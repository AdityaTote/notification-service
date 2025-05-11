import { config } from "dotenv";

config();

export const WS_PORT = process.env.WS_PORT ||8080;
export const KAFKA_BROKER = process.env.KAFKA_BROKER || "localhost:9092";
export const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";