import { useState, useRef } from "react";
import { Upload, RefreshCw, ChevronDown, ChevronRight, Files } from "lucide-react";
import { cn } from "@/lib/utils";
import { FileItemComponent } from "./FileItem";
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
import type { FileItem } from "./types";

interface FileExplorerProps {
  collapsed?: boolean;
}

const initialFiles: FileItem[] = [
  { id: "1", name: "empresas_2024.csv", extension: "csv" },
  { id: "2", name: "reporte_q4.xlsx", extension: "xlsx" },
  { id: "3", name: "contrato_base.pdf", extension: "pdf" },
  { id: "4", name: "notas.docx", extension: "docx" },
  { id: "5", name: "config.json", extension: "json" },
  { id: "6", name: "logo.png", extension: "png" },
];

export function FileExplorer({ collapsed = false }: FileExplorerProps) {
  const [files, setFiles] = useState<FileItem[]>(initialFiles);
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FileItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = event.target.files;
    if (!uploadedFiles) return;

    const newFiles: FileItem[] = Array.from(uploadedFiles).map((file, index) => {
      const extension = file.name.split('.').pop() || '';
      return {
        id: `uploaded-${Date.now()}-${index}`,
        name: file.name,
        extension,
      };
    });

    setFiles((prev) => [...prev, ...newFiles]);
    toast({
      title: "Archivos subidos",
      description: `Se han añadido ${newFiles.length} archivo(s)`,
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRefresh = () => {
    toast({
      title: "Lista actualizada",
      description: "Los archivos han sido refrescados",
    });
  };

  const handleSelectFile = (file: FileItem) => {
    setActiveFileId(file.id);
  };

  const handleDeleteFile = (file: FileItem) => {
    setDeleteTarget(file);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;

    const deletedName = deleteTarget.name;
    const deletedFile = deleteTarget;
    
    setFiles((prev) => prev.filter((f) => f.id !== deleteTarget.id));
    setDeleteTarget(null);

    toast({
      title: "Archivo eliminado",
      description: `"${deletedName}" ha sido eliminado`,
      action: (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setFiles((prev) => [...prev, deletedFile]);
            toast({
              title: "Acción deshecha",
              description: `"${deletedName}" ha sido restaurado`,
            });
          }}
        >
          Deshacer
        </Button>
      ),
    });
  };

  if (collapsed) {
    return (
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-center p-2 rounded-md text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
      >
        <Files className="h-4 w-4" />
      </button>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 px-3 py-2 text-sidebar-foreground hover:bg-sidebar-accent rounded-md transition-colors"
      >
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        )}
        <Files className="h-4 w-4" />
        <span className="text-sm font-medium">Archivos</span>
      </button>

      {/* Collapsible Content */}
      {isExpanded && (
        <div className="mt-1 rounded-md bg-slate-50/50 dark:bg-slate-900/30 mx-2 overflow-hidden">
          {/* Toolbar - Simplified */}
          <div className="flex items-center gap-1 px-2 py-1.5 border-b border-border/50">
            <button
              onClick={handleUploadClick}
              className="p-1 rounded hover:bg-sidebar-accent text-muted-foreground hover:text-sidebar-foreground transition-colors"
              title="Subir archivo"
            >
              <Upload size={14} />
            </button>
            <button
              onClick={handleRefresh}
              className="p-1 rounded hover:bg-sidebar-accent text-muted-foreground hover:text-sidebar-foreground transition-colors"
              title="Refrescar"
            >
              <RefreshCw size={14} />
            </button>
          </div>

          {/* File List */}
          <div className="py-1 max-h-64 overflow-y-auto">
            {files.length === 0 ? (
              <p className="text-xs text-muted-foreground px-3 py-2">
                No hay archivos
              </p>
            ) : (
              files.map((file) => (
                <FileItemComponent
                  key={file.id}
                  file={file}
                  isActive={activeFileId === file.id}
                  onSelect={handleSelectFile}
                  onDelete={handleDeleteFile}
                />
              ))
            )}
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar archivo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará "{deleteTarget?.name}".
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
