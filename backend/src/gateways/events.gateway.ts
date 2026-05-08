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
import { isAllowedFrontendOrigin } from '../common/cors-allow';

@WebSocketGateway({
  cors: {
    origin: (
      origin: string | undefined,
      cb: (err: Error | null, ok?: boolean) => void,
    ) => {
      cb(null, isAllowedFrontendOrigin(origin));
    },
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

  /** Evita 500 se o servidor WS ainda não inicializou ou o emit falhar. */
  private safeEmit(run: (s: Server) => void) {
    try {
      if (this.server) run(this.server);
    } catch (e) {
      console.error('EventsGateway emit falhou', e);
    }
  }

  emitComandaAtualizada(comandaId: string, data: any) {
    this.safeEmit((s) => s.to(`comanda:${comandaId}`).emit('comanda:atualizada', data));
  }

  emitPedidoAdicionado(tenantId: string, comandaId: string, data: any) {
    this.safeEmit((s) => {
      s.to(`tenant:${tenantId}`).emit('pedido:adicionado', data);
      s.to(`comanda:${comandaId}`).emit('comanda:atualizada', data);
    });
  }

  emitPagamentoConfirmado(comandaId: string, data: any) {
    this.safeEmit((s) => s.to(`comanda:${comandaId}`).emit('pagamento:confirmado', data));
  }

  emitComandaCriada(tenantId: string, data: any) {
    this.safeEmit((s) => s.to(`tenant:${tenantId}`).emit('comanda:criada', data));
  }
}
