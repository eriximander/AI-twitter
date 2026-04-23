import { initDb } from "../db/schema.js";
import { createReplyQueries } from "../db/queries.js";
import { postReply } from "../twitter/poster.js";
import { env } from "../config/env.js";
import type { ReplyDraft } from "../db/queries.js";

const INTERVAL_MS = 3 * 60 * 1000; // 3分間隔

async function main() {
  const db = initDb(env.dbPath);
  const replyQ = createReplyQueries(db);

  const replies = db
    .prepare("SELECT * FROM reply_drafts WHERE status = 'approved' ORDER BY id ASC")
    .all() as ReplyDraft[];

  if (replies.length === 0) {
    console.log("承認済みリプライなし");
    return;
  }

  console.log(`${replies.length}件のリプライを${INTERVAL_MS / 60000}分間隔で投稿\n`);

  for (let i = 0; i < replies.length; i++) {
    const reply = replies[i]!;

    if (i > 0) {
      const waitMin = INTERVAL_MS / 60000;
      console.log(`⏳ ${waitMin}分待機中...`);
      await new Promise(r => setTimeout(r, INTERVAL_MS));
    }

    const result = await postReply(reply.reply_content, reply.target_tweet_id);
    if (result.success && result.tweetId) {
      replyQ.markPosted.run({ id: reply.id, replyTweetId: result.tweetId });
      console.log(`✓ #${reply.id} → @${reply.target_username} (${result.tweetId})`);
    } else {
      replyQ.updateStatus.run({ id: reply.id, status: "failed" });
      console.log(`✗ #${reply.id} → @${reply.target_username}: ${result.error}`);
    }
  }

  console.log("\n完了");
  db.close();
}

main().catch(console.error);
