import { useState, useEffect } from "react";
import {
  Plus,
  X,
  LayoutGrid,
  Inbox,
  Star,
  Trash2,
  Eye,
  Table,
  List,
  Filter,
  Target,
  Bookmark,
  Flag,
  Heart,
  Zap,
  TrendingUp,
  BarChart3,
  Users,
  Building2,
  FolderOpen,
  FileText,
  LucideIcon,
} from "lucide-react";
import { DataGrid } from "./DataGrid";
import { DiscoveryEngine, DiscoverySettings } from "./DiscoveryEngine";
import { ToolSwitcher, ToolType } from "./ToolSwitcher";
import { NewViewDialog } from "./DataGrid/NewViewDialog";
import { ViewInfo } from "./DataGrid/types";
import { FileUpload } from "./FileUpload";
import { cn } from "~/lib/utils";
import { Project } from "./AppSidebar";
import { useApi, useQuery, useMutation } from "~/trpc/react";

// Icon mapping for dynamic icon rendering
const iconComponents: Record<string, LucideIcon> = {
  LayoutGrid,
  Inbox,
  Star,
  Trash2,
  Eye,
  Table,
  List,
  Filter,
  Target,
  Bookmark,
  Flag,
  Heart,
  Zap,
  TrendingUp,
  BarChart3,
  Users,
  Building2,
  FolderOpen,
  FileText,
};

interface MainContentProps {
  activeTool: ToolType;
  onToolChange: (tool: ToolType) => void;
  activeProject: Project | null;
  showSettings: boolean;
}

export function MainContent({
  activeTool,
  onToolChange,
  activeProject,
  showSettings,
}: MainContentProps) {
  const api = useApi();
  const [activeViewId, setActiveViewId] = useState<string | null>(null);
  const [newViewDialogOpen, setNewViewDialogOpen] = useState(false);

  // Obtener vistas del proyecto activo (API oficial tRPC v11)
  const { data: viewsData, refetch: refetchViews } = useQuery(
    api.tool2.listViews.queryOptions(
      { projectId: activeProject?.id || "" },
      { enabled: !!activeProject && activeTool === "search" }
    )
  );

  // Obtener columnas disponibles del proyecto
  const { data: columnsData } = useQuery(
    api.tool2.listColumns.queryOptions(
      { projectId: activeProject?.id || "" },
      { enabled: !!activeProject && activeTool === "search" }
    )
  );

  const views: ViewInfo[] =
    viewsData?.map((v) => ({
      id: v.id,
      name: v.name,
      icon: v.icon,
      type: v.type as "system" | "custom",
      visibleColumns: v.visibleColumns || [],
      rowCount: v.rowCount || 0,
    })) || [];

  const availableColumns =
    columnsData?.columns?.filter(
      (col) => col !== "_uid" && col !== "_list_id"
    ) || [];

  // Establecer vista activa por defecto
  useEffect(() => {
    if (views.length > 0 && !activeViewId) {
      setActiveViewId(views[0].id);
    }
  }, [views, activeViewId]);

  const activeView = views.find((v) => v.id === activeViewId) || views[0];

  // Verificar si el proyecto está vacío (no hay vistas o todas tienen 0 filas)
  const isProjectEmpty = views.length === 0 || views.every((v) => (v.rowCount || 0) === 0);

  const createViewMutation = useMutation(
    api.tool2.createView.mutationOptions({
      onSuccess: (newView) => {
        refetchViews();
        setActiveViewId(newView.id);
        setNewViewDialogOpen(false);
      },
    })
  );

  const deleteViewMutation = useMutation(
    api.tool2.deleteView.mutationOptions({
      onSuccess: () => {
        refetchViews();
        if (activeViewId && views.length > 1) {
          const remainingViews = views.filter((v) => v.id !== activeViewId);
          setActiveViewId(remainingViews[0]?.id || null);
        }
      },
    })
  );

  const handleCreateView = (config: {
    name: string;
    icon: string;
    visibleColumns: string[];
  }) => {
    if (!activeProject) return;
    createViewMutation.mutate({
      projectId: activeProject.id,
      name: config.name,
      icon: config.icon,
      visibleColumns: config.visibleColumns,
    });
  };

  const handleDeleteView = (viewId: string) => {
    if (!activeProject) return;
    if (viewId === "all" || views.find((v) => v.id === viewId)?.type === "system") {
      return; // No se pueden eliminar vistas del sistema
    }
    deleteViewMutation.mutate({
      projectId: activeProject.id,
      viewId,
    });
  };

  const handleMoveRows = (rowUids: string[], targetViewId: string) => {
    // DataGrid maneja la mutación internamente, solo refrescamos vistas
    refetchViews();
  };

  const handleCopyRows = (rowUids: string[], targetViewId: string) => {
    // DataGrid maneja la mutación internamente, solo refrescamos vistas
    refetchViews();
  };

  // Get breadcrumb text based on context
  const getBreadcrumbText = () => {
    if (showSettings) {
      return "Ajustes";
    }
    if (!activeProject) {
      return activeTool === "discovery"
        ? "Selecciona un análisis"
        : "Selecciona un proyecto";
    }
    return activeProject.name;
  };

  // If settings is shown, render settings view
  if (showSettings) {
    return (
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-background">
        {/* Top Header */}
        <header className="flex-shrink-0 border-b border-border bg-[hsl(var(--header-background))]">
          <div className="px-6 py-3">
            <nav className="flex items-center gap-2 text-sm">
              <ToolSwitcher activeTool={activeTool} onToolChange={onToolChange} />
              <span className="text-muted-foreground">/</span>
              <span className="font-medium text-foreground">Ajustes</span>
            </nav>
          </div>
        </header>

        {/* Settings Content */}
        <main className="flex-1 overflow-auto p-6">
          {activeTool === "discovery" ? (
            <DiscoverySettings />
          ) : (
            <p className="text-muted-foreground">
              Configuración de Search OS (por implementar)
            </p>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-background">
      {/* Top Header with Tool Switcher and Breadcrumbs */}
      <header className="flex-shrink-0 border-b border-border bg-[hsl(var(--header-background))]">
        <div className="px-6 py-3">
          {/* Breadcrumbs with Tool Switcher */}
          <nav className="flex items-center gap-2 text-sm">
            <ToolSwitcher activeTool={activeTool} onToolChange={onToolChange} />
            <span className="text-muted-foreground">/</span>
            <span
              className={cn(
                "font-medium",
                activeProject ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {getBreadcrumbText()}
            </span>
          </nav>
        </div>

        {/* View Tabs - Only show for Search OS with active project */}
        {activeTool === "search" && activeProject && views.length > 0 && (
          <div className="px-6 pb-3">
            <div className="flex items-center gap-1 overflow-x-auto">
              {views.map((view) => {
                const Icon = view.icon ? iconComponents[view.icon] : undefined;
                const isActive = activeViewId === view.id;

                return (
                  <div key={view.id} className="relative group flex items-center">
                    <button
                      onClick={() => setActiveViewId(view.id)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap",
                        isActive
                          ? "bg-accent text-accent-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      )}
                    >
                      {Icon && <Icon className="h-4 w-4" />}
                      <span>{view.name}</span>
                      {view.type === "custom" && view.rowCount > 0 && (
                        <span
                          className={cn(
                            "px-1.5 py-0.5 text-xs rounded-md",
                            isActive
                              ? "bg-primary/10 text-foreground"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {view.rowCount}
                        </span>
                      )}
                    </button>

                    {view.id !== "all" && view.type === "custom" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteView(view.id);
                        }}
                        className="ml-0.5 p-1 rounded-md opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                        title="Eliminar vista"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                );
              })}

              <button
                onClick={() => setNewViewDialogOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
              >
                <Plus className="h-4 w-4" />
                Nueva Vista
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area - fondo claro tipo segunda imagen */}
      <main className="flex-1 overflow-auto p-6 bg-background">
        {activeTool === "search" ? (
          activeProject ? (
            isProjectEmpty ? (
              <FileUpload
                projectId={activeProject.id}
                onUploadSuccess={() => {
                  refetchViews();
                }}
              />
            ) : activeView ? (
              <DataGrid
                projectId={activeProject.id}
                activeView={activeView}
                views={views}
                onMoveRows={handleMoveRows}
                onCopyRows={handleCopyRows}
              />
            ) : null
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center px-8">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-6">
                <FolderOpen className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold text-foreground mb-3">
                Selecciona un proyecto
              </h2>
              <p className="text-muted-foreground max-w-md">
                Elige un proyecto del sidebar para ver y gestionar los datos de
                empresas. También puedes crear un nuevo proyecto desde el menú
                lateral.
              </p>
            </div>
          )
        ) : (
          <DiscoveryEngine />
        )}
      </main>

      {/* New View Dialog */}
      {activeProject && (
        <NewViewDialog
          open={newViewDialogOpen}
          onOpenChange={setNewViewDialogOpen}
          onCreateView={handleCreateView}
          availableColumns={availableColumns}
        />
      )}
    </div>
  );
}
