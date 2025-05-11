import { WebSocketServer, WebSocket } from "ws";
import { v4 as uuid } from "uuid";
import { pub, redis, sub } from "./rediesClient";
import { IUserConnection, IUserInputMessage } from "@ws/types/ws";
import { getUserForSpecificNotification } from "./user";

export class WsServer {
    private wss: WebSocketServer;
    private onlineConnections: Map<string, IUserConnection>;

    constructor(port: number) {
        this.wss = new WebSocketServer({ port: port });
        this.onlineConnections = new Map<string, IUserConnection>();
        sub.subscribe(
            "app:notification:avaliable",
            "app:notification:required",
            (error) => {
                if (error) {
                    console.error("Error subscribing to Redis channel:", error);
                } else {
                    console.log("Subscribed to Redis channel successfully.");
                }
            }
        );
    }

    public initalize() {
        this.wss.on("connection", async (ws, req) => {
            const connectionId = uuid();
            const userId = req.url?.split("/").pop();
            if (!userId) {
                console.error("User ID not found in URL");
                ws.close();
                return;
            }
            await redis.setex(`ws:user:${userId}`, 3600, connectionId);
            await redis.hset(`ws:conn:${connectionId}`, {
                id: userId,
                ip: req.socket.remoteAddress,
                userAgent: req.headers["user-agent"],
                connectedAt: new Date().toISOString(),
            });
            await redis.expire(`ws:conn:${connectionId}`, 3600);
            this.onlineConnections.set(connectionId, { userId, ws });
            ws.on("error", (e) => {
                console.error("client error", e);
            });
            ws.on("close", (e) => {
                redis.del(`ws:conn:${connectionId}`);
                redis.del(`ws:user:${userId}`);
                this.onlineConnections.delete(connectionId);
                console.log("client disconnected", e);
            });
            ws.on("message", (message) => {
                const data = JSON.parse(message.toString());
                this.availResourceNotification(data, ws);
                this.requiredResourceNotification(data, ws);
            });
        });

        this.wss.on("error", (e) => {
            console.error("server error", e);
        });

        this.wss.on("close", () => {
            console.log("server closed");
        });
    }

    private availResourceNotification(data: IUserInputMessage, ws: WebSocket) {
        if (data.type === "app:notification:avaliable") {
            console.log(data.message);
            pub.publish(
                "app:notification:avaliable",
                JSON.stringify(data.message)
            );
            sub.on("message", (channel, message) => {
                if (channel === "app:notification:avaliable") {
                    // find user to send notification
                    this.notifyUser(message);
                    console.log("Received message from Redis:", message);
                    ws.send(message);
                }
            });
        }
    }

    private requiredResourceNotification(
        data: IUserInputMessage,
        ws: WebSocket
    ) {
        if (data.type === "app:notification:required") {
            console.log(data.message);
            pub.publish(
                "app:notification:required",
                JSON.stringify(data.message)
            );
            sub.on("message", (channel, message) => {
                if (channel === "app:notification:required") {
                    console.log("Received message from Redis:", message);
                    ws.send(message);
                }
            });
        }
    }
    private async notifyUser(message: string) {
        const users = getUserForSpecificNotification(
            message,
            this.onlineConnections
        );
        if (users.ws) {
            if (users.ws.readyState === WebSocket.OPEN) {
                users.ws.send(message);
            }
        }
    }
}
