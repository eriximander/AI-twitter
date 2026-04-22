import type Database from "better-sqlite3";
import { getAuthenticatedClient } from "./client.js";
import { createPostQueries } from "../db/queries.js";
import type { Post } from "../db/queries.js";

interface DailyStatsRow {
  date: string;
  posts_count: number;
  replies_count: number;
  total_impressions: number;
  total_likes: number;
  total_retweets: number;
  follower_count: number;
  profile_clicks: number;
}

export async function updateTweetMetrics(db: Database.Database): Promise<number> {
  const client = await getAuthenticatedClient();
  const postQ = createPostQueries(db);

  const posted = db
    .prepare(
      `SELECT id, tweet_id FROM posts WHERE status = 'posted' AND tweet_id IS NOT NULL AND posted_at >= date('now', '-7 days')`,
    )
    .all() as Pick<Post, "id" | "tweet_id">[];

  let updated = 0;

  for (const post of posted) {
    try {
      const tweet = await client.v2.singleTweet(post.tweet_id!, {
        "tweet.fields": ["public_metrics"],
      });

      const metrics = tweet.data.public_metrics;
      if (metrics) {
        postQ.updateMetrics.run({
          id: post.id,
          impressions: metrics.impression_count ?? 0,
          likes: metrics.like_count ?? 0,
          retweets: metrics.retweet_count ?? 0,
          replies: metrics.reply_count ?? 0,
          profileClicks: 0,
        });
        updated++;
      }
    } catch {
      console.error(`メトリクス取得失敗: tweet_id=${post.tweet_id}`);
    }
  }

  return updated;
}

export function recordDailyStats(db: Database.Database): void {
  const today = new Date().toISOString().slice(0, 10);

  const postCount = db
    .prepare(`SELECT COUNT(*) as c FROM posts WHERE posted_at >= @today AND status = 'posted'`)
    .get({ today }) as { c: number };

  const replyCount = db
    .prepare(`SELECT COUNT(*) as c FROM reply_drafts WHERE posted_at >= @today AND status = 'posted'`)
    .get({ today }) as { c: number };

  const totals = db
    .prepare(
      `SELECT COALESCE(SUM(impressions),0) as imp, COALESCE(SUM(likes),0) as lk, COALESCE(SUM(retweets),0) as rt FROM posts WHERE posted_at >= @today AND status = 'posted'`,
    )
    .get({ today }) as { imp: number; lk: number; rt: number };

  db.prepare(
    `INSERT INTO daily_stats (date, posts_count, replies_count, total_impressions, total_likes, total_retweets)
     VALUES (@date, @postsCount, @repliesCount, @totalImpressions, @totalLikes, @totalRetweets)
     ON CONFLICT(date) DO UPDATE SET
       posts_count = @postsCount, replies_count = @repliesCount,
       total_impressions = @totalImpressions, total_likes = @totalLikes, total_retweets = @totalRetweets`,
  ).run({
    date: today,
    postsCount: postCount.c,
    repliesCount: replyCount.c,
    totalImpressions: totals.imp,
    totalLikes: totals.lk,
    totalRetweets: totals.rt,
  });
}

export function getWeeklyReport(db: Database.Database): string {
  const rows = db
    .prepare(
      `SELECT * FROM daily_stats WHERE date >= date('now', '-7 days') ORDER BY date ASC`,
    )
    .all() as DailyStatsRow[];

  if (rows.length === 0) return "直近7日間のデータがありません";

  const totalPosts = rows.reduce((s, r) => s + r.posts_count, 0);
  const totalReplies = rows.reduce((s, r) => s + r.replies_count, 0);
  const totalImpressions = rows.reduce((s, r) => s + r.total_impressions, 0);
  const totalLikes = rows.reduce((s, r) => s + r.total_likes, 0);

  const lines = [
    `📊 週間レポート (${rows[0]!.date} ~ ${rows[rows.length - 1]!.date})`,
    `  投稿数: ${totalPosts}件`,
    `  リプライ数: ${totalReplies}件`,
    `  総インプレッション: ${totalImpressions.toLocaleString()}`,
    `  総いいね: ${totalLikes}`,
    `  エンゲージメント率: ${totalImpressions > 0 ? ((totalLikes / totalImpressions) * 100).toFixed(2) : 0}%`,
  ];

  const typeStats = db
    .prepare(
      `SELECT type, COUNT(*) as cnt, AVG(impressions) as avg_imp, AVG(likes) as avg_lk
       FROM posts WHERE status = 'posted' AND posted_at >= date('now', '-7 days')
       GROUP BY type ORDER BY avg_imp DESC`,
    )
    .all() as { type: string; cnt: number; avg_imp: number; avg_lk: number }[];

  if (typeStats.length > 0) {
    lines.push("", "  タイプ別パフォーマンス:");
    for (const t of typeStats) {
      lines.push(
        `    ${t.type}: ${t.cnt}件 / 平均imp ${Math.round(t.avg_imp ?? 0)} / 平均♥ ${Math.round(t.avg_lk ?? 0)}`,
      );
    }
  }

  return lines.join("\n");
}
