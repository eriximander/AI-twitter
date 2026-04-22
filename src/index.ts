import { initDb } from "./db/schema.js";
import { startScheduler } from "./twitter/scheduler.js";
import { monitorAndDraft } from "./twitter/monitor.js";
import { updateTweetMetrics, recordDailyStats } from "./twitter/analytics.js";
import { env } from "./config/env.js";
import cron from "node-cron";

function main() {
  console.log("🚀 AI Twitter Bot 起動中...");

  const db = initDb(env.dbPath);

  startScheduler(db);

  cron.schedule("0 8,14 * * *", async () => {
    console.log("\n🔍 モニタリング開始...");
    const count = await monitorAndDraft(db);
    console.log(`${count}件のリプライ下書きを作成`);
  });

  cron.schedule("0 23 * * *", async () => {
    console.log("\n📊 日次メトリクス更新...");
    await updateTweetMetrics(db);
    recordDailyStats(db);
    console.log("日次統計を記録しました");
  });

  console.log("スケジュール:");
  console.log("  投稿: 9:00 / 12:00 / 18:00 / 21:00");
  console.log("  リプライ: 10:30 / 15:30 / 20:30");
  console.log("  モニタリング: 8:00 / 14:00");
  console.log("  メトリクス更新: 23:00");
  console.log("\n✓ 待機中... (Ctrl+C で終了)");
}

main();
