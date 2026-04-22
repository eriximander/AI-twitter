import type { PostType } from "./generator.js";

export interface PostTemplate {
  type: PostType;
  pattern: string;
  example: string;
}

export const postTemplates: PostTemplate[] = [
  // tip: AIツールの具体的な使い方
  {
    type: "tip",
    pattern: "【ツール名】で○○したら△△になった。やり方↓\n\n①…\n②…\n③…\n\n{感想}",
    example: "Claude Codeで議事録をタスクリストに変換したら作業時間が半分になった。やり方↓\n\n①会議音声をWhisperで文字起こし\n②Claude Codeに「タスクを抽出して」\n③そのままNotionに流し込む\n\n15分の作業が3分に。",
  },
  {
    type: "tip",
    pattern: "○○で困ってる人、{ツール名}使ってみて。\n\n{具体的な使い方}\n\n{結果}",
    example: "メール返信に時間かかりすぎる人、Claude使ってみて。\n\n受信メールをコピペ→「丁寧に返信書いて」\n\nこれだけで1通30秒。日に20通あると1日1時間浮く。",
  },
  {
    type: "tip",
    pattern: "AIで○○を自動化したら{数値}時間/週 浮いた話。\n\nBefore: {手動の状態}\nAfter: {自動化後}\n\n{具体的な手順}",
    example: "AIでSNS投稿を半自動化したら週3時間浮いた話。\n\nBefore: ネタ探し→執筆→投稿で1日40分\nAfter: AI生成→確認→ワンクリック投稿で10分\n\nClaudeに「AI副業のtipsを3つ書いて」→選ぶだけ。",
  },
  {
    type: "tip",
    pattern: "知らないと損する{ツール名}の使い方。\n\n{意外な使い方}\n\n{効果}",
    example: "知らないと損するChatGPTの使い方。\n\n「○○について教えて」じゃなくて「○○のプロとして、初心者にアドバイスして」って聞く。\n\n回答の具体性が全然違う。試してみて。",
  },

  // news: AI業界ニュース+自分の見解
  {
    type: "news",
    pattern: "{ニュース概要}\n\n個人的に思うのは{見解}\n\n{実務への影響}",
    example: "OpenAIが新モデル発表。コーディング性能が2倍に。\n\n個人的に思うのは、これでAI副業のハードルがまた一段下がったということ。\n\nプログラミングできない人でもツール作れる時代が本格的に来た。",
  },
  {
    type: "news",
    pattern: "【速報】{ニュース}\n\nこれ、{対象者}にとっては{影響}\n\n{自分のアクション}",
    example: "【速報】Canvaが新AI機能を追加\n\nこれ、デザインできない副業勢にとっては神アプデ。\n\n早速使ってみたけど、サムネ作成が5分→30秒になった。",
  },
  {
    type: "news",
    pattern: "{トレンド}について。\n\n半年前: {過去}\n今: {現在}\n半年後: {予測}\n\n{結論}",
    example: "AI副業の市場について。\n\n半年前: ChatGPTで記事書く程度\n今: AI×動画、AI×デザイン、AI×コードまで拡大\n半年後: AIエージェントで完全自動化が当たり前に\n\n今から始めても遅くない。むしろまだ早い方。",
  },

  // story: 体験談・共感系
  {
    type: "story",
    pattern: "AI副業を始めて{期間}。正直に言うと…\n\n{体験}\n\n{気づき・学び}",
    example: "AI副業を始めて3ヶ月。正直に言うと…\n\n最初の1ヶ月は収益ゼロ。「これ意味あるのかな」って何度も思った。\n\nでも2ヶ月目にブログから初成約。たった3,000円だけど、仕組みが動いた瞬間は感動した。",
  },
  {
    type: "story",
    pattern: "{失敗談}\n\n{そこから学んだこと}\n\n{今のアドバイス}",
    example: "AIで作った記事をそのまま公開したら、Googleに圏外に飛ばされた話。\n\n学んだこと: AIは下書き製造機。人間の編集は絶対に必要。\n\n今のアドバイス: AI生成100%の記事は出さないで。自分の経験を3割混ぜるだけで全然違う。",
  },
  {
    type: "story",
    pattern: "会社員時代の自分に言いたい。\n\n{メッセージ}\n\n{現在の状況}",
    example: "会社員時代の自分に言いたい。\n\n「帰宅後の2時間でAI使って副業始めろ。半年後に月5万の副収入になるから」\n\n実際やってみたら本当にそうなった。時間ないは言い訳だった。",
  },

  // review: ツールレビュー
  {
    type: "review",
    pattern: "{ツール名}を{期間}使ってみた正直な感想。\n\n良い点:\n{良い点}\n\n微妙な点:\n{微妙な点}\n\n{結論}",
    example: "Notion AIを1ヶ月使ってみた正直な感想。\n\n良い点:\n・既存ノートの要約が優秀\n・議事録整理が爆速\n\n微妙な点:\n・日本語の文章生成はClaude/ChatGPTの方が上\n\n結論: Notion使ってる人は試す価値あり。そうでなければ別ツールでいい。",
  },
  {
    type: "review",
    pattern: "【比較】{ツールA} vs {ツールB}\n\n{ツールA}: {特徴}\n{ツールB}: {特徴}\n\n{結論・おすすめ}",
    example: "【比較】ChatGPT vs Claude\n\nChatGPT: プラグイン豊富、画像生成OK\nClaude: 長文理解◎、日本語が自然\n\n結論: 日常使いはChatGPT、長文作業はClaude。両方使い分けが最強。",
  },

  // promo: 収益化投稿（PR表記必須）
  {
    type: "promo",
    pattern: "PR\n{自然な導入}\n\n{ツールの具体的な体験}\n\n{さりげない誘導}",
    example: "PR\n最近AIライティングツール色々試してるんだけど、○○が一番しっくりきた。\n\n特にブログの下書きが10分で出来上がるのが良い。修正は必要だけど、ゼロから書くより圧倒的に速い。\n\n詳しくはプロフのリンクから。",
  },
  {
    type: "promo",
    pattern: "PR\n○○で悩んでた問題、{ツール名}で解決した。\n\n{具体的なBefore/After}\n\n{感想}",
    example: "PR\n画像素材探しで毎回30分かかってた問題、Canva Proで解決した。\n\nBefore: フリー素材サイト5個巡回\nAfter: Canva内でAI生成→即使える\n\n月1,000円で時間を買えるなら安い。",
  },
];

export function getTemplatesForType(type: PostType): PostTemplate[] {
  return postTemplates.filter((t) => t.type === type);
}

export function getRandomTemplate(type: PostType): PostTemplate | undefined {
  const templates = getTemplatesForType(type);
  if (templates.length === 0) return undefined;
  return templates[Math.floor(Math.random() * templates.length)];
}
