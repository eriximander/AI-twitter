import type Database from "better-sqlite3";
import { createAffiliateLinkQueries, type AffiliateLink } from "./links.js";

export interface ConversionEvent {
  linkId: number;
  amount?: number;
  source?: string;
}

export function recordClick(db: Database.Database, linkId: number): void {
  createAffiliateLinkQueries(db).updateClicks.run({ id: linkId });
}

export function recordConversion(db: Database.Database, event: ConversionEvent): void {
  createAffiliateLinkQueries(db).recordConversion.run({ id: event.linkId });
}

export interface MonthlyReport {
  month: string;
  totalClicks: number;
  totalConversions: number;
  totalRevenue: number;
  avgCvr: number;
  topLink: string | null;
}

export function getMonthlyReport(db: Database.Database): MonthlyReport {
  const links = createAffiliateLinkQueries(db).getAll.all() as AffiliateLink[];
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const totalClicks = links.reduce((s, l) => s + l.clicks, 0);
  const totalConversions = links.reduce((s, l) => s + l.conversions, 0);
  const totalRevenue = links.reduce((s, l) => s + l.conversions * l.commission, 0);

  const topPerformer = links
    .filter((l) => l.conversions > 0)
    .sort((a, b) => b.conversions * b.commission - a.conversions * a.commission)[0];

  return {
    month,
    totalClicks,
    totalConversions,
    totalRevenue,
    avgCvr: totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0,
    topLink: topPerformer?.name ?? null,
  };
}

export function checkSpecialRateEligibility(db: Database.Database): string[] {
  const links = createAffiliateLinkQueries(db).getAll.all() as AffiliateLink[];
  const eligible: string[] = [];

  for (const link of links) {
    if (link.is_special_rate) continue;
    if (link.conversions >= 20) {
      eligible.push(
        `${link.name} (${link.asp}): ${link.conversions}CV達成 → 特単交渉可能`,
      );
    }
  }

  return eligible;
}
