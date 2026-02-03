import { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Settings,
  Zap,
  Search,
} from "lucide-react";
import { cn } from "~/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { ProjectSelector } from "./ProjectSelector";
import type { ToolType } from "./ToolSwitcher";
import { useApi, useQuery } from "~/trpc/react";

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
}

export function AppSidebar({
  collapsed,
  onToggle,
  activeProject,
  onProjectChange,
  showSettings,
  onSettingsToggle,
  activeTool,
}: AppSidebarProps) {
  const api = useApi();
  // Obtener proyectos desde el backend (API oficial tRPC v11)
  const { data: projectsData, refetch: refetchProjects } = useQuery(
    api.tool2.listProjects.queryOptions(undefined, {
      enabled: activeTool === "search",
    })
  );

  // Convertir proyectos del backend al formato esperado
  const searchProjects: Project[] =
    projectsData?.map((p) => ({
      id: p.id,
      name: p.name,
      tool: "search" as ToolType,
    })) || [];

  // Proyectos de Discovery (por ahora vacíos, se implementarán después)
  const discoveryProjects: Project[] = [];

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
    refetchProjects();
  };

  const ToolIcon = activeTool === "discovery" ? Zap : Search;
  const toolLabel = activeTool === "discovery" ? "Discovery" : "Search";

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

      {/* Logo / App Name */}
      <div className="p-3 border-b border-sidebar-border">
        <div
          className={cn(
            "flex items-center rounded-md",
            collapsed ? "justify-center p-2" : "gap-2 p-2"
          )}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-bold">
            S
          </span>
          {!collapsed && (
            <span className="font-semibold text-sidebar-primary">
              Search OS
            </span>
          )}
        </div>
      </div>

      {/* Tool Indicator (collapsed) */}
      {collapsed && (
        <div className="p-3 border-b border-sidebar-border">
          <div className="flex items-center justify-center">
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-md",
                activeTool === "discovery"
                  ? "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground"
              )}
            >
              <ToolIcon className="h-4 w-4" />
            </div>
          </div>
        </div>
      )}

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
