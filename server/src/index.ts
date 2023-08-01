import amqplib from "amqplib";
import "dotenv/config";
import { multiplyWithTimeout } from "./worker";
import logger from "./logger";

const BROKER_URL = process.env.BROKER_URL || "amqp://localhost";

const QUEUE = process.env.QUEUE;

const REQUEST_TIMEOUT = process.env.REQUEST_TIMEOUT || 60;

if (!QUEUE) throw new Error("not initilized");

const startListen = async () => {
  const connection = await amqplib.connect(BROKER_URL);
  const channel = await connection.createChannel();

  await channel.prefetch(1);
  await channel.assertQueue(QUEUE, { durable: false });

  channel.on("error", (err) => {
    logger.error(`Channel error: ${err.message}`);
  });

  channel.on("close", (err) => {
    logger.info("Channel closed");
  });

  channel.consume(
    QUEUE,
    async (msg) => {
      if (msg) {
        try {
          logger.info(`Received message: ${msg.content.toString()}`);
          const params = JSON.parse(msg.content.toString());

          const result = await multiplyWithTimeout(params.a, params.b);

          channel.sendToQueue(
            msg.properties.replyTo,
            Buffer.from(JSON.stringify({ result })),
            {
              correlationId: msg.properties.correlationId,
              expiration: REQUEST_TIMEOUT,
            }
          );
        } catch (error) {}
      }
    },
    { noAck: true }
  );
};

try {
  startListen();
} catch (error) {}
