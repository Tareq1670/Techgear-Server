import { PrismaClient, Role, OrderStatus, PaymentMethod } from '@prisma/client';
import { hashPassword } from 'better-auth/crypto';

const prisma = new PrismaClient();

const SEED_ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? 'Admin@123';
const SEED_USER_PASSWORD = process.env.SEED_USER_PASSWORD ?? 'User@123';

const categories = [
  { name: 'Audio', description: 'Headphones, earbuds, and speakers' },
  { name: 'Charging', description: 'Cables, adapters, and power banks' },
  { name: 'Accessories', description: 'Keyboards, mice, and desk gear' },
  { name: 'Wearables', description: 'Smartwatches and fitness trackers' },
  { name: 'Cases & Protection', description: 'Cases, covers, and screen protectors' },
  { name: 'Storage', description: 'SSDs and memory cards' },
];

const products = [
  {
    key: 'budget-earbuds',
    name: 'TechGear Wireless Earbuds Lite',
    description:
      'Affordable true-wireless earbuds with Bluetooth 5.3, touch controls, and a compact charging case.',
    price: 24.99,
    stock: 80,
    category: 'Audio',
  },
  {
    key: 'mini-speaker',
    name: 'TechGear Mini Bluetooth Speaker',
    description:
      'Palm-sized portable speaker with punchy sound, IPX5 water resistance, and 12-hour playtime.',
    price: 29.99,
    stock: 45,
    category: 'Audio',
  },
  {
    key: 'wired-earbuds',
    name: 'TechGear Wired Earbuds Bass',
    description:
      'Budget-friendly wired earbuds with rich bass, in-line mic, and a tangle-resistant cable.',
    price: 9.99,
    stock: 120,
    category: 'Audio',
  },
  {
    key: 'usb-c-cable',
    name: 'TechGear USB-C Fast Charge Cable (1m)',
    description:
      'Durable braided USB-C cable with 60W fast charging and data transfer support.',
    price: 12.99,
    stock: 200,
    category: 'Charging',
  },
  {
    key: 'duo-charger',
    name: 'TechGear 30W Dual USB-C Charger',
    description:
      'Compact 30W dual-port wall charger for phones and tablets, with foldable prongs.',
    price: 19.99,
    stock: 70,
    category: 'Charging',
  },
  {
    key: 'power-bank-lite',
    name: 'TechGear 5000mAh Power Bank',
    description:
      'Slim 5,000mAh power bank with USB-C pass-through charging and a built-in cable.',
    price: 21.99,
    stock: 55,
    category: 'Charging',
  },
  {
    key: 'slim-keyboard',
    name: 'TechGear Slim USB Keyboard',
    description:
      'Quiet, low-profile USB keyboard with spill-resistant keys and a slim design.',
    price: 17.99,
    stock: 60,
    category: 'Accessories',
  },
  {
    key: 'wireless-mouse',
    name: 'TechGear Wireless Mouse',
    description:
      'Reliable 2.4GHz wireless mouse with silent clicks and an 18-month battery life.',
    price: 14.99,
    stock: 90,
    category: 'Accessories',
  },
  {
    key: 'fitness-band-go',
    name: 'TechGear Fitness Band Go',
    description:
      'Entry-level fitness band with step, sleep, and heart-rate tracking for up to 10 days.',
    price: 34.99,
    stock: 40,
    category: 'Wearables',
  },
  {
    key: 'silicone-case',
    name: 'TechGear Silicone Phone Case',
    description:
      'Shock-absorbing silicone case for iPhone 15 and Galaxy S24 with raised bezels.',
    price: 11.99,
    stock: 150,
    category: 'Cases & Protection',
  },
  {
    key: 'screen-protector-pack',
    name: 'TechGear Screen Protector (2-Pack)',
    description:
      'Two-pack of 9H tempered glass screen protectors with an easy-install alignment kit.',
    price: 7.99,
    stock: 180,
    category: 'Cases & Protection',
  },
  {
    key: 'flash-drive-64',
    name: 'TechGear USB 3.0 Flash Drive 64GB',
    description:
      'Fast 64GB USB 3.0 flash drive for photos, music, and everyday documents.',
    price: 9.99,
    stock: 110,
    category: 'Storage',
  },
  {
    key: 'microsd-128',
    name: 'TechGear microSD Card 128GB',
    description:
      'A2-speed 128GB microSD card for phones, action cameras, and handheld consoles.',
    price: 18.99,
    stock: 95,
    category: 'Storage',
  },
];

const reviews = [
  {
    product: 'budget-earbuds',
    rating: 4,
    comment: 'Great value for the price — solid battery and easy to pair.',
  },
  {
    product: 'mini-speaker',
    rating: 5,
    comment: 'Surprisingly loud for its size, and the battery lasts all day.',
  },
  {
    product: 'usb-c-cable',
    rating: 5,
    comment: 'Charges my phone fast and the braided cable feels sturdy.',
  },
  {
    product: 'slim-keyboard',
    rating: 4,
    comment: 'Quiet and comfortable to type on for long work sessions.',
  },
  {
    product: 'fitness-band-go',
    rating: 3,
    comment: 'Good basic tracking, though the companion app is a bit basic.',
  },
];

const orders = [
  {
    status: OrderStatus.DELIVERED,
    shippingAddress: '123 Market Street, Springfield, IL 62704',
    paymentMethod: PaymentMethod.CARD,
    items: [
      { product: 'budget-earbuds', quantity: 1 },
      { product: 'screen-protector-pack', quantity: 2 },
    ],
  },
  {
    status: OrderStatus.PENDING,
    shippingAddress: '456 Oak Avenue, Austin, TX 73301',
    paymentMethod: PaymentMethod.COD,
    items: [
      { product: 'usb-c-cable', quantity: 2 },
      { product: 'power-bank-lite', quantity: 1 },
    ],
  },
];

const cartSeed = [
  { product: 'usb-c-cable', quantity: 2 },
  { product: 'fitness-band-go', quantity: 1 },
];

// Real Unsplash CDN photo URLs (verified live, product-accurate) keyed by product key.
const imageByKey: Record<string, string> = {
  'budget-earbuds':
    'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&q=80&auto=format&fit=crop',
  'mini-speaker':
    'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&q=80&auto=format&fit=crop',
  'wired-earbuds':
    'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600&q=80&auto=format&fit=crop',
  'usb-c-cable':
    'https://images.unsplash.com/photo-1610792516307-ea5acd9c3b00?w=600&q=80&auto=format&fit=crop',
  'duo-charger':
    'https://images.unsplash.com/photo-1610824352934-c10d87b700cc?w=600&q=80&auto=format&fit=crop',
  'power-bank-lite':
    'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600&q=80&auto=format&fit=crop',
  'slim-keyboard':
    'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&q=80&auto=format&fit=crop',
  'wireless-mouse':
    'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&q=80&auto=format&fit=crop',
  'fitness-band-go':
    'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=600&q=80&auto=format&fit=crop',
  'silicone-case':
    'https://images.unsplash.com/photo-1601593346740-925612772716?w=600&q=80&auto=format&fit=crop',
  'screen-protector-pack':
    'https://images.unsplash.com/photo-1600011689032-8b628b8a8747?w=600&q=80&auto=format&fit=crop',
  'flash-drive-64':
    'https://images.unsplash.com/photo-1598331668826-20cecc596b86?w=600&q=80&auto=format&fit=crop',
  'microsd-128':
    'https://images.unsplash.com/photo-1574607383476-f517f260d30b?w=600&q=80&auto=format&fit=crop',
};

const slugify = (name: string): string =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

// Better-Auth (v1.6.x) stores email/password credentials as an Account row with
// providerId "credential" (password hash lives there, not on the User). Create it
// so seeded users can sign in via the Next.js client.
async function upsertCredentialAccount(userId: string, passwordHash: string) {
  const existing = await prisma.account.findFirst({
    where: { userId, providerId: 'credential' },
  });
  if (existing) {
    await prisma.account.update({
      where: { id: existing.id },
      data: { accountId: userId, password: passwordHash },
    });
  } else {
    await prisma.account.create({
      data: {
        userId,
        accountId: userId,
        providerId: 'credential',
        password: passwordHash,
      },
    });
  }
}

async function main() {
  const adminPassword = await hashPassword(SEED_ADMIN_PASSWORD);
  const userPassword = await hashPassword(SEED_USER_PASSWORD);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@techgear.test' },
    update: { password: adminPassword, emailVerified: true },
    create: {
      email: 'admin@techgear.test',
      name: 'TechGear Admin',
      role: Role.ADMIN,
      emailVerified: true,
      password: adminPassword,
    },
  });
  await upsertCredentialAccount(adminUser.id, adminPassword);

  const demoUser = await prisma.user.upsert({
    where: { email: 'user@techgear.test' },
    update: { password: userPassword, emailVerified: true },
    create: {
      email: 'user@techgear.test',
      name: 'Demo User',
      role: Role.USER,
      emailVerified: true,
      password: userPassword,
    },
  });
  await upsertCredentialAccount(demoUser.id, userPassword);

  const categoryIds: Record<string, string> = {};
  for (const category of categories) {
    const record = await prisma.category.upsert({
      where: { slug: slugify(category.name) },
      update: { name: category.name, description: category.description },
      create: {
        name: category.name,
        slug: slugify(category.name),
        description: category.description,
      },
    });
    categoryIds[category.name] = record.id;
  }

  // --- Product reconcile ---
  // Products are matched by name. Products that used to exist in the seeded
  // categories but are no longer in the catalog are soft-deleted; listed
  // products are updated in place or created. Seeded products belong to admin.
  const desiredNames = new Set(products.map((product) => product.name));

  const existingProducts = await prisma.product.findMany({
    where: { isDeleted: false, categoryId: { in: Object.values(categoryIds) } },
    select: { id: true, name: true },
  });

  const staleProductIds = existingProducts
    .filter((product) => !desiredNames.has(product.name))
    .map((product) => product.id);

  if (staleProductIds.length > 0) {
    await prisma.product.updateMany({
      where: { id: { in: staleProductIds } },
      data: { isDeleted: true },
    });
    console.log(`Seed: soft-deleted ${staleProductIds.length} out-of-catalog product(s)`);
  }

  const productIds: Record<string, string> = {};
  const productPrices: Record<string, number> = {};
  for (const product of products) {
    const existing = await prisma.product.findFirst({
      where: { name: product.name, isDeleted: false },
      select: { id: true },
    });

    const imageUrl = imageByKey[product.key] ?? `https://picsum.photos/seed/${product.key}/600/600`;
    const data = {
      description: product.description,
      price: product.price,
      stock: product.stock,
      imageUrl,
      categoryId: categoryIds[product.category],
      userId: adminUser.id,
    };

    let record;
    if (existing) {
      record = await prisma.product.update({
        where: { id: existing.id },
        data,
        select: { id: true, price: true },
      });
    } else {
      record = await prisma.product.create({
        data: { name: product.name, ...data },
        select: { id: true, price: true },
      });
    }

    productIds[product.key] = record.id;
    productPrices[product.key] = record.price;
  }

  // --- Reset the demo user's seed data so re-runs stay deterministic ---
  const demoOrders = await prisma.order.findMany({
    where: { userId: demoUser.id },
    select: { id: true },
  });
  if (demoOrders.length > 0) {
    await prisma.orderItem.deleteMany({
      where: { orderId: { in: demoOrders.map((order) => order.id) } },
    });
    await prisma.order.deleteMany({ where: { userId: demoUser.id } });
  }
  await prisma.review.deleteMany({ where: { userId: demoUser.id } });

  const demoCart = await prisma.cart.findUnique({ where: { userId: demoUser.id } });
  if (demoCart) {
    await prisma.cartItem.deleteMany({ where: { cartId: demoCart.id } });
    await prisma.cart.delete({ where: { userId: demoUser.id } });
  }

  for (const review of reviews) {
    await prisma.review.create({
      data: {
        rating: review.rating,
        comment: review.comment,
        userId: demoUser.id,
        productId: productIds[review.product],
      },
    });
  }

  for (const order of orders) {
    let totalAmount = 0;
    const orderItems = order.items.map((item) => {
      totalAmount += productPrices[item.product] * item.quantity;
      return {
        productId: productIds[item.product],
        quantity: item.quantity,
        price: productPrices[item.product],
      };
    });

    await prisma.order.create({
      data: {
        userId: demoUser.id,
        status: order.status,
        totalAmount: Number(totalAmount.toFixed(2)),
        shippingAddress: order.shippingAddress,
        paymentMethod: order.paymentMethod,
        items: { create: orderItems },
      },
    });
  }

  const newCart = await prisma.cart.create({ data: { userId: demoUser.id } });
  await prisma.cartItem.createMany({
    data: cartSeed.map((item) => ({
      cartId: newCart.id,
      productId: productIds[item.product],
      quantity: item.quantity,
    })),
  });

  console.log(
    `Seed: users, categories, ${products.length} products, reviews, orders, and a demo cart ready\n` +
      `  Admin login: admin@techgear.test / ${SEED_ADMIN_PASSWORD}\n` +
      `  Demo login:  user@techgear.test / ${SEED_USER_PASSWORD}`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
