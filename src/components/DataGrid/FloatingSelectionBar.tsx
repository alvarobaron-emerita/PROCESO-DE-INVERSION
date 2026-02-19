import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { ViewInfo } from "./types";
import { ArrowRight, Copy, Trash2, X } from "lucide-react";

interface FloatingSelectionBarProps {
  selectedCount: number;
  views: ViewInfo[];
  currentViewId: string;
  onMove: (targetViewId: string) => void;
  onCopy: (targetViewId: string) => void;
  onDelete: () => void;
  onClearSelection: () => void;
}

export function FloatingSelectionBar({
  selectedCount,
  views,
  currentViewId,
  onMove,
  onCopy,
  onDelete,
  onClearSelection,
}: FloatingSelectionBarProps) {
  const availableViews = views.filter((v) => v.id !== currentViewId);
  const label =
    selectedCount === 1 ? "1 fila seleccionada" : `${selectedCount} filas seleccionadas`;

  return (
    <div
      className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-lg border border-zinc-700/50 bg-zinc-900 px-4 py-2.5 text-white shadow-xl"
      role="toolbar"
      aria-label="Acciones de filas seleccionadas"
    >
      <span className="text-sm font-medium text-zinc-100">{label}</span>
      <div className="h-4 w-px bg-zinc-600" aria-hidden />
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 text-zinc-100 hover:bg-zinc-700 hover:text-white"
            >
              <ArrowRight className="h-4 w-4" />
              Mover
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="min-w-[180px]">
            <DropdownMenuLabel>Mover a vista</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {availableViews.length === 0 ? (
              <DropdownMenuItem disabled>No hay otras vistas</DropdownMenuItem>
            ) : (
              availableViews.map((view) => (
                <DropdownMenuItem key={view.id} onClick={() => onMove(view.id)}>
                  {view.name}
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 text-zinc-100 hover:bg-zinc-700 hover:text-white"
            >
              <Copy className="h-4 w-4" />
              Copiar
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="min-w-[180px]">
            <DropdownMenuLabel>Copiar a vista</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {availableViews.length === 0 ? (
              <DropdownMenuItem disabled>No hay otras vistas</DropdownMenuItem>
            ) : (
              availableViews.map((view) => (
                <DropdownMenuItem key={view.id} onClick={() => onCopy(view.id)}>
                  {view.name}
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 text-red-300 hover:bg-zinc-700 hover:text-red-200"
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4" />
          Eliminar
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 text-zinc-300 hover:bg-zinc-700 hover:text-white"
          onClick={onClearSelection}
        >
          <X className="h-4 w-4" />
          Deseleccionar
        </Button>
      </div>
    </div>
  );
}
