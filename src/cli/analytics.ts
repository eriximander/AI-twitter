import { initDb } from "../db/schema.js";
import { updateTweetMetrics, recordDailyStats, getWeeklyReport } from "../twitter/analytics.js";
import { getAffiliateReport } from "../affiliate/links.js";
import { getMonthlyReport, checkSpecialRateEligibility } from "../affiliate/tracker.js";
import { checkShadowban } from "../safety/shadowban.js";
import { initCostTracking, getCostReport, formatCostReport } from "../safety/cost-tracker.js";
import { env } from "../config/env.js";

async function main() {
  const db = initDb(env.dbPath);
  initCostTracking(db);
  const command = process.argv[2] ?? "report";

  switch (command) {
    case "update": {
      console.log("メトリクス更新中...");
      const count = await updateTweetMetrics(db);
      console.log(`${count}件のツイートを更新しました`);
      recordDailyStats(db);
      console.log("日次統計を記録しました");
      break;
    }
    case "report": {
      console.log(getWeeklyReport(db));
      console.log();
      console.log(getAffiliateReport(db));
      const monthly = getMonthlyReport(db);
      console.log(`\n💰 ${monthly.month} 推定収益: ¥${monthly.totalRevenue.toLocaleString()}`);
      if (monthly.topLink) {
        console.log(`  トップ案件: ${monthly.topLink}`);
      }
      break;
    }
    case "shadowban": {
      const username = process.argv[3];
      if (!username) {
        console.error("使い方: npm run analytics -- shadowban <username>");
        process.exit(1);
      }
      console.log(`@${username} のシャドウバンチェック中...`);
      const result = await checkShadowban(username);
      if (result.suspected) {
        console.log("⚠️ シャドウバンの可能性あり:");
        for (const indicator of result.indicators) {
          console.log(`  - ${indicator}`);
        }
      } else {
        console.log("✓ シャドウバンの兆候なし");
      }
      break;
    }
    case "cost": {
      console.log(formatCostReport(getCostReport(db)));
      break;
    }
    case "special-rate": {
      const eligible = checkSpecialRateEligibility(db);
      if (eligible.length === 0) {
        console.log("特単交渉可能な案件はまだありません（20CV以上必要）");
      } else {
        console.log("⭐ 特単交渉可能な案件:");
        for (const e of eligible) {
          console.log(`  ${e}`);
        }
      }
      break;
    }
    default:
      console.error(`無効なコマンド: ${command}`);
      console.error("使い方: npm run analytics -- [update|report|shadowban|cost|special-rate]");
      process.exit(1);
  }

  db.close();
}

main().catch((err) => {
  console.error("分析エラー:", err);
  process.exit(1);
});
