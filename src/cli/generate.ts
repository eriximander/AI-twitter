import { initDb } from "../db/schema.js";
import { createPostQueries } from "../db/queries.js";
import { generatePost, type PostType } from "../content/generator.js";
import { checkCompliance } from "../content/compliance.js";
import { checkDuplicate } from "../safety/content-check.js";
import { env } from "../config/env.js";

const POST_TYPES: PostType[] = ["tip", "news", "story", "review"];

async function main() {
  const db = initDb(env.dbPath);
  const postQ = createPostQueries(db);

  const type = (process.argv[2] as PostType) ?? POST_TYPES[Math.floor(Math.random() * POST_TYPES.length)];
  const context = process.argv[3];

  if (!POST_TYPES.includes(type) && type !== "promo") {
    console.error(`無効なタイプ: ${type}`);
    console.error(`使い方: npm run generate -- [${[...POST_TYPES, "promo"].join("|")}] [コンテキスト]`);
    process.exit(1);
  }

  console.log(`\n🤖 ${type} タイプの投稿を生成中...\n`);

  const content = await generatePost(type, context);

  console.log("─".repeat(50));
  console.log(content);
  console.log("─".repeat(50));

  const compliance = checkCompliance(content, type === "promo");
  if (!compliance.ok) {
    console.log("\n⚠️ コンプライアンス警告:");
    for (const issue of compliance.issues) {
      console.log(`  - ${issue}`);
    }
  }

  const duplicate = checkDuplicate(db, content);
  if (!duplicate.ok) {
    console.log(`\n⚠️ 重複チェック: ${duplicate.reason}`);
  }

  if (compliance.ok && duplicate.ok) {
    postQ.insert.run({
      type,
      content,
      imagePath: null,
      status: "draft",
      scheduledAt: null,
    });
    console.log("\n✓ 下書きとして保存しました（npm run review で承認）");
  } else {
    console.log("\n✗ 問題があるため保存しませんでした。再生成してください。");
  }

  db.close();
}

main().catch((err) => {
  console.error("生成エラー:", err);
  process.exit(1);
});
