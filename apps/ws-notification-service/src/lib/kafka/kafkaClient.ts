import { Kafka } from "kafkajs";
import { KAFKA_BROKER } from "../../constants";

/*
 * Kafka client configuration
 * used to create kafka client to connect to kafka broker
 * clientId is used to identify the client in kafka broker
 * brokers is used to specify the kafka broker address
 * add your kafka broker address in brokers array
 */
 
console.log("KAFKA_BROKER: ", KAFKA_BROKER);

export const kafka = new Kafka({
  clientId: "admin-client",
  brokers: [KAFKA_BROKER],
});
