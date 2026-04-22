import Anthropic from "@anthropic-ai/sdk";
import { env } from "../config/env.js";
import { defaultPersona } from "../config/persona.js";

const anthropic = new Anthropic({ apiKey: env.anthropic.apiKey });

export type PostType = "tip" | "news" | "story" | "review" | "promo";

const typeInstructions: Record<PostType, string> = {
  tip: "AIツールの具体的な使い方やtipsを1つ紹介する投稿を書いてください。「やってみたらこうなった」形式で。",
  news: "AI業界の最新ニュースやアップデートについて、自分の見解を添えた投稿を書いてください。",
  story: "AI副業に関する体験談や気づきを共感を呼ぶ形で投稿してください。",
  review: "実際に使ったAIツールの率直なレビューを投稿してください。良い点と悪い点の両方を含めてください。",
  promo: "AIツールやサービスをさりげなく紹介する投稿を書いてください。「PR」を冒頭に入れてください。宣伝感を最小限に。",
};

export async function generatePost(
  type: PostType,
  context?: string,
): Promise<string> {
  const instruction = typeInstructions[type];

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 300,
    system: defaultPersona.systemPrompt,
    messages: [
      {
        role: "user",
        content: `${instruction}${context ? `\n\n参考情報: ${context}` : ""}

必ず以下を守ってください:
- 140文字以内の日本語
- 外部リンクやURLを絶対に含めない
- ハッシュタグは0-2個
- 自然な口語体で`,
      },
    ],
  });

  const block = message.content[0];
  if (!block || block.type !== "text") {
    throw new Error("Unexpected response type");
  }
  return block.text.trim();
}

export async function generateReplyDraft(
  targetUsername: string,
  targetContent: string,
): Promise<string> {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 200,
    system: defaultPersona.systemPrompt,
    messages: [
      {
        role: "user",
        content: `以下の投稿に対する自然なリプライを書いてください。

@${targetUsername} の投稿:
「${targetContent}」

ルール:
- 100文字以内
- 宣伝っぽくしない。純粋な会話として成立させる
- URLを絶対に含めない
- 相手の投稿内容に具体的に言及する
- 共感や有益な補足情報を提供する`,
      },
    ],
  });

  const block = message.content[0];
  if (!block || block.type !== "text") {
    throw new Error("Unexpected response type");
  }
  return block.text.trim();
}
