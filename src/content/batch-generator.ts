import { anthropic, type PostType, type TokenUsage } from "./generator.js";
import { defaultPersona } from "../config/persona.js";

export interface BatchRequest {
  id: string;
  type: PostType;
  context?: string;
}

export interface BatchResult {
  id: string;
  content: string | null;
  error?: string;
}

const typeInstructions: Record<PostType, string> = {
  tip: "AIツールの具体的な使い方やtipsを1つ紹介する投稿を書いてください。「やってみたらこうなった」形式で。",
  news: "AI業界の最新ニュースやアップデートについて、自分の見解を添えた投稿を書いてください。",
  story: "AI副業に関する体験談や気づきを共感を呼ぶ形で投稿してください。",
  review: "実際に使ったAIツールの率直なレビューを投稿してください。良い点と悪い点の両方を含めてください。",
  promo: "AIツールやサービスをさりげなく紹介する投稿を書いてください。「PR」を冒頭に入れてください。宣伝感を最小限に。",
};

export async function generatePostsBatch(
  requests: BatchRequest[],
  pollIntervalMs = 5000,
  timeoutMs = 300_000,
): Promise<BatchResult[]> {
  const batchRequests = requests.map((req) => ({
    custom_id: req.id,
    params: {
      model: "claude-sonnet-4-6" as const,
      max_tokens: 300,
      system: [
        {
          type: "text" as const,
          text: defaultPersona.systemPrompt,
        },
      ],
      messages: [
        {
          role: "user" as const,
          content: `${typeInstructions[req.type]}${req.context ? `\n\n参考情報: ${req.context}` : ""}\n\n140文字以内の日本語、口語体で。`,
        },
      ],
    },
  }));

  const batch = await anthropic.messages.batches.create({
    requests: batchRequests,
  });

  console.log(`バッチ送信: ${batch.id} (${requests.length}件, 50%OFF適用)`);

  const startTime = Date.now();
  let status = batch.processing_status;

  while (status === "in_progress") {
    if (Date.now() - startTime > timeoutMs) {
      throw new Error(`バッチタイムアウト: ${batch.id}`);
    }
    await new Promise((r) => setTimeout(r, pollIntervalMs));
    const updated = await anthropic.messages.batches.retrieve(batch.id);
    status = updated.processing_status;
    const counts = updated.request_counts;
    console.log(
      `  処理中... 成功:${counts.succeeded} 失敗:${counts.errored} 残:${counts.processing}`,
    );
  }

  const results: BatchResult[] = [];
  const decoder = await anthropic.messages.batches.results(batch.id);
  for await (const result of decoder) {
    if (result.result.type === "succeeded") {
      const block = result.result.message.content[0];
      results.push({
        id: result.custom_id,
        content: block && block.type === "text" ? block.text.trim() : null,
      });
    } else {
      results.push({
        id: result.custom_id,
        content: null,
        error: result.result.type,
      });
    }
  }

  return results;
}
