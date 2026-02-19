import { useState, useEffect } from "react";
import {
  Folder,
  ChevronDown,
  ChevronRight,
  Plus,
  ExternalLink,
} from "lucide-react";
import { cn } from "~/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";
import { getSearchOsAppUrl } from "~/lib/api-config";
import type { Project } from "./AppSidebar";
import type { ToolType } from "./ToolSwitcher";

interface ProjectSelectorProps {
  projects: Project[];
  activeProject: Project | null;
  onProjectChange: (project: Project | null) => void;
  onCreateProject: (project: Project) => void;
  /** Si se proporciona y la herramienta es Discovery, el botón "Nuevo análisis" llama esto en lugar de abrir el diálogo */
  onRequestNewAnalysis?: () => void;
  collapsed?: boolean;
  activeTool: ToolType;
}

export function ProjectSelector({
  projects,
  activeProject,
  onProjectChange,
  onCreateProject,
  onRequestNewAnalysis,
  collapsed = false,
  activeTool,
}: ProjectSelectorProps) {
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(
    new Set(activeProject ? [activeProject.id] : [])
  );

  // Search OS (Tool 2): solo enlace a la app Streamlit
  if (activeTool === "search") {
    const searchOsUrl = getSearchOsAppUrl();
    if (collapsed) {
      return (
        <a
          href={searchOsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center w-full p-2 rounded-md text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
          title="Abrir Search OS (Data Viewer)"
        >
          <ExternalLink className="h-4 w-4" />
        </a>
      );
    }
    return (
      <a
        href={searchOsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-sm transition-colors",
          "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        )}
      >
        <ExternalLink className="h-4 w-4 shrink-0" />
        <span>Abrir Search OS (Data Viewer)</span>
      </a>
    );
  }

  useEffect(() => {
    setExpandedProjects(
      new Set(
        activeProject && activeProject.tool === activeTool
          ? [activeProject.id]
          : []
      )
    );
  }, [activeTool]);

  const toggleProjectExpanded = (projectId: string) => {
    setExpandedProjects((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) {
        next.delete(projectId);
      } else {
        next.add(projectId);
      }
      return next;
    });
  };

  const handleProjectClick = (project: Project) => {
    onProjectChange(project);
    setExpandedProjects((prev) => new Set([...prev, project.id]));
  };

  const handleCreateClick = () => {
    if (onRequestNewAnalysis) onRequestNewAnalysis();
  };

  if (collapsed) {
    return (
      <div className="space-y-1">
        {projects.map((project) => (
          <button
            key={project.id}
            onClick={() => handleProjectClick(project)}
            className={cn(
              "flex items-center justify-center w-full p-2 rounded-md transition-colors",
              activeProject?.id === project.id
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
            title={project.name}
          >
            <Folder className="h-4 w-4" />
          </button>
        ))}
        <button
          onClick={handleCreateClick}
          className="flex items-center justify-center w-full p-2 rounded-md text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
          title="Nuevo análisis"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-1">
        {projects.map((project) => {
          const isExpanded = expandedProjects.has(project.id);
          const isActive = activeProject?.id === project.id;

          return (
            <Collapsible
              key={project.id}
              open={isExpanded}
              onOpenChange={() => toggleProjectExpanded(project.id)}
            >
              <CollapsibleTrigger asChild>
                <button
                  onClick={() => handleProjectClick(project)}
                  className={cn(
                    "flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-sm transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  {isExpanded ? (
                    <ChevronDown className="h-3 w-3 shrink-0" />
                  ) : (
                    <ChevronRight className="h-3 w-3 shrink-0" />
                  )}
                  <Folder className="h-4 w-4 shrink-0" />
                  <span className="flex-1 text-left truncate">{project.name}</span>
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pl-6 pt-1">
                {/* Aquí se pueden añadir archivos o subelementos si es necesario */}
              </CollapsibleContent>
            </Collapsible>
          );
        })}

        <button
          onClick={handleCreateClick}
          className={cn(
            "flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-sm transition-colors",
            "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          )}
        >
          <Plus className="h-4 w-4 shrink-0" />
          <span>Nuevo análisis</span>
        </button>
      </div>
    </>
  );
}
