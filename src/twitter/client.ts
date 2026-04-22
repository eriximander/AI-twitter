import { TwitterApi } from "twitter-api-v2";
import { env } from "../config/env.js";

let cachedClient: TwitterApi | null = null;

export function getAuthenticatedClient(): TwitterApi {
  if (cachedClient) return cachedClient;

  cachedClient = new TwitterApi({
    appKey: env.x.apiKey,
    appSecret: env.x.apiSecret,
    accessToken: env.x.accessToken,
    accessSecret: env.x.accessSecret,
  });

  return cachedClient;
}
