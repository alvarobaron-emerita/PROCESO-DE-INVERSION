export type ColumnFormat = "tags" | "text" | "scoring" | "number" | "date";
export type DataSource = "manual" | "ai";

export interface AIOutput {
  id: string;
  title: string;
  format: ColumnFormat;
}

export interface NewColumnConfig {
  title: string;
  dataSource: DataSource;
  format: ColumnFormat;
  aiPrompt?: string;
  aiOutputs?: AIOutput[];
}

export interface NewColumnDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateColumn: (config: NewColumnConfig) => void;
}
