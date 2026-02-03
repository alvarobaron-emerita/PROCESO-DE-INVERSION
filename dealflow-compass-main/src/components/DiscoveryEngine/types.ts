export interface DiscoveryConfig {
  sector: string;
  context: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export type AnalysisStatus = "idle" | "analyzing" | "complete";

export interface AnalysisReport {
  verdict: "green" | "amber" | "red";
  verdictText: string;
  cnaeClassification: string[];
  marketSize: string;
  leaderShare: string;
  ebitdaMargin: string;
  grossMargin: string;
  cashConversion: string;
  searchSignals: string[];
  targetCompanies: string[];
}

export interface AgentStatus {
  name: string;
  status: "pending" | "running" | "complete";
  icon: string;
}
