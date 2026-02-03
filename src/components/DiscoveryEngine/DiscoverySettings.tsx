import { useState, useEffect } from "react";
import { Zap, Save } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";
import { useToast } from "~/hooks/use-toast";

const DISCOVERY_EMERITA_KEY = "discovery_emerita_thesis";
const DISCOVERY_PROMPTS_KEY = "discovery_custom_prompts";

const DEFAULT_EMERITA_THESIS = {
  TARGET_GEO: "España (prioritario), Europa Occidental (secundario)",
  TARGET_SIZE: "Ventas 5-40M€, EBITDA 1-5M€",
  TARGET_MARGINS: "EBITDA ≥15%, Bruto ≥40%",
  DEAL_KILLERS: [
    "Riesgo tecnológico alto",
    "Dependencia de un solo cliente",
    "Sector en declive",
    "Márgenes muy bajos (<10%)",
  ],
  VALUE_LEVERS: [
    "Digitalización (pasar de papel a software)",
    "Profesionalización comercial (outbound)",
    "Eficiencia operativa",
  ],
};

export const REPORT_SECTIONS: Record<string, string> = {
  "1_executive_summary": "1. Resumen Ejecutivo y Semáforo",
  "2_financials": "2. Unit Economics y Financieros",
  "3_market_size": "3. Tamaño y Segmentación",
  "4_value_chain": "4. Cadena de Valor",
  "5_competition": "5. Estructura Competitiva",
  "6_regulations": "6. Regulación y Riesgos",
  "7_opportunities": "7. Oportunidades (Tesis Emerita)",
  "8_gtm_targets": "8. Hipótesis y Targets",
  "9_conclusion": "9. Conclusión Estructurada",
  "10_sourcing_signals": "10. Señales de Búsqueda",
};

export function DiscoverySettings() {
  const { toast } = useToast();
  const [emeritaJson, setEmeritaJson] = useState("");
  const [prompts, setPrompts] = useState<Record<string, string>>({});
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const stored = localStorage.getItem(DISCOVERY_EMERITA_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as object;
        setEmeritaJson(JSON.stringify(parsed, null, 2));
      } else {
        setEmeritaJson(JSON.stringify(DEFAULT_EMERITA_THESIS, null, 2));
      }
    } catch {
      setEmeritaJson(JSON.stringify(DEFAULT_EMERITA_THESIS, null, 2));
    }
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(DISCOVERY_PROMPTS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Record<string, string>;
        setPrompts(parsed);
      } else {
        setPrompts({});
      }
    } catch {
      setPrompts({});
    }
  }, []);

  const handleSaveManifiesto = () => {
    try {
      const parsed = JSON.parse(emeritaJson) as object;
      localStorage.setItem(DISCOVERY_EMERITA_KEY, JSON.stringify(parsed));
      toast({
        title: "Manifiesto guardado",
        description: "La tesis de Emerita se usará en los próximos análisis.",
      });
    } catch (e) {
      toast({
        title: "Error",
        description: "El JSON del Manifiesto no es válido. Revisa la sintaxis.",
        variant: "destructive",
      });
    }
  };

  const handleSavePrompts = () => {
    try {
      localStorage.setItem(DISCOVERY_PROMPTS_KEY, JSON.stringify(prompts));
      toast({
        title: "Prompts guardados",
        description: "Se usarán en la generación del informe por secciones.",
      });
    } catch (e) {
      toast({
        title: "Error",
        description: "No se pudieron guardar los prompts.",
        variant: "destructive",
      });
    }
  };

  const handleRestoreDefaultManifiesto = () => {
    setEmeritaJson(JSON.stringify(DEFAULT_EMERITA_THESIS, null, 2));
    toast({
      title: "Valores por defecto",
      description: "Manifiesto restaurado. Guarda para aplicarlo.",
    });
  };

  return (
    <div className="max-w-4xl space-y-10">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20">
          <Zap className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">
            Ajustes del Discovery Engine
          </h2>
          <p className="text-sm text-muted-foreground">
            Manifiesto Emerita y prompts por sección. Se aplican a cada nuevo análisis.
          </p>
        </div>
      </div>

      {/* Manifiesto / Tesis Emerita */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-base font-medium">Manifiesto / Tesis Emerita</Label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRestoreDefaultManifiesto}
            >
              Restaurar por defecto
            </Button>
            <Button type="button" size="sm" onClick={handleSaveManifiesto}>
              <Save className="h-4 w-4 mr-2" />
              Guardar Manifiesto
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Criterios de inversión que el analista usa siempre (geografía, tamaño, márgenes, deal killers, palancas de valor). Edita en JSON.
        </p>
        <Textarea
          value={emeritaJson}
          onChange={(e) => setEmeritaJson(e.target.value)}
          rows={18}
          className="font-mono text-sm bg-muted/30 border-border"
          placeholder='{"TARGET_GEO": "...", "TARGET_SIZE": "...", ...}'
        />
      </section>

      {/* Prompts por sección */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-base font-medium">Prompts por sección</Label>
          <Button type="button" size="sm" onClick={handleSavePrompts}>
            <Save className="h-4 w-4 mr-2" />
            Guardar todos los prompts
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Instrucciones específicas para cada bloque del informe. Si está vacío, se usa el prompt por defecto del sistema.
        </p>
        <div className="space-y-2">
          {Object.entries(REPORT_SECTIONS).map(([key, title]) => (
            <Collapsible
              key={key}
              open={openSections[key] ?? false}
              onOpenChange={(open) =>
                setOpenSections((prev) => ({ ...prev, [key]: open }))
              }
            >
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-between font-normal"
                >
                  <span>{title}</span>
                  <span className="text-muted-foreground text-xs">{key}</span>
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <Textarea
                  value={prompts[key] ?? ""}
                  onChange={(e) =>
                    setPrompts((prev) => ({ ...prev, [key]: e.target.value }))
                  }
                  rows={4}
                  className="mt-2 font-mono text-sm bg-muted/30"
                  placeholder={`Prompt opcional para: ${title}`}
                />
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      </section>
    </div>
  );
}
