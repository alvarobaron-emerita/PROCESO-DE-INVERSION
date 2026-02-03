import { useState, useEffect, useMemo } from "react";
import { Zap, Save, Plus, Trash2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";
import { useToast } from "~/hooks/use-toast";
import {
  thesisToManifestoText,
  manifestoTextToThesis,
  type EmeritaThesisObject,
} from "./manifestoTextUtils";

const DISCOVERY_EMERITA_KEY = "discovery_emerita_thesis";
const DISCOVERY_PROMPTS_KEY = "discovery_custom_prompts";
const DISCOVERY_SECTION_TITLES_KEY = "discovery_section_titles";
const DISCOVERY_SECTIONS_KEY = "discovery_sections";

export interface SectionItem {
  key: string;
  title: string;
  prompt: string;
}

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

/** Prompts por defecto (hardcodeados en el backend). Se muestran en la UI y se envían al LLM si no hay custom. */
export const DEFAULT_SECTION_PROMPTS: Record<string, string> = {
  "1_executive_summary": `- Conclusión directa.
- **VEREDICTO:** [VERDE / ÁMBAR / ROJO]. Justifica el color basándote en márgenes y fragmentación.
- Si el margen es <15%, el semáforo DEBE ser ROJO o ÁMBAR.`,
  "2_financials": `- ¿Cómo gana dinero una empresa aquí? Desglose de costes típicos.
- Márgenes medios observados (Bruto y EBITDA).
- Ciclo de caja (¿Quién financia a quién?).`,
  "3_market_size": `- Estimación TAM/SAM en España. Tendencia (CAGR).
- Segmentos más atractivos para un Search Fund.`,
  "4_value_chain": `- Diagrama textual (Proveedor → Fabricante → Distribuidor → Cliente).
- ¿Quién tiene la sartén por el mango (poder de negociación)?`,
  "5_competition": `- Grado de concentración.
- Menciona nombres de competidores reales encontrados en el contexto.
- Busca el "Arquetipo Ideal": Empresa familiar, 20+ años historia, dueños ≥60 años.`,
  "6_regulations": `- Barreras de entrada reales. Normativas críticas (ej. ISOs, Marcado CE).
- Deal Killers del Manifiesto Emerita.`,
  "7_opportunities": `- ¿Dónde está la ineficiencia? (Ej. Procesos en papel, sin equipo comercial).
- Palancas de valor disponibles del Manifiesto.
- ¿Cómo puede Emerita multiplicar el EBITDA?`,
  "8_gtm_targets": `- Perfil ideal de empresa target.
- Criterios de búsqueda específicos.`,
  "9_conclusion": `- Síntesis ejecutiva de hallazgos clave.
- Recomendación final.`,
  "10_sourcing_signals": `- Qué buscar en Google/LinkedIn para encontrar al target (señales).`,
};

function buildDefaultSections(): SectionItem[] {
  return Object.entries(REPORT_SECTIONS).map(([key, title]) => ({
    key,
    title,
    prompt: DEFAULT_SECTION_PROMPTS[key] ?? "",
  }));
}

export function DiscoverySettings() {
  const { toast } = useToast();
  const [emeritaText, setEmeritaText] = useState("");
  const [sections, setSections] = useState<SectionItem[]>(() => buildDefaultSections());
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const defaultSections = useMemo(() => buildDefaultSections(), []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(DISCOVERY_EMERITA_KEY);
      const obj = stored
        ? (JSON.parse(stored) as EmeritaThesisObject)
        : DEFAULT_EMERITA_THESIS;
      setEmeritaText(thesisToManifestoText(obj));
    } catch {
      setEmeritaText(thesisToManifestoText(DEFAULT_EMERITA_THESIS));
    }
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(DISCOVERY_SECTIONS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as SectionItem[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSections(parsed);
          return;
        }
      }
    } catch {
      /* ignore */
    }
    // Si no hay discovery_sections, construir desde prompts/títulos guardados (compat)
    try {
      const promptsStored = localStorage.getItem(DISCOVERY_PROMPTS_KEY);
      const titlesStored = localStorage.getItem(DISCOVERY_SECTION_TITLES_KEY);
      const prompts = promptsStored ? (JSON.parse(promptsStored) as Record<string, string>) : {};
      const titles = titlesStored ? (JSON.parse(titlesStored) as Record<string, string>) : {};
      setSections(
        defaultSections.map((s) => ({
          key: s.key,
          title: titles[s.key] || s.title,
          prompt: prompts[s.key] ?? s.prompt,
        }))
      );
    } catch {
      setSections(buildDefaultSections());
    }
  }, [defaultSections]);

  const handleSaveManifiesto = () => {
    try {
      const thesis = manifestoTextToThesis(emeritaText);
      localStorage.setItem(DISCOVERY_EMERITA_KEY, JSON.stringify(thesis));
      toast({
        title: "Manifiesto guardado",
        description: "La tesis de Emerita se usará en los próximos análisis.",
      });
    } catch (e) {
      toast({
        title: "Error",
        description: "Revisa el formato del texto (claves y listas con «- »).",
        variant: "destructive",
      });
    }
  };

  const handleSavePrompts = () => {
    try {
      localStorage.setItem(DISCOVERY_SECTIONS_KEY, JSON.stringify(sections));
      // Mantener compat con claves antiguas por si algo las lee
      const prompts: Record<string, string> = {};
      const sectionTitles: Record<string, string> = {};
      sections.forEach((s) => {
        prompts[s.key] = s.prompt;
        sectionTitles[s.key] = s.title;
      });
      localStorage.setItem(DISCOVERY_PROMPTS_KEY, JSON.stringify(prompts));
      localStorage.setItem(DISCOVERY_SECTION_TITLES_KEY, JSON.stringify(sectionTitles));
      toast({
        title: "Secciones guardadas",
        description: "Se usarán en la generación del informe. Puedes añadir o eliminar secciones.",
      });
    } catch (e) {
      toast({
        title: "Error",
        description: "No se pudieron guardar las secciones.",
        variant: "destructive",
      });
    }
  };

  const handleAddSection = () => {
    setSections((prev) => [
      ...prev,
      { key: `custom_${Date.now()}`, title: "Nueva sección", prompt: "" },
    ]);
    toast({ title: "Sección añadida", description: "Edita título y prompt y guarda." });
  };

  const handleRemoveSection = (index: number) => {
    setSections((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRestoreDefaultManifiesto = () => {
    setEmeritaText(thesisToManifestoText(DEFAULT_EMERITA_THESIS));
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
          Criterios de inversión que el analista usa siempre. Escribe o pega texto: una línea por criterio
          (CLAVE: valor). Para listas (DEAL_KILLERS, VALUE_LEVERS) escribe el nombre y debajo líneas que empiecen por «- ».
        </p>
        <Textarea
          value={emeritaText}
          onChange={(e) => setEmeritaText(e.target.value)}
          rows={18}
          className="font-mono text-sm bg-muted/30 border-border"
          placeholder={`TARGET_GEO: España (prioritario)...\nTARGET_SIZE: Ventas 5-40M€...\nDEAL_KILLERS:\n- Riesgo tecnológico alto\n- ...`}
        />
      </section>

      {/* Secciones del informe: añadir, eliminar, editar título y prompt */}
      <section className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <Label className="text-base font-medium">Secciones del informe</Label>
          <div className="flex gap-2">
            <Button type="button" size="sm" variant="outline" onClick={handleAddSection}>
              <Plus className="h-4 w-4 mr-2" />
              Añadir sección
            </Button>
            <Button type="button" size="sm" onClick={handleSavePrompts}>
              <Save className="h-4 w-4 mr-2" />
              Guardar todo
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Añade, elimina o edita secciones. Cada una tiene título e instrucciones para el LLM. Guarda para aplicar en el próximo análisis.
        </p>
        <div className="space-y-2">
          {sections.map((sec, index) => (
            <Collapsible
              key={sec.key}
              open={openSections[sec.key] ?? false}
              onOpenChange={(open) =>
                setOpenSections((prev) => ({ ...prev, [sec.key]: open }))
              }
            >
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-between font-normal"
                >
                  <span>{sec.title || sec.key}</span>
                  <span className="text-muted-foreground text-xs">{sec.key}</span>
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 pt-2">
                <div className="flex items-center justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveSection(index);
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Eliminar sección
                  </Button>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Título de la sección</Label>
                  <Input
                    value={sec.title}
                    onChange={(e) =>
                      setSections((prev) =>
                        prev.map((s, i) =>
                          i === index ? { ...s, title: e.target.value } : s
                        )
                      )
                    }
                    placeholder="Ej: 1. Resumen Ejecutivo"
                    className="font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Instrucciones para el contenido</Label>
                  <Textarea
                    value={sec.prompt}
                    onChange={(e) =>
                      setSections((prev) =>
                        prev.map((s, i) =>
                          i === index ? { ...s, prompt: e.target.value } : s
                        )
                      )
                    }
                    rows={5}
                    className="font-mono text-sm bg-muted/30"
                    placeholder="Instrucciones para esta sección..."
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      </section>
    </div>
  );
}
