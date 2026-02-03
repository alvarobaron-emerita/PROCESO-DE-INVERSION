export type AnalysisStatus = "idle" | "analyzing" | "complete";

export interface AgentStatus {
  name: string;
  status: "pending" | "running" | "complete";
  icon: string;
}

export interface DiscoveryConfig {
  sector: string;
  context?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface AnalysisReport {
  sector: string;
  verdict: "green" | "amber" | "red";
  ebitdaMargin: string;
  grossMargin: string;
  targetCompanies: Array<{
    name: string;
    revenue: string;
  }>;
}
