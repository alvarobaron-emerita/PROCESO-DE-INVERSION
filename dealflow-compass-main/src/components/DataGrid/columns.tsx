import { ColumnDef } from "@tanstack/react-table";
import { ExternalLink } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Company } from "./types";
import { ScoreBadge } from "./ScoreBadge";
import { StatusTag } from "./StatusTag";

export const columns: ColumnDef<Company>[] = [
  {
    id: "select",
    size: 48,
    minSize: 48,
    maxSize: 48,
    enableResizing: false,
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
        className="border-muted-foreground"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        className="border-muted-foreground"
      />
    ),
  },
  {
    accessorKey: "name",
    header: "Company",
    size: 220,
    minSize: 150,
    cell: ({ row }) => {
      const company = row.original;
      return (
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-medium text-foreground text-sm truncate">
            {company.name}
          </span>
          <a
            href={`https://${company.url}`}
            target="_blank"
            rel="noopener noreferrer"
            className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground flex-shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      );
    },
  },
  {
    accessorKey: "city",
    header: "City",
    size: 140,
    minSize: 100,
    cell: ({ getValue }) => (
      <span className="text-sm text-foreground">{getValue<string>()}</span>
    ),
  },
  {
    accessorKey: "employees",
    header: "Employees",
    size: 90,
    minSize: 70,
    cell: ({ getValue }) => (
      <span className="text-sm text-foreground text-center block">
        {getValue<string>()}
      </span>
    ),
  },
  {
    accessorKey: "description",
    header: "Description",
    size: 200,
    minSize: 120,
    cell: ({ getValue }) => {
      const description = getValue<string>();
      const truncated =
        description.length > 50
          ? `${description.substring(0, 50)}...`
          : description;
      return (
        <p
          className="text-sm text-muted-foreground truncate"
          title={description}
        >
          {truncated}
        </p>
      );
    },
  },
  {
    accessorKey: "revenue",
    header: "Revenue",
    size: 100,
    minSize: 80,
    cell: ({ getValue }) => (
      <span className="font-mono text-sm text-foreground text-right block">
        {getValue<string>()}
      </span>
    ),
  },
  {
    accessorKey: "ebitda",
    header: "EBITDA",
    size: 100,
    minSize: 80,
    cell: ({ getValue }) => (
      <span className="font-mono text-sm text-foreground text-right block">
        {getValue<string>()}
      </span>
    ),
  },
  {
    accessorKey: "score",
    header: () => (
      <span>
        <span className="text-muted-foreground/70">[AI]</span> Relevo
      </span>
    ),
    size: 110,
    minSize: 90,
    cell: ({ getValue }) => (
      <div className="flex justify-center">
        <ScoreBadge score={getValue<number>()} />
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    size: 140,
    minSize: 100,
    cell: ({ getValue }) => (
      <div className="flex justify-center">
        <StatusTag status={getValue<string>()} />
      </div>
    ),
  },
];
