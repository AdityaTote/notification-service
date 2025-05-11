import { WebSocket, WebSocketServer } from "ws";
import { IUserInputMessage } from "@ws/types/ws";
import { EventProducer } from "./producer";
import { EventConsumer } from "./consumer";

export class WsKafkaServer {
  private wss: WebSocketServer;
  private producer: EventProducer | undefined;
  private consumer: EventConsumer | undefined;

  constructor(port: number) {
    this.wss = new WebSocketServer({ port: port });
    this.initProducer();
    this.initConsumer();
  }

  public initalize() {
    this.wss.on("connection", (ws) => {
      ws.on("error", (e) => {
        console.error("client error", e);
      });

      ws.on("close", () => {
        console.log("client disconnected");
        this.consumer?.removeWebSocket(ws);
      });

      ws.on("message", async (message) => {
        const data = JSON.parse(message.toString()) as IUserInputMessage;
        await this.availResourceNotification(data, ws);
        await this.requiredResourceNotification(data, ws);
      });
    });

    this.wss.on("error", (e) => {
      console.error("server error", e);
    });

    this.wss.on("close", () => {
      console.log("server closed");
    });
  }

  private async availResourceNotification(
    data: IUserInputMessage,
    ws: WebSocket
  ) {
    if (data.type === "app:notification:avaliable") {
      this.ensureKafkaInstances();
      console.log("Sending available resource notification:", data.message);

      // Register WS first to avoid message loss
      await this.consumer?.addWebSocketForTopic(
        "app-notification-avaliable",
        ws
      );
      await this.producer?.sendMessage(
        "app-notification-avaliable",
        data.message
      );
    }
  }

  private async requiredResourceNotification(
    data: IUserInputMessage,
    ws: WebSocket
  ) {
    if (data.type === "app:notification:required") {
      this.ensureKafkaInstances();
      console.log("Sending required resource notification:", data.message);

      await this.consumer?.addWebSocketForTopic(
        "app-notification-required",
        ws
      );
      await this.producer?.sendMessage(
        "app-notification-required",
        data.message
      );
    }
  }

  private initProducer() {
    this.producer = new EventProducer();
  }

  private initConsumer() {
    this.consumer = new EventConsumer();
  }

  private ensureKafkaInstances() {
    if (!this.producer) this.initProducer();
    if (!this.consumer) this.initConsumer();
  }
}
