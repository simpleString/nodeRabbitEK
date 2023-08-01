import { randomUUID } from "crypto";

export const SERVER_ID = process.env.SERVER_ID || randomUUID();
