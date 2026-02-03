import { useState } from "react";
import { Rocket, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AgentIndicator } from "./AgentIndicator";
import { DiscoveryConfig, AgentStatus, AnalysisStatus } from "./types";

interface ConfigPanelProps {
  onStartAnalysis: (config: DiscoveryConfig) => void;
  analysisStatus: AnalysisStatus;
  agents: AgentStatus[];
}

export function ConfigPanel({ onStartAnalysis, analysisStatus, agents }: ConfigPanelProps) {
  const [sector, setSector] = useState("");
  const [context, setContext] = useState("");

  const handleSubmit = () => {
    if (sector.trim()) {
      onStartAnalysis({ sector: sector.trim(), context: context.trim() });
    }
  };

  const isAnalyzing = analysisStatus === "analyzing";

  return (
    <div className="flex flex-col h-full p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20">
          <Rocket className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Discovery Engine</h2>
          <p className="text-sm text-muted-foreground">Copiloto de Inversión</p>
        </div>
      </div>

      {/* Form */}
      <div className="space-y-6 flex-1">
        <div className="space-y-2">
          <Label htmlFor="sector" className="text-foreground">
            Nombre del Sector / Nicho
          </Label>
          <Input
            id="sector"
            placeholder="Ej: Sector vitivinícola en España"
            value={sector}
            onChange={(e) => setSector(e.target.value)}
            disabled={isAnalyzing}
            className="bg-background/50 border-border/50 focus:border-primary"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="context" className="text-foreground">
            Contexto Adicional <span className="text-muted-foreground">(Opcional)</span>
          </Label>
          <Textarea
            id="context"
            placeholder="Ej: Buscamos empresas familiares con facturación entre 5-20M€..."
            value={context}
            onChange={(e) => setContext(e.target.value)}
            disabled={isAnalyzing}
            rows={4}
            className="bg-background/50 border-border/50 focus:border-primary resize-none"
          />
        </div>

        {/* Agent Status */}
        {isAnalyzing && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary animate-pulse" />
              <span className="text-sm font-medium text-foreground">
                Agentes Investigando...
              </span>
            </div>
            <AgentIndicator agents={agents} />
          </div>
        )}
      </div>

      {/* Action Button */}
      <Button
        onClick={handleSubmit}
        disabled={!sector.trim() || isAnalyzing}
        className="w-full mt-6 h-12 text-base font-semibold"
        size="lg"
      >
        {isAnalyzing ? (
          <>
            <Sparkles className="h-5 w-5 mr-2 animate-pulse" />
            Analizando...
          </>
        ) : (
          <>
            <Rocket className="h-5 w-5 mr-2" />
            ARRANCAR ANÁLISIS
          </>
        )}
      </Button>
    </div>
  );
}
