import { PrismaClient, Role, OrderStatus } from '@prisma/client';
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
    key: 'earbuds-pro',
    name: 'TechGear Wireless Earbuds Pro',
    description:
      'Premium true-wireless earbuds with active noise cancellation, a wireless charging case, and 36-hour battery life.',
    price: 129.99,
    stock: 40,
    category: 'Audio',
  },
  {
    key: 'over-ear-headphones',
    name: 'TechGear Over-Ear Headphones X',
    description:
      'Studio-grade over-ear headphones with plush memory-foam cushions and deep, punchy bass response.',
    price: 89.99,
    stock: 25,
    category: 'Audio',
  },
  {
    key: 'gan-charger',
    name: 'TechGear 65W USB-C GaN Charger',
    description:
      'Compact gallium-nitride wall charger with two USB-C and one USB-A port for laptops, phones, and tablets.',
    price: 45.99,
    stock: 60,
    category: 'Charging',
  },
  {
    key: 'power-bank',
    name: 'TechGear 10000mAh Power Bank Slim',
    description:
      'Pocketable 10,000mAh power bank with fast USB-C Power Delivery and pass-through charging.',
    price: 39.99,
    stock: 30,
    category: 'Charging',
  },
  {
    key: 'tkl-keyboard',
    name: 'TechGear TKL Mechanical Keyboard',
    description:
      'Tenkeyless mechanical keyboard with hot-swappable switches, PBT keycaps, and per-key RGB lighting.',
    price: 79.99,
    stock: 20,
    category: 'Accessories',
  },
  {
    key: 'ergo-mouse',
    name: 'TechGear Ergonomic Wireless Mouse',
    description:
      'Silent-click ergonomic mouse with adjustable DPI and up to 12 months of battery life.',
    price: 34.99,
    stock: 50,
    category: 'Accessories',
  },
  {
    key: 'fitness-band',
    name: 'TechGear Smart Fitness Band S1',
    description:
      'Water-resistant fitness band with heart-rate, sleep, and step tracking for up to 14 days per charge.',
    price: 59.99,
    stock: 35,
    category: 'Wearables',
  },
  {
    key: 'smart-watch',
    name: 'TechGear Smart Watch Pro 2',
    description:
      'AMOLED smartwatch with built-in GPS, 100+ workout modes, and a 7-day battery life.',
    price: 199.99,
    stock: 15,
    category: 'Wearables',
  },
  {
    key: 'screen-protector',
    name: 'TechGear Tempered Glass Screen Protector',
    description:
      '9H hardness tempered glass with an oleophobic coating and edge-to-edge coverage.',
    price: 12.99,
    stock: 100,
    category: 'Cases & Protection',
  },
  {
    key: 'portable-ssd',
    name: 'TechGear Portable SSD 1TB',
    description:
      'Pocket-size 1TB external SSD with USB 3.2 Gen 2 speeds up to 1050 MB/s and shock-resistant housing.',
    price: 119.99,
    stock: 22,
    category: 'Storage',
  },
];

const reviews = [
  {
    product: 'earbuds-pro',
    rating: 5,
    comment: 'Incredible sound and the battery genuinely lasts a full week.',
  },
  {
    product: 'earbuds-pro',
    rating: 4,
    comment: 'Great value and very comfortable for long listening sessions.',
  },
  {
    product: 'tkl-keyboard',
    rating: 5,
    comment: 'The switches feel amazing; typing is a joy on this board.',
  },
  {
    product: 'gan-charger',
    rating: 4,
    comment: 'Charges my laptop and phone quickly and stays cool.',
  },
  {
    product: 'smart-watch',
    rating: 3,
    comment: 'Solid watch, but the battery could last longer than a week.',
  },
];

const orders = [
  {
    status: OrderStatus.DELIVERED,
    items: [
      { product: 'earbuds-pro', quantity: 1 },
      { product: 'screen-protector', quantity: 2 },
    ],
  },
  {
    status: OrderStatus.PENDING,
    items: [
      { product: 'gan-charger', quantity: 1 },
      { product: 'power-bank', quantity: 1 },
    ],
  },
];

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

  const existingProductCount = await prisma.product.count({
    where: { categoryId: { in: Object.values(categoryIds) } },
  });

  if (existingProductCount > 0) {
    console.log('Seed: products already present, skipping products, reviews, and orders');
    return;
  }

  const productIds: Record<string, string> = {};
  const productPrices: Record<string, number> = {};
  for (const product of products) {
    const record = await prisma.product.create({
      data: {
        name: product.name,
        description: product.description,
        price: product.price,
        stock: product.stock,
        imageUrl: `https://picsum.photos/seed/${product.key}/600/600`,
        categoryId: categoryIds[product.category],
      },
    });
    productIds[product.key] = record.id;
    productPrices[product.key] = record.price;
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
        items: { create: orderItems },
      },
    });
  }

  console.log(
    `Seed: users, categories, products, reviews, and orders created\n` +
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
