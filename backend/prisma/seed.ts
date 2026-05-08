import { PrismaClient } from '@prisma/client';
import { ensureDemoTenant } from '../src/prisma/ensure-demo-tenant';

const prisma = new PrismaClient();

async function main() {
  const force = process.env.FORCE_PRISMA_SEED === '1';
  if (!force) {
    const demo = await prisma.tenant.findUnique({ where: { slug: 'demo-club' } });
    if (demo) {
      console.log('Seed: tenant demo-club já existe — ignorando.');
      return;
    }
  }

  await ensureDemoTenant(prisma);

  console.log('Seed concluído! Tenant: demo-club');
  console.log('Admin: admin@demo.com / admin123');
  console.log('Staff: staff@demo.com / staff123');
  console.log('Saída: saida@demo.com / saida123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
