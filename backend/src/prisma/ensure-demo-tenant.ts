import type { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const PRODUTOS = [
  { nome: 'Cerveja Long Neck', preco: 12.0, categoria: 'Bebidas' },
  { nome: 'Vodka Red Bull', preco: 28.0, categoria: 'Drinks' },
  { nome: 'Caipirinha', preco: 18.0, categoria: 'Drinks' },
  { nome: 'Whisky Dose', preco: 22.0, categoria: 'Destilados' },
  { nome: 'Água Mineral', preco: 6.0, categoria: 'Sem Álcool' },
  { nome: 'Energético', preco: 15.0, categoria: 'Sem Álcool' },
  { nome: 'Porção Batata Frita', preco: 25.0, categoria: 'Comida' },
  { nome: 'Porção Tábua de Frios', preco: 45.0, categoria: 'Comida' },
];

/**
 * Garante tenant demo + usuários + produtos base (idempotente).
 * Roda na subida da API — não depende de ts-node / prisma db seed no Docker.
 * Desligar: DISABLE_DEMO_BOOTSTRAP=true
 */
export async function ensureDemoTenant(prisma: PrismaClient): Promise<void> {
  if (process.env.DISABLE_DEMO_BOOTSTRAP === 'true') {
    console.warn('[JR Gateway bootstrap] DISABLE_DEMO_BOOTSTRAP=true — tenant demo NÃO será criado.');
    return;
  }

  const slug = (process.env.BOOTSTRAP_TENANT_SLUG || 'demo-club').trim().toLowerCase();

  let antes = 0;
  try {
    antes = await prisma.tenant.count();
  } catch (e) {
    console.error('[JR Gateway bootstrap] falha ao contar tenants (banco OK?)', e);
    throw e;
  }

  console.log(`[JR Gateway bootstrap] garantindo tenant slug="${slug}" (tenants antes: ${antes})`);

  const tenant = await prisma.tenant.upsert({
    where: { slug },
    update: { ativo: true },
    create: {
      nome: process.env.BOOTSTRAP_TENANT_NOME || 'Demo Club',
      slug,
      plano: 'pro',
    },
  });

  const users = [
    { email: 'admin@demo.com', nome: 'Admin', role: 'ADMIN', senha: 'admin123' },
    { email: 'staff@demo.com', nome: 'Garçom 1', role: 'STAFF', senha: 'staff123' },
    { email: 'saida@demo.com', nome: 'Segurança', role: 'SEGURANCA', senha: 'saida123' },
  ];

  for (const u of users) {
    const email = u.email.trim().toLowerCase();
    const hash = await bcrypt.hash(u.senha, 10);
    await prisma.usuario.upsert({
      where: { email_tenantId: { email, tenantId: tenant.id } },
      update: {},
      create: {
        tenantId: tenant.id,
        nome: u.nome,
        email,
        senha: hash,
        role: u.role,
      },
    });
  }

  for (const p of PRODUTOS) {
    const exists = await prisma.produto.findFirst({
      where: { tenantId: tenant.id, nome: p.nome },
    });
    if (!exists) {
      await prisma.produto.create({
        data: {
          tenantId: tenant.id,
          nome: p.nome,
          preco: p.preco,
          categoria: p.categoria,
        },
      });
    }
  }

  console.log(`[JR Gateway bootstrap] OK slug="${slug}" id=${tenant.id} — admin@demo.com / admin123`);
}
