import Database from "better-sqlite3";

export function initDb(dbPath: string): Database.Database {
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  db.exec(`
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL CHECK(type IN ('tip', 'news', 'story', 'review', 'promo')),
      content TEXT NOT NULL,
      image_path TEXT,
      status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'approved', 'rejected', 'posted', 'failed')),
      scheduled_at TEXT,
      posted_at TEXT,
      tweet_id TEXT,
      impressions INTEGER DEFAULT 0,
      likes INTEGER DEFAULT 0,
      retweets INTEGER DEFAULT 0,
      replies INTEGER DEFAULT 0,
      profile_clicks INTEGER DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS reply_drafts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      target_tweet_id TEXT NOT NULL,
      target_username TEXT NOT NULL,
      target_content TEXT NOT NULL,
      reply_content TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'approved', 'rejected', 'posted', 'failed')),
      posted_at TEXT,
      reply_tweet_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS affiliate_links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      asp TEXT NOT NULL,
      category TEXT NOT NULL,
      url TEXT NOT NULL,
      commission INTEGER NOT NULL,
      is_special_rate INTEGER NOT NULL DEFAULT 0,
      clicks INTEGER DEFAULT 0,
      conversions INTEGER DEFAULT 0,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS daily_stats (
      date TEXT PRIMARY KEY,
      posts_count INTEGER DEFAULT 0,
      replies_count INTEGER DEFAULT 0,
      total_impressions INTEGER DEFAULT 0,
      total_likes INTEGER DEFAULT 0,
      total_retweets INTEGER DEFAULT 0,
      follower_count INTEGER DEFAULT 0,
      profile_clicks INTEGER DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
    CREATE INDEX IF NOT EXISTS idx_posts_scheduled ON posts(scheduled_at);
    CREATE INDEX IF NOT EXISTS idx_reply_drafts_status ON reply_drafts(status);
  `);

  return db;
}
