import type Database from "better-sqlite3";

export interface AffiliateLink {
  id: number;
  name: string;
  asp: string;
  category: string;
  url: string;
  commission: number;
  is_special_rate: number;
  clicks: number;
  conversions: number;
  active: number;
  created_at: string;
}

export function createAffiliateLinkQueries(db: Database.Database) {
  return {
    insert: db.prepare(`
      INSERT INTO affiliate_links (name, asp, category, url, commission, is_special_rate)
      VALUES (@name, @asp, @category, @url, @commission, @isSpecialRate)
    `),

    getAll: db.prepare(`
      SELECT * FROM affiliate_links WHERE active = 1 ORDER BY category, name
    `),

    getByCategory: db.prepare(`
      SELECT * FROM affiliate_links WHERE category = @category AND active = 1
    `),

    updateClicks: db.prepare(`
      UPDATE affiliate_links SET clicks = clicks + 1 WHERE id = @id
    `),

    recordConversion: db.prepare(`
      UPDATE affiliate_links SET conversions = conversions + 1 WHERE id = @id
    `),

    deactivate: db.prepare(`
      UPDATE affiliate_links SET active = 0 WHERE id = @id
    `),

    getTopPerformers: db.prepare(`
      SELECT *, CASE WHEN clicks > 0 THEN CAST(conversions AS REAL) / clicks * 100 ELSE 0 END as cvr
      FROM affiliate_links WHERE active = 1 AND clicks > 0
      ORDER BY cvr DESC LIMIT @limit
    `),
  };
}

export function addAffiliateLink(
  db: Database.Database,
  link: { name: string; asp: string; category: string; url: string; commission: number; isSpecialRate?: boolean },
): void {
  createAffiliateLinkQueries(db).insert.run({
    name: link.name,
    asp: link.asp,
    category: link.category,
    url: link.url,
    commission: link.commission,
    isSpecialRate: link.isSpecialRate ? 1 : 0,
  });
}

export function getAffiliateReport(db: Database.Database): string {
  const links = createAffiliateLinkQueries(db).getAll.all() as AffiliateLink[];

  if (links.length === 0) return "アフィリエイトリンクが登録されていません";

  const lines = ["📎 アフィリエイトリンク一覧:"];
  for (const link of links) {
    const cvr = link.clicks > 0 ? ((link.conversions / link.clicks) * 100).toFixed(1) : "-";
    const special = link.is_special_rate ? " ⭐特単" : "";
    lines.push(
      `  ${link.name} (${link.asp}${special}) - ${link.clicks}クリック / ${link.conversions}CV / CVR ${cvr}% / 単価¥${link.commission.toLocaleString()}`,
    );
  }

  const totalRevenue = links.reduce((s, l) => s + l.conversions * l.commission, 0);
  lines.push(`\n  推定総収益: ¥${totalRevenue.toLocaleString()}`);

  return lines.join("\n");
}
