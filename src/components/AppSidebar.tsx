import { useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, Settings } from "lucide-react";
import { cn } from "~/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { ProjectSelector } from "./ProjectSelector";
import { ToolSwitcher } from "./ToolSwitcher";
import type { ToolType } from "./ToolSwitcher";
import { useApi } from "~/trpc/react";
import {
  getAnalyses,
  DISCOVERY_ANALYSES_CHANGED,
} from "~/components/DiscoveryEngine/discoveryStorage";

export interface Project {
  id: string;
  name: string;
  emoji?: string;
  icon?: string;
  tool: ToolType;
}

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  activeProject: Project | null;
  onProjectChange: (project: Project | null) => void;
  showSettings: boolean;
  onSettingsToggle: (show: boolean) => void;
  activeTool: ToolType;
  onToolChange: (tool: ToolType) => void;
  /** Llamado cuando el usuario pide "Nuevo análisis" en Discovery (no se usa API de proyectos) */
  onRequestNewDiscoveryAnalysis?: () => void;
}

export function AppSidebar({
  collapsed,
  onToggle,
  activeProject,
  onProjectChange,
  showSettings,
  onSettingsToggle,
  activeTool,
  onToolChange,
  onRequestNewDiscoveryAnalysis,
}: AppSidebarProps) {
  const api = useApi();
  const [discoveryRefresh, setDiscoveryRefresh] = useState(0);

  // Refrescar lista de análisis Discovery cuando se guarda uno (evento desde DiscoveryEngine)
  useEffect(() => {
    const handler = () => setDiscoveryRefresh((r) => r + 1);
    window.addEventListener(DISCOVERY_ANALYSES_CHANGED, handler);
    return () => window.removeEventListener(DISCOVERY_ANALYSES_CHANGED, handler);
  }, []);

  // Search OS (Tool 2) se usa vía la app Streamlit; no hay lista de proyectos en React
  const searchProjects: Project[] = [];

  // Análisis guardados de Discovery (localStorage), convertidos a formato Project
  const discoveryProjects: Project[] = useMemo(() => {
    if (activeTool !== "discovery") return [];
    return getAnalyses().map((a) => ({
      id: a.id,
      name: a.sectorName,
      tool: "discovery" as ToolType,
    }));
  }, [activeTool, discoveryRefresh]);

  // Obtener proyectos para la herramienta activa
  const currentProjects = activeTool === "search" ? searchProjects : discoveryProjects;

  // Cuando cambia la herramienta, actualizar proyecto activo si no pertenece a la nueva herramienta
  useEffect(() => {
    if (activeProject && activeProject.tool !== activeTool) {
      const firstProject = currentProjects[0] || null;
      onProjectChange(firstProject);
    }
  }, [activeTool]);

  const handleCreateProject = (newProject: Project) => {
    onProjectChange(newProject);
  };

  return (
    <aside
      className={cn(
        "relative flex flex-col h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-in-out",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-6 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-background shadow-sm hover:bg-accent transition-colors"
      >
        {collapsed ? (
          <ChevronRight className="h-3 w-3 text-muted-foreground" />
        ) : (
          <ChevronLeft className="h-3 w-3 text-muted-foreground" />
        )}
      </button>

      {/* Selector de herramienta (Discovery Engine / Search OS) */}
      <div className="p-3 border-b border-sidebar-border">
        <ToolSwitcher
          activeTool={activeTool}
          onToolChange={onToolChange}
          compact={collapsed}
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-3 overflow-y-auto">
        {/* Project Selector */}
        <ProjectSelector
          projects={currentProjects}
          activeProject={activeProject}
          onProjectChange={(project) => {
            onProjectChange(project);
            onSettingsToggle(false);
          }}
          onCreateProject={handleCreateProject}
          onRequestNewAnalysis={onRequestNewDiscoveryAnalysis}
          collapsed={collapsed}
          activeTool={activeTool}
        />

        {/* Separator */}
        <div className="h-px bg-sidebar-border" />

        {/* Settings Nav Item */}
        <button
          onClick={() => onSettingsToggle(!showSettings)}
          className={cn(
            "flex items-center rounded-md w-full transition-colors",
            showSettings
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            collapsed ? "justify-center p-2" : "gap-3 px-3 py-2"
          )}
        >
          <Settings className="h-4 w-4 shrink-0" />
          {!collapsed && (
            <span className="text-sm font-medium">Ajustes</span>
          )}
        </button>
      </nav>

      {/* User Profile */}
      <div className="p-3 border-t border-sidebar-border">
        <div
          className={cn(
            "flex items-center rounded-md hover:bg-sidebar-accent transition-colors cursor-pointer",
            collapsed ? "justify-center p-2" : "gap-3 p-2"
          )}
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src="" />
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              U
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-primary truncate">
                Usuario
              </p>
              <p className="text-xs text-sidebar-foreground truncate">
                usuario@example.com
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
