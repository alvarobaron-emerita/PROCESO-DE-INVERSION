import { Search, Download, Columns, Plus, Eye, EyeOff, RotateCcw, FilterX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePermissions } from "@/contexts/PermissionsContext";

interface ColumnConfig {
  id: string;
  label: string;
}

const AVAILABLE_COLUMNS: ColumnConfig[] = [
  { id: "name", label: "Company" },
  { id: "city", label: "City" },
  { id: "employees", label: "Employees" },
  { id: "description", label: "Description" },
  { id: "revenue", label: "Revenue" },
  { id: "ebitda", label: "EBITDA" },
  { id: "score", label: "[AI] Relevo" },
  { id: "status", label: "Status" },
];

interface ActionBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  columnVisibility: Record<string, boolean>;
  onColumnVisibilityChange: (columnId: string) => void;
  onResetColumns: () => void;
  onNewColumn: () => void;
  dynamicColumns?: { id: string; label: string }[];
  hasActiveFilters?: boolean;
  onClearAllFilters?: () => void;
}

export function ActionBar({ 
  searchValue, 
  onSearchChange,
  columnVisibility,
  onColumnVisibilityChange,
  onResetColumns,
  onNewColumn,
  dynamicColumns = [],
  hasActiveFilters = false,
  onClearAllFilters,
}: ActionBarProps) {
  const { canEdit } = usePermissions();
  const allColumns = [...AVAILABLE_COLUMNS, ...dynamicColumns];
  const isColumnVisible = (columnId: string) => {
    return columnVisibility[columnId] !== false;
  };

  return (
    <div className="flex items-center justify-between gap-4 mb-4">
      {/* Left Side - Search */}
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search companies..."
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 h-9 bg-background"
        />
      </div>

      {/* Right Side - Actions */}
      <div className="flex items-center gap-2">
        {hasActiveFilters && onClearAllFilters && (
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-1.5 text-destructive border-destructive/50 hover:bg-destructive/10"
            onClick={onClearAllFilters}
          >
            <FilterX className="h-4 w-4" />
            Limpiar filtros
          </Button>
        )}
        <Button variant="outline" size="sm" className="gap-1.5">
          <Download className="h-4 w-4" />
          Exportar
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Columns className="h-4 w-4" />
              Editar Columnas
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="end" 
            className="w-48 bg-background border border-border shadow-md rounded-lg z-50"
          >
            {allColumns.map((column) => (
              <DropdownMenuItem
                key={column.id}
                onClick={() => onColumnVisibilityChange(column.id)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-foreground cursor-pointer hover:bg-muted/50 transition-colors"
              >
                {isColumnVisible(column.id) ? (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                )}
                <span className={!isColumnVisible(column.id) ? "text-muted-foreground" : ""}>
                  {column.label}
                </span>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onResetColumns}
              className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground cursor-pointer hover:bg-muted/50 transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              Restaurar por defecto
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {canEdit && (
          <Button size="sm" className="gap-1.5" onClick={onNewColumn}>
            <Plus className="h-4 w-4" />
            New Column
          </Button>
        )}
      </div>
    </div>
  );
}