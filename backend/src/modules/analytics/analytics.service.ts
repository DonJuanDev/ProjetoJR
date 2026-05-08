import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async resumo(tenantId: string) {
    const comandas = await this.prisma.comanda.findMany({
      where: { tenantId },
      include: {
        pedidos: {
          where: { status: { not: 'CANCELADO' } },
          include: { itens: { include: { produto: true } } },
        },
      },
    });

    const pagas = comandas.filter((c) => c.status === 'PAGA');
    const totalFaturado = pagas.reduce((s, c) => s + Number(c.total), 0);
    const ticketMedio = pagas.length ? totalFaturado / pagas.length : 0;
    const taxaConversao = comandas.length ? (pagas.length / comandas.length) * 100 : 0;

    // Top produtos por quantidade vendida
    const prodMap: Record<string, { nome: string; categoria: string; total: number; quantidade: number }> = {};
    const horaMap: Record<number, { quantidade: number; total: number }> = {};

    comandas.forEach((c) => {
      const hora = new Date(c.createdAt).getHours();
      horaMap[hora] = horaMap[hora] || { quantidade: 0, total: 0 };
      horaMap[hora].quantidade++;
      horaMap[hora].total += Number(c.total);

      c.pedidos.forEach((p) => {
        p.itens.forEach((item) => {
          const key = item.produtoId;
          prodMap[key] = prodMap[key] || {
            nome: item.produto.nome,
            categoria: item.produto.categoria,
            total: 0,
            quantidade: 0,
          };
          prodMap[key].total += Number(item.quantidade) * Number(item.precoUnit);
          prodMap[key].quantidade += item.quantidade;
        });
      });
    });

    const topProdutos = Object.values(prodMap)
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 10);

    const porHora = Object.entries(horaMap)
      .map(([hora, v]) => ({ hora: parseInt(hora), label: `${hora.padStart(2, '0')}:00`, ...v }))
      .sort((a, b) => a.hora - b.hora);

    const horarioPico = porHora.reduce(
      (max, h) => (h.quantidade > max.quantidade ? h : max),
      { hora: 0, label: '00:00', quantidade: 0, total: 0 },
    );

    const sugestoes = this.gerarSugestoes({
      topProdutos,
      horarioPico,
      ticketMedio,
      taxaConversao,
      totalComandas: comandas.length,
      totalPagas: pagas.length,
    });

    return {
      topProdutos,
      porHora,
      horarioPico,
      ticketMedio,
      taxaConversao,
      totalFaturado,
      totalComandas: comandas.length,
      totalPagas: pagas.length,
      sugestoes,
    };
  }

  async crm(tenantId: string) {
    const comandas = await this.prisma.comanda.findMany({
      where: { tenantId, clienteNome: { not: null } },
      orderBy: { createdAt: 'desc' },
      include: {
        pedidos: {
          where: { status: { not: 'CANCELADO' } },
          include: { itens: { include: { produto: true } } },
        },
      },
    });

    // Agrupa por clienteNome + clienteTelefone
    const clienteMap: Record<
      string,
      {
        nome: string;
        telefone?: string;
        visitas: number;
        totalGasto: number;
        ultimaVisita: string;
        primeiraVisita: string;
        bebidasFavoritas: Record<string, number>;
      }
    > = {};

    comandas.forEach((c) => {
      const chave = c.clienteTelefone || c.clienteNome || 'desconhecido';
      if (!clienteMap[chave]) {
        clienteMap[chave] = {
          nome: c.clienteNome || 'Desconhecido',
          telefone: c.clienteTelefone || undefined,
          visitas: 0,
          totalGasto: 0,
          ultimaVisita: c.createdAt.toISOString(),
          primeiraVisita: c.createdAt.toISOString(),
          bebidasFavoritas: {},
        };
      }

      const cli = clienteMap[chave];
      cli.visitas++;
      cli.totalGasto += Number(c.total);

      if (new Date(c.createdAt) > new Date(cli.ultimaVisita)) {
        cli.ultimaVisita = c.createdAt.toISOString();
      }
      if (new Date(c.createdAt) < new Date(cli.primeiraVisita)) {
        cli.primeiraVisita = c.createdAt.toISOString();
      }

      c.pedidos.forEach((p) => {
        p.itens.forEach((item) => {
          cli.bebidasFavoritas[item.produto.nome] =
            (cli.bebidasFavoritas[item.produto.nome] || 0) + item.quantidade;
        });
      });
    });

    const clientes = Object.values(clienteMap)
      .map((c) => ({
        ...c,
        ticketMedio: c.visitas > 0 ? c.totalGasto / c.visitas : 0,
        topBebidas: Object.entries(c.bebidasFavoritas)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 3)
          .map(([nome, qtd]) => ({ nome, qtd })),
      }))
      .sort((a, b) => b.totalGasto - a.totalGasto);

    return { clientes, total: clientes.length };
  }

  private gerarSugestoes(data: {
    topProdutos: { nome: string; categoria: string; total: number; quantidade: number }[];
    horarioPico: { hora: number; label: string; quantidade: number; total: number };
    ticketMedio: number;
    taxaConversao: number;
    totalComandas: number;
    totalPagas: number;
  }) {
    const sugestoes: { tipo: string; icone: string; titulo: string; descricao: string; prioridade: 'alta' | 'media' | 'baixa' }[] = [];

    if (data.topProdutos.length > 0) {
      const top = data.topProdutos[0];
      sugestoes.push({
        tipo: 'produto',
        icone: '🏆',
        titulo: `"${top.nome}" é seu campeão de vendas`,
        descricao: `Vendido ${top.quantidade}x. Considere criar um combo ou promoção com esse produto para aumentar o ticket médio.`,
        prioridade: 'media',
      });
    }

    if (data.horarioPico.quantidade > 0) {
      sugestoes.push({
        tipo: 'horario',
        icone: '⏰',
        titulo: `Pico de movimento às ${data.horarioPico.label}`,
        descricao: `Seu horário mais movimentado tem ${data.horarioPico.quantidade} comandas abertas. Garanta equipe suficiente nesse período.`,
        prioridade: 'alta',
      });
    }

    if (data.taxaConversao < 60 && data.totalComandas >= 5) {
      sugestoes.push({
        tipo: 'conversao',
        icone: '📊',
        titulo: `Taxa de pagamento abaixo de 60%`,
        descricao: `Apenas ${data.taxaConversao.toFixed(0)}% das comandas foram pagas. Verifique comandas abertas há mais de 2h e acione os clientes.`,
        prioridade: 'alta',
      });
    }

    if (data.ticketMedio > 0 && data.ticketMedio < 50) {
      sugestoes.push({
        tipo: 'ticket',
        icone: '💰',
        titulo: `Ticket médio de R$ ${data.ticketMedio.toFixed(2)}`,
        descricao: `Ticket relativamente baixo. Considere destacar combos, drinks especiais ou promoções de bebidas premium no cardápio.`,
        prioridade: 'media',
      });
    }

    if (data.topProdutos.length >= 3) {
      const bottom = data.topProdutos[data.topProdutos.length - 1];
      sugestoes.push({
        tipo: 'cardapio',
        icone: '🍹',
        titulo: `"${bottom.nome}" tem baixa saída`,
        descricao: `Produto com menor venda no cardápio. Avalie se vale manter, reduzir o preço ou substituir por algo mais popular.`,
        prioridade: 'baixa',
      });
    }

    if (data.totalComandas >= 10) {
      sugestoes.push({
        tipo: 'fidelidade',
        icone: '🎯',
        titulo: `Cadastre seus clientes frequentes`,
        descricao: `Com ${data.totalComandas} comandas registradas, identifique quem volta com frequência e crie benefícios exclusivos para fidelizá-los.`,
        prioridade: 'media',
      });
    }

    return sugestoes;
  }
}
