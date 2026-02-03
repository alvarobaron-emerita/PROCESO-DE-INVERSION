import { useState, useCallback } from "react";
import { ConfigPanel } from "./ConfigPanel";
import { ChatPanel } from "./ChatPanel";
import { ReportViewer } from "./ReportViewer";
import { 
  DiscoveryConfig, 
  ChatMessage, 
  AnalysisStatus, 
  AgentStatus, 
  AnalysisReport 
} from "./types";
import { generateMockReport, generateMarkdownReport } from "./mockData";
import { useToast } from "@/hooks/use-toast";

const initialAgents: AgentStatus[] = [
  { name: "CNAE Mapping Agent", status: "pending", icon: "🗂️" },
  { name: "Tavily Research Agent", status: "pending", icon: "🔍" },
  { name: "Gemini Analysis Agent", status: "pending", icon: "🧠" },
];

export function DiscoveryEngine() {
  const { toast } = useToast();
  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus>("idle");
  const [agents, setAgents] = useState<AgentStatus[]>(initialAgents);
  const [config, setConfig] = useState<DiscoveryConfig | null>(null);
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [markdown, setMarkdown] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const simulateAgentProgress = useCallback(async () => {
    const delays = [800, 1200, 1500];
    
    for (let i = 0; i < initialAgents.length; i++) {
      setAgents(prev => 
        prev.map((agent, idx) => ({
          ...agent,
          status: idx === i ? "running" : idx < i ? "complete" : "pending"
        }))
      );
      await new Promise(resolve => setTimeout(resolve, delays[i]));
    }
    
    setAgents(prev => prev.map(agent => ({ ...agent, status: "complete" })));
  }, []);

  const handleStartAnalysis = useCallback(async (newConfig: DiscoveryConfig) => {
    setConfig(newConfig);
    setAnalysisStatus("analyzing");
    setAgents(initialAgents);

    await simulateAgentProgress();

    // Generate mock report
    const mockReport = generateMockReport(newConfig.sector);
    const mockMarkdown = generateMarkdownReport(newConfig.sector, mockReport);

    setReport(mockReport);
    setMarkdown(mockMarkdown);
    setAnalysisStatus("complete");

    // Add initial assistant message
    setMessages([
      {
        id: "1",
        role: "assistant",
        content: `He completado el análisis del sector "${newConfig.sector}". El veredicto es ${
          mockReport.verdict === "green" ? "positivo ✓" : 
          mockReport.verdict === "amber" ? "moderado ⚠️" : "con precaución ⚠️"
        }. ¿En qué aspecto te gustaría profundizar?`,
        timestamp: new Date(),
      }
    ]);
  }, [simulateAgentProgress]);

  const handleSendMessage = useCallback(async (content: string) => {
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsProcessing(true);

    // Simulate AI response
    await new Promise(resolve => setTimeout(resolve, 1500));

    const responses: Record<string, string> = {
      "Profundiza en los márgenes": `El margen EBITDA del ${report?.ebitdaMargin} está ${
        parseFloat(report?.ebitdaMargin || "0") >= 15 
          ? "por encima del umbral de la Tesis Emerita (15%)" 
          : "por debajo del umbral ideal de 15%"
      }. El margen bruto de ${report?.grossMargin} indica ${
        parseFloat(report?.grossMargin || "0") >= 35 
          ? "una estructura de costes saludable" 
          : "presión en la estructura de costes"
      }. Recomiendo analizar la evolución de estos márgenes en los últimos 3 años.`,
      "¿Qué riesgos identificas?": "Los principales riesgos identificados son:\n\n1. **Dependencia climática**: El sector está expuesto a variaciones meteorológicas.\n2. **Competencia de importaciones**: Presión de productores de bajo coste.\n3. **Sucesión generacional**: Muchas empresas familiares sin plan de continuidad.\n4. **Regulación**: Cambios en normativa de etiquetado y denominaciones.",
      "Busca más empresas objetivo": `He identificado 4 empresas adicionales que cumplen los criterios:\n\n• **Viñedos del Atlántico** - €8.2M facturación\n• **Bodega Tradición Familiar** - €12.5M facturación\n• **Grupo Viticultura Norte** - €6.8M facturación\n• **Cooperativa Sierra Central** - €15.1M facturación\n\nTodas presentan indicios de interés en procesos de sucesión o profesionalización.`,
    };

    const assistantMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: responses[content] || `He analizado tu consulta sobre "${content}". Basándome en los datos del sector ${config?.sector}, puedo indicarte que esta es una consideración relevante para la tesis de inversión. ¿Te gustaría que profundice en algún aspecto específico?`,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, assistantMessage]);
    setIsProcessing(false);
  }, [config, report]);

  const handleReset = useCallback(() => {
    setAnalysisStatus("idle");
    setAgents(initialAgents);
    setConfig(null);
    setReport(null);
    setMarkdown(null);
    setMessages([]);
  }, []);

  const handleCreateProject = useCallback(() => {
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
