import "dotenv/config";

function required(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required env var: ${key}`);
  }
  return value;
}

function optional(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

export const env = {
  x: {
    appKey: required("X_APP_KEY"),
    appSecret: required("X_APP_SECRET"),
    accessToken: required("X_ACCESS_TOKEN"),
    accessSecret: required("X_ACCESS_SECRET"),
  },
  anthropic: {
    apiKey: required("ANTHROPIC_API_KEY"),
  },
  logLevel: optional("LOG_LEVEL", "info"),
  dbPath: optional("DB_PATH", "data/ai-twitter.db"),
} as const;
