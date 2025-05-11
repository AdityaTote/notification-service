import { WsKafkaServer } from "./lib/kafka/wsKafka";

const wsServer = new WsKafkaServer(8080);
wsServer.initalize();
console.log("WebSocket server started on ws://localhost:8080");
