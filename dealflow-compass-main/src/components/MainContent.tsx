import { useState } from "react";
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
  LucideIcon
} from "lucide-react";
import { DataGrid } from "./DataGrid/index";
import { DiscoveryEngine } from "./DiscoveryEngine/index";
import { ToolSwitcher, ToolType } from "./ToolSwitcher";
import { NewViewDialog } from "./DataGrid/NewViewDialog";
import { CustomView, ViewConfig, defaultViews } from "./DataGrid/viewTypes";
import { SettingsView } from "./Settings/SettingsView";
import { cn } from "@/lib/utils";
import { Project } from "./ProjectSelector";
import { useToast } from "@/hooks/use-toast";

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

export function MainContent({ activeTool, onToolChange, activeProject, showSettings }: MainContentProps) {
  const { toast } = useToast();
  const [views, setViews] = useState<CustomView[]>(defaultViews);
  const [activeViewId, setActiveViewId] = useState<string>("longlist");
  const [newViewDialogOpen, setNewViewDialogOpen] = useState(false);

  const activeView = views.find((v) => v.id === activeViewId) || views[0];

  const handleCreateView = (config: ViewConfig) => {
    const newView: CustomView = {
      id: `custom_${Date.now()}`,
      name: config.name,
      icon: config.icon,
      visibleColumns: config.visibleColumns,
      rowIds: new Set(),
      isCustom: true,
    };

    setViews((prev) => [...prev, newView]);
    setActiveViewId(newView.id);

    toast({
      title: "Vista creada",
      description: `La vista "${config.name}" se ha creado correctamente.`,
    });
  };

  const handleDeleteView = (viewId: string) => {
    if (viewId === "all") return;
    
    const viewToDelete = views.find((v) => v.id === viewId);
    if (!viewToDelete) return;

    setViews((prev) => prev.filter((v) => v.id !== viewId));
    
    if (activeViewId === viewId) {
      setActiveViewId(views[0].id);
    }

    toast({
      title: "Vista eliminada",
      description: `La vista "${viewToDelete.name}" se ha eliminado.`,
    });
  };

  const handleMoveRows = (rowIds: number[], targetViewId: string) => {
    const targetView = views.find((v) => v.id === targetViewId);
    if (!targetView) return;

    setViews((prev) =>
      prev.map((view) => {
        if (view.id === targetViewId) {
          const newRowIds = new Set(view.rowIds);
          rowIds.forEach((id) => newRowIds.add(id));
          return { ...view, rowIds: newRowIds };
        }
        if (view.id === activeViewId && view.isCustom) {
          const newRowIds = new Set(view.rowIds);
          rowIds.forEach((id) => newRowIds.delete(id));
          return { ...view, rowIds: newRowIds };
        }
        return view;
      })
    );

    toast({
      title: "Filas movidas",
      description: `${rowIds.length} ${rowIds.length === 1 ? "fila movida" : "filas movidas"} a "${targetView.name}".`,
    });
  };

  const handleCopyRows = (rowIds: number[], targetViewId: string) => {
    const targetView = views.find((v) => v.id === targetViewId);
    if (!targetView) return;

    setViews((prev) =>
      prev.map((view) => {
        if (view.id === targetViewId) {
          const newRowIds = new Set(view.rowIds);
          rowIds.forEach((id) => newRowIds.add(id));
          return { ...view, rowIds: newRowIds };
        }
        return view;
      })
    );

    toast({
      title: "Filas copiadas",
      description: `${rowIds.length} ${rowIds.length === 1 ? "fila copiada" : "filas copiadas"} a "${targetView.name}".`,
    });
  };

  // Get breadcrumb text based on context
  const getBreadcrumbText = () => {
    if (showSettings) {
      return "Ajustes";
    }
    if (!activeProject) {
      return activeTool === "discovery" ? "Selecciona un análisis" : "Selecciona un proyecto";
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
          <SettingsView activeTool={activeTool} />
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
            <span className={cn(
              "font-medium",
              activeProject ? "text-foreground" : "text-muted-foreground"
            )}>
              {getBreadcrumbText()}
            </span>
          </nav>
        </div>

        {/* View Tabs - Only show for Search OS with active project */}
        {activeTool === "search" && activeProject && (
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
                      {view.isCustom && view.rowIds.size > 0 && (
                        <span
                          className={cn(
                            "px-1.5 py-0.5 text-xs rounded-md",
                            isActive
                              ? "bg-primary/10 text-foreground"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {view.rowIds.size}
                        </span>
                      )}
                    </button>
                    
                    {view.id !== "all" && (
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

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto p-6">
        {activeTool === "search" ? (
          activeProject ? (
            <DataGrid
              activeView={activeView}
              views={views}
              onMoveRows={handleMoveRows}
              onCopyRows={handleCopyRows}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center px-8">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-6">
                <FolderOpen className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold text-foreground mb-3">
                Selecciona un proyecto
              </h2>
              <p className="text-muted-foreground max-w-md">
                Elige un proyecto del sidebar para ver y gestionar los datos de empresas.
                También puedes crear un nuevo proyecto desde el menú lateral.
              </p>
            </div>
          )
        ) : (
          <DiscoveryEngine />
        )}
      </main>

      {/* New View Dialog */}
      <NewViewDialog
        open={newViewDialogOpen}
        onOpenChange={setNewViewDialogOpen}
        onCreateView={handleCreateView}
      />
    </div>
  );
}
