import type Database from "better-sqlite3";

export interface ContentCheckResult {
  ok: boolean;
  reason?: string;
}

export function checkDuplicate(
  db: Database.Database,
  content: string,
): ContentCheckResult {
  const existing = db
    .prepare(
      `SELECT id FROM posts WHERE content = @content AND status IN ('posted', 'approved', 'draft')`,
    )
    .get({ content }) as { id: number } | undefined;

  if (existing) {
    return { ok: false, reason: "同一内容の投稿が既に存在します" };
  }

  // 類似度チェック: 先頭50文字が一致する投稿があれば警告
  const prefix = [...content].slice(0, 50).join("");
  const similar = db
    .prepare(
      `SELECT id, content FROM posts WHERE content LIKE @prefix AND status = 'posted'`,
    )
    .get({ prefix: `${prefix}%` }) as { id: number; content: string } | undefined;

  if (similar) {
    return { ok: false, reason: "類似する投稿が既に存在します（スパム判定リスク）" };
  }

  return { ok: true };
}
