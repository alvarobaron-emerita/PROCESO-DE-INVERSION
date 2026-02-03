import { Button } from "~/components/ui/button";
import { X, Trash2 } from "lucide-react";

interface SelectionBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onDelete: () => void;
}

export function SelectionBar({
  selectedCount,
  onClearSelection,
  onDelete,
}: SelectionBarProps) {
  return (
    <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg border border-primary/20">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-foreground">
          {selectedCount} fila(s) seleccionada(s)
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onDelete}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Eliminar
        </Button>
        <Button variant="ghost" size="sm" onClick={onClearSelection}>
          <X className="h-4 w-4 mr-2" />
          Deseleccionar
        </Button>
      </div>
    </div>
  );
}
