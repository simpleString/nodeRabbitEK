import amqplib, { Channel, Connection, ConsumeMessage } from "amqplib";
import { EventEmitter } from "stream";
import { SERVER_ID } from "./config";
import logger from "./logger";

export default class RabbitMQ {
  private connection?: Connection;
  private channel?: Channel;
  private queue?: string;
  private responseQueue?: string;

  private requestTimeout?: number;

  private eventEmitter = new EventEmitter();

  async init(
    url: string,
    queue: string,
    responseQueue: string,
    requestTimeout: number
  ) {
    this.connection = await amqplib.connect(url);
    this.channel = await this.connection.createChannel();

    this.queue = queue;
    this.responseQueue = responseQueue;
    this.requestTimeout = requestTimeout;

    await this.channel.assertQueue(this.queue, { durable: false });
    await this.channel.assertQueue(this.responseQueue, { durable: false });

    this.channel.on("error", (err) => {
      console.error(`Channel error: ${err.message}`);
    });

    this.channel.on("close", (err) => {
      logger.info("Channel closed");
    });

    this.channel.consume(
      this.responseQueue,
      (msg) => {
        if (msg) {
          logger.info(`Received message: ${msg.content.toString()}`);
          this.eventEmitter.emit(msg.properties.correlationId, msg);
        }
      },
      { noAck: true }
    );
  }

  async rpc(data: {}) {
    if (!this.queue) throw new Error("Not initilized");
    this.channel?.sendToQueue(this.queue, Buffer.from(JSON.stringify(data)), {
      replyTo: this.responseQueue,
      correlationId: SERVER_ID,
      expiration: this.requestTimeout,
    });

    const result = await new Promise((res, rej) => {
      const timer = setTimeout(
        () => rej(new Error("Time over")),
        this.requestTimeout! * 1000
      );

      this.eventEmitter.once(SERVER_ID, (msg: ConsumeMessage) => {
        try {
          clearTimeout(timer);
          const data = JSON.parse(msg.content.toString());
          res(data);
        } catch (error) {
          rej(error);
        }
      });
    });

    return result;
  }
}
