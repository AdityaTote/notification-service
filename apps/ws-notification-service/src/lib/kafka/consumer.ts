import { Consumer } from "kafkajs";
import { kafka } from "./kafkaClient";

export class EventConsumer {
  private consumer: Consumer;
  private connected = false;
  private subscribedTopics: Set<string> = new Set();
  private socketsMap: Map<string, Set<WebSocket>> = new Map();
  private isRunning = false;

  constructor(groupId: string = "test-1") {
    this.consumer = kafka.consumer({ groupId });
  }

  private async connect(): Promise<void> {
    if (!this.connected) {
      await this.consumer.connect();
      this.connected = true;
    }
  }

  private async subscribe(topic: string): Promise<void> {
    if (!this.subscribedTopics.has(topic)) {
      await this.consumer.subscribe({ topic });
      this.subscribedTopics.add(topic);
    }
  }

  private async startConsuming(): Promise<void> {
    if (this.isRunning) return;

    await this.consumer.run({
      eachMessage: async ({ topic, message }) => {
        const wsSet = this.socketsMap.get(topic);
        const msgValue = message.value?.toString() || "";

        if (wsSet) {
          for (const ws of wsSet) {
            if (ws.readyState === ws.OPEN) {
              ws.send(msgValue);
            }
          }
        }
      },
    });

    this.isRunning = true;
  }

  public async addWebSocketForTopic(
    topic: string,
    ws: WebSocket
  ): Promise<void> {
    await this.connect();
    await this.subscribe(topic);

    if (!this.socketsMap.has(topic)) {
      this.socketsMap.set(topic, new Set());
    }
    this.socketsMap.get(topic)!.add(ws);

    await this.startConsuming(); // <-- Call AFTER subscribe
  }

  public removeWebSocket(ws: WebSocket): void {
    for (const [topic, sockets] of this.socketsMap.entries()) {
      sockets.delete(ws);
      if (sockets.size === 0) {
        this.socketsMap.delete(topic);
      }
    }
  }

  public async disconnect(): Promise<void> {
    if (this.connected) {
      await this.consumer.disconnect();
      this.connected = false;
      this.subscribedTopics.clear();
      this.socketsMap.clear();
      this.isRunning = false;
    }
  }
}
