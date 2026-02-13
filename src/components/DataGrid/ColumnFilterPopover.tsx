import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Filter, Loader2 } from "lucide-react";
import { cn } from "~/lib/utils";

interface ColumnFilterPopoverProps {
  columnId: string;
  selectedFilter: string[];
  values: string[];
  isLoading: boolean;
  onFilterChange: (values: string[] | undefined) => void;
  onSelectAll: (values: string[]) => void;
  onAutoResize: (columnId: string, sampleValues: string[]) => void;
  onRequestValues: () => void;
}

export function ColumnFilterPopover({
  columnId,
  selectedFilter,
  values,
  isLoading,
  onFilterChange,
  onSelectAll,
  onAutoResize,
  onRequestValues,
}: ColumnFilterPopoverProps) {
  const [open, setOpen] = useState(false);

  const toggleFilterValue = (value: string) => {
    const next = selectedFilter.includes(value)
      ? selectedFilter.filter((x) => x !== value)
      : [...selectedFilter, value];
    onFilterChange(next.length ? next : undefined);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) {
      onRequestValues();
    }
  };

  const hasValues = values.length > 0;

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 flex-shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <Filter
            className={cn("h-4 w-4", selectedFilter.length > 0 && "text-primary")}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-64 p-0"
        align="start"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-2 border-b flex justify-between items-center">
          <span className="text-sm font-medium">Filtrar por valores</span>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              disabled={!hasValues || isLoading}
              onClick={() => onSelectAll(values)}
            >
              Todos
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => onFilterChange([])}
            >
              Ninguno
            </Button>
          </div>
        </div>
        <ScrollArea className="h-[240px]">
          <div className="p-2 space-y-1">
            {isLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-2 px-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Cargando valores...
              </div>
            )}
            {!isLoading && !hasValues && (
              <p className="text-sm text-muted-foreground py-2">
                Sin valores únicos
              </p>
            )}
            {!isLoading &&
              values.map((val) => (
              <label
                key={val}
                className="flex items-center gap-2 cursor-pointer text-sm hover:bg-muted/50 rounded px-2 py-1"
              >
                <Checkbox
                  checked={
                    selectedFilter == null ? true : selectedFilter.includes(val)
                  }
                  onCheckedChange={() => toggleFilterValue(val)}
                />
                <span className="truncate">{val}</span>
              </label>
              ))}
          </div>
        </ScrollArea>
        <div className="border-t p-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-xs"
            onClick={() => onAutoResize(columnId, values)}
            disabled={!hasValues}
          >
            Auto-ajustar ancho de columna
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
