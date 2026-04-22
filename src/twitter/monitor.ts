import type Database from "better-sqlite3";
import { getTwitterClient } from "./client.js";
import { monitorKeywords, targetAccounts } from "../config/targets.js";
import { createReplyQueries } from "../db/queries.js";
import { generateReplyDraft } from "../content/generator.js";
import { checkReplyRateLimit } from "../safety/rate-limiter.js";

export interface MonitoredTweet {
  id: string;
  username: string;
  content: string;
}

export async function searchKeywordTweets(
  maxResults = 10,
): Promise<MonitoredTweet[]> {
  const client = getTwitterClient();
  const tweets: MonitoredTweet[] = [];

  for (const keyword of monitorKeywords) {
    try {
      const result = await client.v2.search(keyword, {
        max_results: maxResults,
        "tweet.fields": ["author_id", "text"],
        expansions: ["author_id"],
      });

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
    } catch {
      console.error(`キーワード「${keyword}」の検索に失敗`);
    }
  }

  return tweets;
}

export async function fetchTargetAccountTweets(): Promise<MonitoredTweet[]> {
  const client = getTwitterClient();
  const tweets: MonitoredTweet[] = [];

  for (const target of targetAccounts) {
    try {
      const user = await client.v2.userByUsername(target.username);
      if (!user.data) continue;

      const timeline = await client.v2.userTimeline(user.data.id, {
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
      const draft = await generateReplyDraft(tweet.username, tweet.content);
      replyQ.insert.run({
        targetTweetId: tweet.id,
        targetUsername: tweet.username,
        targetContent: tweet.content,
        replyContent: draft,
      });
      drafted++;
      console.log(`下書き作成: @${tweet.username} への返信`);
    } catch {
      console.error(`@${tweet.username} へのリプライ生成に失敗`);
    }
  }

  return drafted;
}
