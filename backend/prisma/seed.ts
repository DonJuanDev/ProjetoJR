import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'demo-club' },
    update: {},
    create: {
      nome: 'Demo Club',
      slug: 'demo-club',
      plano: 'pro',
    },
  });

  const senhaHash = await bcrypt.hash('admin123', 10);

  await prisma.usuario.upsert({
    where: { email_tenantId: { email: 'admin@demo.com', tenantId: tenant.id } },
    update: {},
    create: {
      tenantId: tenant.id,
      nome: 'Admin',
      email: 'admin@demo.com',
      senha: senhaHash,
      role: 'ADMIN',
    },
  });

  await prisma.usuario.upsert({
    where: { email_tenantId: { email: 'staff@demo.com', tenantId: tenant.id } },
    update: {},
    create: {
      tenantId: tenant.id,
      nome: 'Garçom 1',
      email: 'staff@demo.com',
      senha: await bcrypt.hash('staff123', 10),
      role: 'STAFF',
    },
  });

  await prisma.usuario.upsert({
    where: { email_tenantId: { email: 'saida@demo.com', tenantId: tenant.id } },
    update: {},
    create: {
      tenantId: tenant.id,
      nome: 'Segurança',
      email: 'saida@demo.com',
      senha: await bcrypt.hash('saida123', 10),
      role: 'SEGURANCA',
    },
  });

  const produtos = [
    { nome: 'Cerveja Long Neck', preco: 12.0, categoria: 'Bebidas' },
    { nome: 'Vodka Red Bull', preco: 28.0, categoria: 'Drinks' },
    { nome: 'Caipirinha', preco: 18.0, categoria: 'Drinks' },
    { nome: 'Whisky Dose', preco: 22.0, categoria: 'Destilados' },
    { nome: 'Água Mineral', preco: 6.0, categoria: 'Sem Álcool' },
    { nome: 'Energético', preco: 15.0, categoria: 'Sem Álcool' },
    { nome: 'Porção Batata Frita', preco: 25.0, categoria: 'Comida' },
    { nome: 'Porção Tábua de Frios', preco: 45.0, categoria: 'Comida' },
  ];

  for (const p of produtos) {
    await prisma.produto.upsert({
      where: { id: p.nome },
      update: {},
      create: {
        tenantId: tenant.id,
        nome: p.nome,
        preco: p.preco,
        categoria: p.categoria,
      },
    }).catch(() => {
      return prisma.produto.create({
        data: {
          tenantId: tenant.id,
          nome: p.nome,
          preco: p.preco,
          categoria: p.categoria,
        },
      });
    });
  }

  console.log('Seed concluído! Tenant:', tenant.slug);
  console.log('Admin: admin@demo.com / admin123');
  console.log('Staff: staff@demo.com / staff123');
  console.log('Saída: saida@demo.com / saida123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
