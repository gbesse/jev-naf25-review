import type { JevProvider } from "./jev.mjs";
export interface PortfolioActivity {
  siren: string;
  description?: string;
  websiteEvidence?: string;
  currentCode?: string;
  proposedCode?: string;
  observedAt: string;
}
export interface PortfolioReference {
  code: string;
  label: string;
  includes?: string[];
  excludes?: string[];
  sourceUrl: string;
  retrievedAt: string;
}
export type PortfolioStatus = "needs_evidence" | "missing_code" | "missing_reference" | "provider_error" |
  "insufficient_evidence" | "weak_fit" | "possible_fit" | "strong_fit" | "budget_deferred" | "not_assessed";
export interface PortfolioReport {
  schemaVersion: 1;
  referenceVersion: "NAF2025";
  mode: "assessment" | "preflight-only";
  inputFingerprint: string;
  budget: { maxDecisions: number; attemptedDecisions: number; completedDecisions: number;
    failedDecisions: number; remainingDecisions: number };
  total: number;
  counts: Partial<Record<PortfolioStatus, number>>;
  rows: { siren: string; currentCode: string | null; proposedCode: string | null;
    observedAt: string; reviewRequired: true; evidenceFingerprint: string;
    reference: { code: string; label: string; sourceUrl: string; retrievedAt: string; fingerprint: string } | null;
    status: PortfolioStatus; priority: number; evidenceScore: number | null;
    probability: number | null; confidence: number | null; questions: string[] }[];
}
export function reviewPortfolio(input: { activities: PortfolioActivity[]; entries: PortfolioReference[];
  provider?: JevProvider; maxDecisions?: number }): Promise<PortfolioReport>;
export function parsePortfolioCsv(source: string): PortfolioActivity[];
