import { getAuthenticatedClient } from "../twitter/client.js";

export interface ShadowbanCheckResult {
  suspected: boolean;
  indicators: string[];
}

export async function checkShadowban(username: string): Promise<ShadowbanCheckResult> {
  const client = await getAuthenticatedClient();
  const indicators: string[] = [];

  try {
    const searchResult = await client.v2.search(`from:${username}`, {
      max_results: 10,
    });

    const tweetCount = searchResult.data?.data?.length ?? 0;
    if (tweetCount === 0) {
      indicators.push("検索結果にツイートが表示されない（検索サジェストBAN の可能性）");
    }

    const user = await client.v2.userByUsername(username, {
      "user.fields": ["public_metrics"],
    });

    if (user.data?.public_metrics) {
      const metrics = user.data.public_metrics;
      if ((metrics.tweet_count ?? 0) > 100 && (metrics.followers_count ?? 0) < 5) {
        indicators.push("投稿数に対してフォロワーが極端に少ない");
      }
    }
  } catch {
    indicators.push("API エラー（アカウント制限の可能性）");
  }

  return {
    suspected: indicators.length > 0,
    indicators,
  };
}
