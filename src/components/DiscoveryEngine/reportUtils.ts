/**
 * Convierte el reporte del backend (meta + sections) a markdown para el visor.
 * Fuente de verdad: el JSON que devuelve el backend, no plantillas mock.
 */

export interface BackendReportMeta {
  sector_name?: string;
  cnae_codes?: string[];
  verdict?: string;
  timestamp?: string;
  evaluation?: Record<string, unknown>;
}

export interface BackendReportSection {
  title?: string;
  content?: string;
}

export interface BackendReport {
  meta?: BackendReportMeta;
  sections?: Record<string, BackendReportSection>;
}

const VERDICT_EMOJI: Record<string, string> = {
  VERDE: "🟢",
  GREEN: "🟢",
  ÁMBAR: "🟡",
  AMBAR: "🟡",
  AMBER: "🟡",
  ROJO: "🔴",
  RED: "🔴",
};

/** Orden canónico de las secciones del informe */
const SECTION_ORDER = [
  "1_executive_summary",
  "2_financials",
  "3_market_size",
  "4_value_chain",
  "5_competition",
  "6_regulations",
  "7_opportunities",
  "8_gtm_targets",
  "9_conclusion",
  "10_sourcing_signals",
];

/**
 * Genera markdown a partir del reporte real del backend.
 */
export function reportToMarkdown(report: BackendReport): string {
  const meta = report.meta ?? {};
  const sections = report.sections ?? {};
  const sectorName = meta.sector_name ?? "Sector";
  const verdictRaw = (meta.verdict ?? "ÁMBAR").toUpperCase();
  const verdictEmoji = VERDICT_EMOJI[verdictRaw] ?? "🟡";
  const cnaeCodes = meta.cnae_codes ?? [];

  const parts: string[] = [];

  // Título y veredicto
  parts.push(`# Análisis de Inversión: ${sectorName}\n`);
  parts.push(`## ${verdictEmoji} Veredicto: ${verdictRaw}\n`);
  if (meta.timestamp) {
    parts.push(`*Fecha: ${meta.timestamp}*\n`);
  }
  parts.push("---\n");

  // CNAE si está disponible en meta
  if (cnaeCodes.length > 0) {
    parts.push("## 📊 Clasificación CNAE\n");
    parts.push(cnaeCodes.map((c) => `- \`${c}\``).join("\n"));
    parts.push("\n---\n");
  }

  // Secciones en orden
  const orderedKeys = SECTION_ORDER.filter((key) => sections[key]);
  const remainingKeys = Object.keys(sections).filter((k) => !SECTION_ORDER.includes(k));
  const allKeys = [...orderedKeys, ...remainingKeys];

  for (const key of allKeys) {
    const section = sections[key];
    if (!section || !section.content) continue;
    const title = section.title ?? key;
    parts.push(`## ${title}\n\n`);
    parts.push(section.content.trim());
    parts.push("\n\n---\n");
  }

  parts.push("\n*Informe generado por Discovery Engine • Tesis Emerita*");
  return parts.join("");
}

/**
 * Fallback markdown cuando el backend falla (sin datos inventados de un sector).
 */
export function getErrorFallbackMarkdown(sectorOrCompany: string): string {
  return `# Análisis no disponible

No se pudo completar el análisis para **${sectorOrCompany}**.

Posibles causas:
- Error de conexión con el servidor
- Timeout en uno de los agentes (CNAE, investigación o análisis)
- Error en la generación del informe

Por favor, comprueba tu conexión y vuelve a intentar. Si el problema continúa, revisa los ajustes del Discovery Engine (modelo, API keys) o contacta con soporte.

---
*Discovery Engine • Tesis Emerita*`;
}
