import Anthropic from "@anthropic-ai/sdk";
import { env } from "../config/env.js";
import { defaultPersona } from "../config/persona.js";

const anthropic = new Anthropic({ apiKey: env.anthropic.apiKey });

export type PostType = "tip" | "news" | "story" | "review" | "promo";

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheCreationTokens: number;
}

export interface GenerationResult {
  content: string;
  usage: TokenUsage;
}

function extractUsage(response: Anthropic.Message): TokenUsage {
  const u = response.usage as unknown as Record<string, number>;
  return {
    inputTokens: u.input_tokens ?? 0,
    outputTokens: u.output_tokens ?? 0,
    cacheReadTokens: u.cache_read_input_tokens ?? 0,
    cacheCreationTokens: u.cache_creation_input_tokens ?? 0,
  };
}

const cachedSystemPrompt: Anthropic.MessageCreateParams["system"] = [
  {
    type: "text" as const,
    text: defaultPersona.systemPrompt,
    cache_control: { type: "ephemeral" as const },
  },
];

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
): Promise<GenerationResult> {
  const instruction = typeInstructions[type];

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 300,
    system: cachedSystemPrompt,
    messages: [
      {
        role: "user",
        content: `${instruction}${context ? `\n\n参考情報: ${context}` : ""}\n\n140文字以内の日本語、口語体で。`,
      },
    ],
  });

  const block = message.content[0];
  if (!block || block.type !== "text") {
    throw new Error("Unexpected response type");
  }
  return { content: block.text.trim(), usage: extractUsage(message) };
}

export async function generateReplyDraft(
  targetUsername: string,
  targetContent: string,
): Promise<GenerationResult> {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 150,
    system: cachedSystemPrompt,
    messages: [
      {
        role: "user",
        content: `以下の投稿に対する自然なリプライを書いてください。

@${targetUsername} の投稿:
「${targetContent}」

100文字以内。宣伝感ゼロ。相手の内容に具体的に言及。`,
      },
    ],
  });

  const block = message.content[0];
  if (!block || block.type !== "text") {
    throw new Error("Unexpected response type");
  }
  return { content: block.text.trim(), usage: extractUsage(message) };
}

export { anthropic };
