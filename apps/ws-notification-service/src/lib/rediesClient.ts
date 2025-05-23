import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");
const pub = new Redis(process.env.REDIS_URL || "redis://localhost:6379");
const sub = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

export { pub, sub, redis };
