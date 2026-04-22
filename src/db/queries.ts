import type Database from "better-sqlite3";

export interface Post {
  id: number;
  type: string;
  content: string;
  image_path: string | null;
  status: string;
  scheduled_at: string | null;
  posted_at: string | null;
  tweet_id: string | null;
  impressions: number;
  likes: number;
  retweets: number;
  replies: number;
  profile_clicks: number;
  created_at: string;
}

export interface ReplyDraft {
  id: number;
  target_tweet_id: string;
  target_username: string;
  target_content: string;
  reply_content: string;
  status: string;
  posted_at: string | null;
  reply_tweet_id: string | null;
  created_at: string;
}

export function createPostQueries(db: Database.Database) {
  return {
    insert: db.prepare(`
      INSERT INTO posts (type, content, image_path, status, scheduled_at)
      VALUES (@type, @content, @imagePath, @status, @scheduledAt)
    `),

    getPending: db.prepare(`
      SELECT * FROM posts WHERE status = 'draft' ORDER BY created_at ASC
    `),

    getApproved: db.prepare(`
      SELECT * FROM posts WHERE status = 'approved'
      AND (scheduled_at IS NULL OR scheduled_at <= datetime('now'))
      ORDER BY scheduled_at ASC, created_at ASC LIMIT 1
    `),

    updateStatus: db.prepare(`
      UPDATE posts SET status = @status, updated_at = datetime('now') WHERE id = @id
    `),

    markPosted: db.prepare(`
      UPDATE posts SET status = 'posted', posted_at = datetime('now'),
      tweet_id = @tweetId, updated_at = datetime('now') WHERE id = @id
    `),

    updateMetrics: db.prepare(`
      UPDATE posts SET impressions = @impressions, likes = @likes,
      retweets = @retweets, replies = @replies, profile_clicks = @profileClicks,
      updated_at = datetime('now') WHERE id = @id
    `),

    getTodayCount: db.prepare(`
      SELECT COUNT(*) as count FROM posts
      WHERE posted_at >= date('now') AND status = 'posted'
    `),

    getStats: db.prepare(`
      SELECT type, COUNT(*) as count,
      AVG(impressions) as avg_impressions,
      AVG(likes) as avg_likes,
      AVG(retweets) as avg_retweets
      FROM posts WHERE status = 'posted'
      GROUP BY type
    `),
  };
}

export function createReplyQueries(db: Database.Database) {
  return {
    insert: db.prepare(`
      INSERT INTO reply_drafts (target_tweet_id, target_username, target_content, reply_content)
      VALUES (@targetTweetId, @targetUsername, @targetContent, @replyContent)
    `),

    getPending: db.prepare(`
      SELECT * FROM reply_drafts WHERE status = 'draft' ORDER BY created_at ASC
    `),

    updateStatus: db.prepare(`
      UPDATE reply_drafts SET status = @status WHERE id = @id
    `),

    markPosted: db.prepare(`
      UPDATE reply_drafts SET status = 'posted', posted_at = datetime('now'),
      reply_tweet_id = @replyTweetId WHERE id = @id
    `),

    getTodayCount: db.prepare(`
      SELECT COUNT(*) as count FROM reply_drafts
      WHERE posted_at >= date('now') AND status = 'posted'
    `),
  };
}
