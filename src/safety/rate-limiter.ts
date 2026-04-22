import type Database from "better-sqlite3";

const MAX_POSTS_PER_DAY = 4;
const MAX_REPLIES_PER_DAY = 3;
const MIN_POST_INTERVAL_MS = 3 * 60 * 60 * 1000; // 3 hours

export interface RateLimitResult {
  allowed: boolean;
  reason?: string;
}

export function checkPostRateLimit(db: Database.Database): RateLimitResult {
  const todayCount = db
    .prepare(
      `SELECT COUNT(*) as count FROM posts WHERE posted_at >= date('now') AND status = 'posted'`,
    )
    .get() as { count: number };

  if (todayCount.count >= MAX_POSTS_PER_DAY) {
    return {
      allowed: false,
      reason: `本日の投稿上限(${MAX_POSTS_PER_DAY}件)に達しています`,
    };
  }

  const lastPost = db
    .prepare(
      `SELECT posted_at FROM posts WHERE status = 'posted' ORDER BY posted_at DESC LIMIT 1`,
    )
    .get() as { posted_at: string } | undefined;

  if (lastPost) {
    const elapsed = Date.now() - new Date(lastPost.posted_at + "Z").getTime();
    if (elapsed < MIN_POST_INTERVAL_MS) {
      const remainMin = Math.ceil(
        (MIN_POST_INTERVAL_MS - elapsed) / 60_000,
      );
      return {
        allowed: false,
        reason: `前回の投稿から3時間経過していません（残り${remainMin}分）`,
      };
    }
  }

  return { allowed: true };
}

export function checkReplyRateLimit(db: Database.Database): RateLimitResult {
  const todayCount = db
    .prepare(
      `SELECT COUNT(*) as count FROM reply_drafts WHERE posted_at >= date('now') AND status = 'posted'`,
    )
    .get() as { count: number };

  if (todayCount.count >= MAX_REPLIES_PER_DAY) {
    return {
      allowed: false,
      reason: `本日のリプライ上限(${MAX_REPLIES_PER_DAY}件)に達しています`,
    };
  }

  return { allowed: true };
}
