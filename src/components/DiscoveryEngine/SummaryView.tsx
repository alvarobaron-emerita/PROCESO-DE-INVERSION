import { Zap, Plus, FileText } from "lucide-react";
import { Button } from "~/components/ui/button";
import { ScrollArea } from "~/components/ui/scroll-area";
import type { SavedAnalysis } from "./types";
import { cn } from "~/lib/utils";

interface SummaryViewProps {
  analyses: SavedAnalysis[];
  onSelectAnalysis: (id: string) => void;
  onNewAnalysis: () => void;
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function SummaryView({
  analyses,
  onSelectAnalysis,
  onNewAnalysis,
}: SummaryViewProps) {
  return (
    <div className="flex flex-col h-full p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20">
          <Zap className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Mis análisis
          </h2>
          <p className="text-sm text-muted-foreground">
            Sectores que ya has analizado. Haz clic para volver a ver el informe.
          </p>
        </div>
      </div>

      <Button
        onClick={onNewAnalysis}
        className="w-full h-12 text-base font-semibold mb-4"
        size="lg"
      >
        <Plus className="h-5 w-5 mr-2" />
        Nuevo análisis
      </Button>

      {analyses.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 text-center py-8 px-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted mb-4">
            <FileText className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground mb-1">
            Aún no hay análisis guardados
          </p>
          <p className="text-sm text-muted-foreground max-w-xs">
            Ejecuta tu primer análisis con el botón de arriba. Aquí aparecerán todos los sectores que analices.
          </p>
        </div>
      ) : (
        <ScrollArea className="flex-1 -mx-2 px-2">
          <ul className="space-y-1">
            {analyses.map((a) => (
              <li key={a.id}>
                <button
                  type="button"
                  onClick={() => onSelectAnalysis(a.id)}
                  className={cn(
                    "w-full text-left rounded-lg border border-border/50 bg-background/50",
                    "px-4 py-3 hover:bg-accent/50 hover:border-accent transition-colors"
                  )}
                >
                  <p className="font-medium text-foreground truncate">
                    {a.sectorName}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDate(a.createdAt)}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        </ScrollArea>
      )}
    </div>
  );
}
