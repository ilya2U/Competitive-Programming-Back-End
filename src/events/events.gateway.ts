import { Connection, ConnectorService } from '@/connector';
import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsResponse,
} from '@nestjs/websockets';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { Server, WebSocket } from 'ws';
import { config } from 'dotenv';
import { IncomingMessage } from 'http';

config();

@WebSocketGateway(parseInt(process.env.WS_PORT))
export class EventsGateway implements OnGatewayConnection, OnGatewayInit {
  private readonly logger = new Logger(EventsGateway.name);

  socketMap: Map<string, WebSocket> = new Map();
  connectionMap: WeakMap<WebSocket, BehaviorSubject<Connection>> =
    new WeakMap();
  livenessMap: WeakMap<WebSocket, boolean> = new WeakMap();
  taskMap: WeakMap<WebSocket, string> = new WeakMap();

  @WebSocketServer()
  server: Server;

  constructor(private connectorService: ConnectorService) {}

  afterInit() {
    this.logger.log(`Starting WSS on port ${process.env.WS_PORT}`);
    const interval = setInterval(() => {
      this.server.clients.forEach((ws) => {
        if (this.livenessMap.get(ws) === false) {
          const connId = this.connectionMap.get(ws)?.getValue().peer1;

          if (connId) {
            this.socketMap.delete(connId);
            this.connectorService.disconnect(this.taskMap.get(ws), connId);
          }
          ws.terminate();
        }

        this.livenessMap.set(ws, false);
        ws.ping();
      });
    }, parseInt(process.env.HEARTBIT_TIMEOUT));

    this.server.on('close', () => {
      clearInterval(interval);
      this.logger.log('Successfully cleared heartbit interval');
    });
  }

  handleConnection(ws: WebSocket, request: IncomingMessage): void {
    const params = new URLSearchParams(request.url.split('?').at(-1));
    const taskId = params.get('taskId');
    const connection = this.connectorService.connect(taskId);
    const { peer1 } = connection.getValue();

    const connectEvent = JSON.stringify({ event: 'connect', data: peer1 });
    ws.send(connectEvent);

    this.logger.log(`Initializing connection ${peer1} for task ${taskId}`);
    this.socketMap.set(peer1, ws);
    this.livenessMap.set(ws, true);
    this.taskMap.set(ws, taskId);
    this.connectionMap.set(ws, connection);

    ws.on('pong', () => {
      this.livenessMap.set(ws, true);
    });
    ws.on('close', () => {
      this.logger.log(`Disconnecting ${peer1}`);
      this.socketMap.delete(peer1);
      this.connectorService.disconnect(taskId, peer1);
    });
    ws.on('error', this.logger.error);

    connection.subscribe({
      next: ({ peer1, peer2, wasClosed }) => {
        if (wasClosed) {
          const disconnectEvent = JSON.stringify({ event: 'disconnect' });
          ws.send(disconnectEvent);
          connection.next({ peer1 });
        } else if (peer1 && peer2) {
          const pairEvent = JSON.stringify({ event: 'pair', data: peer2 });
          this.logger.log(`Pairing ${peer1} with ${peer2}`);
          ws.send(pairEvent);
        }
      },
    });
  }

  @SubscribeMessage('ready')
  handleReadyMessage(ws: WebSocket): void {
    const connection = this.connectionMap.get(ws);
    const { peer2 } = connection.getValue();
    const peerSocket = this.socketMap.get(peer2);

    if (peerSocket) {
      const readyEvent = JSON.stringify({ event: 'ready', data: null });

      peerSocket.send(readyEvent);
    }
  }

  @SubscribeMessage('retry')
  handleRetryMessage(ws: WebSocket): void {
    const connection = this.connectionMap.get(ws);
    const taskId = this.taskMap.get(ws);
    const { peer1 } = connection.getValue();

    this.connectorService.retry(taskId, peer1);
  }

  @SubscribeMessage('push')
  handlePushMessage(ws: WebSocket, data: string): void {
    const connection = this.connectionMap.get(ws);
    const { peer2 } = connection.getValue();
    const peerSocket = this.socketMap.get(peer2);

    if (peerSocket) {
      const pullEvent = JSON.stringify({ event: 'pull', data });

      peerSocket.send(pullEvent);
    }
  }

  @SubscribeMessage('attempt')
  handleAttemptMessage(ws: WebSocket): void {
    const connection = this.connectionMap.get(ws);
    const { peer2 } = connection.getValue();
    const peerSocket = this.socketMap.get(peer2);

    if (peerSocket) {
      const attemptEvent = JSON.stringify({ event: 'attempt', data: null });

      peerSocket.send(attemptEvent);
    }
  }

  @SubscribeMessage('win')
  handleWinMessage(ws: WebSocket): Observable<WsResponse> {
    const connection = this.connectionMap.get(ws);
    const { peer2 } = connection.getValue();
    const peerSocket = this.socketMap.get(peer2);

    if (peerSocket) {
      const loseEvent = JSON.stringify({ event: 'lose', data: null });

      peerSocket.send(loseEvent);
    }

    return of({ event: 'win', data: null });
  }

  @SubscribeMessage('decline')
  handleDeclineMessage(ws: WebSocket): Observable<WsResponse> {
    const connection = this.connectionMap.get(ws);
    const taskId = this.taskMap.get(ws);
    const { peer1 } = connection.getValue();
    this.connectorService.decline(taskId, peer1);

    return of({ event: 'decline', data: null });
  }
}
