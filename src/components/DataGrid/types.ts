export interface ViewInfo {
  id: string;
  name: string;
  icon: string;
  type: "system" | "custom";
  visibleColumns?: string[];
  rowCount?: number;
}
