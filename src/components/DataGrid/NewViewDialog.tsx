import { useState } from "react";
import {
  Columns,
  Eye,
  Table,
  LayoutGrid,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Checkbox } from "~/components/ui/checkbox";
import { ScrollArea } from "~/components/ui/scroll-area";
import { cn } from "~/lib/utils";

// Icon mapping
const iconComponents: Record<string, LucideIcon> = {
  Eye,
  Table,
  LayoutGrid,
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

// Iconos reservados para vistas de sistema (Bandeja de Entrada, Shortlist, Descartados)
const SYSTEM_VIEW_ICON_IDS = ["Inbox", "Star", "Trash2"];

// Available icons for custom view selection (excluimos los de sistema para no duplicar)
const availableViewIcons = [
  { id: "Eye", label: "Vista" },
  { id: "Table", label: "Tabla" },
  { id: "LayoutGrid", label: "Cuadrícula" },
  { id: "List", label: "Lista" },
  { id: "Filter", label: "Filtro" },
  { id: "Target", label: "Objetivo" },
  { id: "Bookmark", label: "Marcador" },
  { id: "Flag", label: "Bandera" },
  { id: "Heart", label: "Favorito" },
  { id: "Zap", label: "Rápido" },
  { id: "TrendingUp", label: "Tendencia" },
  { id: "BarChart3", label: "Gráfico" },
  { id: "Users", label: "Usuarios" },
  { id: "Building2", label: "Empresa" },
  { id: "FolderOpen", label: "Carpeta" },
  { id: "FileText", label: "Documento" },
].filter((icon) => !SYSTEM_VIEW_ICON_IDS.includes(icon.id));

interface NewViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateView: (config: {
    name: string;
    icon: string;
    visibleColumns: string[];
  }) => void;
  availableColumns?: string[];
}

export function NewViewDialog({
  open,
  onOpenChange,
  onCreateView,
  availableColumns = [],
}: NewViewDialogProps) {
  const [viewName, setViewName] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("Eye");
  const [selectedColumns, setSelectedColumns] = useState<Set<string>>(
    new Set(availableColumns)
  );

  const handleToggleColumn = (columnId: string) => {
    setSelectedColumns((prev) => {
      const next = new Set(prev);
      if (next.has(columnId)) {
        next.delete(columnId);
      } else {
        next.add(columnId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedColumns(new Set(availableColumns));
  };

  const handleDeselectAll = () => {
    setSelectedColumns(new Set());
  };

  const handleCreate = () => {
    if (!viewName.trim()) return;

    onCreateView({
      name: viewName.trim(),
      icon: selectedIcon,
      visibleColumns: Array.from(selectedColumns),
    });

    // Reset state
    setViewName("");
    setSelectedIcon("Eye");
    setSelectedColumns(new Set(availableColumns));
    onOpenChange(false);
  };

  const handleClose = () => {
    setViewName("");
    setSelectedIcon("Eye");
    setSelectedColumns(new Set(availableColumns));
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-primary" />
            Configurar Nueva Vista
          </DialogTitle>
          <DialogDescription>
            Crea una vista personalizada seleccionando un icono y las columnas
            que deseas ver.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4 -mx-6 px-6">
          {/* View Name */}
          <div className="space-y-2">
            <Label htmlFor="view-name">Nombre de la Vista</Label>
            <Input
              id="view-name"
              placeholder="Ej: Mi análisis personalizado"
              value={viewName}
              onChange={(e) => setViewName(e.target.value)}
            />
          </div>

          {/* Icon Selection */}
          <div className="space-y-2">
            <Label>Icono de la Vista</Label>
            <div className="grid grid-cols-8 gap-1.5 p-2 border rounded-md bg-muted/30">
              {availableViewIcons.map((iconOption) => {
                const IconComponent = iconComponents[iconOption.id];
                if (!IconComponent) return null;

                return (
                  <button
                    key={iconOption.id}
                    type="button"
                    onClick={() => setSelectedIcon(iconOption.id)}
                    className={cn(
                      "flex items-center justify-center p-2 rounded-md transition-all",
                      selectedIcon === iconOption.id
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "hover:bg-muted text-muted-foreground hover:text-foreground"
                    )}
                    title={iconOption.label}
                  >
                    <IconComponent className="h-4 w-4" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Column Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Columns className="h-4 w-4" />
                Selección de Columnas
              </Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={handleSelectAll}
                >
                  Todas
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={handleDeselectAll}
                >
                  Ninguna
                </Button>
              </div>
            </div>

            <ScrollArea className="h-[160px] rounded-md border p-3">
              <div className="space-y-2">
                {availableColumns.length > 0 ? (
                  availableColumns.map((column) => (
                    <div
                      key={column}
                      className="flex items-center gap-3 py-1.5 px-2 rounded-md hover:bg-muted/50 transition-colors"
                    >
                      <Checkbox
                        id={`col-${column}`}
                        checked={selectedColumns.has(column)}
                        onCheckedChange={() => handleToggleColumn(column)}
                      />
                      <label
                        htmlFor={`col-${column}`}
                        className="text-sm font-medium cursor-pointer flex-1"
                      >
                        {column}
                      </label>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No hay columnas disponibles
                  </p>
                )}
              </div>
            </ScrollArea>

            <p className="text-xs text-muted-foreground">
              {selectedColumns.size} de {availableColumns.length} columnas
              seleccionadas
            </p>
          </div>
        </div>

        <DialogFooter className="flex-shrink-0 border-t pt-4 -mx-6 px-6">
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!viewName.trim() || selectedColumns.size === 0}
          >
            Crear Vista
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
