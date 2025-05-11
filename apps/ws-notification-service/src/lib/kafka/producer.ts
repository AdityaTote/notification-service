import { Producer } from "kafkajs";
import { kafka } from "./kafkaClient";
import { ITopicMessages } from "@ws/types/kafka";

export class EventProducer {
    private producer: Producer;
    private connected = false;

    constructor() {
        this.producer = kafka.producer({
            transactionTimeout: 30000,
        });
    }

    /**
     * Connect to Kafka broker`
     */
    public async connect(): Promise<void> {
        if (!this.connected) {
            try {
                await this.producer.connect();
                this.connected = true;
                console.log("Producer connected successfully");
            } catch (error) {
                console.error("Error connecting producer: ", error);
                throw error;
            }
        }
    }

    /**
     * Disconnect from Kafka broker
     */
    public async disconnect(): Promise<void> {
        if (this.connected) {
            try {
                await this.producer.disconnect();
                this.connected = false;
                console.log("Producer disconnected");
            } catch (error) {
                console.error("Error disconnecting producer: ", error);
                throw error;
            }
        }
    }

    /**
     * Send a single message or array of messages to a topic
     */
    public async sendMessage(topic: string, messages: string): Promise<void> {
        try {
            if (!this.connected) {
                await this.connect();
            }

            await this.producer.send({
                topic,
                messages: [{ key: messages + Date.now(), value: messages }],
            });
        } catch (error) {
            console.error("Error sending message: ", error);
            throw error;
        }
    }

    /**
     * Send batch of messages to multiple topics
     */
    public async sendBatch(topicMessages: ITopicMessages[]): Promise<void> {
        try {
            if (!this.connected) {
                await this.connect();
            }

            const formattedBatch = topicMessages.map((tm) => ({
                topic: tm.topic,
                messages: tm.messages.map((msg) => ({
                    ...msg,
                    value:
                        typeof msg.value === "object" &&
                        !(msg.value instanceof Buffer)
                            ? JSON.stringify(msg.value)
                            : msg.value,
                })),
            }));

            await this.producer.sendBatch({
                topicMessages: formattedBatch,
            });
        } catch (error) {
            console.error("Error sending batch message: ", error);
            throw error;
        }
    }
}
