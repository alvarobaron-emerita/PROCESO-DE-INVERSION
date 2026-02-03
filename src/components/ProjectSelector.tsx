import { useState, useEffect } from "react";
import {
  Folder,
  ChevronDown,
  ChevronRight,
  Plus,
} from "lucide-react";
import { cn } from "~/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { useApi, useMutation } from "~/trpc/react";
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
  const api = useApi();
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(
    new Set(activeProject ? [activeProject.id] : [])
  );
  const [newProjectDialogOpen, setNewProjectDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");

  const createProjectMutation = useMutation(
    api.tool2.createProject.mutationOptions({
      onSuccess: (newProject) => {
        const project: Project = {
          id: newProject.id,
          name: newProject.name,
          tool: activeTool,
        };
        onCreateProject(project);
        setNewProjectDialogOpen(false);
        setNewProjectName("");
      },
    })
  );

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

  const handleCreateProject = () => {
    if (!newProjectName.trim()) return;
    createProjectMutation.mutate({ name: newProjectName.trim() });
  };

  const handleCreateClick = () => {
    if (activeTool === "discovery" && onRequestNewAnalysis) {
      onRequestNewAnalysis();
      return;
    }
    setNewProjectDialogOpen(true);
  };

  const createButtonLabel =
    activeTool === "discovery" ? "Nuevo análisis" : "Nuevo proyecto";

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
          title={createButtonLabel}
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
          <span>{createButtonLabel}</span>
        </button>
      </div>

      {/* Dialog para crear nuevo proyecto */}
      <Dialog open={newProjectDialogOpen} onOpenChange={setNewProjectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear nuevo proyecto</DialogTitle>
            <DialogDescription>
              Crea un nuevo proyecto para gestionar tus datos.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="project-name">Nombre del proyecto</Label>
              <Input
                id="project-name"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="Ej: Vitivinícola 2025"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleCreateProject();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setNewProjectDialogOpen(false);
                setNewProjectName("");
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateProject}
              disabled={!newProjectName.trim() || createProjectMutation.isPending}
            >
              {createProjectMutation.isPending ? "Creando..." : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
