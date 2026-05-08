import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProdutosService {
  constructor(private prisma: PrismaService) {}

  async listar(tenantId: string) {
    return this.prisma.produto.findMany({
      where: { tenantId, ativo: true },
      orderBy: [{ categoria: 'asc' }, { nome: 'asc' }],
    });
  }

  async listarTodos(tenantId: string) {
    return this.prisma.produto.findMany({
      where: { tenantId },
      orderBy: [{ categoria: 'asc' }, { nome: 'asc' }],
    });
  }

  async criar(tenantId: string, data: { nome: string; preco: number; categoria: string; descricao?: string }) {
    return this.prisma.produto.create({
      data: { ...data, tenantId },
    });
  }

  async atualizar(tenantId: string, id: string, data: { nome?: string; preco?: number; categoria?: string; descricao?: string; ativo?: boolean }) {
    const produto = await this.prisma.produto.findFirst({ where: { id, tenantId } });
    if (!produto) throw new NotFoundException('Produto não encontrado');
    return this.prisma.produto.update({ where: { id }, data });
  }

  async remover(tenantId: string, id: string) {
    const produto = await this.prisma.produto.findFirst({ where: { id, tenantId } });
    if (!produto) throw new NotFoundException('Produto não encontrado');
    return this.prisma.produto.update({ where: { id }, data: { ativo: false } });
  }
}
