import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

function socketCorsOrigins(): string | string[] {
  const list = (process.env.FRONTEND_URL || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (list.length === 0) return 'http://localhost:3000';
  if (list.length === 1) return list[0];
  return list;
}

@WebSocketGateway({
  cors: {
    origin: socketCorsOrigins(),
    credentials: true,
  },
  namespace: '/',
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`Cliente conectado: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Cliente desconectado: ${client.id}`);
  }

  @SubscribeMessage('join:comanda')
  handleJoinComanda(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { comandaId: string },
  ) {
    client.join(`comanda:${data.comandaId}`);
    return { event: 'joined', data: { room: `comanda:${data.comandaId}` } };
  }

  @SubscribeMessage('join:tenant')
  handleJoinTenant(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { tenantId: string },
  ) {
    client.join(`tenant:${data.tenantId}`);
    return { event: 'joined', data: { room: `tenant:${data.tenantId}` } };
  }

  emitComandaAtualizada(comandaId: string, data: any) {
    this.server.to(`comanda:${comandaId}`).emit('comanda:atualizada', data);
  }

  emitPedidoAdicionado(tenantId: string, comandaId: string, data: any) {
    this.server.to(`tenant:${tenantId}`).emit('pedido:adicionado', data);
    this.server.to(`comanda:${comandaId}`).emit('comanda:atualizada', data);
  }

  emitPagamentoConfirmado(comandaId: string, data: any) {
    this.server.to(`comanda:${comandaId}`).emit('pagamento:confirmado', data);
  }

  emitComandaCriada(tenantId: string, data: any) {
    this.server.to(`tenant:${tenantId}`).emit('comanda:criada', data);
  }
}
