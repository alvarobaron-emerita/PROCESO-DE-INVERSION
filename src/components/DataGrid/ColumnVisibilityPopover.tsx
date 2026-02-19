/**
 * ColumnVisibilityPopover - UX de clase mundial para mostrar/ocultar columnas
 * Incluye: búsqueda, acciones masivas, multi-selección, presets
 */

import { useState, useMemo, useCallback } from "react";
import { Eye, EyeOff, RotateCcw, Zap } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "~/components/ui/command";
import { cn } from "~/lib/utils";
import type { Table } from "@tanstack/react-table";

const ESSENTIAL_COLUMNS = [
  "name",
  "city",
  "description",
  "website",
  "revenue",
  "ebitda",
  "employees",
  "nif",
  "province",
];

interface ColumnVisibilityPopoverProps<TData> {
  table: Table<TData>;
}

export function ColumnVisibilityPopover<TData>({ table }: ColumnVisibilityPopoverProps<TData>) {
  const [search, setSearch] = useState("");
  const [selectedColumnIds, setSelectedColumnIds] = useState<Set<string>>(new Set());
  const [lastClickedId, setLastClickedId] = useState<string | null>(null);

  const dataColumns = useMemo(
    () =>
      table
        .getAllColumns()
        .filter((col) => col.id !== "select")
        .map((col) => ({
          id: col.id,
          getIsVisible: () => col.getIsVisible(),
          toggleVisibility: (show: boolean) => col.toggleVisibility(!!show),
        })),
    [table]
  );

  const filteredColumns = useMemo(() => {
    if (!search.trim()) return dataColumns;
    const q = search.toLowerCase();
    return dataColumns.filter((col) => col.id.toLowerCase().includes(q));
  }, [dataColumns, search]);

  const showAll = useCallback(() => {
    table.resetColumnVisibility();
  }, [table]);

  const hideAll = useCallback(() => {
    const all: Record<string, boolean> = {};
    dataColumns.forEach((col) => {
      all[col.id] = false;
    });
    table.setColumnVisibility(all);
  }, [table, dataColumns]);

  const invert = useCallback(() => {
    const next: Record<string, boolean> = {};
    dataColumns.forEach((col) => {
      next[col.id] = !col.getIsVisible();
    });
    table.setColumnVisibility(next);
  }, [table, dataColumns]);

  const essentialOnly = useCallback(() => {
    const next: Record<string, boolean> = {};
    dataColumns.forEach((col) => {
      next[col.id] = ESSENTIAL_COLUMNS.includes(col.id);
    });
    table.setColumnVisibility(next);
  }, [table, dataColumns]);

  const handleColumnClick = useCallback(
    (columnId: string, isShift: boolean, isMeta: boolean) => {
      const col = dataColumns.find((c) => c.id === columnId);
      if (!col) return;

      if (isMeta) {
        setSelectedColumnIds((prev) => {
          const next = new Set(prev);
          if (next.has(columnId)) next.delete(columnId);
          else next.add(columnId);
          return next;
        });
        setLastClickedId(columnId);
        return;
      }

      if (isShift && lastClickedId != null) {
        const ids = dataColumns.map((c) => c.id);
        const start = Math.min(ids.indexOf(columnId), ids.indexOf(lastClickedId));
        const end = Math.max(ids.indexOf(columnId), ids.indexOf(lastClickedId));
        const range = ids.slice(start, end + 1);
        setSelectedColumnIds((prev) => {
          const next = new Set(prev);
          range.forEach((id) => next.add(id));
          return next;
        });
        return;
      }

      col.toggleVisibility(!col.getIsVisible());
      setSelectedColumnIds(new Set());
      setLastClickedId(columnId);
    },
    [dataColumns, lastClickedId]
  );

  const showSelected = useCallback(() => {
    const next: Record<string, boolean> = {};
    dataColumns.forEach((col) => {
      next[col.id] = selectedColumnIds.has(col.id);
    });
    table.setColumnVisibility(next);
    setSelectedColumnIds(new Set());
  }, [table, dataColumns, selectedColumnIds]);

  const hideSelected = useCallback(() => {
    selectedColumnIds.forEach((id) => {
      const col = table.getColumn(id);
      col?.toggleVisibility(false);
    });
    setSelectedColumnIds(new Set());
  }, [table, selectedColumnIds]);

  const invertSelected = useCallback(() => {
    selectedColumnIds.forEach((id) => {
      const col = table.getColumn(id);
      if (col) col.toggleVisibility(!col.getIsVisible());
    });
    setSelectedColumnIds(new Set());
  }, [table, selectedColumnIds]);

  const handleSelectAll = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "a") {
        e.preventDefault();
        setSelectedColumnIds(new Set(filteredColumns.map((c) => c.id)));
      }
    },
    [filteredColumns]
  );

  const hasSelection = selectedColumnIds.size > 0;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <Eye className="h-4 w-4 mr-2" />
          Columnas visibles
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end" onOpenAutoFocus={(e) => e.preventDefault()}>
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-1 p-2 border-b">
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={showAll}>
              <Eye className="h-3 w-3 mr-1" />
              Todas
            </Button>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={hideAll}>
              <EyeOff className="h-3 w-3 mr-1" />
              Ninguna
            </Button>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={invert}>
              <RotateCcw className="h-3 w-3 mr-1" />
              Invertir
            </Button>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={essentialOnly}>
              <Zap className="h-3 w-3 mr-1" />
              Esenciales
            </Button>
          </div>

          <Command className="rounded-none border-0" onKeyDown={handleSelectAll}>
            <CommandInput
              placeholder="Buscar columnas..."
              value={search}
              onValueChange={setSearch}
            />
            <CommandList className="max-h-[240px]">
              <CommandEmpty>Sin resultados</CommandEmpty>
              <CommandGroup>
                {filteredColumns.map((column) => {
                  const col = table.getColumn(column.id);
                  if (!col) return null;
                  const isVisible = col.getIsVisible();
                  const isSelected = selectedColumnIds.has(column.id);
                  return (
                    <CommandItem
                      key={column.id}
                      value={column.id}
                      onSelect={() => {}}
                      className="cursor-pointer"
                    >
                      <div
                        role="button"
                        tabIndex={0}
                        className="flex items-center gap-2 w-full"
                        onClick={(e) =>
                          handleColumnClick(column.id, e.shiftKey, e.metaKey || e.ctrlKey)
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            handleColumnClick(column.id, e.shiftKey, e.metaKey || e.ctrlKey);
                          }
                        }}
                      >
                        <div onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={isVisible}
                            onCheckedChange={(value) => col.toggleVisibility(!!value)}
                          />
                        </div>
                        <span
                          className={cn(
                            "flex-1 truncate text-sm",
                            !isVisible && "text-muted-foreground"
                          )}
                        >
                          {column.id}
                        </span>
                        {isSelected && (
                          <span className="text-xs text-muted-foreground">Seleccionada</span>
                        )}
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>

          {hasSelection && (
            <div className="flex flex-wrap gap-1 p-2 border-t">
              <span className="text-xs text-muted-foreground w-full">
                {selectedColumnIds.size} seleccionadas
              </span>
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={showSelected}>
                Solo estas
              </Button>
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={hideSelected}>
                Ocultar
              </Button>
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={invertSelected}>
                Invertir
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
