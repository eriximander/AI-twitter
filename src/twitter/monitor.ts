import type Database from "better-sqlite3";
import { getAuthenticatedClient } from "./client.js";
import { monitorKeywords, targetAccounts } from "../config/targets.js";
import { createReplyQueries } from "../db/queries.js";
import { generateReplyDraft } from "../content/generator.js";
import { checkReplyRateLimit } from "../safety/rate-limiter.js";
import { logApiUsage } from "../safety/cost-tracker.js";

export interface MonitoredTweet {
  id: string;
  username: string;
  content: string;
}

const userIdCache = new Map<string, string>();

export async function searchKeywordTweets(
  maxResults = 10,
): Promise<MonitoredTweet[]> {
  const client = await getAuthenticatedClient();

  if (monitorKeywords.length === 0) return [];

  const query = monitorKeywords
    .map((kw) => (kw.includes(" ") ? `"${kw}"` : kw))
    .join(" OR ");

  try {
    const result = await client.v2.search(query, {
      max_results: maxResults,
      "tweet.fields": ["author_id", "text"],
      expansions: ["author_id"],
    });

    const tweets: MonitoredTweet[] = [];
    for (const tweet of result.data?.data ?? []) {
      const author = result.includes?.users?.find(
        (u) => u.id === tweet.author_id,
      );
      tweets.push({
        id: tweet.id,
        username: author?.username ?? "unknown",
        content: tweet.text,
      });
    }
    return tweets;
  } catch {
    console.error("キーワード検索に失敗");
    return [];
  }
}

export async function fetchTargetAccountTweets(): Promise<MonitoredTweet[]> {
  const client = await getAuthenticatedClient();
  const tweets: MonitoredTweet[] = [];

  for (const target of targetAccounts) {
    try {
      let userId = userIdCache.get(target.username);
      if (!userId) {
        const user = await client.v2.userByUsername(target.username);
        if (!user.data) continue;
        userId = user.data.id;
        userIdCache.set(target.username, userId);
      }

      const timeline = await client.v2.userTimeline(userId, {
        max_results: 5,
        "tweet.fields": ["created_at"],
      });

      for (const tweet of timeline.data?.data ?? []) {
        tweets.push({
          id: tweet.id,
          username: target.username,
          content: tweet.text,
        });
      }
    } catch {
      console.error(`@${target.username} のタイムライン取得に失敗`);
    }
  }

  return tweets;
}

export async function monitorAndDraft(db: Database.Database): Promise<number> {
  const rateCheck = checkReplyRateLimit(db);
  if (!rateCheck.allowed) {
    console.log(`リプライ制限: ${rateCheck.reason}`);
    return 0;
  }

  const tweets = await searchKeywordTweets(5);
  const replyQ = createReplyQueries(db);
  let drafted = 0;

  for (const tweet of tweets.slice(0, 3)) {
    try {
      const result = await generateReplyDraft(tweet.username, tweet.content);
      replyQ.insert.run({
        targetTweetId: tweet.id,
        targetUsername: tweet.username,
        targetContent: tweet.content,
        replyContent: result.content,
      });
      logApiUsage(db, "claude-sonnet-4-6", "generateReplyDraft", result.usage);
      drafted++;
      console.log(`下書き作成: @${tweet.username} への返信`);
    } catch {
      console.error(`@${tweet.username} へのリプライ生成に失敗`);
    }
  }

  return drafted;
}
