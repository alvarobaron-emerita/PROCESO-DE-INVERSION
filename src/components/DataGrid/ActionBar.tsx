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
import { ArrowRight, Copy } from "lucide-react";

interface ActionBarProps {
  selectedCount: number;
  views: ViewInfo[];
  currentViewId: string;
  onMove: (targetViewId: string) => void;
  onCopy: (targetViewId: string) => void;
}

export function ActionBar({
  selectedCount,
  views,
  currentViewId,
  onMove,
  onCopy,
}: ActionBarProps) {
  const availableViews = views.filter((v) => v.id !== currentViewId);

  return (
    <div className="flex items-center gap-2 p-4 bg-muted/50 rounded-lg border">
      <span className="text-sm font-medium">
        {selectedCount} fila(s) seleccionada(s)
      </span>
      <div className="flex gap-2 ml-auto">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <ArrowRight className="h-4 w-4 mr-2" />
              Mover a
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Mover a vista</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {availableViews.map((view) => (
              <DropdownMenuItem
                key={view.id}
                onClick={() => onMove(view.id)}
              >
                {view.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Copy className="h-4 w-4 mr-2" />
              Copiar a
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Copiar a vista</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {availableViews.map((view) => (
              <DropdownMenuItem
                key={view.id}
                onClick={() => onCopy(view.id)}
              >
                {view.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
