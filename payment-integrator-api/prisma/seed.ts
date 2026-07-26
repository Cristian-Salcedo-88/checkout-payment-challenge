import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Fixed ids so re-running the seed upserts instead of duplicating rows.
const PRODUCTS = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    name: 'Ceramic Mug',
    description: 'Ceramic mug, 350ml.',
    price: 4_500_000, // COP 45.000
    imageUrl: 'https://picsum.photos/seed/ceramic-mug/400',
    stock: 15,
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    name: 'Wireless Earbuds',
    description: 'Bluetooth 5.3 earbuds with charging case.',
    price: 18_000_000, // COP 180.000
    imageUrl: 'https://picsum.photos/seed/wireless-earbuds/400',
    stock: 8,
  },
  {
    id: '33333333-3333-4333-8333-333333333333',
    name: 'Mechanical Keyboard',
    description: '75% layout mechanical keyboard, hot-swappable switches.',
    price: 35_000_000, // COP 350.000
    imageUrl: 'https://picsum.photos/seed/mechanical-keyboard/400',
    stock: 5,
  },
  {
    id: '44444444-4444-4444-8444-444444444444',
    name: 'Insulated Water Bottle',
    description: '750ml stainless steel bottle, keeps drinks cold for 24h.',
    price: 6_000_000, // COP 60.000
    imageUrl: 'https://picsum.photos/seed/water-bottle/400',
    stock: 0, // out of stock on purpose, to exercise the "in stock" filter
  },
  {
    id: '55555555-5555-4555-8555-555555555555',
    name: 'Canvas Backpack',
    description: 'Water-resistant backpack with padded laptop sleeve.',
    price: 22_000_000, // COP 220.000
    imageUrl: 'https://picsum.photos/seed/canvas-backpack/400',
    stock: 12,
  },
];

async function main() {
  for (const product of PRODUCTS) {
    await prisma.product.upsert({
      where: { id: product.id },
      create: product,
      update: product,
    });
  }
  console.log(`Seeded ${PRODUCTS.length} products.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
