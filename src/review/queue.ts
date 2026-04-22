import type Database from "better-sqlite3";
import { createPostQueries, createReplyQueries } from "../db/queries.js";
import type { Post, ReplyDraft } from "../db/queries.js";

export interface ReviewItem {
  kind: "post" | "reply";
  id: number;
  content: string;
  context?: string;
}

export function getPendingReviews(db: Database.Database): ReviewItem[] {
  const postQ = createPostQueries(db);
  const replyQ = createReplyQueries(db);

  const posts = postQ.getPending.all() as Post[];
  const replies = replyQ.getPending.all() as ReplyDraft[];

  const items: ReviewItem[] = [];

  for (const p of posts) {
    items.push({
      kind: "post",
      id: p.id,
      content: p.content,
      context: `[${p.type}] ${p.scheduled_at ?? "未スケジュール"}`,
    });
  }

  for (const r of replies) {
    items.push({
      kind: "reply",
      id: r.id,
      content: r.reply_content,
      context: `@${r.target_username}: ${r.target_content.slice(0, 60)}...`,
    });
  }

  return items;
}

export function approveItem(
  db: Database.Database,
  kind: "post" | "reply",
  id: number,
): void {
  if (kind === "post") {
    createPostQueries(db).updateStatus.run({ id, status: "approved" });
  } else {
    createReplyQueries(db).updateStatus.run({ id, status: "approved" });
  }
}

export function rejectItem(
  db: Database.Database,
  kind: "post" | "reply",
  id: number,
): void {
  if (kind === "post") {
    createPostQueries(db).updateStatus.run({ id, status: "rejected" });
  } else {
    createReplyQueries(db).updateStatus.run({ id, status: "rejected" });
  }
}
