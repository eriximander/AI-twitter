import { initDb } from "../db/schema.js";
import { runReviewCli } from "../review/cli.js";
import { env } from "../config/env.js";

async function main() {
  const db = initDb(env.dbPath);
  await runReviewCli(db);
  db.close();
}

main().catch((err) => {
  console.error("レビューエラー:", err);
  process.exit(1);
});
