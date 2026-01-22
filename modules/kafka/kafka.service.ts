import { Injectable, OnModuleInit, OnModuleDestroy, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { Kafka, Producer, Consumer, KafkaConfig } from 'kafkajs';
import * as fs from 'fs';
import * as path from 'path';
import { validateEnv } from '../../utils/env.validation';

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy, OnApplicationBootstrap {
    private kafka: Kafka;
    private producer: Producer;
    private consumer: Consumer;
    private readonly logger = new Logger(KafkaService.name);
    private readonly handlers = new Map<string, ((payload: any) => Promise<void>)[]>();
    private isConsumerRunning = false;

    constructor() {
        const config = validateEnv(process.env);

        // Default SSL config: trust self-signed / mismatched hostnames (critical for DO Internal)
        let sslConfig: boolean | { ca?: Buffer[], cert?: Buffer, key?: Buffer, rejectUnauthorized?: boolean } = config.KAFKA_SSL ? { rejectUnauthorized: false } : false;

        const certPath = path.join(process.cwd(), 'certs', 'kafka-user.crt');
        const keyPath = path.join(process.cwd(), 'certs', 'kafka-user.key');
        const caPath = path.join(process.cwd(), 'certs', 'ca-certificate.crt');

        // Only use mTLS if we DO NOT have SASL credentials
        if (!config.KAFKA_USERNAME && config.KAFKA_SSL && fs.existsSync(certPath) && fs.existsSync(keyPath)) {
            this.logger.log('Found mTLS certificates and no SASL credentials, configuring mTLS');
            sslConfig = {
                rejectUnauthorized: false, // Still allow hostname mismatch
                cert: fs.readFileSync(certPath),
                key: fs.readFileSync(keyPath),
            };
            if (fs.existsSync(caPath)) {
                sslConfig.ca = [fs.readFileSync(caPath)];
            }
        }

        const kafkaConfig: KafkaConfig = {
            clientId: config.KAFKA_CLIENT_ID,
            brokers: config.KAFKA_BROKERS.split(','),
            ssl: sslConfig as any, // kafkajs types are a bit complex for ssl union
        };

        if (config.KAFKA_USERNAME && config.KAFKA_PASSWORD) {
            this.logger.log('Configuring Kafka with SASL/SCRAM mechanism');
            kafkaConfig.sasl = {
                mechanism: 'scram-sha-256',
                username: config.KAFKA_USERNAME,
                password: config.KAFKA_PASSWORD,
            };
        }

        this.kafka = new Kafka(kafkaConfig);

        this.producer = this.kafka.producer();
        this.consumer = this.kafka.consumer({ groupId: config.KAFKA_GROUP_ID });
    }

    async onModuleInit() {
        await this.connect();
    }

    async onApplicationBootstrap() {
        if (this.handlers.size > 0 && !this.isConsumerRunning) {
            this.logger.log(`Starting Kafka Consumer with ${this.handlers.size} topic(s)...`);
            this.isConsumerRunning = true;
            await this.consumer.run({
                eachMessage: async ({ topic, message }) => {
                    const value = message.value?.toString();
                    if (value) {
                        try {
                            const payload = JSON.parse(value);
                            const topicHandlers = this.handlers.get(topic);
                            if (topicHandlers) {
                                await Promise.all(topicHandlers.map(h => h(payload)));
                            }
                        } catch (e) {
                            this.logger.error(`Error processing message on ${topic}`, e);
                        }
                    }
                },
            });
        }
    }

    async onModuleDestroy() {
        await this.disconnect();
    }

    async connect() {
        try {
            await this.producer.connect();
            await this.consumer.connect();
            this.logger.log(`Kafka Connected (Brokers: ${process.env.KAFKA_BROKERS})`);
        } catch (err) {
            this.logger.error('Failed to connect to Kafka', err);
        }
    }

    async disconnect() {
        await this.producer.disconnect();
        await this.consumer.disconnect();
    }

    async emit<T>(topic: string, event: T) {
        // Enforce Event Contract wrapper
        const message = {
            value: JSON.stringify({
                eventId: crypto.randomUUID(),
                occurredAt: new Date().toISOString(),
                ...event,
            }),
        };

        await this.producer.send({
            topic,
            messages: [message],
        });
    }

    async subscribe<T = any>(topic: string, handler: (payload: T) => Promise<void>) {
        if (this.isConsumerRunning) {
            throw new Error(`Cannot subscribe to ${topic}: Consumer is already running.`);
        }

        this.logger.log(`Registering subscription for topic: ${topic}`);
        const existing = this.handlers.get(topic) || [];
        this.handlers.set(topic, [...existing, handler]);

        await this.consumer.subscribe({ topic, fromBeginning: false });
    }
}
