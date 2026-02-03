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

/** Análisis guardado (sector + reporte completo) para poder reabrir después */
export interface SavedAnalysis {
  id: string;
  sectorName: string;
  context?: string;
  createdAt: string;
  /** Reporte completo del backend (meta + sections) */
  report: {
    meta?: { sector_name?: string; cnae_codes?: string[]; verdict?: string; timestamp?: string; [k: string]: unknown };
    sections?: Record<string, { title?: string; content?: string }>;
  };
  /** Si el usuario editó el informe, markdown final a mostrar (sino se genera desde report) */
  editedMarkdown?: string;
}
