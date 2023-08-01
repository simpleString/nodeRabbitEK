import winston from "winston";
import { ElasticsearchTransport } from "winston-elasticsearch";
import { SERVER_ID } from "./config";

const esTransport = new ElasticsearchTransport({
  level: "info",
  clientOpts: {
    node: `${process.env.ELASTICSEARCH_URL}:9200`,
    auth: { username: "elastic", password: "1234567" },
  },
});

const logger = winston.createLogger({
  handleRejections: true,
  exitOnError: false,
  format: winston.format.json(),
  defaultMeta: { service: SERVER_ID },
  transports: [esTransport],
});

if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.json()
      ),
    })
  );
}

export default logger;
