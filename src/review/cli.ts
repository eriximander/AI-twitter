import * as readline from "node:readline/promises";
import { stdin, stdout } from "node:process";
import type Database from "better-sqlite3";
import { getPendingReviews, approveItem, rejectItem } from "./queue.js";
import { checkCompliance } from "../content/compliance.js";

export async function runReviewCli(db: Database.Database): Promise<void> {
  const items = getPendingReviews(db);

  if (items.length === 0) {
    console.log("✓ 承認待ちのアイテムはありません");
    return;
  }

  console.log(`\n📋 承認待ち: ${items.length}件\n`);

  const rl = readline.createInterface({ input: stdin, output: stdout });

  for (const item of items) {
    const label = item.kind === "post" ? "📝 投稿" : "💬 リプライ";

    console.log("─".repeat(50));
    console.log(`${label} #${item.id}`);
    if (item.context) console.log(`  ${item.context}`);
    console.log();
    console.log(`  ${item.content}`);
    console.log();

    const compliance = checkCompliance(
      item.content,
      item.content.startsWith("PR"),
    );
    if (!compliance.ok) {
      console.log("  ⚠️ コンプライアンス警告:");
      for (const issue of compliance.issues) {
        console.log(`    - ${issue}`);
      }
      console.log();
    }

    const answer = await rl.question("  [a]承認 / [r]却下 / [s]スキップ > ");

    switch (answer.trim().toLowerCase()) {
      case "a":
        approveItem(db, item.kind, item.id);
        console.log("  ✓ 承認しました\n");
        break;
      case "r":
        rejectItem(db, item.kind, item.id);
        console.log("  ✗ 却下しました\n");
        break;
      default:
        console.log("  → スキップ\n");
        break;
    }
  }

  rl.close();
  console.log("レビュー完了");
}
