import { useState, useMemo } from "react";
import { Column, Table } from "@tanstack/react-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  MoreHorizontal,
  ArrowUpAZ,
  ArrowDownZA,
  ArrowUp01,
  ArrowDown10,
  Filter,
  X,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Company } from "./types";

interface ColumnHeaderMenuProps {
  column: Column<Company, unknown>;
  table: Table<Company>;
  title: string;
}

type FilterCondition = "equals" | "contains" | "startsWith" | "isEmpty";

interface ColumnFilter {
  condition: FilterCondition;
  value: string;
  selectedValues?: string[];
}

export function ColumnHeaderMenu({ column, table, title }: ColumnHeaderMenuProps) {
  const [open, setOpen] = useState(false);
  const [filterCondition, setFilterCondition] = useState<FilterCondition>("contains");
  const [filterValue, setFilterValue] = useState("");

  const columnFilterValue = column.getFilterValue() as ColumnFilter | undefined;
  const isFiltered = columnFilterValue !== undefined;
  const isSorted = column.getIsSorted();

  // Get unique values for this column
  const uniqueValues = useMemo(() => {
    const values = new Set<string>();
    table.getPreFilteredRowModel().rows.forEach((row) => {
      const value = row.getValue(column.id);
      if (value !== null && value !== undefined && value !== "") {
        values.add(String(value));
      }
    });
    return Array.from(values).sort();
  }, [table, column.id]);

  const selectedUniqueValues = useMemo(() => {
    return columnFilterValue?.selectedValues || uniqueValues;
  }, [columnFilterValue, uniqueValues]);

  const handleSort = (direction: "asc" | "desc") => {
    column.toggleSorting(direction === "desc");
    setOpen(false);
  };

  const handleClearSort = () => {
    column.clearSorting();
    setOpen(false);
  };

  const handleFilterConditionChange = (condition: FilterCondition) => {
    setFilterCondition(condition);
    if (condition === "isEmpty") {
      column.setFilterValue({ condition: "isEmpty", value: "", selectedValues: uniqueValues });
    }
  };

  const handleFilterValueChange = (value: string) => {
    setFilterValue(value);
    if (value) {
      column.setFilterValue({ condition: filterCondition, value, selectedValues: uniqueValues });
    } else if (filterCondition !== "isEmpty") {
      column.setFilterValue(undefined);
    }
  };

  const handleUniqueValueToggle = (value: string) => {
    const currentSelected = new Set(selectedUniqueValues);
    if (currentSelected.has(value)) {
      currentSelected.delete(value);
    } else {
      currentSelected.add(value);
    }

    const selectedArray = Array.from(currentSelected);
    if (selectedArray.length === uniqueValues.length) {
      column.setFilterValue(undefined);
    } else if (selectedArray.length === 0) {
      column.setFilterValue({ condition: "selectedValues", value: "", selectedValues: [] });
    } else {
      column.setFilterValue({ condition: "selectedValues", value: "", selectedValues: selectedArray });
    }
  };

  const handleSelectAll = () => {
    column.setFilterValue(undefined);
  };

  const handleClearFilter = () => {
    column.setFilterValue(undefined);
    setFilterValue("");
    setFilterCondition("contains");
    setOpen(false);
  };

  const isNumericColumn = column.id === "employees" || column.id === "score" || column.id === "revenue" || column.id === "ebitda";

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "p-0.5 rounded hover:bg-muted transition-colors",
            isFiltered && "text-primary",
            !isFiltered && "opacity-0 group-hover:opacity-100"
          )}
        >
          <MoreHorizontal className={cn("h-4 w-4", isFiltered && "text-primary")} />
          {isFiltered && (
            <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-primary" />
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-56 bg-background border border-border shadow-lg rounded-lg z-[100]"
      >
        {/* Sorting Section */}
        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
          Ordenar
        </div>
        <DropdownMenuItem
          onClick={() => handleSort("asc")}
          className="flex items-center gap-2 cursor-pointer"
        >
          {isNumericColumn ? (
            <ArrowUp01 className="h-4 w-4" />
          ) : (
            <ArrowUpAZ className="h-4 w-4" />
          )}
          <span>{isNumericColumn ? "Menor a mayor" : "Ordenar de A a Z"}</span>
          {isSorted === "asc" && <Check className="h-4 w-4 ml-auto" />}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleSort("desc")}
          className="flex items-center gap-2 cursor-pointer"
        >
          {isNumericColumn ? (
            <ArrowDown10 className="h-4 w-4" />
          ) : (
            <ArrowDownZA className="h-4 w-4" />
          )}
          <span>{isNumericColumn ? "Mayor a menor" : "Ordenar de Z a A"}</span>
          {isSorted === "desc" && <Check className="h-4 w-4 ml-auto" />}
        </DropdownMenuItem>
        {isSorted && (
          <DropdownMenuItem
            onClick={handleClearSort}
            className="flex items-center gap-2 cursor-pointer text-muted-foreground"
          >
            <X className="h-4 w-4" />
            <span>Quitar orden</span>
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        {/* Filter Section */}
        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
          Filtrar
        </div>
        
        {/* Text/Number Filter Submenu */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="flex items-center gap-2 cursor-pointer">
            <Filter className="h-4 w-4" />
            <span>Filtros de {isNumericColumn ? "número" : "texto"}</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-56 bg-background border border-border shadow-lg rounded-lg z-[100]">
            <DropdownMenuItem
              onClick={() => handleFilterConditionChange("equals")}
              className={cn("cursor-pointer", filterCondition === "equals" && "bg-muted")}
            >
              Es igual a
              {filterCondition === "equals" && <Check className="h-4 w-4 ml-auto" />}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleFilterConditionChange("contains")}
              className={cn("cursor-pointer", filterCondition === "contains" && "bg-muted")}
            >
              Contiene
              {filterCondition === "contains" && <Check className="h-4 w-4 ml-auto" />}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleFilterConditionChange("startsWith")}
              className={cn("cursor-pointer", filterCondition === "startsWith" && "bg-muted")}
            >
              Empieza por
              {filterCondition === "startsWith" && <Check className="h-4 w-4 ml-auto" />}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleFilterConditionChange("isEmpty")}
              className={cn("cursor-pointer", filterCondition === "isEmpty" && "bg-muted")}
            >
              Está vacío
              {filterCondition === "isEmpty" && <Check className="h-4 w-4 ml-auto" />}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <div className="p-2">
              <Input
                placeholder="Valor a filtrar..."
                value={filterValue}
                onChange={(e) => handleFilterValueChange(e.target.value)}
                className="h-8 text-sm"
                disabled={filterCondition === "isEmpty"}
              />
            </div>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        {/* Unique Values Section */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="flex items-center gap-2 cursor-pointer">
            <Check className="h-4 w-4" />
            <span>Valores únicos</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-56 bg-background border border-border shadow-lg rounded-lg z-[100]">
            <div className="p-2 border-b border-border">
              <button
                onClick={handleSelectAll}
                className="text-xs text-primary hover:underline"
              >
                Seleccionar todos
              </button>
            </div>
            <ScrollArea className="max-h-48">
              <div className="p-1">
                {uniqueValues.length === 0 ? (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">
                    No hay valores
                  </div>
                ) : (
                  uniqueValues.map((value) => (
                    <div
                      key={value}
                      className="flex items-center gap-2 px-2 py-1.5 hover:bg-muted rounded cursor-pointer"
                      onClick={() => handleUniqueValueToggle(value)}
                    >
                      <Checkbox
                        checked={selectedUniqueValues.includes(value)}
                        className="h-3.5 w-3.5"
                      />
                      <span className="text-sm truncate">{value}</span>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        {isFiltered && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleClearFilter}
              className="flex items-center gap-2 cursor-pointer text-destructive"
            >
              <X className="h-4 w-4" />
              <span>Quitar filtro</span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
