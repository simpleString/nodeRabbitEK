import "dotenv/config";
import express, { NextFunction, Request, Response } from "express";
import RabbitMQ from "./rabbit";
import logger from "./logger";
import { SERVER_ID } from "./config";

const app = express();

const PORT = process.env.PORT || 3000;

const BROKER_URL = process.env.BROKER_URL || "amqp://localhost";

const QUEUE = process.env.QUEUE;
const RESPONSE_QUEUE = process.env.RESPONSE_QUEUE;

const REQUEST_TIMEOUT = process.env.REQUEST_TIMEOUT || 60;

if (!(QUEUE && RESPONSE_QUEUE)) throw new Error("not initilized");

const rabitClient = new RabbitMQ();

app.use(express.json());

app.post("/request", async (req, res) => {
  try {
    const result = await rabitClient.rpc(req.body);
    res.json(result);
  } catch (error) {
    if (error instanceof Error) {
      logger.error(error);
      res.status(500).json({ error: error.message, message: undefined });
    }
  }
});

app.use((err: any, req: Request, res: Response, _: NextFunction) => {
  logger.error(err.stack);
  res.status(500).send({ error: err.message, message: undefined });
});

app.listen(3000, async () => {
  await rabitClient.init(BROKER_URL, QUEUE, RESPONSE_QUEUE, +REQUEST_TIMEOUT);
  logger.info(`Client running`);
});
