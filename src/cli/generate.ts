import { initDb } from "../db/schema.js";
import { createPostQueries } from "../db/queries.js";
import { generatePost, type PostType } from "../content/generator.js";
import { generatePostsBatch, type BatchRequest } from "../content/batch-generator.js";
import { checkCompliance } from "../content/compliance.js";
import { checkDuplicate } from "../safety/content-check.js";
import { initCostTracking, logApiUsage, getCostReport, formatCostReport } from "../safety/cost-tracker.js";
import { env } from "../config/env.js";

const POST_TYPES: PostType[] = ["tip", "news", "story", "review"];

async function singleGenerate(db: ReturnType<typeof initDb>, type: PostType, context?: string) {
  const postQ = createPostQueries(db);

  console.log(`\n🤖 ${type} タイプの投稿を生成中...\n`);

  const result = await generatePost(type, context);
  logApiUsage(db, "claude-sonnet-4-6", "generatePost", result.usage);

  const cacheInfo = result.usage.cacheReadTokens > 0
    ? ` (キャッシュヒット: ${result.usage.cacheReadTokens}tok)`
    : result.usage.cacheCreationTokens > 0
      ? ` (キャッシュ作成: ${result.usage.cacheCreationTokens}tok)`
      : "";
  console.log(`トークン: in=${result.usage.inputTokens} out=${result.usage.outputTokens}${cacheInfo}`);

  console.log("─".repeat(50));
  console.log(result.content);
  console.log("─".repeat(50));

  const compliance = checkCompliance(result.content, type === "promo");
  if (!compliance.ok) {
    console.log("\n⚠️ コンプライアンス警告:");
    for (const issue of compliance.issues) {
      console.log(`  - ${issue}`);
    }
  }

  const duplicate = checkDuplicate(db, result.content);
  if (!duplicate.ok) {
    console.log(`\n⚠️ 重複チェック: ${duplicate.reason}`);
  }

  if (compliance.ok && duplicate.ok) {
    postQ.insert.run({
      type,
      content: result.content,
      imagePath: null,
      status: "draft",
      scheduledAt: null,
    });
    console.log("\n✓ 下書きとして保存しました（npm run review で承認）");
  } else {
    console.log("\n✗ 問題があるため保存しませんでした。再生成してください。");
  }
}

async function batchGenerate(db: ReturnType<typeof initDb>, count: number) {
  const postQ = createPostQueries(db);
  const requests: BatchRequest[] = [];

  for (let i = 0; i < count; i++) {
    const type = POST_TYPES[i % POST_TYPES.length]!;
    requests.push({ id: `post_${i}_${type}`, type });
  }

  console.log(`\n📦 バッチ生成: ${count}件 (50%OFFで処理)\n`);

  const results = await generatePostsBatch(requests);
  let saved = 0;

  for (const result of results) {
    if (!result.content) {
      console.log(`  ✗ ${result.id}: ${result.error ?? "生成失敗"}`);
      continue;
    }

    const type = result.id.split("_")[2] as PostType;
    const compliance = checkCompliance(result.content, type === "promo");
    const duplicate = checkDuplicate(db, result.content);

    if (compliance.ok && duplicate.ok) {
      postQ.insert.run({
        type,
        content: result.content,
        imagePath: null,
        status: "draft",
        scheduledAt: null,
      });
      console.log(`  ✓ ${result.id}: 保存完了`);
      saved++;
    } else {
      const reasons = [...compliance.issues, duplicate.reason].filter(Boolean);
      console.log(`  ✗ ${result.id}: ${reasons.join(", ")}`);
    }
  }

  console.log(`\n✓ ${saved}/${count}件を下書き保存しました`);
}

async function main() {
  const db = initDb(env.dbPath);
  initCostTracking(db);

  const arg = process.argv[2];

  if (arg === "batch") {
    const count = Number(process.argv[3]) || 4;
    await batchGenerate(db, count);
  } else if (arg === "cost") {
    console.log(formatCostReport(getCostReport(db)));
  } else {
    const type = (arg as PostType) ?? POST_TYPES[Math.floor(Math.random() * POST_TYPES.length)];
    const context = process.argv[3];

    if (!POST_TYPES.includes(type) && type !== "promo") {
      console.error(`無効な引数: ${arg}`);
      console.error(`使い方:`);
      console.error(`  npm run generate -- [type] [context]  単発生成`);
      console.error(`  npm run generate -- batch [count]     バッチ生成(50%OFF)`);
      console.error(`  npm run generate -- cost              コストレポート`);
      process.exit(1);
    }

    await singleGenerate(db, type, context);
  }

  db.close();
}

main().catch((err) => {
  console.error("生成エラー:", err);
  process.exit(1);
});
