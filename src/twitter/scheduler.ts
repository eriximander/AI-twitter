import type Database from "better-sqlite3";
import cron from "node-cron";
import { createPostQueries, createReplyQueries } from "../db/queries.js";
import type { Post, ReplyDraft } from "../db/queries.js";
import { postTweet, postReply } from "./poster.js";
import { checkPostRateLimit, checkReplyRateLimit } from "../safety/rate-limiter.js";

export function startScheduler(db: Database.Database): void {
  cron.schedule("0 9,12,18,21 * * *", async () => {
    await processApprovedPost(db);
  });

  cron.schedule("30 10,15,20 * * *", async () => {
    await processApprovedReply(db);
  });

  console.log("スケジューラ起動: 投稿 9/12/18/21時, リプライ 10:30/15:30/20:30");
}

export async function processApprovedPost(db: Database.Database): Promise<boolean> {
  const rateCheck = checkPostRateLimit(db);
  if (!rateCheck.allowed) {
    console.log(`投稿スキップ: ${rateCheck.reason}`);
    return false;
  }

  const postQ = createPostQueries(db);
  const post = postQ.getApproved.get() as Post | undefined;
  if (!post) {
    console.log("承認済み投稿なし");
    return false;
  }

  const result = await postTweet(post.content);
  if (result.success && result.tweetId) {
    postQ.markPosted.run({ id: post.id, tweetId: result.tweetId });
    console.log(`投稿完了: #${post.id} → ${result.tweetId}`);
    return true;
  }

  postQ.updateStatus.run({ id: post.id, status: "failed" });
  console.error(`投稿失敗: #${post.id} - ${result.error}`);
  return false;
}

export async function processApprovedReply(db: Database.Database): Promise<boolean> {
  const rateCheck = checkReplyRateLimit(db);
  if (!rateCheck.allowed) {
    console.log(`リプライスキップ: ${rateCheck.reason}`);
    return false;
  }

  const replyQ = createReplyQueries(db);
  const reply = db
    .prepare(`SELECT * FROM reply_drafts WHERE status = 'approved' ORDER BY created_at ASC LIMIT 1`)
    .get() as ReplyDraft | undefined;

  if (!reply) return false;

  const result = await postReply(reply.reply_content, reply.target_tweet_id);
  if (result.success && result.tweetId) {
    replyQ.markPosted.run({ id: reply.id, replyTweetId: result.tweetId });
    console.log(`リプライ完了: #${reply.id} → @${reply.target_username}`);
    return true;
  }

  replyQ.updateStatus.run({ id: reply.id, status: "failed" });
  console.error(`リプライ失敗: #${reply.id} - ${result.error}`);
  return false;
}
