import { Trash2, Tag, FileText, Sparkles, Hash, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AIOutput, ColumnFormat } from "./types";

const formatOptions: { value: ColumnFormat; label: string; icon: React.ReactNode }[] = [
  { value: "tags", label: "Etiquetas (Tags)", icon: <Tag className="h-4 w-4" /> },
  { value: "text", label: "Texto Libre", icon: <FileText className="h-4 w-4" /> },
  { value: "scoring", label: "Scoring", icon: <Sparkles className="h-4 w-4" /> },
  { value: "number", label: "Números", icon: <Hash className="h-4 w-4" /> },
  { value: "date", label: "Fecha", icon: <Calendar className="h-4 w-4" /> },
];

interface AIOutputItemProps {
  output: AIOutput;
  index: number;
  canDelete: boolean;
  onUpdate: (id: string, updates: Partial<AIOutput>) => void;
  onDelete: (id: string) => void;
}

export function AIOutputItem({ output, index, canDelete, onUpdate, onDelete }: AIOutputItemProps) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border border-border bg-background">
      <div className="flex-1 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded">
            Salida {index + 1}
          </span>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor={`output-title-${output.id}`} className="text-sm font-medium">
            Título de la Columna
          </Label>
          <Input
            id={`output-title-${output.id}`}
            placeholder="Ej: Región, Certificaciones..."
            value={output.title}
            onChange={(e) => onUpdate(output.id, { title: e.target.value })}
            className="border-border focus:border-primary"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Formato de Salida</Label>
          <Select
            value={output.format}
            onValueChange={(value) => onUpdate(output.id, { format: value as ColumnFormat })}
          >
            <SelectTrigger className="border-border">
              <SelectValue placeholder="Selecciona un formato..." />
            </SelectTrigger>
            <SelectContent>
              {formatOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center gap-2">
                    {option.icon}
                    {option.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {canDelete && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0 mt-6"
          onClick={() => onDelete(output.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
