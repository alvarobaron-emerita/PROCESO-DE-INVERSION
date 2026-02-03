import { useState, useRef, useEffect } from "react";
import { 
  Folder, 
  ChevronDown, 
  ChevronRight, 
  Files, 
  Upload, 
  RefreshCw,
  Plus,
  Zap,
  Search
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { FileItemComponent } from "@/components/FileExplorer/FileItem";
import { toast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { NewProjectDialog, NewProjectConfig } from "@/components/NewProjectDialog";
import type { FileItem } from "@/components/FileExplorer/types";
import type { ToolType } from "@/components/ToolSwitcher";

export interface Project {
  id: string;
  name: string;
  emoji: string;
  icon?: string;
  tool: ToolType; // Which tool this project belongs to
}

interface ProjectFilesMap {
  [projectId: string]: FileItem[];
}

// Initial projects separated by tool
const initialSearchProjects: Project[] = [
  { id: "search-1", name: "Vitivinícola 2025", emoji: "🍷", tool: "search" },
  { id: "search-2", name: "Logística Frío", emoji: "🧊", tool: "search" },
];

const initialDiscoveryProjects: Project[] = [
  { id: "discovery-1", name: "Análisis Alimentación", emoji: "🥗", tool: "discovery" },
  { id: "discovery-2", name: "Sector Energético", emoji: "⚡", tool: "discovery" },
];

// Initial files per project
const initialProjectFiles: ProjectFilesMap = {
  "search-1": [
    { id: "1-1", name: "empresas_2024.csv", extension: "csv" },
    { id: "1-2", name: "reporte_q4.xlsx", extension: "xlsx" },
    { id: "1-3", name: "contrato_base.pdf", extension: "pdf" },
    { id: "1-4", name: "notas.docx", extension: "docx" },
  ],
  "search-2": [
    { id: "2-1", name: "rutas_2024.xlsx", extension: "xlsx" },
    { id: "2-2", name: "inventario.csv", extension: "csv" },
    { id: "2-3", name: "manual_operaciones.pdf", extension: "pdf" },
  ],
  "discovery-1": [
    { id: "d1-1", name: "informe_sector.md", extension: "md" },
    { id: "d1-2", name: "analisis_competencia.pdf", extension: "pdf" },
  ],
  "discovery-2": [
    { id: "d2-1", name: "tesis_inversion.md", extension: "md" },
  ],
};

interface ProjectSelectorProps {
  projects: Project[];
  activeProject: Project | null;
  onProjectChange: (project: Project | null) => void;
  onCreateProject: (project: Project, initialFile?: File) => void;
  collapsed?: boolean;
  activeTool: ToolType;
}

export function ProjectSelector({
  projects,
  activeProject,
  onProjectChange,
  onCreateProject,
  collapsed = false,
  activeTool,
}: ProjectSelectorProps) {
  // Filter projects by active tool
  const toolProjects = projects.filter(p => p.tool === activeTool);
  
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(
    new Set(activeProject ? [activeProject.id] : [])
  );
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(
    new Set(activeProject ? [activeProject.id] : [])
  );
  const [projectFiles, setProjectFiles] = useState<ProjectFilesMap>(initialProjectFiles);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ file: FileItem; projectId: string } | null>(null);
  const [newProjectDialogOpen, setNewProjectDialogOpen] = useState(false);
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  // Reset expanded state when tool changes
  useEffect(() => {
    setExpandedProjects(new Set(activeProject && activeProject.tool === activeTool ? [activeProject.id] : []));
    setExpandedFiles(new Set(activeProject && activeProject.tool === activeTool ? [activeProject.id] : []));
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

  const toggleFilesExpanded = (projectId: string) => {
    setExpandedFiles((prev) => {
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
    setExpandedFiles((prev) => new Set([...prev, project.id]));
  };

  const handleUploadClick = (projectId: string) => {
    fileInputRefs.current[projectId]?.click();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, projectId: string) => {
    const uploadedFiles = event.target.files;
    if (!uploadedFiles) return;

    const newFiles: FileItem[] = Array.from(uploadedFiles).map((file, index) => {
      const extension = file.name.split('.').pop() || '';
      return {
        id: `${projectId}-uploaded-${Date.now()}-${index}`,
        name: file.name,
        extension,
      };
    });

    setProjectFiles((prev) => ({
      ...prev,
      [projectId]: [...(prev[projectId] || []), ...newFiles],
    }));

    toast({
      title: "Archivos subidos",
      description: `Se han añadido ${newFiles.length} archivo(s)`,
    });

    if (fileInputRefs.current[projectId]) {
      fileInputRefs.current[projectId]!.value = '';
    }
  };

  const handleRefresh = (projectId: string) => {
    toast({
      title: "Lista actualizada",
      description: "Los archivos han sido refrescados",
    });
  };

  const handleSelectFile = (file: FileItem) => {
    setActiveFileId(file.id);
  };

  const handleDeleteFile = (file: FileItem, projectId: string) => {
    setDeleteTarget({ file, projectId });
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;

    const { file, projectId } = deleteTarget;
    
    setProjectFiles((prev) => ({
      ...prev,
      [projectId]: (prev[projectId] || []).filter((f) => f.id !== file.id),
    }));
    setDeleteTarget(null);

    toast({
      title: "Archivo eliminado",
      description: `"${file.name}" ha sido eliminado`,
      action: (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setProjectFiles((prev) => ({
              ...prev,
              [projectId]: [...(prev[projectId] || []), file],
            }));
            toast({
              title: "Acción deshecha",
              description: `"${file.name}" ha sido restaurado`,
            });
          }}
        >
          Deshacer
        </Button>
      ),
    });
  };

  const handleCreateProject = (config: NewProjectConfig) => {
    const newProjectId = `${activeTool}-${Date.now()}`;
    const newProject: Project = {
      id: newProjectId,
      name: config.name,
      emoji: config.emoji,
      icon: config.icon,
      tool: activeTool,
    };

    // If there's an initial file, add it to the project files
    if (config.initialFile) {
      const extension = config.initialFile.name.split('.').pop() || '';
      const newFile: FileItem = {
        id: `${newProjectId}-initial-${Date.now()}`,
        name: config.initialFile.name,
        extension,
      };
      setProjectFiles((prev) => ({
        ...prev,
        [newProjectId]: [newFile],
      }));
    } else {
      setProjectFiles((prev) => ({
        ...prev,
        [newProjectId]: [],
      }));
    }

    setExpandedProjects((prev) => new Set([...prev, newProjectId]));
    setExpandedFiles((prev) => new Set([...prev, newProjectId]));

    onCreateProject(newProject, config.initialFile);

    toast({
      title: "Proyecto creado",
      description: `"${config.name}" se ha creado correctamente.`,
    });
  };

  const ToolIcon = activeTool === "discovery" ? Zap : Search;
  const toolLabel = activeTool === "discovery" ? "Discovery Engine" : "Search OS";

  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-1">
        {toolProjects.map((project) => (
          <button
            key={project.id}
            onClick={() => handleProjectClick(project)}
            className={cn(
              "flex items-center justify-center p-2 rounded-md transition-colors",
              activeProject?.id === project.id
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent"
            )}
            title={project.name}
          >
            <span className="text-base">{project.emoji}</span>
          </button>
        ))}
        <button
          onClick={() => setNewProjectDialogOpen(true)}
          className="flex items-center justify-center p-2 rounded-md text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
          title="Nuevo proyecto"
        >
          <Plus className="h-4 w-4" />
        </button>

        <NewProjectDialog
          open={newProjectDialogOpen}
          onOpenChange={setNewProjectDialogOpen}
          onCreateProject={handleCreateProject}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Tool Context Header */}
      <div className="flex items-center gap-2 px-3 py-2 mb-1 rounded-md bg-sidebar-accent/50">
        <ToolIcon className="h-4 w-4 text-primary" />
        <span className="text-xs font-medium text-muted-foreground">{toolLabel}</span>
      </div>

      {/* Projects Header */}
      <div className="flex items-center gap-2 px-3 py-2 text-sidebar-foreground">
        <Folder className="h-4 w-4" />
        <span className="text-sm font-medium">Proyectos</span>
        <span className="text-xs text-muted-foreground ml-auto">{toolProjects.length}</span>
      </div>

      {/* Empty State */}
      {toolProjects.length === 0 && (
        <div className="px-3 py-4 text-center">
          <p className="text-xs text-muted-foreground mb-2">
            No hay proyectos en {toolLabel}
          </p>
          <button
            onClick={() => setNewProjectDialogOpen(true)}
            className="text-xs text-primary hover:underline"
          >
            Crear primer proyecto
          </button>
        </div>
      )}

      {/* Project List with Nested Files */}
      <div className="space-y-0.5">
        {toolProjects.map((project) => {
          const isProjectExpanded = expandedProjects.has(project.id);
          const isFilesExpanded = expandedFiles.has(project.id);
          const isActive = activeProject?.id === project.id;
          const files = projectFiles[project.id] || [];

          return (
            <div key={project.id} className="relative">
              {/* Vertical guide line */}
              {isProjectExpanded && (
                <div 
                  className="absolute left-[22px] top-8 bottom-0 w-px bg-border"
                  style={{ height: 'calc(100% - 32px)' }}
                />
              )}

              {/* Project Row */}
              <Collapsible open={isProjectExpanded} onOpenChange={() => toggleProjectExpanded(project.id)}>
                <CollapsibleTrigger asChild>
                  <button
                    onClick={() => handleProjectClick(project)}
                    className={cn(
                      "flex items-center gap-2 w-full px-3 py-1.5 rounded-md transition-colors text-left",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent"
                    )}
                  >
                    {isProjectExpanded ? (
                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    )}
                    <span className="text-base shrink-0">{project.emoji}</span>
                    <span className="text-sm font-medium truncate flex-1">{project.name}</span>
                  </button>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  {/* Files Subsection */}
                  <div className="ml-4 relative">
                    <div className="absolute left-[6px] top-3 w-2 h-px bg-border" />

                    <Collapsible open={isFilesExpanded} onOpenChange={() => toggleFilesExpanded(project.id)}>
                      <CollapsibleTrigger asChild>
                        <button
                          className="flex items-center gap-2 w-full pl-4 pr-3 py-1.5 rounded-md text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors text-left"
                        >
                          {isFilesExpanded ? (
                            <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
                          ) : (
                            <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
                          )}
                          <Files className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span className="text-xs font-medium">Archivos</span>
                          <span className="text-xs text-muted-foreground ml-auto">{files.length}</span>
                        </button>
                      </CollapsibleTrigger>

                      <CollapsibleContent>
                        <div className="ml-4 relative">
                          {files.length > 0 && (
                            <div 
                              className="absolute left-[6px] top-0 w-px bg-border"
                              style={{ height: `calc(100% - 8px)` }}
                            />
                          )}

                          <div className="flex items-center gap-1 pl-4 py-1.5 border-b border-border/50 mb-1">
                            <button
                              onClick={() => handleUploadClick(project.id)}
                              className="p-1 rounded hover:bg-sidebar-accent text-muted-foreground hover:text-sidebar-foreground transition-colors"
                              title="Subir archivo"
                            >
                              <Upload size={12} />
                            </button>
                            <button
                              onClick={() => handleRefresh(project.id)}
                              className="p-1 rounded hover:bg-sidebar-accent text-muted-foreground hover:text-sidebar-foreground transition-colors"
                              title="Refrescar"
                            >
                              <RefreshCw size={12} />
                            </button>
                            <input
                              ref={(el) => (fileInputRefs.current[project.id] = el)}
                              type="file"
                              multiple
                              className="hidden"
                              onChange={(e) => handleFileUpload(e, project.id)}
                            />
                          </div>

                          <div className="space-y-0.5">
                            {files.length === 0 ? (
                              <p className="text-xs text-muted-foreground pl-4 py-2">
                                No hay archivos
                              </p>
                            ) : (
                              files.map((file) => (
                                <div key={file.id} className="relative">
                                  <div className="absolute left-[6px] top-1/2 w-2 h-px bg-border" />
                                  <div className="pl-4">
                                    <FileItemComponent
                                      file={file}
                                      isActive={activeFileId === file.id}
                                      onSelect={handleSelectFile}
                                      onDelete={(f) => handleDeleteFile(f, project.id)}
                                    />
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          );
        })}

        {/* Add Project Button */}
        <button 
          onClick={() => setNewProjectDialogOpen(true)}
          className="flex items-center gap-2 w-full px-3 py-1.5 text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent rounded-md transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          <span className="text-xs">Nuevo proyecto</span>
        </button>
      </div>

      {/* New Project Dialog */}
      <NewProjectDialog
        open={newProjectDialogOpen}
        onOpenChange={setNewProjectDialogOpen}
        onCreateProject={handleCreateProject}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar archivo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará "{deleteTarget?.file.name}".
              Podrás deshacer esta acción inmediatamente después.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export { initialSearchProjects, initialDiscoveryProjects };
