import { useState, useCallback, useEffect } from "react";
import { ConfigPanel } from "./ConfigPanel";
import { ChatPanel } from "./ChatPanel";
import { ReportViewer } from "./ReportViewer";
import { SummaryView } from "./SummaryView";
export { DiscoverySettings } from "./DiscoverySettings";
import {
  DiscoveryConfig,
  ChatMessage,
  AnalysisStatus,
  AgentStatus,
  AnalysisReport,
  type SavedAnalysis,
} from "./types";
import { reportToMarkdown, getErrorFallbackMarkdown } from "./reportUtils";
import type { BackendReport } from "./reportUtils";
import { getAnalyses, saveAnalysis, getAnalysisById, updateAnalysis, notifyAnalysesChanged } from "./discoveryStorage";
import { useApi, useMutation } from "~/trpc/react";
import { useToast } from "~/hooks/use-toast";

type DiscoveryView = "list" | "config" | "report";

const DISCOVERY_EMERITA_KEY = "discovery_emerita_thesis";
const DISCOVERY_PROMPTS_KEY = "discovery_custom_prompts";
const DISCOVERY_SECTION_TITLES_KEY = "discovery_section_titles";
const DISCOVERY_SECTIONS_KEY = "discovery_sections";

function backendReportToAnalysisReport(
  backendReport: BackendReport,
  sectorLabel: string
): AnalysisReport {
  const meta = backendReport.meta ?? {};
  const v = (meta.verdict ?? "ÁMBAR").toUpperCase();
  const verdict: AnalysisReport["verdict"] =
    v === "VERDE" || v === "GREEN" ? "green" : v === "ROJO" || v === "RED" ? "red" : "amber";
  return {
    sector: meta.sector_name ?? sectorLabel,
    verdict,
    ebitdaMargin: "",
    grossMargin: "",
    targetCompanies: [],
  };
}

const initialAgents: AgentStatus[] = [
  { name: "CNAE Mapping Agent", status: "pending", icon: "🗂️" },
  { name: "Tavily Research Agent", status: "pending", icon: "🔍" },
  { name: "Gemini Analysis Agent", status: "pending", icon: "🧠" },
];

interface DiscoveryEngineProps {
  /** ID del análisis a abrir (desde el sidebar). null = ninguno; undefined = modo interno (lista propia) */
  openAnalysisId?: string | null;
  /** Si true, abrir directamente el panel de config (nuevo análisis) */
  requestDiscoveryConfig?: boolean;
  /** Llamado al abrir el panel de config */
  onClearRequestDiscoveryConfig?: () => void;
}

export function DiscoveryEngine({
  openAnalysisId,
  requestDiscoveryConfig = false,
  onClearRequestDiscoveryConfig,
}: DiscoveryEngineProps = {}) {
  const api = useApi();
  const { toast } = useToast();
  const sidebarMode = openAnalysisId !== undefined;
  const [savedAnalyses, setSavedAnalyses] = useState<SavedAnalysis[]>(() =>
    getAnalyses()
  );
  const [view, setView] = useState<DiscoveryView>(() =>
    getAnalyses().length > 0 ? "list" : "config"
  );
  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus>("idle");
  const [agents, setAgents] = useState<AgentStatus[]>(initialAgents);
  const [config, setConfig] = useState<DiscoveryConfig | null>(null);
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [backendReport, setBackendReport] = useState<BackendReport | null>(null);
  const [markdown, setMarkdown] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentAnalysisId, setCurrentAnalysisId] = useState<string | null>(null);
  const [isEditingReport, setIsEditingReport] = useState(false);

  // Sincronizar con sidebar: abrir análisis seleccionado
  useEffect(() => {
    if (!sidebarMode) return;
    if (openAnalysisId === null || openAnalysisId === "") {
      setCurrentAnalysisId(null);
      setReport(null);
      setBackendReport(null);
      setMarkdown(null);
      setView("list");
      return;
    }
    const saved = getAnalysisById(openAnalysisId);
    if (saved) {
      const backendReport = saved.report as BackendReport;
      setConfig({ sector: saved.sectorName, context: saved.context });
      setReport(backendReportToAnalysisReport(backendReport, saved.sectorName));
      setBackendReport(backendReport);
      setMarkdown(saved.editedMarkdown ?? reportToMarkdown(backendReport));
      setMessages([]);
      setAnalysisStatus("complete");
      setView("report");
      setCurrentAnalysisId(saved.id);
    }
  }, [sidebarMode, openAnalysisId]);

  // Sincronizar con sidebar: abrir panel de config (nuevo análisis)
  useEffect(() => {
    if (requestDiscoveryConfig && sidebarMode) {
      setView("config");
      setAnalysisStatus("idle");
      setConfig(null);
      setReport(null);
      setBackendReport(null);
      setMarkdown(null);
      setMessages([]);
      setAgents(initialAgents);
      onClearRequestDiscoveryConfig?.();
    }
  }, [requestDiscoveryConfig, sidebarMode, onClearRequestDiscoveryConfig]);

  useEffect(() => {
    setSavedAnalyses(getAnalyses());
  }, [view]);

  // Mutations para llamar al backend (API oficial tRPC v11)
  const classifyMutation = useMutation(api.tool1.classifySector.mutationOptions());
  const researchMutation = useMutation(api.tool1.researchSector.mutationOptions());
  const generateReportMutation = useMutation(
    api.tool1.generateReport.mutationOptions()
  );
  const chatMutation = useMutation(api.tool1.chat.mutationOptions());

  const simulateAgentProgress = useCallback(async () => {
    const delays = [800, 1200, 1500];

    for (let i = 0; i < initialAgents.length; i++) {
      setAgents((prev) =>
        prev.map((agent, idx) => ({
          ...agent,
          status:
            idx === i ? "running" : idx < i ? "complete" : "pending",
        }))
      );
      await new Promise((resolve) => setTimeout(resolve, delays[i]));
    }

    setAgents((prev) =>
      prev.map((agent) => ({ ...agent, status: "complete" }))
    );
  }, []);

  const handleStartAnalysis = useCallback(
    async (newConfig: DiscoveryConfig) => {
      setConfig(newConfig);
      setAnalysisStatus("analyzing");
      setAgents(initialAgents);

      try {
        // Paso 1: Clasificar sector
        setAgents((prev) =>
          prev.map((agent, idx) => ({
            ...agent,
            status: idx === 0 ? "running" : "pending",
          }))
        );

        const cnaeResult = await classifyMutation.mutateAsync({
          sectorName: newConfig.sector,
          additionalContext: newConfig.context,
        });

        setAgents((prev) =>
          prev.map((agent, idx) => ({
            ...agent,
            status: idx === 0 ? "complete" : idx === 1 ? "running" : "pending",
          }))
        );

        // Paso 2: Investigar sector
        const cnaeCodes = [
          cnaeResult.primary_cnae,
          ...cnaeResult.secondary_cnae,
        ];

        const researchResult = await researchMutation.mutateAsync({
          sectorName: newConfig.sector,
          cnaeCodes,
          maxResultsPerQuery: 3,
        });

        setAgents((prev) =>
          prev.map((agent, idx) => ({
            ...agent,
            status: idx === 2 ? "running" : "complete",
          }))
        );

        // Paso 3: Generar reporte (Manifiesto + secciones desde Ajustes: customSections o customPrompts/customSectionTitles)
        let emeritaThesis: Record<string, unknown> | undefined;
        let customPrompts: Record<string, unknown> | undefined;
        let customSectionTitles: Record<string, string> | undefined;
        let customSections: Array<{ key: string; title: string; prompt?: string }> | undefined;
        try {
          const stored = localStorage.getItem(DISCOVERY_EMERITA_KEY);
          if (stored) emeritaThesis = JSON.parse(stored) as Record<string, unknown>;
        } catch {
          /* ignore */
        }
        try {
          const stored = localStorage.getItem(DISCOVERY_SECTIONS_KEY);
          if (stored) {
            const parsed = JSON.parse(stored) as Array<{ key: string; title: string; prompt?: string }>;
            if (Array.isArray(parsed) && parsed.length > 0) customSections = parsed;
          }
        } catch {
          /* ignore */
        }
        if (!customSections) {
          try {
            const stored = localStorage.getItem(DISCOVERY_PROMPTS_KEY);
            if (stored) customPrompts = JSON.parse(stored) as Record<string, unknown>;
          } catch {
            /* ignore */
          }
          try {
            const stored = localStorage.getItem(DISCOVERY_SECTION_TITLES_KEY);
            if (stored) customSectionTitles = JSON.parse(stored) as Record<string, string>;
          } catch {
            /* ignore */
          }
        }

        const reportResult = await generateReportMutation.mutateAsync({
          sectorName: newConfig.sector,
          cnaeCodes,
          researchData: researchResult.research_data,
          additionalContext: newConfig.context || undefined,
          emeritaThesis,
          customPrompts,
          customSectionTitles,
          customSections,
        });

        setAgents((prev) =>
          prev.map((agent) => ({ ...agent, status: "complete" }))
        );

        const backendReport = reportResult.report as BackendReport;
        const reportMarkdown = reportToMarkdown(backendReport);
        const analysisReport = backendReportToAnalysisReport(
          backendReport,
          newConfig.sector
        );

        setReport(analysisReport);
        setBackendReport(backendReport);
        setMarkdown(reportMarkdown);
        setAnalysisStatus("complete");
        setView("report");

        const newId = crypto.randomUUID();
        const saved: SavedAnalysis = {
          id: newId,
          sectorName: newConfig.sector,
          context: newConfig.context || undefined,
          createdAt: new Date().toISOString(),
          report: backendReport,
        };
        saveAnalysis(saved);
        setSavedAnalyses(getAnalyses());
        setCurrentAnalysisId(newId);
        notifyAnalysesChanged();

        const verdictText =
          analysisReport.verdict === "green"
            ? "positivo ✓"
            : analysisReport.verdict === "amber"
              ? "moderado ⚠️"
              : "con precaución ⚠️";
        setMessages([
          {
            id: "1",
            role: "assistant",
            content: `He completado el análisis de "${analysisReport.sector}". El veredicto es ${verdictText}. ¿En qué aspecto te gustaría profundizar?`,
            timestamp: new Date(),
          },
        ]);
      } catch (error) {
        console.error("Error en análisis:", error);
        toast({
          title: "Error en el análisis",
          description:
            error instanceof Error ? error.message : "No se pudo completar el análisis. Vuelve a intentarlo.",
          variant: "destructive",
        });
        setMarkdown(getErrorFallbackMarkdown(newConfig.sector));
        const fallbackBackend: BackendReport = {
          meta: { sector_name: newConfig.sector, verdict: "ÁMBAR" },
        };
        setReport(
          backendReportToAnalysisReport(fallbackBackend, newConfig.sector)
        );
        setBackendReport(fallbackBackend);
        setAnalysisStatus("complete");
        setView("report");
        setMessages([
          {
            id: "1",
            role: "assistant",
            content: `No se pudo completar el análisis de "${newConfig.sector}". Revisa el informe a la derecha para más detalles o inténtalo de nuevo.`,
            timestamp: new Date(),
          },
        ]);
      }
    },
    [classifyMutation, researchMutation, generateReportMutation]
  );

  const handleSendMessage = useCallback(
    async (content: string) => {
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        role: "user",
        content,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsProcessing(true);

      try {
        // Historial reciente (últimos 10 mensajes) para contexto conversacional
        const recentHistory = messages
          .slice(-10)
          .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

        const chatResult = await chatMutation.mutateAsync({
          message: content,
          report: backendReport ?? {},
          history: recentHistory.length > 0 ? recentHistory : undefined,
        });

        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: chatResult.response,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } catch (error) {
        console.error("Error en chat:", error);
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content:
            "No se pudo obtener respuesta. Comprueba que el backend esté en marcha y la conexión sea correcta, o inténtalo más tarde.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } finally {
        setIsProcessing(false);
      }
    },
    [chatMutation, backendReport, messages]
  );

  const handleReset = useCallback(() => {
    setAnalysisStatus("idle");
    setAgents(initialAgents);
    setConfig(null);
    setReport(null);
    setBackendReport(null);
    setMarkdown(null);
    setMessages([]);
    setView("list");
  }, []);

  const handleSelectAnalysis = useCallback((id: string) => {
    const saved = getAnalysisById(id);
    if (!saved) return;
    const backendReport = saved.report as BackendReport;
    setConfig({ sector: saved.sectorName, context: saved.context });
    setReport(backendReportToAnalysisReport(backendReport, saved.sectorName));
    setBackendReport(backendReport);
    setMarkdown(saved.editedMarkdown ?? reportToMarkdown(backendReport));
    setMessages([]);
    setAnalysisStatus("complete");
    setView("report");
    setCurrentAnalysisId(saved.id);
  }, []);

  const handleNewAnalysis = useCallback(() => {
    setView("config");
    setAnalysisStatus("idle");
    setConfig(null);
    setReport(null);
    setBackendReport(null);
    setMarkdown(null);
    setMessages([]);
    setAgents(initialAgents);
  }, []);

  const handleCreateProject = useCallback(() => {
    // TODO: Implementar creación de proyecto en Tool 2
    toast({
      title: "Proyecto creado",
      description: `Se ha creado un nuevo proyecto con ${report?.targetCompanies.length || 0} empresas objetivo en Search OS.`,
    });
  }, [report, toast]);

  const handleSaveEditedReport = useCallback(
    (editedMarkdown: string) => {
      if (!currentAnalysisId) return;
      updateAnalysis(currentAnalysisId, { editedMarkdown });
      setMarkdown(editedMarkdown);
      setIsEditingReport(false);
      notifyAnalysesChanged();
      toast({ title: "Informe guardado", description: "Los cambios se han guardado correctamente." });
    },
    [currentAnalysisId, toast]
  );

  return (
    <div className="flex h-full rounded-lg overflow-hidden border border-border/50 bg-card">
      {/* Left Panel - 35% */}
      <div className="w-[35%] border-r border-border/50 flex flex-col bg-background/50">
        {view === "list" && !sidebarMode && (
          <SummaryView
            analyses={savedAnalyses}
            onSelectAnalysis={handleSelectAnalysis}
            onNewAnalysis={handleNewAnalysis}
          />
        )}
        {view === "list" && sidebarMode && (
          <div className="flex flex-col items-center justify-center flex-1 text-center px-6 text-muted-foreground">
            <p className="text-sm">Selecciona un análisis en el sidebar o crea uno nuevo.</p>
          </div>
        )}
        {view === "config" && (
          <ConfigPanel
            onStartAnalysis={handleStartAnalysis}
            analysisStatus={analysisStatus}
            agents={agents}
          />
        )}
        {view === "report" && (
          <ChatPanel
            messages={messages}
            onSendMessage={handleSendMessage}
            onReset={handleReset}
            isProcessing={isProcessing}
            sector={config?.sector || ""}
          />
        )}
      </div>

      {/* Right Panel - 65% */}
      <div className="w-[65%] flex flex-col bg-background">
        {view === "list" && (
          <div className="flex flex-col items-center justify-center h-full text-center px-8 text-muted-foreground">
            <p className="text-sm">
              {sidebarMode
                ? "Selecciona un análisis del sidebar o crea uno nuevo."
                : "Selecciona un análisis de la lista o crea uno nuevo."}
            </p>
          </div>
        )}
        {(view === "config" || view === "report") && (
          <ReportViewer
            markdown={markdown}
            report={report}
            isLoading={analysisStatus === "analyzing"}
            onCreateProject={handleCreateProject}
            isEditing={isEditingReport}
            onStartEdit={() => setIsEditingReport(true)}
            onCancelEdit={() => setIsEditingReport(false)}
            onSaveEdited={handleSaveEditedReport}
          />
        )}
      </div>
    </div>
  );
}
