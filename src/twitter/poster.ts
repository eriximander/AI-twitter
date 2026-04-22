import { getReadWriteClient } from "./client.js";

export interface PostResult {
  success: boolean;
  tweetId?: string;
  error?: string;
}

export async function postTweet(content: string): Promise<PostResult> {
  try {
    const client = getReadWriteClient();
    const result = await client.v2.tweet(content);
    return {
      success: true,
      tweetId: result.data.id,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, error: message };
  }
}

export async function postReply(
  content: string,
  replyToId: string,
): Promise<PostResult> {
  try {
    const client = getReadWriteClient();
    const result = await client.v2.reply(content, replyToId);
    return {
      success: true,
      tweetId: result.data.id,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, error: message };
  }
}
