/**
 * DataGrid Component
 * Tabla de datos con TanStack Table conectada al backend
 */

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  ColumnVisibilityState,
  RowSelectionState,
  ColumnSizingState,
  ColumnOrderState,
  ColumnPinningState,
  FilterFn,
} from "@tanstack/react-table";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  PanelLeft,
  PanelRight,
  PinOff,
  GripVertical,
  Columns,
  Upload,
} from "lucide-react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Checkbox } from "~/components/ui/checkbox";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { ColumnVisibilityPopover } from "./ColumnVisibilityPopover";
import { useApi, useMutation } from "~/trpc/react";
import { ViewInfo } from "./types";
import { FloatingSelectionBar } from "./FloatingSelectionBar";
import { cn } from "~/lib/utils";
import { getFastApiBaseUrl } from "~/lib/api-config";
import { ColumnFilterPopover } from "./ColumnFilterPopover";

interface DataRow {
  _uid: string;
  [key: string]: unknown;
}

interface DataQueryResponse {
  data: DataRow[];
  columns: string[];
  totalRowCount: number;
  offset: number;
  limit: number;
  nextCursor: number | null;
}

const PAGE_SIZE = 750;
const DEFAULT_SEARCH_COLUMNS = [
  "name",
  "city",
  "description",
  "website",
  "status",
  "revenue",
  "ebitda",
  "employees",
];

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
  onOpenAddColumn: () => void;
  /** Si se proporciona, muestra botón "Añadir archivo" para subir más datos (append) */
  onOpenAddFile?: () => void;
  customColumnDefs: Record<
    string,
    {
      type: string;
      label?: string;
      options?: string[];
      prompt?: string;
      modelSelected?: string;
      smartContext?: boolean;
    }
  >;
}

export function DataGrid({
  projectId,
  activeView,
  views,
  onMoveRows,
  onCopyRows,
  onOpenAddColumn,
  onOpenAddFile,
  customColumnDefs,
}: DataGridProps) {
  const api = useApi();
  const queryClient = useQueryClient();
  const baseUrl = getFastApiBaseUrl();

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({});
  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>([]);
  const [columnPinning, setColumnPinning] = useState<ColumnPinningState>({ left: [], right: [] });
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [searchInput, setSearchInput] = useState("");
  const [appliedGlobalFilter, setAppliedGlobalFilter] = useState("");
  const [columnValueState, setColumnValueState] = useState<Record<string, { values: string[]; loading: boolean }>>({});
  const [activeCell, setActiveCell] = useState<{ rowIndex: number; columnId: string } | null>(null);
  const [editingCell, setEditingCell] = useState<{ rowUid: string; columnId: string } | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [draggedCol, setDraggedCol] = useState<string | null>(null);

  const mutateUpdateRowRef = useRef<
    (vars: { projectId: string; rowUid: string; updates: Record<string, unknown> }) => void
  >(() => {});

  const tableRef = useRef<HTMLDivElement>(null);
  const parentRef = useRef<HTMLDivElement>(null);
  const cellRefsMap = useRef<Map<string, HTMLDivElement>>(new Map());
  const measureRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearchInput("");
    setAppliedGlobalFilter("");
    setColumnFilters([]);
    setColumnVisibility({});
    setRowSelection({});
    setColumnValueState({});
  }, [projectId, activeView.id]);

  useEffect(() => {
    const handle = setTimeout(() => {
      setAppliedGlobalFilter(searchInput.trim());
    }, 300);
    return () => clearTimeout(handle);
  }, [searchInput]);

  const backendColumnFilters = useMemo(() => {
    const map: Record<string, string[]> = {};
    columnFilters.forEach((filter) => {
      if (Array.isArray(filter.value) && filter.value.length > 0) {
        map[filter.id] = filter.value.map((value) => String(value));
      }
    });
    return map;
  }, [columnFilters]);

  const columnFiltersKey = useMemo(() => JSON.stringify(backendColumnFilters), [backendColumnFilters]);
  const sortingPayload = useMemo(() => sorting.map(({ id, desc }) => ({ id, desc: !!desc })), [sorting]);
  const sortingKey = useMemo(() => JSON.stringify(sortingPayload), [sortingPayload]);

  useEffect(() => {
    setColumnValueState({});
  }, [columnFiltersKey, appliedGlobalFilter, sortingKey, projectId, activeView.id]);

  useEffect(() => {
    setRowSelection({});
  }, [columnFiltersKey, appliedGlobalFilter, sortingKey, projectId, activeView.id]);

  const fetchDataPage = useCallback(
    async ({ pageParam = 0 }): Promise<DataQueryResponse> => {
      const response = await fetch(
        `${baseUrl}/api/tool2/projects/${projectId}/views/${activeView.id}/data/query`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            offset: pageParam,
            limit: PAGE_SIZE,
            globalFilter: appliedGlobalFilter || undefined,
            searchableColumns: DEFAULT_SEARCH_COLUMNS,
            columnFilters: backendColumnFilters,
            sort: sortingPayload,
          }),
        }
      );

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => null);
        const detail = errorPayload?.detail ?? response.statusText;
        throw new Error(detail);
      }

      const payload = (await response.json()) as DataQueryResponse;
      return payload;
    },
    [activeView.id, appliedGlobalFilter, backendColumnFilters, baseUrl, projectId, sortingPayload]
  );

  const {
    data: pagedData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useInfiniteQuery({
    queryKey: [
      "viewData",
      projectId,
      activeView.id,
      appliedGlobalFilter,
      columnFiltersKey,
      sortingKey,
    ],
    queryFn: fetchDataPage,
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!projectId && !!activeView.id,
    staleTime: 0,
  });

  const pages = pagedData?.pages ?? [];

  const rows: DataRow[] = useMemo(() => pages.flatMap((page) => page?.data ?? []), [pages]);
  const totalRowCount = pages.length > 0 ? pages[0].totalRowCount : 0;

  const serverColumns = useMemo(() => {
    for (const page of pages) {
      if (page?.columns?.length) {
        return page.columns;
      }
    }
    return [] as string[];
  }, [pages]);

  const isInitialLoading = isLoading && rows.length === 0;
  const isEmptyState = !isLoading && totalRowCount === 0;

  const invalidateData = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: ["viewData", projectId, activeView.id],
    });
  }, [queryClient, projectId, activeView.id]);

  const updateRowMutation = useMutation(
    api.tool2.updateRow.mutationOptions({
      onSuccess: () => {
        invalidateData();
      },
    })
  );
  mutateUpdateRowRef.current = updateRowMutation.mutate;

  const columns: ColumnDef<DataRow>[] = useMemo(() => {
    if (serverColumns.length === 0) return [];

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
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
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

    const dataColumns: ColumnDef<DataRow>[] = serverColumns
      .filter((col) => col !== "_uid" && col !== "_list_id")
      .map((col) => ({
        id: col,
        accessorFn: (rowData) => (rowData as Record<string, unknown>)?.[col],
        header: col,
        size: 150,
        minSize: 60,
        maxSize: 600,
        filterFn: inArrayFilter,
        cell: ({ getValue, row, column }) => {
          const value = getValue();
          const rowUid = row.original._uid;
          const colId = column.id;
          const customDef = customColumnDefs[colId];
          const isTextColumn = customDef?.type === "text";
          const isSingleSelect = customDef?.type === "single_select";
          const isEditing = editingCell?.rowUid === rowUid && editingCell?.columnId === colId;

          if (isSingleSelect) {
            const options = customDef?.options ?? [];
            const displayVal = value != null && value !== "" ? String(value) : "—";
            return (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <span
                    className="text-sm text-foreground cursor-pointer hover:bg-muted/50 rounded px-1 -mx-1 min-h-[20px] block w-full"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {displayVal}
                  </span>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="max-h-60 overflow-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  {options.length === 0 ? (
                    <DropdownMenuItem disabled>Sin opciones</DropdownMenuItem>
                  ) : (
                    options.map((option) => (
                      <DropdownMenuItem
                        key={option}
                        onClick={() => {
                          mutateUpdateRowRef.current({
                            projectId,
                            rowUid,
                            updates: { [colId]: option },
                          });
                        }}
                      >
                        {option}
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            );
          }

          if (isTextColumn && isEditing) {
            return (
              <Input
                autoFocus
                value={editingValue}
                onChange={(e) => setEditingValue(e.target.value)}
                onBlur={() => {
                  const nextValue = editingValue.trim();
                  if (nextValue !== String(value ?? "").trim()) {
                    mutateUpdateRowRef.current({
                      projectId,
                      rowUid,
                      updates: { [colId]: nextValue },
                    });
                  }
                  setEditingCell(null);
                }}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const nextValue = editingValue.trim();
                    if (nextValue !== String(value ?? "").trim()) {
                      mutateUpdateRowRef.current({
                        projectId,
                        rowUid,
                        updates: { [colId]: nextValue },
                      });
                    }
                    setEditingCell(null);
                  }
                  if (e.key === "Escape") {
                    e.preventDefault();
                    setEditingCell(null);
                  }
                }}
                className="h-7 px-2 text-sm"
              />
            );
          }

          return (
            <span className="text-sm text-foreground">
              {value !== null && value !== undefined ? String(value) : ""}
            </span>
          );
        },
      }));

    return [...baseColumns, ...dataColumns];
  }, [serverColumns, customColumnDefs, editingCell, editingValue, projectId]);

  const table = useReactTable({
    data: rows,
    columns,
    state: {
      rowSelection,
      sorting,
      columnFilters,
      columnVisibility,
      columnSizing,
      columnOrder,
      columnPinning,
    },
    enableRowSelection: true,
    enableSorting: true,
    enableColumnFilters: true,
    enableHiding: true,
    enableColumnResizing: true,
    enableColumnOrdering: true,
    enablePinning: true,
    columnResizeMode: "onEnd",
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnSizingChange: setColumnSizing,
    onColumnOrderChange: setColumnOrder,
    onColumnPinningChange: setColumnPinning,
    filterFns: { inArray: inArrayFilter },
    getCoreRowModel: getCoreRowModel(),
  });

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 52,
    overscan: 15,
  });
  const virtualItems = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();
  const columnWidths = table.getHeaderGroups()[0]?.headers.map((h) => h.getSize()) ?? [];
  const totalTableWidth = columnWidths.reduce((a, b) => a + b, 0);

  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return;
    if (virtualItems.length === 0) return;
    const lastItem = virtualItems[virtualItems.length - 1];
    if (!lastItem) return;
    if (lastItem.index >= rows.length - 100) {
      fetchNextPage();
    }
  }, [virtualItems, hasNextPage, isFetchingNextPage, rows.length, fetchNextPage]);

  const focusCellWithRetry = useCallback(
    (cellKey: string, maxRetries = 12) => {
      let retries = 0;
      let rafId: number | null = null;
      let cancelled = false;
      const cancel = () => {
        cancelled = true;
        if (rafId != null) cancelAnimationFrame(rafId);
      };

      const tryFocus = () => {
        if (cancelled) return;
        const el = cellRefsMap.current.get(cellKey);
        if (el) {
          el.focus();
          return;
        }
        retries++;
        if (retries < maxRetries) {
          rafId = requestAnimationFrame(tryFocus);
        }
      };

      rafId = requestAnimationFrame(tryFocus);
      return cancel;
    },
    []
  );

  const focusRetryCancelRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (activeCell == null || !parentRef.current) return;

    focusRetryCancelRef.current?.();

    rowVirtualizer.scrollToIndex(activeCell.rowIndex, { align: "auto" });

    const cellKey = `${activeCell.rowIndex}-${activeCell.columnId}`;
    const cancel = focusCellWithRetry(cellKey);
    focusRetryCancelRef.current = cancel;

    return () => {
      if (cancel) cancel();
      focusRetryCancelRef.current = null;
    };
  }, [activeCell?.rowIndex, activeCell?.columnId, rowVirtualizer, focusCellWithRetry]);

  useEffect(() => {
    if (activeCell != null && hasNextPage && !isFetchingNextPage && activeCell.rowIndex >= rows.length - 100) {
      fetchNextPage();
    }
  }, [activeCell?.rowIndex, hasNextPage, isFetchingNextPage, rows.length, fetchNextPage]);

  useEffect(() => {
    parentRef.current?.scrollTo({ top: 0 });
    rowVirtualizer.scrollToIndex(0, { align: "start" });
  }, [projectId, activeView.id, appliedGlobalFilter, columnFiltersKey, sortingKey, rowVirtualizer]);

  const selectedRowUids = useMemo(
    () =>
      Object.keys(rowSelection)
        .map((idx) => {
          const row = table.getRowModel().rows[parseInt(idx, 10)];
          return row?.original._uid;
        })
        .filter((uid): uid is string => !!uid),
    [rowSelection, table]
  );

  const moveRowsMutation = useMutation(
    api.tool2.moveRows.mutationOptions({
      onSuccess: () => {
        invalidateData();
        setRowSelection({});
      },
    })
  );

  const copyRowsMutation = useMutation(
    api.tool2.copyRows.mutationOptions({
      onSuccess: () => invalidateData(),
    })
  );

  const deleteRowsMutation = useMutation(
    api.tool2.deleteRows.mutationOptions({
      onSuccess: () => {
        invalidateData();
        setRowSelection({});
      },
    })
  );

  const enrichColumnMutation = useMutation(
    api.tool2.enrichColumn.mutationOptions({
      onSuccess: (result: { processed?: number; success?: number }) => {
        invalidateData();
        if (result?.processed != null) {
          // Toast opcional: `Procesadas ${result.success}/${result.processed} filas`
        }
      },
    })
  );

  const aiColumnNames = useMemo(
    () =>
      Object.entries(customColumnDefs)
        .filter(([, def]) => def?.type === "ai_score")
        .map(([name]) => name),
    [customColumnDefs]
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
      confirm(`¿Estás seguro de que quieres eliminar ${selectedRowUids.length} fila(s)?`)
    ) {
      deleteRowsMutation.mutate({
        projectId,
        rowUids: selectedRowUids,
      });
    }
  };

  const getLocalColumnSamples = useCallback(
    (columnId: string) => {
      const set = new Set<string>();
      rows.forEach((row) => {
        const value = (row as Record<string, unknown>)[columnId];
        const strValue = value != null ? String(value).trim() : "";
        if (strValue) {
          set.add(strValue);
        }
      });
      return Array.from(set).sort((a, b) => a.localeCompare(b)).slice(0, 200);
    },
    [rows]
  );

  const autoResizeColumn = useCallback(
    (columnId: string, sampleValues: string[] = []) => {
      if (!measureRef.current) return;
      const samples = [columnId, ...sampleValues]
        .sort((a, b) => String(b).length - String(a).length)
        .slice(0, 10);
      measureRef.current.textContent = samples.join(" ");
      const w = measureRef.current.getBoundingClientRect().width;
      const padded = Math.round(Math.max(60, Math.min(600, w + 32)));
      setColumnSizing((prev) => ({ ...prev, [columnId]: padded }));
    },
    []
  );

  const handleHeaderDragStart = useCallback((e: React.DragEvent, columnId: string) => {
    setDraggedCol(columnId);
    e.dataTransfer.setData("text/plain", columnId);
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const handleHeaderDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handleHeaderDrop = useCallback(
    (e: React.DragEvent, targetColumnId: string) => {
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
    },
    [table]
  );

  const requestColumnValues = useCallback(
    (columnId: string) => {
      setColumnValueState((prev) => {
        const existing = prev[columnId];
        if (existing?.loading) {
          return prev;
        }
        return {
          ...prev,
          [columnId]: {
            values: existing?.values ?? [],
            loading: true,
          },
        };
      });

      fetch(
        `${baseUrl}/api/tool2/projects/${projectId}/views/${activeView.id}/column-values`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            columnId,
            globalFilter: appliedGlobalFilter || undefined,
            searchableColumns: DEFAULT_SEARCH_COLUMNS,
            columnFilters: backendColumnFilters,
            limit: 500,
          }),
        }
      )
        .then(async (response) => {
          if (!response.ok) {
            const errorPayload = await response.json().catch(() => null);
            throw new Error(errorPayload?.detail ?? response.statusText);
          }
          return response.json() as Promise<{ values: string[] }>;
        })
        .then((payload) => {
          setColumnValueState((prev) => ({
            ...prev,
            [columnId]: {
              values: payload.values,
              loading: false,
            },
          }));
        })
        .catch(() => {
          setColumnValueState((prev) => ({
            ...prev,
            [columnId]: {
              values: prev[columnId]?.values ?? [],
              loading: false,
            },
          }));
        });
    },
    [activeView.id, appliedGlobalFilter, backendColumnFilters, baseUrl, projectId]
  );

  if (error instanceof Error) {
    return (
      <div className="flex items-center justify-center h-64 px-6 text-center">
        <p className="text-sm text-destructive">
          Error al cargar los datos: {error.message}
        </p>
      </div>
    );
  }

  if (isInitialLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Cargando datos...</p>
      </div>
    );
  }

  if (isEmptyState) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <p className="text-muted-foreground mb-2">Esta vista está vacía</p>
        <p className="text-sm text-muted-foreground">
          Selecciona empresas de otras vistas y muévelas aquí.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 bg-background relative">
      <div
        ref={measureRef}
        className="absolute -left-[9999px] invisible whitespace-nowrap text-sm px-3 py-2 pointer-events-none"
        aria-hidden
      />
      <div className="flex items-center gap-4">
        <Input
          placeholder="Buscar en columnas clave..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="max-w-sm"
        />
        <div className="text-sm text-muted-foreground">
          {rows.length.toLocaleString()} de {totalRowCount.toLocaleString()} filas
        </div>
        <div className="ml-auto flex gap-2">
          {onOpenAddFile && (
            <Button variant="outline" size="sm" onClick={onOpenAddFile}>
              <Upload className="h-4 w-4 mr-2" />
              Añadir archivo
            </Button>
          )}
          <ColumnVisibilityPopover table={table} />
          <Button variant="outline" size="sm" onClick={onOpenAddColumn}>
            <Columns className="h-4 w-4 mr-2" />
            Columna
          </Button>
        </div>
      </div>

      <div className="rounded-md border" ref={tableRef}>
        <div
          ref={parentRef}
          className="overflow-auto border-border"
          style={{
            maxHeight: "calc(100vh - 320px)",
            minHeight: 200,
            scrollBehavior: "auto",
          }}
        >
          <div style={{ minWidth: totalTableWidth, width: totalTableWidth }}>
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
                      const columnValuesEntry = columnValueState[columnId];
                      const fallbackValues = getLocalColumnSamples(columnId);
                      const displayedValues =
                        columnValuesEntry?.values?.length ? columnValuesEntry.values : fallbackValues;
                      const loadingValues = columnValuesEntry?.loading ?? false;

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
                                ? {
                                    position: "sticky" as const,
                                    right: totalTableWidth - header.getStart() - header.getSize(),
                                    zIndex: 11,
                                    backgroundColor: "hsl(var(--muted))",
                                  }
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
                                : flexRender(header.column.columnDef.header, header.getContext())}
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
                                <ColumnFilterPopover
                                  columnId={columnId}
                                  selectedFilter={selectedFilter}
                                  values={displayedValues}
                                  isLoading={loadingValues}
                                  onFilterChange={(vals) =>
                                    header.column.setFilterValue(vals ?? undefined)
                                  }
                                  onSelectAll={(vals) =>
                                    header.column.setFilterValue(vals.length ? vals : undefined)
                                  }
                                  onAutoResize={autoResizeColumn}
                                  onRequestValues={() => requestColumnValues(columnId)}
                                />
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
                        </th>
                      );
                    })}
                  </tr>
                ))}
              </thead>
            </table>
            <div
              style={{
                height: `${totalSize}px`,
                width: totalTableWidth,
                position: "relative",
              }}
            >
              {virtualItems.map((virtualRow) => {
                const row = table.getRowModel().rows[virtualRow.index];
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
                      gridTemplateColumns: columnWidths.map((w) => `${w}px`).join(" "),
                      contain: "layout",
                    }}
                  >
                    {row.getVisibleCells().map((cell) => {
                      const isActive =
                        activeCell?.rowIndex === rowIndex && activeCell?.columnId === cell.column.id;
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
                          }}
                          onFocus={() => setActiveCell({ rowIndex, columnId: cell.column.id })}
                          onBlur={() => {
                            setTimeout(() => {
                              if (!tableRef.current?.contains(document.activeElement)) {
                                setActiveCell(null);
                              }
                            }, 0);
                          }}
                          onKeyDown={(e) => {
                            const rowUid = row.original._uid;
                            const isTextColumn = customColumnDefs[cell.column.id]?.type === "text";
                            if (editingCell?.rowUid === rowUid && editingCell?.columnId === cell.column.id) {
                              return;
                            }
                            const visibleColumns = table.getAllColumns().filter((col) => col.getIsVisible());
                            const currentColIndex = visibleColumns.findIndex((col) => col.id === cell.column.id);
                            const isMeta = e.metaKey || e.ctrlKey;
                            const getCellEl = (r: number, c: string) => cellRefsMap.current.get(`${r}-${c}`);

                            if (isTextColumn && e.key === "Enter") {
                              e.preventDefault();
                              setEditingCell({ rowUid, columnId: cell.column.id });
                              setEditingValue(String(cell.getValue() ?? ""));
                              return;
                            }
                            if (isTextColumn && e.key.length === 1 && !isMeta) {
                              e.preventDefault();
                              setEditingCell({ rowUid, columnId: cell.column.id });
                              setEditingValue(e.key);
                              return;
                            }

                            if (isMeta) {
                              switch (e.key) {
                                case "ArrowUp":
                                  e.preventDefault();
                                  setActiveCell({ rowIndex: 0, columnId: cell.column.id });
                                  rowVirtualizer.scrollToIndex(0, { align: "start" });
                                  return;
                                case "ArrowDown":
                                  e.preventDefault();
                                  {
                                    const lastRow = rows.length - 1;
                                    setActiveCell({ rowIndex: lastRow, columnId: cell.column.id });
                                    rowVirtualizer.scrollToIndex(lastRow, { align: "end" });
                                  }
                                  return;
                                case "ArrowLeft":
                                  e.preventDefault();
                                  {
                                    const firstCol = visibleColumns[0];
                                    if (firstCol) {
                                      setActiveCell({ rowIndex, columnId: firstCol.id });
                                      getCellEl(rowIndex, firstCol.id)?.focus();
                                      parentRef.current?.scrollTo({ left: 0 });
                                    }
                                  }
                                  return;
                                case "ArrowRight":
                                  e.preventDefault();
                                  {
                                    const lastCol = visibleColumns[visibleColumns.length - 1];
                                    if (lastCol) {
                                      setActiveCell({ rowIndex, columnId: lastCol.id });
                                      getCellEl(rowIndex, lastCol.id)?.focus();
                                      const el = parentRef.current;
                                      if (el) el.scrollLeft = el.scrollWidth - el.clientWidth;
                                    }
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
                          onDoubleClick={() => {
                            const isTextColumn = customColumnDefs[cell.column.id]?.type === "text";
                            if (!isTextColumn) return;
                            setEditingCell({ rowUid: row.original._uid, columnId: cell.column.id });
                            setEditingValue(String(cell.getValue() ?? ""));
                          }}
                        >
                          <span className="truncate block text-sm text-foreground w-full min-w-0">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
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

      {isFetchingNextPage && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground shadow">
          Cargando más filas...
        </div>
      )}

      {selectedRowUids.length > 0 && (
        <FloatingSelectionBar
          selectedCount={selectedRowUids.length}
          views={views}
          currentViewId={activeView.id}
          aiColumns={aiColumnNames}
          onMove={handleMoveRows}
          onCopy={handleCopyRows}
          onExecuteAI={(columnName) => {
            enrichColumnMutation.mutate({
              projectId,
              columnName,
              rowUids: selectedRowUids,
            });
          }}
          onDelete={handleDeleteRows}
          onClearSelection={() => setRowSelection({})}
        />
      )}
    </div>
  );
}
