import { getAuthenticatedClient } from "../twitter/client.js";
import { generateReplyDraft } from "../content/generator.js";
import { initDb } from "../db/schema.js";
import { createReplyQueries } from "../db/queries.js";
import { logApiUsage } from "../safety/cost-tracker.js";
import { env } from "../config/env.js";

const targets = [
  "ChatgptAIskill",
  "ctgptlb",
  "Naoki_GPT",
  "aratamedo",
  "horomojisan",
];

async function main() {
  const db = initDb(env.dbPath);
  const client = getAuthenticatedClient();
  const replyQ = createReplyQueries(db);

  console.log("🔍 ターゲットの最新ポスト取得 → リプライ下書き生成\n");

  let drafted = 0;

  for (const username of targets) {
    if (drafted >= 3) break;

    try {
      const user = await client.v2.userByUsername(username);
      if (!user.data) continue;

      const timeline = await client.v2.userTimeline(user.data.id, {
        max_results: 5,
        "tweet.fields": ["created_at", "text"],
        exclude: ["retweets", "replies"],
      });

      const tweets = timeline.data?.data ?? [];
      if (tweets.length === 0) continue;

      const tweet = tweets[0]!;
      console.log(`@${username}: "${tweet.text.replace(/\n/g, " ").slice(0, 80)}..."`);

      const result = await generateReplyDraft(username, tweet.text);
      logApiUsage(db, "claude-sonnet-4-6", "generateReplyDraft", result.usage);

      replyQ.insert.run({
        targetTweetId: tweet.id,
        targetUsername: username,
        targetContent: tweet.text,
        replyContent: result.content,
      });

      console.log(`  → 下書き: "${result.content}"`);
      console.log();
      drafted++;
    } catch (e: any) {
      console.log(`  ✗ @${username}: ${e.message}`);
    }
  }

  console.log(`\n✓ ${drafted}件のリプライ下書き作成`);
  console.log("npm run review でリプライ承認 → 投稿");

  db.close();
}

main().catch(console.error);
