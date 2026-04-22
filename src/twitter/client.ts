import { TwitterApi } from "twitter-api-v2";
import { env } from "../config/env.js";

let client: TwitterApi | null = null;

export function getTwitterClient(): TwitterApi {
  if (!client) {
    client = new TwitterApi({
      appKey: env.x.appKey,
      appSecret: env.x.appSecret,
      accessToken: env.x.accessToken,
      accessSecret: env.x.accessSecret,
    });
  }
  return client;
}

export function getReadWriteClient() {
  return getTwitterClient().readWrite;
}
