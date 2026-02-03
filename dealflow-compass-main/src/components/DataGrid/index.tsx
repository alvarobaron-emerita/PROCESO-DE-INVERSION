import { useState, useMemo, CSSProperties, useCallback, useEffect } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
  ColumnOrderState,
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  FilterFn,
} from "@tanstack/react-table";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { restrictToHorizontalAxis } from "@dnd-kit/modifiers";
import { Sparkles, Loader2 } from "lucide-react";
import { columns as baseColumns } from "./columns";
import { mockData as initialMockData, Company, DynamicColumn, ColumnFormat } from "./types";
import { CustomView } from "./viewTypes";
import { DraggableHeader } from "./DraggableHeader";
import { ActionBar } from "./ActionBar";
import { SelectionBar } from "./SelectionBar";
import { EditPanel } from "./EditPanel";
import { NewColumnDialog, NewColumnConfig } from "./NewColumnDialog";
import { ScoreBadge } from "./ScoreBadge";
import { useToast } from "@/hooks/use-toast";

interface ColumnFilter {
  condition: string;
  value: string;
  selectedValues?: string[];
}

interface DataGridProps {
  activeView: CustomView;
  views: CustomView[];
  onMoveRows: (rowIds: number[], targetViewId: string) => void;
  onCopyRows: (rowIds: number[], targetViewId: string) => void;
}

export function DataGrid({ activeView, views, onMoveRows, onCopyRows }: DataGridProps) {
  const { toast } = useToast();
  const [data, setData] = useState<Company[]>(initialMockData);
  const [rowSelection, setRowSelection] = useState({});
  const [dynamicColumns, setDynamicColumns] = useState<DynamicColumn[]>([]);
  const [newColumnDialogOpen, setNewColumnDialogOpen] = useState(false);
  const [columnSizing, setColumnSizing] = useState({});
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({});
  const [editPanelOpen, setEditPanelOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [loadingColumns, setLoadingColumns] = useState<Set<string>>(new Set());
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  // Apply view-specific column visibility
  useEffect(() => {
    if (activeView.isCustom && activeView.visibleColumns.length > 0) {
      const allColumnIds = ["select", "name", "city", "employees", "description", "revenue", "ebitda", "score", "status", ...dynamicColumns.map(c => c.id)];
      const newVisibility: Record<string, boolean> = {};
      
      allColumnIds.forEach((colId) => {
        if (colId === "select") {
          newVisibility[colId] = true; // Always show select column
        } else {
          newVisibility[colId] = activeView.visibleColumns.includes(colId);
        }
      });
      
      setColumnVisibility(newVisibility);
    } else if (!activeView.isCustom) {
      // Reset visibility for system views
      setColumnVisibility({});
    }
  }, [activeView.id, activeView.isCustom, activeView.visibleColumns, dynamicColumns]);

  // Clear selection when view changes
  useEffect(() => {
    setRowSelection({});
  }, [activeView.id]);

  // Custom filter function for our filter format
  const customFilterFn: FilterFn<Company> = useCallback((row, columnId, filterValue: ColumnFilter) => {
    const cellValue = row.getValue(columnId);
    const stringValue = cellValue !== null && cellValue !== undefined ? String(cellValue).toLowerCase() : "";
    
    if (filterValue.condition === "selectedValues" && filterValue.selectedValues) {
      if (filterValue.selectedValues.length === 0) return false;
      return filterValue.selectedValues.includes(String(cellValue));
    }

    switch (filterValue.condition) {
      case "equals":
        return stringValue === filterValue.value.toLowerCase();
      case "contains":
        return stringValue.includes(filterValue.value.toLowerCase());
      case "startsWith":
        return stringValue.startsWith(filterValue.value.toLowerCase());
      case "isEmpty":
        return stringValue === "";
      default:
        return true;
    }
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Create cell renderer based on column format
  const createCellRenderer = (format: ColumnFormat, columnId: string, isAI: boolean) => {
    return ({ row }: { row: { original: Company } }) => {
      const value = row.original[columnId];
      const isLoading = loadingColumns.has(`${row.original.id}-${columnId}`);

      if (isLoading) {
        return (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span className="text-xs">Generando...</span>
          </div>
        );
      }

      if (value === undefined || value === null || value === "") {
        if (isAI) {
          return (
            <div className="flex items-center gap-1 text-muted-foreground/50">
              <Sparkles className="h-3 w-3" />
              <span className="text-xs italic">Pendiente</span>
            </div>
          );
        }
        return <span className="text-muted-foreground/50 text-xs italic">Vacío</span>;
      }

      switch (format) {
        case "scoring":
          return (
            <div className="flex justify-center">
              <ScoreBadge score={Number(value)} />
            </div>
          );
        case "number":
          return (
            <span className="font-mono text-sm text-foreground text-right block">
              {value}
            </span>
          );
        case "tags":
          return (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
              {String(value)}
            </span>
          );
        case "date":
          return <span className="text-sm text-foreground">{String(value)}</span>;
        case "text":
        default:
          return <span className="text-sm text-muted-foreground">{String(value)}</span>;
      }
    };
  };

  // Build all columns including dynamic ones
  const allColumns = useMemo((): ColumnDef<Company>[] => {
    const dynamicColDefs: ColumnDef<Company>[] = dynamicColumns.map((col) => ({
      id: col.id,
      accessorKey: col.id,
      header: () => (
        <div className="flex items-center gap-1.5">
          {col.dataSource === "ai" && <Sparkles className="h-3 w-3 text-primary" />}
          <span>{col.title}</span>
        </div>
      ),
      size: 140,
      minSize: 100,
      cell: createCellRenderer(col.format, col.id, col.dataSource === "ai"),
      filterFn: customFilterFn,
    }));

    // Add filter function to base columns
    const baseWithFilter = baseColumns.map(col => ({
      ...col,
      filterFn: customFilterFn,
    }));

    return [...baseWithFilter, ...dynamicColDefs];
  }, [dynamicColumns, loadingColumns, customFilterFn]);

  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>(
    baseColumns.map((col) => col.id ?? (col as any).accessorKey ?? "")
  );

  const table = useReactTable({
    data,
    columns: allColumns,
    state: {
      rowSelection,
      columnOrder,
      columnSizing,
      globalFilter,
      columnVisibility,
      sorting,
      columnFilters,
    },
    enableRowSelection: true,
    enableColumnResizing: true,
    columnResizeMode: "onChange",
    onRowSelectionChange: setRowSelection,
    onColumnOrderChange: setColumnOrder,
    onColumnSizingChange: setColumnSizing,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    globalFilterFn: (row, columnId, filterValue) => {
      const search = filterValue.toLowerCase();
      const name = String(row.getValue("name") ?? "").toLowerCase();
      const city = String(row.getValue("city") ?? "").toLowerCase();
      const description = String(row.getValue("description") ?? "").toLowerCase();
      return name.includes(search) || city.includes(search) || description.includes(search);
    },
  });

  const hasActiveFilters = columnFilters.length > 0;

  const handleClearAllFilters = () => {
    setColumnFilters([]);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active && over && active.id !== over.id) {
      setColumnOrder((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const columnIds = useMemo(
    () => table.getAllLeafColumns().map((col) => col.id),
    [table]
  );

  const selectedRowCount = Object.keys(rowSelection).length;

  const getSelectedRowIds = (): number[] => {
    const selectedRowIndices = Object.keys(rowSelection).map((idx) => parseInt(idx, 10));
    return selectedRowIndices
      .map((idx) => table.getRowModel().rows[idx]?.original.id)
      .filter((id): id is number => id !== undefined);
  };

  const handleClearSelection = () => {
    setRowSelection({});
  };

  const handleColumnVisibilityChange = (columnId: string) => {
    setColumnVisibility((prev) => ({
      ...prev,
      [columnId]: prev[columnId] === false ? true : false,
    }));
  };

  const handleResetColumns = () => {
    setColumnVisibility({});
  };

  const handleDelete = () => {
    const selectedIds = getSelectedRowIds();
    setData((prevData) => prevData.filter((company) => !selectedIds.includes(company.id)));
    setRowSelection({});
  };

  const handleEdit = () => {
    const selectedRowIndices = Object.keys(rowSelection);
    if (selectedRowIndices.length === 1) {
      const rowIndex = parseInt(selectedRowIndices[0], 10);
      const selectedRow = table.getRowModel().rows[rowIndex];
      if (selectedRow) {
        setEditingCompany(selectedRow.original);
        setEditPanelOpen(true);
      }
    }
  };

  const handleMove = (targetViewId: string) => {
    const selectedIds = getSelectedRowIds();
    onMoveRows(selectedIds, targetViewId);
    setRowSelection({});
  };

  const handleCopy = (targetViewId: string) => {
    const selectedIds = getSelectedRowIds();
    onCopyRows(selectedIds, targetViewId);
    setRowSelection({});
  };

  const handleSaveCompany = (updatedCompany: Company) => {
    setData((prevData) =>
      prevData.map((company) =>
        company.id === updatedCompany.id ? updatedCompany : company
      )
    );
    setRowSelection({});
  };

  const handleCreateColumn = (config: NewColumnConfig) => {
    // Handle multiple AI outputs
    if (config.dataSource === "ai" && config.aiOutputs && config.aiOutputs.length > 0) {
      const baseTimestamp = Date.now();
      const newColumns: DynamicColumn[] = config.aiOutputs.map((output, idx) => ({
        id: `custom_${baseTimestamp}_${idx}`,
        title: output.title,
        dataSource: "ai" as const,
        format: output.format,
        aiPrompt: config.aiPrompt,
      }));

      setDynamicColumns((prev) => [...prev, ...newColumns]);
      setColumnOrder((prev) => [...prev, ...newColumns.map((c) => c.id)]);

      // Simulate loading for all new AI columns
      const loadingKeys = new Set<string>();
      newColumns.forEach((col) => {
        data.forEach((company) => {
          loadingKeys.add(`${company.id}-${col.id}`);
        });
      });
      setLoadingColumns((prev) => new Set([...prev, ...loadingKeys]));

      // Simulate AI generation with random delays
      data.forEach((company, companyIndex) => {
        newColumns.forEach((col, colIndex) => {
          setTimeout(() => {
            setData((prevData) =>
              prevData.map((c) => {
                if (c.id === company.id) {
                  let generatedValue: string | number;
                  if (col.format === "scoring") {
                    generatedValue = Math.round(Math.random() * 100) / 10;
                  } else if (col.format === "number") {
                    generatedValue = Math.floor(Math.random() * 1000);
                  } else if (col.format === "tags") {
                    const tags = ["Premium", "Export", "Bio", "D.O.", "Reserva"];
                    generatedValue = tags[Math.floor(Math.random() * tags.length)];
                  } else {
                    const samples = [
                      "Alta calidad",
                      "Exportación internacional",
                      "Producción limitada",
                      "Denominación de origen",
                      "Vinos premium",
                    ];
                    generatedValue = samples[Math.floor(Math.random() * samples.length)];
                  }
                  return { ...c, [col.id]: generatedValue };
                }
                return c;
              })
            );

            setLoadingColumns((prev) => {
              const next = new Set(prev);
              next.delete(`${company.id}-${col.id}`);
              return next;
            });
          }, 500 + companyIndex * 100 + colIndex * 50);
        });
      });

      const columnCount = config.aiOutputs.length;
      toast({
        title: columnCount === 1 ? "Columna creada" : `${columnCount} columnas creadas`,
        description: columnCount === 1 
          ? `La columna "${config.aiOutputs[0].title}" se ha añadido correctamente.`
          : `Se han añadido ${columnCount} columnas con IA.`,
      });
    } else {
      // Manual column
      const columnId = `custom_${Date.now()}`;
      const newColumn: DynamicColumn = {
        id: columnId,
        title: config.title,
        dataSource: config.dataSource,
        format: config.format,
        aiPrompt: config.aiPrompt,
      };

      setDynamicColumns((prev) => [...prev, newColumn]);
      setColumnOrder((prev) => [...prev, columnId]);

      toast({
        title: "Columna creada",
        description: `La columna "${config.title}" se ha añadido correctamente.`,
      });
    }
  };

  const dynamicColumnList = dynamicColumns.map((col) => ({
    id: col.id,
    label: col.dataSource === "ai" ? `[AI] ${col.title}` : col.title,
  }));

  return (
    <div className="flex flex-col h-full">
      <ActionBar 
        searchValue={globalFilter} 
        onSearchChange={setGlobalFilter}
        columnVisibility={columnVisibility}
        onColumnVisibilityChange={handleColumnVisibilityChange}
        onResetColumns={handleResetColumns}
        onNewColumn={() => setNewColumnDialogOpen(true)}
        dynamicColumns={dynamicColumnList}
        hasActiveFilters={hasActiveFilters}
        onClearAllFilters={handleClearAllFilters}
      />
      
      <div className="overflow-x-auto border border-border rounded-lg bg-card flex-1">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToHorizontalAxis]}
        >
          <table
            className="w-full text-sm"
            style={{ width: table.getCenterTotalSize() }}
          >
            <thead className="sticky top-0 z-50 bg-[hsl(var(--header-background))] border-b border-border">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  <SortableContext
                    items={columnIds}
                    strategy={horizontalListSortingStrategy}
                  >
                    {headerGroup.headers.map((header) => (
                      <DraggableHeader key={header.id} header={header} table={table} />
                    ))}
                  </SortableContext>
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-border">
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="group hover:bg-muted/30 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => {
                    const cellStyle: CSSProperties = {
                      width: cell.column.getSize(),
                    };
                    return (
                      <td
                        key={cell.id}
                        className="px-4 py-3"
                        style={cellStyle}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </DndContext>
      </div>

      <SelectionBar
        selectedCount={selectedRowCount}
        views={views}
        currentViewId={activeView.id}
        onMove={handleMove}
        onCopy={handleCopy}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <EditPanel
        open={editPanelOpen}
        onOpenChange={setEditPanelOpen}
        company={editingCompany}
        onSave={handleSaveCompany}
      />

      <NewColumnDialog
        open={newColumnDialogOpen}
        onOpenChange={setNewColumnDialogOpen}
        onCreateColumn={handleCreateColumn}
      />
    </div>
  );
}
