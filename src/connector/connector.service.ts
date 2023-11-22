import { Injectable } from '@nestjs/common';
import { BehaviorSubject } from 'rxjs';
import { v4 as uuid } from 'uuid';
import { Connection } from './models';

@Injectable()
export class ConnectorService {
  private readonly queue: Map<string, BehaviorSubject<string[]>> = new Map();
  private readonly pairs: Map<string, BehaviorSubject<Connection>> = new Map();
  private readonly destructors: WeakMap<
    BehaviorSubject<Connection>,
    () => void
  > = new WeakMap();

  getQueue(taskId: string): BehaviorSubject<string[]> {
    if (!this.queue.get(taskId)) {
      this.queue.set(taskId, new BehaviorSubject([]));
    }

    return this.queue.get(taskId);
  }

  getPeer(
    connId: string,
    connection: BehaviorSubject<Connection>,
  ): string | undefined {
    return Object.values(connection.getValue()).find((id) => id !== connId);
  }

  getConnection(connId: string): BehaviorSubject<Connection> | undefined {
    return this.pairs.get(connId);
  }

  addToQueue(taskId: string, ...connIds: string[]): void {
    this.getQueue(taskId).next([
      ...this.getQueue(taskId).getValue(),
      ...connIds,
    ]);
  }

  removeFromQueue(taskId: string, ...connIds: string[]): void {
    const queue = this.getQueue(taskId).getValue();
    connIds.forEach((connId) => queue.splice(queue.indexOf(connId), 1));
    this.getQueue(taskId).next([...queue]);
  }

  connect(taskId: string): BehaviorSubject<Connection> {
    const connId = uuid(); // идентификатор нового подключения

    // эдж кейс: только что созданный uuid уже обработан
    if (
      this.pairs.get(connId) ||
      this.getQueue(taskId).getValue().includes(connId)
    ) {
      this.connect(taskId);
      return;
    }

    const connection = new BehaviorSubject<Connection>({ peer1: connId });

    this.pairs.set(connId, connection);
    this.addToQueue(taskId, connId);

    const subscription = this.getQueue(taskId).subscribe({
      next: (queue) => {
        if (
          queue.length &&
          queue.includes(connId) &&
          queue[0] !== connId &&
          !connection.getValue().peer2
        ) {
          const peerId = queue[0]; // берем самое старое подключение из ожидающих
          const peerConnection = this.pairs.get(peerId);

          connection.next({ peer1: connId, peer2: peerId });
          peerConnection.next({ peer1: peerId, peer2: connId });

          this.removeFromQueue(taskId, connId, peerId);
        }
      },
    });
    this.destructors.set(connection, () => subscription.unsubscribe());

    return connection;
  }

  retry(taskId: string, connId: string): void {
    if (!this.getQueue(taskId).getValue().includes(connId)) {
      this.addToQueue(taskId, connId);
    }
  }

  decline(taskId: string, connId: string): void {
    const connection = this.pairs.get(connId);
    const peerId = this.getPeer(connId, connection);

    connection.next({ peer1: connId });

    if (peerId) {
      const peerConnection = this.pairs.get(peerId);
      peerConnection.next({ peer1: peerId, wasClosed: true });
      this.addToQueue(taskId, peerId);
    }
  }

  disconnect(taskId: string, connId: string): void {
    const connection = this.pairs.get(connId);
    if (!connection) return;

    const peerId = this.getPeer(connId, connection);
    const queue = this.getQueue(taskId).getValue();

    this.pairs.delete(connId);
    this.destructors.get(connection)?.();

    if (queue.includes(connId)) {
      this.removeFromQueue(taskId, connId);
    }

    if (peerId) {
      const peerConnection = this.pairs.get(peerId);
      peerConnection.next({ peer1: peerId, wasClosed: true });
      this.addToQueue(taskId, peerId);
    }
  }
}
