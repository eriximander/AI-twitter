export interface ReplyTarget {
  username: string;
  reason: string;
}

export const monitorKeywords = [
  "AI副業",
  "ChatGPT 使い方",
  "AIツール おすすめ",
  "Claude 便利",
  "AI 稼ぐ",
  "生成AI 仕事",
];

export const targetAccounts: ReplyTarget[] = [
  { username: "ai_and_and", reason: "AI副業・AI活用情報発信" },
  { username: "and_and_and_and", reason: "AI×マーケティング" },
  { username: "masahirochaen", reason: "ChatGPT活用術" },
  { username: "and_and_and_and", reason: "AI副業実践者" },
  { username: "shota7180", reason: "AIツールレビュー" },
];
