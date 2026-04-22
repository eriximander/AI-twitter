const URL_PATTERN = /https?:\/\/[^\s]+/gi;
const SHORTENED_URL_PATTERN = /(?:bit\.ly|t\.co|goo\.gl|tinyurl|ow\.ly)\/[^\s]+/gi;

const BANNED_WORDS = [
  "絶対稼げる",
  "必ず稼げる",
  "確実に稼げる",
  "誰でも簡単に",
  "今すぐ稼げる",
  "不労所得",
  "楽して稼ぐ",
  "月収100万確定",
];

export interface ComplianceResult {
  ok: boolean;
  issues: string[];
}

export function checkCompliance(content: string, isPromo: boolean): ComplianceResult {
  const issues: string[] = [];

  if (URL_PATTERN.test(content)) {
    issues.push("外部リンクが含まれています。投稿本文にURLは入れないでください。");
  }

  if (SHORTENED_URL_PATTERN.test(content)) {
    issues.push("短縮URLが含まれています。");
  }

  for (const word of BANNED_WORDS) {
    if (content.includes(word)) {
      issues.push(`禁止ワード「${word}」が含まれています（景表法違反リスク）。`);
    }
  }

  if (isPromo && !content.startsWith("PR")) {
    issues.push("収益化投稿にはPR表記が必要です（ステマ規制）。");
  }

  const charCount = [...content].length;
  if (charCount > 280) {
    issues.push(`文字数超過: ${charCount}文字（上限280文字）`);
  }

  return {
    ok: issues.length === 0,
    issues,
  };
}
