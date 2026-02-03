import { useState, useRef, useCallback } from "react";
import {
  Grape,
  Wine,
  Factory,
  Globe,
  Building2,
  Briefcase,
  ShoppingCart,
  Truck,
  Package,
  Leaf,
  Sun,
  Mountain,
  Ship,
  Plane,
  Store,
  Warehouse,
  Upload,
  FileSpreadsheet,
  X,
  LucideIcon,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// Icon mapping
const projectIconComponents: Record<string, LucideIcon> = {
  Grape,
  Wine,
  Factory,
  Globe,
  Building2,
  Briefcase,
  ShoppingCart,
  Truck,
  Package,
  Leaf,
  Sun,
  Mountain,
  Ship,
  Plane,
  Store,
  Warehouse,
};

// Available icons for project selection
export const availableProjectIcons = [
  { id: "Grape", label: "Uvas", emoji: "🍇" },
  { id: "Wine", label: "Vino", emoji: "🍷" },
  { id: "Factory", label: "Fábrica", emoji: "🏭" },
  { id: "Globe", label: "Global", emoji: "🌍" },
  { id: "Building2", label: "Empresa", emoji: "🏢" },
  { id: "Briefcase", label: "Negocio", emoji: "💼" },
  { id: "ShoppingCart", label: "Comercio", emoji: "🛒" },
  { id: "Truck", label: "Logística", emoji: "🚚" },
  { id: "Package", label: "Paquete", emoji: "📦" },
  { id: "Leaf", label: "Eco", emoji: "🌿" },
  { id: "Sun", label: "Energía", emoji: "☀️" },
  { id: "Mountain", label: "Montaña", emoji: "⛰️" },
  { id: "Ship", label: "Naviera", emoji: "🚢" },
  { id: "Plane", label: "Aéreo", emoji: "✈️" },
  { id: "Store", label: "Tienda", emoji: "🏪" },
  { id: "Warehouse", label: "Almacén", emoji: "🏬" },
];

export interface NewProjectConfig {
  name: string;
  icon: string;
  emoji: string;
  initialFile?: File;
}

interface NewProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateProject: (config: NewProjectConfig) => void;
}

export function NewProjectDialog({
  open,
  onOpenChange,
  onCreateProject,
}: NewProjectDialogProps) {
  const [projectName, setProjectName] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("Grape");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedIconData = availableProjectIcons.find((i) => i.id === selectedIcon);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (['csv', 'xlsx', 'xls'].includes(extension || '')) {
        setUploadedFile(file);
      }
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setUploadedFile(files[0]);
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCreate = () => {
    if (!projectName.trim()) return;

    onCreateProject({
      name: projectName.trim(),
      icon: selectedIcon,
      emoji: selectedIconData?.emoji || "📁",
      initialFile: uploadedFile || undefined,
    });

    // Reset state
    setProjectName("");
    setSelectedIcon("Grape");
    setUploadedFile(null);
    onOpenChange(false);
  };

  const handleClose = () => {
    setProjectName("");
    setSelectedIcon("Grape");
    setUploadedFile(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground text-sm">
              {selectedIconData?.emoji || "📁"}
            </span>
            Nuevo Proyecto
          </DialogTitle>
          <DialogDescription>
            Crea un nuevo proyecto para organizar tus datos y análisis.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Project Name */}
          <div className="space-y-2">
            <Label htmlFor="project-name">Nombre del Proyecto</Label>
            <Input
              id="project-name"
              placeholder="Ej: Análisis Mercado 2025"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
            />
          </div>

          {/* Icon Selection */}
          <div className="space-y-2">
            <Label>Icono del Proyecto</Label>
            <div className="grid grid-cols-8 gap-1.5 p-3 border rounded-lg bg-muted/30">
              {availableProjectIcons.map((iconOption) => {
                const IconComponent = projectIconComponents[iconOption.id];
                if (!IconComponent) return null;
                
                return (
                  <button
                    key={iconOption.id}
                    type="button"
                    onClick={() => setSelectedIcon(iconOption.id)}
                    className={cn(
                      "flex flex-col items-center justify-center p-2 rounded-md transition-all gap-0.5",
                      selectedIcon === iconOption.id
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "hover:bg-muted text-muted-foreground hover:text-foreground"
                    )}
                    title={iconOption.label}
                  >
                    <span className="text-base">{iconOption.emoji}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* File Upload Dropzone */}
          <div className="space-y-2">
            <Label>Archivo Inicial (Opcional)</Label>
            
            {uploadedFile ? (
              <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
                <FileSpreadsheet className="h-8 w-8 text-primary" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{uploadedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(uploadedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={handleRemoveFile}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50 hover:bg-muted/30"
                )}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                  <Upload className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">
                    Sube el archivo base para este proyecto
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    CSV, Excel (.xlsx, .xls) • Arrastra o haz clic
                  </p>
                </div>
              </div>
            )}
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!projectName.trim()}
            className="bg-foreground text-background hover:bg-foreground/90"
          >
            Crear Proyecto
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
