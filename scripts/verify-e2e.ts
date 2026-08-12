import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const BASE = process.env.E2E_BASE_URL ?? 'http://localhost:5000';
const SHIPPING_ADDRESS = '100 Test Lane, Test City, TX 77001';

let failures = 0;

const check = (name: string, condition: boolean, detail?: unknown) => {
  if (condition) {
    console.log(`  [PASS] ${name}`);
  } else {
    failures += 1;
    console.error(`  [FAIL] ${name}${detail !== undefined ? ` — ${JSON.stringify(detail)}` : ''}`);
  }
};

interface ApiOptions {
  method?: string;
  body?: unknown;
  user?: { sub: string; role: 'USER' | 'ADMIN'; email?: string };
}

async function api(path: string, options: ApiOptions = {}) {
  const { method = 'GET', body, user } = options;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (user) headers['x-dev-user'] = JSON.stringify(user);

  const response = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let json: unknown = null;
  try {
    json = await response.json();
  } catch {
    // non-JSON response
  }

  return { status: response.status, json };
}

const asUser = (id: string, email: string) => ({ sub: id, role: 'USER' as const, email });
const asAdmin = (id: string, email: string) => ({ sub: id, role: 'ADMIN' as const, email });

async function main() {
  console.log(`\n=== TechGear E2E verification against ${BASE} ===\n`);

  // ---------- 1. Health ----------
  console.log('1. Health check');
  const health = await api('/health');
  check('GET /health returns 200', health.status === 200, health.status);

  // ---------- 2. Products ----------
  console.log('\n2. Product catalog');
  const productsRes = await api('/api/products?limit=100');
  const products = (productsRes.json as { data?: { products?: { id: string; name: string; price: number; stock: number }[] } })?.data?.products ?? [];
  check('GET /api/products returns 200', productsRes.status === 200, productsRes.status);
  check('Catalog is non-empty', products.length > 0, products.length);
  check('No overly expensive products (max price <= $50)', products.every((p) => p.price <= 50), products.map((p) => p.price));
  console.log(`   Catalog size: ${products.length}; most expensive: $${Math.max(...products.map((p) => p.price))}`);
  console.log(`   Sample: ${products.slice(0, 3).map((p) => `${p.name} ($${p.price})`).join(', ')}`);

  // ---------- 3. Test users ----------
  console.log('\n3. Test users');
  const buyer = await prisma.user.create({
    data: { email: `e2e-buyer-${Date.now()}@techgear.test`, name: 'E2E Buyer', role: 'USER', emailVerified: true },
  });
  const other = await prisma.user.create({
    data: { email: `e2e-other-${Date.now()}@techgear.test`, name: 'E2E Other', role: 'USER', emailVerified: true },
  });
  const admin = await prisma.user.findUniqueOrThrow({ where: { email: 'admin@techgear.test' } });
  console.log(`   Buyer: ${buyer.email}, Admin: ${admin.email}`);

  const buyerAuth = asUser(buyer.id, buyer.email);
  const otherAuth = asUser(other.id, other.email);
  const adminAuth = asAdmin(admin.id, admin.email);

  // ---------- 4. Cart requires auth ----------
  console.log('\n4. Cart authentication (guest blocked)');
  const guestCart = await api('/api/cart');
  check('GET /api/cart without auth returns 401', guestCart.status === 401, guestCart.status);
  const guestAdd = await api('/api/cart/items', {
    method: 'POST',
    body: { productId: '00000000-0000-0000-0000-000000000000', quantity: 1 },
  });
  check('POST /api/cart/items without auth returns 401', guestAdd.status === 401, guestAdd.status);

  // ---------- 5. User product creation ----------
  console.log('\n5. User can create and list their own products');
  const categoryRes = await api('/api/categories');
  const categories = (categoryRes.json as { data?: { categories?: { id: string; name: string }[] } })?.data?.categories ?? [];
  const firstCategory = categories[0]?.id;
  check('Categories available for product creation', Boolean(firstCategory));

  const newProductBody = {
    name: 'E2E Test Gadget',
    description: 'A product created by a regular user during E2E verification.',
    price: 19.99,
    stock: 5,
    categoryId: firstCategory,
  };
  const createRes = await api('/api/products', { method: 'POST', body: newProductBody, user: buyerAuth });
  const createdProduct = (createRes.json as { data?: { product?: { id: string; userId: string | null } } })?.data?.product;
  check('POST /api/products as regular user returns 201', createRes.status === 201, createRes.status);
  check('Created product is owned by the buyer', createdProduct?.userId === buyer.id, createdProduct?.userId);

  const myRes = await api('/api/products/my-products', { user: buyerAuth });
  const myProducts = (myRes.json as { data?: { products?: { id: string }[] } })?.data?.products ?? [];
  check('GET /api/products/my-products contains the new product', myProducts.some((p) => p.id === createdProduct?.id));

  const forbiddenRes = await api(`/api/products/${createdProduct?.id}`, {
    method: 'PATCH',
    body: { name: 'Hijacked' },
    user: otherAuth,
  });
  check('Another user cannot edit the buyer\'s product (403)', forbiddenRes.status === 403, forbiddenRes.status);

  // ---------- 6. Cart flow ----------
  console.log('\n6. Cart flow (add / view / update / remove)');
  const targetProduct = products[0];
  check('Picked a seeded product for cart/order testing', Boolean(targetProduct?.id));

  const addItemRes = await api('/api/cart/items', {
    method: 'POST',
    body: { productId: targetProduct.id, quantity: 2 },
    user: buyerAuth,
  });
  const cartAfterAdd = (addItemRes.json as { data?: { cart?: { items: { productId: string; quantity: number }[]; totalCount: number; totalPrice: number } } })?.data?.cart;
  check('POST /api/cart/items adds the item', cartAfterAdd?.items.some((i) => i.productId === targetProduct.id && i.quantity === 2));

  const cartGetRes = await api('/api/cart', { user: buyerAuth });
  const cart = (cartGetRes.json as { data?: { cart?: { items: { productId: string; quantity: number }[]; totalCount: number; totalPrice: number } } })?.data?.cart;
  check('GET /api/cart returns the item', cart?.items.some((i) => i.productId === targetProduct.id && i.quantity === 2));

  const updateRes = await api(`/api/cart/items/${targetProduct.id}`, {
    method: 'PATCH',
    body: { quantity: 3 },
    user: buyerAuth,
  });
  const cartAfterUpdate = (updateRes.json as { data?: { cart?: { items: { productId: string; quantity: number }[]; totalCount: number; totalPrice: number } } })?.data?.cart;
  const updatedQty = cartAfterUpdate?.items.find((i) => i.productId === targetProduct.id)?.quantity;
  check('PATCH /api/cart/items updates quantity to 3', updatedQty === 3, updatedQty);
  check('Cart totalPrice reflects server prices', cartAfterUpdate?.totalPrice === Number((targetProduct.price * 3).toFixed(2)), cartAfterUpdate?.totalPrice);

  const removeRes = await api(`/api/cart/items/${targetProduct.id}`, { method: 'DELETE', user: buyerAuth });
  const cartAfterRemove = (removeRes.json as { data?: { cart?: { items: unknown[]; totalCount: number } } })?.data?.cart;
  check('DELETE /api/cart/items removes the item', cartAfterRemove?.totalCount === 0, cartAfterRemove?.totalCount);

  // Re-add for the order step
  await api('/api/cart/items', {
    method: 'POST',
    body: { productId: targetProduct.id, quantity: 2 },
    user: buyerAuth,
  });

  // ---------- 7. Order flow ----------
  console.log('\n7. Order flow (create → stock deduction → status update → admin view)');
  const productBefore = await prisma.product.findUniqueOrThrow({ where: { id: targetProduct.id } });

  const orderRes = await api('/api/orders', {
    method: 'POST',
    body: {
      items: [{ productId: targetProduct.id, quantity: 2 }],
      shippingAddress: SHIPPING_ADDRESS,
      paymentMethod: 'CARD',
      totalAmount: 0.01,
    },
    user: buyerAuth,
  });
  const order = (orderRes.json as { data?: { order?: { id: string; totalAmount: number; status: string; paymentMethod: string; shippingAddress: string; items: unknown[] } } })?.data?.order;
  check('POST /api/orders returns 201', orderRes.status === 201, orderRes.status);
  check('Order totalAmount is server-computed (ignores client value)', order?.totalAmount === Number((targetProduct.price * 2).toFixed(2)), order?.totalAmount);
  check('Order stores shippingAddress', order?.shippingAddress === SHIPPING_ADDRESS, order?.shippingAddress);
  check('Order stores paymentMethod', order?.paymentMethod === 'CARD', order?.paymentMethod);
  check('Order defaults to PENDING', order?.status === 'PENDING', order?.status);

  const productAfter = await prisma.product.findUniqueOrThrow({ where: { id: targetProduct.id } });
  check('Stock decreased by ordered quantity (2)', productAfter.stock === productBefore.stock - 2, { before: productBefore.stock, after: productAfter.stock });

  const myOrdersRes = await api('/api/orders/my-orders', { user: buyerAuth });
  const myOrders = (myOrdersRes.json as { data?: { orders?: { id: string; status: string }[] } })?.data?.orders ?? [];
  check('GET /api/orders/my-orders contains the new order', myOrders.some((o) => o.id === order?.id && o.status === 'PENDING'));

  const updateStatusRes = await api(`/api/orders/${order?.id}/status`, {
    method: 'PATCH',
    body: { status: 'PROCESSING' },
    user: adminAuth,
  });
  const updatedOrder = (updateStatusRes.json as { data?: { order?: { id: string; status: string } } })?.data?.order;
  check('Admin can update order status to PROCESSING', updatedOrder?.status === 'PROCESSING', updatedOrder?.status);

  const adminOrdersRes = await api('/api/orders', { user: adminAuth });
  const adminOrders = (adminOrdersRes.json as { data?: { orders?: { id: string; status: string; user?: { email: string } }[] } })?.data?.orders ?? [];
  check('GET /api/orders (admin) contains the order', adminOrders.some((o) => o.id === order?.id && o.status === 'PROCESSING' && o.user?.email === buyer.email));

  const dbOrder = await prisma.order.findUniqueOrThrow({ where: { id: order?.id } });
  check('Database reflects status + shipping + payment', dbOrder.status === 'PROCESSING' && dbOrder.shippingAddress === SHIPPING_ADDRESS && dbOrder.paymentMethod === 'CARD', { status: dbOrder.status, shipping: dbOrder.shippingAddress, payment: dbOrder.paymentMethod });

  // ---------- 8. Order validation ----------
  console.log('\n8. Order validation');
  const missingFieldsRes = await api('/api/orders', {
    method: 'POST',
    body: { items: [{ productId: targetProduct.id, quantity: 1 }] },
    user: buyerAuth,
  });
  check('POST /api/orders without shippingAddress returns 400', missingFieldsRes.status === 400, missingFieldsRes.status);

  const insufficientRes = await api('/api/orders', {
    method: 'POST',
    body: {
      items: [{ productId: targetProduct.id, quantity: 999999 }],
      shippingAddress: SHIPPING_ADDRESS,
      paymentMethod: 'CARD',
    },
    user: buyerAuth,
  });
  check('Order with insufficient stock returns 400', insufficientRes.status === 400, insufficientRes.status);

  // ---------- 9. Cleanup ----------
  console.log('\n9. Cleanup test data');
  const cleanOrder = await prisma.order.findUniqueOrThrow({ where: { id: order?.id } });
  await prisma.orderItem.deleteMany({ where: { orderId: cleanOrder.id } });
  await prisma.order.delete({ where: { id: cleanOrder.id } });
  await prisma.product.update({ where: { id: targetProduct.id }, data: { stock: productBefore.stock } });

  const buyerCart = await prisma.cart.findUnique({ where: { userId: buyer.id } });
  if (buyerCart) {
    await prisma.cartItem.deleteMany({ where: { cartId: buyerCart.id } });
    await prisma.cart.delete({ where: { id: buyerCart.id } });
  }
  await prisma.product.deleteMany({ where: { id: createdProduct?.id, userId: buyer.id } });
  await prisma.user.deleteMany({ where: { id: { in: [buyer.id, other.id] } } });
  console.log('   Test users, order, cart, and product removed; product stock restored.');

  // ---------- Summary ----------
  console.log(`\n=== RESULT: ${failures === 0 ? 'ALL CHECKS PASSED' : `${failures} CHECK(S) FAILED`} ===\n`);
  process.exitCode = failures === 0 ? 0 : 1;
}

main()
  .catch((error) => {
    console.error('E2E script error:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
