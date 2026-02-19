import {
  FolderOpen,
  ExternalLink,
  LayoutGrid,
} from "lucide-react";
import { DiscoveryEngine, DiscoverySettings } from "./DiscoveryEngine";
import { ToolType } from "./ToolSwitcher";
import { cn } from "~/lib/utils";
import { Project } from "./AppSidebar";
import { getSearchOsAppUrl } from "~/lib/api-config";

interface MainContentProps {
  activeTool: ToolType;
  activeProject: Project | null;
  showSettings: boolean;
  /** Si true, Discovery Engine abre directamente el panel de config (nuevo análisis) */
  requestDiscoveryConfig?: boolean;
  /** Llamado cuando Discovery Engine ha abierto el panel de config */
  onClearRequestDiscoveryConfig?: () => void;
}

export function MainContent({
  activeTool,
  activeProject,
  showSettings,
  requestDiscoveryConfig = false,
  onClearRequestDiscoveryConfig,
}: MainContentProps) {
  const getBreadcrumbText = () => {
    if (showSettings) return "Ajustes";
    if (activeTool === "discovery") {
      return activeProject ? activeProject.name : "Selecciona un análisis";
    }
    return "Search OS";
  };

  if (showSettings) {
    return (
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-background">
        <header className="flex-shrink-0 border-b border-border bg-[hsl(var(--header-background))]">
          <div className="px-6 py-3">
            <nav className="flex items-center gap-2 text-sm">
              <span className="font-medium text-foreground">Ajustes</span>
            </nav>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6">
          {activeTool === "discovery" ? (
            <DiscoverySettings />
          ) : (
            <p className="text-muted-foreground">
              Search OS (Data Viewer) se gestiona en la aplicación Streamlit.
              Úsala desde el enlace del sidebar o el botón inferior.
            </p>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-background">
      <header className="flex-shrink-0 border-b border-border bg-[hsl(var(--header-background))]">
        <div className="px-6 py-3">
          <nav className="flex items-center gap-2 text-sm">
            <span
              className={cn(
                "font-medium",
                activeProject && activeTool === "discovery"
                  ? "text-foreground"
                  : "text-muted-foreground"
              )}
            >
              {getBreadcrumbText()}
            </span>
          </nav>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-6 bg-background">
        {activeTool === "search" ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-8">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 mb-6">
              <LayoutGrid className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-2xl font-semibold text-foreground mb-2">
              Search OS (Data Viewer)
            </h1>
            <p className="text-muted-foreground max-w-lg mb-2">
              Excel inteligente con cerebros intercambiables: ingesta de listados
              SABI (CSV/Excel), enriquecimiento con IA (scoring, columnas
              inteligentes) y gestión tipo CRM (etiquetas, listas, Data Chat).
            </p>
            <p className="text-sm text-muted-foreground max-w-lg mb-8">
              La herramienta corre en Streamlit según el plan original. Ábrela
              en una nueva pestaña para crear proyectos, subir archivos y usar
              AgGrid con columnas IA.
            </p>
            <a
              href={getSearchOsAppUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              Abrir Data Viewer (Streamlit)
            </a>
            <p className="text-xs text-muted-foreground mt-6">
              Por defecto: <code className="bg-muted px-1 rounded">http://localhost:8501</code>
              {" "}
              — Ejecuta <code className="bg-muted px-1 rounded">streamlit run src/main.py</code> desde la carpeta{" "}
              <code className="bg-muted px-1 rounded">search-os</code>.
            </p>
          </div>
        ) : (
          <DiscoveryEngine
            openAnalysisId={activeProject?.id ?? null}
            requestDiscoveryConfig={requestDiscoveryConfig}
            onClearRequestDiscoveryConfig={onClearRequestDiscoveryConfig}
          />
        )}
      </main>
    </div>
  );
}
