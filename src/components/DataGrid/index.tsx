/**
 * DataGrid Component
 * Tabla de datos con TanStack Table conectada al backend
 */
import { useState, useMemo, useRef, useEffect } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  RowSelectionState,
  ColumnSizingState,
  ColumnOrderState,
  ColumnPinningState,
  FilterFn,
} from "@tanstack/react-table";
import { ArrowUpDown, ArrowUp, ArrowDown, Filter, PanelLeft, PanelRight, PinOff, GripVertical } from "lucide-react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Checkbox } from "~/components/ui/checkbox";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { ScrollArea } from "~/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { useApi, useQuery, useMutation } from "~/trpc/react";
import { ViewInfo } from "./types";
import { FloatingSelectionBar } from "./FloatingSelectionBar";
import { cn } from "~/lib/utils";

interface DataRow {
  _uid: string;
  [key: string]: unknown;
}

// Filtro tipo Excel: valor de la celda debe estar en la lista seleccionada (undefined = mostrar todas, [] = ninguna)
const inArrayFilter: FilterFn<DataRow> = (row, columnId, filterValue: string[] | undefined) => {
  if (filterValue == null) return true;
  if (filterValue.length === 0) return false;
  const cellVal = String(row.getValue(columnId) ?? "").trim();
  return filterValue.includes(cellVal);
};

interface DataGridProps {
  projectId: string;
  activeView: ViewInfo;
  views: ViewInfo[];
  onMoveRows: (rowUids: string[], targetViewId: string) => void;
  onCopyRows: (rowUids: string[], targetViewId: string) => void;
}

export function DataGrid({
  projectId,
  activeView,
  views,
  onMoveRows,
  onCopyRows,
}: DataGridProps) {
  const api = useApi();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({});
  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>([]);
  const [columnPinning, setColumnPinning] = useState<ColumnPinningState>({ left: [], right: [] });
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [globalFilter, setGlobalFilter] = useState("");
  const [activeCell, setActiveCell] = useState<{ rowIndex: number; columnId: string } | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const parentRef = useRef<HTMLDivElement>(null);
  const cellRefsMap = useRef<Map<string, HTMLDivElement>>(new Map());
  const measureRef = useRef<HTMLDivElement>(null);

  // Obtener datos de la vista activa (API oficial tRPC v11)
  const { data: viewData, isLoading, refetch } = useQuery(
    api.tool2.getViewData.queryOptions(
      { projectId, viewId: activeView.id },
      { enabled: !!projectId && !!activeView.id }
    )
  );

  const data: DataRow[] = useMemo(() => {
    if (!viewData?.data) return [];
    return viewData.data as DataRow[];
  }, [viewData]);

  const columns: ColumnDef<DataRow>[] = useMemo(() => {
    if (!viewData?.columns) return [];

    const baseColumns: ColumnDef<DataRow>[] = [
      {
        id: "select",
        size: 48,
        minSize: 48,
        maxSize: 48,
        enableSorting: false,
        enableResizing: false,
        enableColumnFilter: false,
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected()
                ? true
                : table.getIsSomePageRowsSelected()
                ? "indeterminate"
                : false
            }
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
          />
        ),
      },
    ];

    // Crear columnas dinámicas basadas en los datos
    // Nota: TanStack Table pasa el dato crudo de la fila (row.original) al accessorFn, no el objeto Row
    const dataColumns: ColumnDef<DataRow>[] = viewData.columns
      .filter((col) => col !== "_uid" && col !== "_list_id")
      .map((col) => ({
        id: col,
        accessorFn: (rowData) => (rowData as Record<string, unknown>)?.[col],
        header: col,
        size: 150,
        minSize: 60,
        maxSize: 600,
        filterFn: inArrayFilter,
        cell: ({ getValue }) => {
          const value = getValue();
          return (
            <span className="text-sm text-foreground">
              {value !== null && value !== undefined ? String(value) : ""}
            </span>
          );
        },
      }));

    return [...baseColumns, ...dataColumns];
  }, [viewData]);

  const table = useReactTable({
    data,
    columns,
    state: {
      rowSelection,
      sorting,
      columnFilters,
      columnSizing,
      columnOrder,
      columnPinning,
      globalFilter,
    },
    enableRowSelection: true,
    enableSorting: true,
    enableColumnFilters: true,
    enableColumnResizing: true,
    enableColumnOrdering: true,
    enablePinning: true,
    columnResizeMode: "onChange",
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnSizingChange: setColumnSizing,
    onColumnOrderChange: setColumnOrder,
    onColumnPinningChange: setColumnPinning,
    onGlobalFilterChange: setGlobalFilter,
    filterFns: { inArray: inArrayFilter },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    globalFilterFn: (row, columnId, filterValue) => {
      const raw = row.original;
      if (!raw || typeof raw !== "object") return false;
      const search = String(filterValue).toLowerCase();
      const rowValues = Object.values(raw)
        .map((v) => String(v ?? "").toLowerCase())
        .join(" ");
      return rowValues.includes(search);
    },
  });

  const rows = table.getRowModel().rows;
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 52,
    overscan: 14,
  });
  const virtualItems = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();
  const columnWidths = table.getHeaderGroups()[0]?.headers.map((h) => h.getSize()) ?? [];
  const totalTableWidth = columnWidths.reduce((a, b) => a + b, 0);

  const uniqueValuesByColumn = useMemo(() => {
    const map = new Map<string, string[]>();
    const preRows = table.getPreFilteredRowModel().rows;
    table.getAllLeafColumns().forEach((col) => {
      const set = new Set<string>();
      preRows.forEach((row) => {
        const v = row.getValue(col.id);
        const s = v != null ? String(v).trim() : "";
        if (s !== "") set.add(s);
      });
      map.set(col.id, Array.from(set).sort((a, b) => a.localeCompare(b)).slice(0, 500));
    });
    return map;
  }, [table, data.length]);

  // Drag and drop para reordenar columnas
  const [draggedCol, setDraggedCol] = useState<string | null>(null);
  const handleHeaderDragStart = (e: React.DragEvent, columnId: string) => {
    setDraggedCol(columnId);
    e.dataTransfer.setData("text/plain", columnId);
    e.dataTransfer.effectAllowed = "move";
  };
  const handleHeaderDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };
  const handleHeaderDrop = (e: React.DragEvent, targetColumnId: string) => {
    e.preventDefault();
    setDraggedCol(null);
    const sourceId = e.dataTransfer.getData("text/plain");
    if (!sourceId || sourceId === targetColumnId) return;
    const cols = table.getAllLeafColumns().map((c) => c.id);
    const srcIdx = cols.indexOf(sourceId);
    const tgtIdx = cols.indexOf(targetColumnId);
    if (srcIdx === -1 || tgtIdx === -1) return;
    const newOrder = [...cols];
    newOrder.splice(srcIdx, 1);
    newOrder.splice(tgtIdx, 0, sourceId);
    table.setColumnOrder(newOrder);
  };

  const autoResizeColumn = (columnId: string) => {
    if (!measureRef.current) return;
    const values = uniqueValuesByColumn.get(columnId) ?? [];
    const samples = [columnId, ...values]
      .sort((a, b) => String(b).length - String(a).length)
      .slice(0, 10);
    measureRef.current.textContent = samples.join(" ");
    const w = measureRef.current.getBoundingClientRect().width;
    const padded = Math.round(Math.max(60, Math.min(600, w + 32)));
    setColumnSizing((prev) => ({ ...prev, [columnId]: padded }));
  };

  // Navegación teclado: scroll al índice y focus en la celda (después de que el virtualizador pinte la fila)
  useEffect(() => {
    if (activeCell == null || !parentRef.current) return;
    rowVirtualizer.scrollToIndex(activeCell.rowIndex, { align: "auto" });
    const cellKey = `${activeCell.rowIndex}-${activeCell.columnId}`;
    let rafId2: number;
    const rafId1 = requestAnimationFrame(() => {
      rafId2 = requestAnimationFrame(() => {
        cellRefsMap.current.get(cellKey)?.focus();
      });
    });
    return () => {
      cancelAnimationFrame(rafId1);
      cancelAnimationFrame(rafId2!);
    };
  }, [activeCell?.rowIndex, activeCell?.columnId, rowVirtualizer]);

  const selectedRowUids = useMemo(() => {
    return Object.keys(rowSelection)
      .map((idx) => {
        const row = table.getRowModel().rows[parseInt(idx, 10)];
        return row?.original._uid;
      })
      .filter((uid): uid is string => !!uid);
  }, [rowSelection, table]);

  const moveRowsMutation = useMutation(
    api.tool2.moveRows.mutationOptions({
      onSuccess: () => {
        refetch();
        setRowSelection({});
      },
    })
  );

  const copyRowsMutation = useMutation(
    api.tool2.copyRows.mutationOptions({
      onSuccess: () => refetch(),
    })
  );

  const deleteRowsMutation = useMutation(
    api.tool2.deleteRows.mutationOptions({
      onSuccess: () => {
        refetch();
        setRowSelection({});
      },
    })
  );

  const handleMoveRows = (targetViewId: string) => {
    if (selectedRowUids.length === 0) return;
    moveRowsMutation.mutate({
      projectId,
      viewId: activeView.id,
      rowUids: selectedRowUids,
      targetViewId,
    });
    onMoveRows(selectedRowUids, targetViewId);
  };

  const handleCopyRows = (targetViewId: string) => {
    if (selectedRowUids.length === 0) return;
    copyRowsMutation.mutate({
      projectId,
      viewId: activeView.id,
      rowUids: selectedRowUids,
      targetViewId,
    });
    onCopyRows(selectedRowUids, targetViewId);
  };

  const handleDeleteRows = () => {
    if (selectedRowUids.length === 0) return;
    if (
      confirm(
        `¿Estás seguro de que quieres eliminar ${selectedRowUids.length} fila(s)?`
      )
    ) {
      deleteRowsMutation.mutate({
        projectId,
        rowUids: selectedRowUids,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Cargando datos...</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <p className="text-muted-foreground mb-2">
          Esta vista está vacía
        </p>
        <p className="text-sm text-muted-foreground">
          Selecciona empresas de otras vistas y muévelas aquí.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 bg-background relative">
      {/* Elemento oculto para medir ancho de texto al auto-ajustar columnas */}
      <div
        ref={measureRef}
        className="absolute -left-[9999px] invisible whitespace-nowrap text-sm px-3 py-2 pointer-events-none"
        aria-hidden
      />
      {/* Barra de búsqueda global */}
      <div className="flex items-center gap-4">
        <Input
          placeholder="Buscar en todos los campos..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm"
        />
        <div className="text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} de {data.length} filas
        </div>
      </div>

      {/* Tabla: un solo scroll (header + body) para que horizontal vayan juntos */}
      <div className="rounded-md border" ref={tableRef}>
        <div
          ref={parentRef}
          className="overflow-auto border-border"
          style={{
            maxHeight: "calc(100vh - 320px)",
            minHeight: 200,
          }}
        >
          <div style={{ minWidth: totalTableWidth, width: totalTableWidth }}>
            {/* Cabecera: sticky para que al bajar siga visible */}
            <table
              className="w-full border-collapse border-b border-border"
              style={{ tableLayout: "fixed", width: totalTableWidth }}
            >
              <thead className="sticky top-0 z-10 bg-muted/95 backdrop-blur-sm shadow-sm">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id} className="border-b border-border bg-muted/90">
                    {headerGroup.headers.map((header) => {
                      const canSort = header.column.getCanSort();
                      const isSorted = header.column.getIsSorted();
                      const canFilter = header.column.getCanFilter();
                      const columnId = header.column.id;
                      const selectedFilter = (header.column.getFilterValue() as string[] | undefined) ?? [];
                      const uniqueValues = uniqueValuesByColumn.get(columnId) ?? [];
                      const toggleFilterValue = (value: string) => {
                        const next = selectedFilter.includes(value)
                          ? selectedFilter.filter((x) => x !== value)
                          : [...selectedFilter, value];
                        header.column.setFilterValue(next.length ? next : undefined);
                      };
                      const selectAll = () =>
                        header.column.setFilterValue(uniqueValues.length ? uniqueValues : undefined);
                      const clearFilter = () => header.column.setFilterValue(undefined);
                      return (
                        <th
                          key={header.id}
                          className={cn(
                            "px-3 py-2 text-left align-middle font-semibold text-foreground border-r border-border last:border-r-0 relative select-none",
                            canSort && "cursor-pointer hover:bg-muted",
                            draggedCol === columnId && "opacity-50"
                          )}
                          style={{
                            width: header.getSize(),
                            minWidth: header.getSize(),
                            maxWidth: header.getSize(),
                            ...(header.column.getIsPinned() === "left"
                              ? { position: "sticky" as const, left: header.getStart(), zIndex: 11, backgroundColor: "hsl(var(--muted))" }
                              : header.column.getIsPinned() === "right"
                                ? { position: "sticky" as const, right: totalTableWidth - header.getStart() - header.getSize(), zIndex: 11, backgroundColor: "hsl(var(--muted))" }
                                : {}),
                          }}
                          draggable={columnId !== "select"}
                          onDragStart={(e) => columnId !== "select" && handleHeaderDragStart(e, columnId)}
                          onDragOver={handleHeaderDragOver}
                          onDrop={(e) => columnId !== "select" && handleHeaderDrop(e, columnId)}
                          onDragEnd={() => setDraggedCol(null)}
                          onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                        >
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1 overflow-hidden min-h-[28px]">
                              {columnId !== "select" && (
                                <GripVertical className="h-4 w-4 flex-shrink-0 text-muted-foreground cursor-grab active:cursor-grabbing" />
                              )}
                              {header.isPlaceholder
                                ? null
                                : flexRender(
                                    header.column.columnDef.header,
                                    header.getContext()
                                  )}
                              {canSort && (
                                <span className="flex-shrink-0 text-muted-foreground">
                                  {isSorted === "asc" ? (
                                    <ArrowUp className="h-4 w-4" />
                                  ) : isSorted === "desc" ? (
                                    <ArrowDown className="h-4 w-4" />
                                  ) : (
                                    <ArrowUpDown className="h-4 w-4 opacity-50" />
                                  )}
                                </span>
                              )}
                              {canFilter && columnId !== "select" && (
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 flex-shrink-0"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <Filter className={cn("h-4 w-4", selectedFilter.length > 0 && "text-primary")} />
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-64 p-0" align="start" onClick={(e) => e.stopPropagation()}>
                                    <div className="p-2 border-b flex justify-between items-center">
                                      <span className="text-sm font-medium">Filtrar por valores</span>
                                      <div className="flex gap-1">
                                        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={selectAll}>
                                          Todos
                                        </Button>
                                        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => header.column.setFilterValue([])}>
                                          Ninguno
                                        </Button>
                                      </div>
                                    </div>
                                    <ScrollArea className="h-[240px]">
                                      <div className="p-2 space-y-1">
                                        {uniqueValues.map((val) => (
                                          <label
                                            key={val}
                                            className="flex items-center gap-2 cursor-pointer text-sm hover:bg-muted/50 rounded px-2 py-1"
                                          >
                                            <Checkbox
                                              checked={selectedFilter == null ? true : selectedFilter.includes(val)}
                                              onCheckedChange={() => toggleFilterValue(val)}
                                            />
                                            <span className="truncate">{val}</span>
                                          </label>
                                        ))}
                                        {uniqueValues.length === 0 && (
                                          <p className="text-sm text-muted-foreground py-2">Sin valores únicos</p>
                                        )}
                                      </div>
                                    </ScrollArea>
                                    <div className="border-t p-2">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="w-full justify-start text-xs"
                                        onClick={() => autoResizeColumn(columnId)}
                                      >
                                        Auto-ajustar ancho de columna
                                      </Button>
                                    </div>
                                  </PopoverContent>
                                </Popover>
                              )}
                              {header.column.getCanPin() && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 flex-shrink-0"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      {header.column.getIsPinned() === "left" ? (
                                        <PanelLeft className="h-4 w-4 text-primary" />
                                      ) : header.column.getIsPinned() === "right" ? (
                                        <PanelRight className="h-4 w-4 text-primary" />
                                      ) : (
                                        <PinOff className="h-4 w-4 text-muted-foreground" />
                                      )}
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="start" onClick={(e) => e.stopPropagation()}>
                                    <DropdownMenuItem onClick={() => header.column.pin("left")}>
                                      <PanelLeft className="h-4 w-4 mr-2" /> Fijar a la izquierda
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => header.column.pin("right")}>
                                      <PanelRight className="h-4 w-4 mr-2" /> Fijar a la derecha
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => header.column.pin(false)}>
                                      <PinOff className="h-4 w-4 mr-2" /> Soltar
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </div>
                          </div>
                          {header.column.getCanResize() && (
                            <div
                              onMouseDown={header.getResizeHandler()}
                              onTouchStart={header.getResizeHandler()}
                              className={cn(
                                "absolute right-0 top-0 h-full w-1.5 cursor-col-resize touch-none select-none hover:bg-primary/50 active:bg-primary",
                                header.column.getIsResizing() && "bg-primary"
                              )}
                              style={{ touchAction: "none" }}
                            />
                          )}
                        </th>
                      );
                    })}
                  </tr>
                ))}
              </thead>
            </table>
            {/* Body virtualizado: mismo ancho que la tabla */}
            <div
              style={{
                height: `${totalSize}px`,
                width: totalTableWidth,
                position: "relative",
              }}
            >
              {virtualItems.map((virtualRow) => {
                const row = rows[virtualRow.index];
                if (!row) return null;
                const rowIndex = virtualRow.index;
                return (
                  <div
                    key={row.id}
                    data-index={virtualRow.index}
                    className={cn(
                      "border-b border-border transition-colors hover:bg-muted/30 grid items-center",
                      rowIndex % 2 === 0 ? "bg-background" : "bg-muted/5"
                    )}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: totalTableWidth,
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                      gridTemplateColumns: columnWidths
                        .map((w) => `${w}px`)
                        .join(" "),
                    }}
                  >
                    {row.getVisibleCells().map((cell) => {
                      const isActive =
                        activeCell?.rowIndex === rowIndex &&
                        activeCell?.columnId === cell.column.id;
                      const cellKey = `${rowIndex}-${cell.column.id}`;
                      return (
                        <div
                          key={cell.id}
                          ref={(el) => {
                            if (el) cellRefsMap.current.set(cellKey, el);
                          }}
                          role="gridcell"
                          tabIndex={0}
                          data-cell-id={cellKey}
                          className={cn(
                            "px-3 py-2 flex items-center border-r border-border last:border-r-0 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset cursor-cell overflow-hidden min-h-0",
                            isActive && "bg-primary/10 ring-2 ring-primary"
                          )}
                          style={{
                            width: cell.column.getSize(),
                            minWidth: cell.column.getSize(),
                            maxWidth: cell.column.getSize(),
                            ...(cell.column.getIsPinned() === "left"
                              ? { position: "sticky" as const, left: cell.column.getStart(), zIndex: 1, backgroundColor: rowIndex % 2 === 0 ? "hsl(var(--background))" : "hsl(var(--muted) / 0.2)" }
                              : cell.column.getIsPinned() === "right"
                                ? { position: "sticky" as const, right: totalTableWidth - cell.column.getStart() - cell.column.getSize(), zIndex: 1, backgroundColor: rowIndex % 2 === 0 ? "hsl(var(--background))" : "hsl(var(--muted) / 0.2)" }
                                : {}),
                          }}
                          onFocus={() =>
                            setActiveCell({ rowIndex, columnId: cell.column.id })
                          }
                          onBlur={() => {
                            setTimeout(() => {
                              if (!tableRef.current?.contains(document.activeElement)) {
                                setActiveCell(null);
                              }
                            }, 0);
                          }}
                          onKeyDown={(e) => {
                            const visibleColumns = table
                              .getAllColumns()
                              .filter((col) => col.getIsVisible());
                            const currentColIndex = visibleColumns.findIndex(
                              (col) => col.id === cell.column.id
                            );
                            const isMeta = e.metaKey || e.ctrlKey;
                            const getCellEl = (r: number, c: string) =>
                              cellRefsMap.current.get(`${r}-${c}`);

                            if (isMeta) {
                              switch (e.key) {
                                case "ArrowUp":
                                  e.preventDefault();
                                  setActiveCell({ rowIndex: 0, columnId: cell.column.id });
                                  rowVirtualizer.scrollToIndex(0, { align: "start" });
                                  return;
                                case "ArrowDown":
                                  e.preventDefault();
                                  const lastRow = rows.length - 1;
                                  setActiveCell({ rowIndex: lastRow, columnId: cell.column.id });
                                  rowVirtualizer.scrollToIndex(lastRow, { align: "end" });
                                  return;
                                case "ArrowLeft":
                                  e.preventDefault();
                                  if (currentColIndex > 0) {
                                    const prevCol = visibleColumns[currentColIndex - 1];
                                    setActiveCell({ rowIndex, columnId: prevCol.id });
                                    getCellEl(rowIndex, prevCol.id)?.focus();
                                  }
                                  return;
                                case "ArrowRight":
                                  e.preventDefault();
                                  if (currentColIndex < visibleColumns.length - 1) {
                                    const nextCol = visibleColumns[currentColIndex + 1];
                                    setActiveCell({ rowIndex, columnId: nextCol.id });
                                    getCellEl(rowIndex, nextCol.id)?.focus();
                                  }
                                  return;
                                default:
                                  break;
                              }
                            }

                            switch (e.key) {
                              case "ArrowRight":
                                e.preventDefault();
                                if (currentColIndex < visibleColumns.length - 1) {
                                  const nextCol = visibleColumns[currentColIndex + 1];
                                  setActiveCell({ rowIndex, columnId: nextCol.id });
                                  getCellEl(rowIndex, nextCol.id)?.focus();
                                }
                                break;
                              case "ArrowLeft":
                                e.preventDefault();
                                if (currentColIndex > 0) {
                                  const prevCol = visibleColumns[currentColIndex - 1];
                                  setActiveCell({ rowIndex, columnId: prevCol.id });
                                  getCellEl(rowIndex, prevCol.id)?.focus();
                                }
                                break;
                              case "ArrowDown":
                                e.preventDefault();
                                if (rowIndex < rows.length - 1) {
                                  setActiveCell({
                                    rowIndex: rowIndex + 1,
                                    columnId: cell.column.id,
                                  });
                                  rowVirtualizer.scrollToIndex(rowIndex + 1, { align: "start" });
                                }
                                break;
                              case "ArrowUp":
                                e.preventDefault();
                                if (rowIndex > 0) {
                                  setActiveCell({
                                    rowIndex: rowIndex - 1,
                                    columnId: cell.column.id,
                                  });
                                  rowVirtualizer.scrollToIndex(rowIndex - 1, { align: "end" });
                                }
                                break;
                              default:
                                break;
                            }
                          }}
                        >
                          <span className="truncate block text-sm text-foreground w-full min-w-0">
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Barra flotante de selección (estilo segunda imagen) */}
      {selectedRowUids.length > 0 && (
        <FloatingSelectionBar
          selectedCount={selectedRowUids.length}
          views={views}
          currentViewId={activeView.id}
          onMove={handleMoveRows}
          onCopy={handleCopyRows}
          onDelete={handleDeleteRows}
          onClearSelection={() => setRowSelection({})}
        />
      )}
    </div>
  );
}
