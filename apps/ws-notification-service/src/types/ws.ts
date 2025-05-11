import { WebSocket } from "ws";

export interface IUserInputMessage {
  type: string;
  message: string;
}

export interface IUserConnection {
  userId: string;
  ws: WebSocket;
}