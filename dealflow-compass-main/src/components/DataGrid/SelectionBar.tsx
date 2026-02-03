import { useState } from "react";
import { ArrowRight, Copy, Pencil, Trash2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { CustomView } from "./viewTypes";
import { usePermissions } from "@/contexts/PermissionsContext";

interface SelectionBarProps {
  selectedCount: number;
  views: CustomView[];
  currentViewId: string;
  onMove?: (targetViewId: string) => void;
  onCopy?: (targetViewId: string) => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function SelectionBar({
  selectedCount,
  views,
  currentViewId,
  onMove,
  onCopy,
  onEdit,
  onDelete,
}: SelectionBarProps) {
  const { canEdit } = usePermissions();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  if (selectedCount === 0) return null;

  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    onDelete?.();
    setShowDeleteDialog(false);
  };

  // Filter out current view from targets
  const targetViews = views.filter((v) => v.id !== currentViewId);

  return (
    <>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
        <div className="flex items-center gap-1 bg-foreground text-background px-4 py-2 rounded-full shadow-lg">
          <span className="text-sm font-medium px-2">
            {selectedCount} {selectedCount === 1 ? "fila" : "filas"} seleccionadas
          </span>
          
          <div className="h-4 w-px bg-background/30 mx-2" />
          
          {/* Move Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-background hover:bg-background/10 hover:text-background gap-1.5 h-8"
              >
                <ArrowRight className="h-4 w-4" />
                Mover
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="bg-popover min-w-[160px]">
              {targetViews.length === 0 ? (
                <DropdownMenuItem disabled className="text-muted-foreground">
                  No hay otras vistas
                </DropdownMenuItem>
              ) : (
                targetViews.map((view) => (
                  <DropdownMenuItem
                    key={view.id}
                    onClick={() => onMove?.(view.id)}
                    className="cursor-pointer"
                  >
                    {view.name}
                    {view.isCustom && (
                      <span className="ml-auto text-xs text-muted-foreground">
                        (personalizada)
                      </span>
                    )}
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Copy Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-background hover:bg-background/10 hover:text-background gap-1.5 h-8"
              >
                <Copy className="h-4 w-4" />
                Copiar
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="bg-popover min-w-[160px]">
              {targetViews.length === 0 ? (
                <DropdownMenuItem disabled className="text-muted-foreground">
                  No hay otras vistas
                </DropdownMenuItem>
              ) : (
                targetViews.map((view) => (
                  <DropdownMenuItem
                    key={view.id}
                    onClick={() => onCopy?.(view.id)}
                    className="cursor-pointer"
                  >
                    {view.name}
                    {view.isCustom && (
                      <span className="ml-auto text-xs text-muted-foreground">
                        (personalizada)
                      </span>
                    )}
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          
          {canEdit && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={onEdit}
                className="text-background hover:bg-background/10 hover:text-background gap-1.5 h-8"
              >
                <Pencil className="h-4 w-4" />
                Editar
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDeleteClick}
                className={cn(
                  "text-background hover:bg-destructive hover:text-destructive-foreground gap-1.5 h-8"
                )}
              >
                <Trash2 className="h-4 w-4" />
                Eliminar
              </Button>
            </>
          )}
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar {selectedCount === 1 ? "esta fila" : "estas filas"}?</AlertDialogTitle>
            <AlertDialogDescription>
              Estás a punto de eliminar {selectedCount} {selectedCount === 1 ? "registro" : "registros"}. 
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
