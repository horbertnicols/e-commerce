import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'admin@example.com';
  const adminPassword = 'Admin123!';

  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (existing) {
    console.log('Admin already exists:', adminEmail);
    if (existing.role !== 'ADMIN') {
      await prisma.user.update({ where: { id: existing.id }, data: { role: 'ADMIN' } });
      console.log('Updated role to ADMIN');
    }
  } else {
    const hashedPw = await bcrypt.hash(adminPassword, 10);
    const user = await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPw,
        name: 'Admin',
        role: 'ADMIN',
      },
    });
    console.log('Admin created:', user.email, user.id);
  }

  // Seed some categories
  const categoryCount = await prisma.category.count();
  if (categoryCount === 0) {
    const categories = [
      { name: '电子产品', description: '手机、电脑、数码配件', sort: 1, isPopular: true },
      { name: '服装鞋帽', description: '男装、女装、鞋类', sort: 2, isPopular: true },
      { name: '食品饮料', description: '零食、饮料、生鲜', sort: 3, isPopular: true },
      { name: '家居用品', description: '家具、家纺、厨具', sort: 4 },
      { name: '图书文具', description: '图书、文具、办公用品', sort: 5 },
      { name: '美妆护肤', description: '护肤品、彩妆、香水', sort: 6, isPopular: true },
      { name: '运动户外', description: '运动装备、户外用品', sort: 7 },
      { name: '母婴用品', description: '婴儿用品、玩具', sort: 8 },
    ];
    for (const cat of categories) {
      await prisma.category.create({ data: cat });
    }
    console.log('Seeded', categories.length, 'categories');
  }

  // Seed default site configs
  const siteConfigCount = await prisma.siteConfig.count();
  if (siteConfigCount === 0) {
    const configs = [
      { key: 'hero_image', value: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=2000&q=80' },
      { key: 'hero_title', value: '发现优质好物' },
      { key: 'hero_description', value: '精选商品，品质保证，快速配送，购物无忧' },
      { key: 'hero_button_text', value: '立即选购' },
    ];
    for (const cfg of configs) {
      await prisma.siteConfig.create({ data: cfg });
    }
    console.log('Seeded', configs.length, 'site configs');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
