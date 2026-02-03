export interface CustomView {
  id: string;
  name: string;
  icon?: string;
  visibleColumns: string[];
  rowIds: Set<number>;
  isCustom: boolean;
}

export interface ViewConfig {
  name: string;
  icon: string;
  visibleColumns: string[];
}

// Default system views
export const defaultViews: CustomView[] = [
  {
    id: "all",
    name: "All",
    icon: "LayoutGrid",
    visibleColumns: [],
    rowIds: new Set(),
    isCustom: false,
  },
  {
    id: "longlist",
    name: "Longlist",
    icon: "Inbox",
    visibleColumns: [],
    rowIds: new Set(),
    isCustom: false,
  },
  {
    id: "shortlist",
    name: "Shortlist",
    icon: "Star",
    visibleColumns: [],
    rowIds: new Set(),
    isCustom: false,
  },
  {
    id: "discarded",
    name: "Discarded",
    icon: "Trash2",
    visibleColumns: [],
    rowIds: new Set(),
    isCustom: false,
  },
];

// Available columns for selection
export const availableColumns = [
  { id: "name", label: "Company" },
  { id: "city", label: "City" },
  { id: "employees", label: "Employees" },
  { id: "description", label: "Description" },
  { id: "revenue", label: "Revenue" },
  { id: "ebitda", label: "EBITDA" },
  { id: "score", label: "[AI] Relevo" },
  { id: "status", label: "Status" },
];

// Available icons for view selection
export const availableViewIcons = [
  { id: "Eye", label: "Vista" },
  { id: "Table", label: "Tabla" },
  { id: "LayoutGrid", label: "Cuadrícula" },
  { id: "List", label: "Lista" },
  { id: "Filter", label: "Filtro" },
  { id: "Target", label: "Objetivo" },
  { id: "Bookmark", label: "Marcador" },
  { id: "Flag", label: "Bandera" },
  { id: "Heart", label: "Favorito" },
  { id: "Zap", label: "Rápido" },
  { id: "TrendingUp", label: "Tendencia" },
  { id: "BarChart3", label: "Gráfico" },
  { id: "Users", label: "Usuarios" },
  { id: "Building2", label: "Empresa" },
  { id: "FolderOpen", label: "Carpeta" },
  { id: "FileText", label: "Documento" },
];
