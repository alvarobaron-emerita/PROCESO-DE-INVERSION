import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Header, flexRender, Table } from "@tanstack/react-table";
import { GripVertical, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Company } from "./types";
import { ColumnHeaderMenu } from "./ColumnHeaderMenu";

interface DraggableHeaderProps {
  header: Header<Company, unknown>;
  table: Table<Company>;
}

export function DraggableHeader({ header, table }: DraggableHeaderProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: header.column.id,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    width: header.getSize(),
    position: "relative",
    zIndex: isDragging ? 1 : 0,
  };

  const isSorted = header.column.getIsSorted();
  const isFiltered = header.column.getFilterValue() !== undefined;
  const isSelectColumn = header.column.id === "select";

  // Get column title for the menu
  const getColumnTitle = () => {
    const headerContent = header.column.columnDef.header;
    if (typeof headerContent === "string") return headerContent;
    if (typeof headerContent === "function") {
      const rendered = headerContent(header.getContext());
      if (typeof rendered === "string") return rendered;
      // For complex headers, use accessorKey or id
      return (header.column.columnDef as any).accessorKey || header.column.id;
    }
    return header.column.id;
  };

  return (
    <th
      ref={setNodeRef}
      style={style}
      className={cn(
        "px-4 py-3 text-left font-medium text-muted-foreground bg-background group",
        isDragging && "opacity-80 bg-muted"
      )}
    >
      <div className="flex items-center gap-1">
        {!isSelectColumn && (
          <button
            {...attributes}
            {...listeners}
            className="opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing p-0.5 -ml-1 rounded hover:bg-muted transition-opacity"
          >
            <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        )}
        <span className={cn("select-none flex items-center gap-1", isFiltered && "text-primary")}>
          {header.isPlaceholder
            ? null
            : flexRender(header.column.columnDef.header, header.getContext())}
          {isSorted === "asc" && <ArrowUp className="h-3.5 w-3.5" />}
          {isSorted === "desc" && <ArrowDown className="h-3.5 w-3.5" />}
        </span>
        {!isSelectColumn && header.column.getCanFilter() && (
          <div className="relative ml-auto">
            <ColumnHeaderMenu
              column={header.column}
              table={table}
              title={getColumnTitle()}
            />
          </div>
        )}
      </div>
      {header.column.getCanResize() && (
        <div
          onMouseDown={header.getResizeHandler()}
          onTouchStart={header.getResizeHandler()}
          className={cn(
            "absolute right-0 top-0 h-full w-1 cursor-col-resize select-none touch-none opacity-0 group-hover:opacity-100 bg-border hover:bg-primary transition-colors",
            header.column.getIsResizing() && "opacity-100 bg-primary"
          )}
        />
      )}
    </th>
  );
}
