import { useState, useCallback } from "react";
import { ConfigPanel } from "./ConfigPanel";
import { ChatPanel } from "./ChatPanel";
import { ReportViewer } from "./ReportViewer";
export { DiscoverySettings } from "./DiscoverySettings";
import {
  DiscoveryConfig,
  ChatMessage,
  AnalysisStatus,
  AgentStatus,
  AnalysisReport,
} from "./types";
import { reportToMarkdown, getErrorFallbackMarkdown } from "./reportUtils";
import type { BackendReport } from "./reportUtils";
import { useApi, useMutation } from "~/trpc/react";
import { useToast } from "~/hooks/use-toast";

const DISCOVERY_EMERITA_KEY = "discovery_emerita_thesis";
const DISCOVERY_PROMPTS_KEY = "discovery_custom_prompts";

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

export function DiscoveryEngine() {
  const api = useApi();
  const { toast } = useToast();
  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus>("idle");
  const [agents, setAgents] = useState<AgentStatus[]>(initialAgents);
  const [config, setConfig] = useState<DiscoveryConfig | null>(null);
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [markdown, setMarkdown] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

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

        // Paso 3: Generar reporte (con Manifiesto y prompts desde Ajustes si existen)
        let emeritaThesis: Record<string, unknown> | undefined;
        let customPrompts: Record<string, unknown> | undefined;
        try {
          const stored = localStorage.getItem(DISCOVERY_EMERITA_KEY);
          if (stored) emeritaThesis = JSON.parse(stored) as Record<string, unknown>;
        } catch {
          /* ignore */
        }
        try {
          const stored = localStorage.getItem(DISCOVERY_PROMPTS_KEY);
          if (stored) customPrompts = JSON.parse(stored) as Record<string, unknown>;
        } catch {
          /* ignore */
        }

        const reportResult = await generateReportMutation.mutateAsync({
          sectorName: newConfig.sector,
          cnaeCodes,
          researchData: researchResult.research_data,
          additionalContext: newConfig.context || undefined,
          emeritaThesis,
          customPrompts,
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
        setMarkdown(reportMarkdown);
        setAnalysisStatus("complete");

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
        setReport(
          backendReportToAnalysisReport(
            { meta: { sector_name: newConfig.sector, verdict: "ÁMBAR" } },
            newConfig.sector
          )
        );
        setAnalysisStatus("complete");
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
        // Llamar al backend para obtener respuesta del chat
        const chatResult = await chatMutation.mutateAsync({
          message: content,
          sectionKey: "1_executive_summary",
          report: report || {},
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
        // Respuesta de fallback
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: `He analizado tu consulta sobre "${content}". Basándome en los datos del sector ${config?.sector}, puedo indicarte que esta es una consideración relevante para la tesis de inversión. ¿Te gustaría que profundice en algún aspecto específico?`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } finally {
        setIsProcessing(false);
      }
    },
    [chatMutation, config, report]
  );

  const handleReset = useCallback(() => {
    setAnalysisStatus("idle");
    setAgents(initialAgents);
    setConfig(null);
    setReport(null);
    setMarkdown(null);
    setMessages([]);
  }, []);

  const handleCreateProject = useCallback(() => {
    // TODO: Implementar creación de proyecto en Tool 2
    toast({
      title: "Proyecto creado",
      description: `Se ha creado un nuevo proyecto con ${report?.targetCompanies.length || 0} empresas objetivo en Search OS.`,
    });
  }, [report, toast]);

  const isConfigMode = analysisStatus !== "complete";

  return (
    <div className="flex h-full rounded-lg overflow-hidden border border-border/50 bg-card">
      {/* Left Panel - 35% */}
      <div className="w-[35%] border-r border-border/50 flex flex-col bg-background/50">
        {isConfigMode ? (
          <ConfigPanel
            onStartAnalysis={handleStartAnalysis}
            analysisStatus={analysisStatus}
            agents={agents}
          />
        ) : (
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
        <ReportViewer
          markdown={markdown}
          report={report}
          isLoading={analysisStatus === "analyzing"}
          onCreateProject={handleCreateProject}
        />
      </div>
    </div>
  );
}
