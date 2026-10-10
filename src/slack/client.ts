import { WebClient } from "@slack/web-api";
import dotenv from "dotenv";

dotenv.config();

const token = process.env.SLACK_TOKEN;

if (!token) {
  throw new Error("Missing SLACK_TOKEN in .env");
}

export const slackClient = new WebClient(token);