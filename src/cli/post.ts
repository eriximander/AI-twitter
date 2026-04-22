import { initDb } from "../db/schema.js";
import { processApprovedPost, processApprovedReply } from "../twitter/scheduler.js";
import { env } from "../config/env.js";

async function main() {
  const db = initDb(env.dbPath);
  const mode = process.argv[2] ?? "post";

  switch (mode) {
    case "post": {
      const posted = await processApprovedPost(db);
      if (!posted) console.log("投稿可能なアイテムがありません");
      break;
    }
    case "reply": {
      const replied = await processApprovedReply(db);
      if (!replied) console.log("投稿可能なリプライがありません");
      break;
    }
    case "all": {
      await processApprovedPost(db);
      await processApprovedReply(db);
      break;
    }
    default:
      console.error(`無効なモード: ${mode}`);
      console.error("使い方: npm run post -- [post|reply|all]");
      process.exit(1);
  }

  db.close();
}

main().catch((err) => {
  console.error("投稿エラー:", err);
  process.exit(1);
});
