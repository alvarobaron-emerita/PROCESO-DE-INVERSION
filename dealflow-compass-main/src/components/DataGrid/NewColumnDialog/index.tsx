import { useState } from "react";
import { Sparkles, Type, Hash, Calendar, Tag, FileText, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AIOutputItem } from "./AIOutputItem";
import { ColumnFormat, DataSource, AIOutput, NewColumnConfig, NewColumnDialogProps } from "./types";

export type { ColumnFormat, DataSource, NewColumnConfig } from "./types";

const formatOptions: { value: ColumnFormat; label: string; icon: React.ReactNode }[] = [
  { value: "tags", label: "Etiquetas (Tags)", icon: <Tag className="h-4 w-4" /> },
  { value: "text", label: "Texto Libre", icon: <FileText className="h-4 w-4" /> },
  { value: "scoring", label: "Scoring", icon: <Sparkles className="h-4 w-4" /> },
  { value: "number", label: "Números", icon: <Hash className="h-4 w-4" /> },
  { value: "date", label: "Fecha", icon: <Calendar className="h-4 w-4" /> },
];

const createNewOutput = (): AIOutput => ({
  id: crypto.randomUUID(),
  title: "",
  format: "text",
});

export function NewColumnDialog({ open, onOpenChange, onCreateColumn }: NewColumnDialogProps) {
  const [title, setTitle] = useState("");
  const [dataSource, setDataSource] = useState<DataSource>("manual");
  const [format, setFormat] = useState<ColumnFormat | "">("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiOutputs, setAiOutputs] = useState<AIOutput[]>([createNewOutput()]);

  const isManualValid = dataSource === "manual" && title.trim() !== "" && format !== "";
  const isAIValid = dataSource === "ai" && aiPrompt.trim() !== "" && aiOutputs.every(o => o.title.trim() !== "");
  const isValid = isManualValid || isAIValid;

  const columnCount = dataSource === "ai" ? aiOutputs.length : 1;

  const handleCreate = () => {
    if (!isValid) return;
    
    if (dataSource === "manual") {
      onCreateColumn({
        title: title.trim(),
        dataSource,
        format: format as ColumnFormat,
      });
    } else {
      onCreateColumn({
        title: aiOutputs[0]?.title.trim() || "AI Column",
        dataSource,
        format: aiOutputs[0]?.format || "text",
        aiPrompt,
        aiOutputs: aiOutputs.map(o => ({ ...o, title: o.title.trim() })),
      });
    }

    resetForm();
    onOpenChange(false);
  };

  const resetForm = () => {
    setTitle("");
    setDataSource("manual");
    setFormat("");
    setAiPrompt("");
    setAiOutputs([createNewOutput()]);
  };

  const handleCancel = () => {
    resetForm();
    onOpenChange(false);
  };

  const handleAddOutput = () => {
    setAiOutputs(prev => [...prev, createNewOutput()]);
  };

  const handleUpdateOutput = (id: string, updates: Partial<AIOutput>) => {
    setAiOutputs(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o));
  };

  const handleDeleteOutput = (id: string) => {
    setAiOutputs(prev => prev.filter(o => o.id !== id));
  };

  const getButtonText = () => {
    if (dataSource === "manual") return "Crear Columna";
    return columnCount === 1 ? "Crear Columna" : `Crear ${columnCount} Columnas`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-lg font-semibold">Nueva Columna</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Configura una nueva columna para la tabla de datos.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0 -mx-6 px-6 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
          <div className="space-y-5 py-4 pb-6">
            {/* Data Source Toggle */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Origen de los datos</Label>
              <ToggleGroup
                type="single"
                value={dataSource}
                onValueChange={(value) => value && setDataSource(value as DataSource)}
                className="justify-start gap-2"
              >
                <ToggleGroupItem
                  value="manual"
                  className="flex items-center gap-2 px-4 py-2 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                >
                  <Type className="h-4 w-4" />
                  Manual
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="ai"
                  className="flex items-center gap-2 px-4 py-2 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                >
                  <Sparkles className="h-4 w-4" />
                  Potenciada por IA
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            {/* Manual Mode Fields */}
            {dataSource === "manual" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="column-title" className="text-sm font-medium">
                    Título de la columna
                  </Label>
                  <Input
                    id="column-title"
                    placeholder="Ej: Región, Certificaciones..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="border-border focus:border-primary"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Tipo de formato</Label>
                  <Select value={format} onValueChange={(value) => setFormat(value as ColumnFormat)}>
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
              </>
            )}

            {/* AI Mode Fields */}
            {dataSource === "ai" && (
              <div className="space-y-4 rounded-lg border border-border bg-muted/30 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-primary">
                  <Sparkles className="h-4 w-4" />
                  Configuración de IA
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="ai-prompt" className="text-sm font-medium">
                    Prompt de IA
                  </Label>
                  <Textarea
                    id="ai-prompt"
                    placeholder="Describe qué información debe extraer o generar la IA para estas columnas basándose en el nombre de la empresa y su descripción..."
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    className="min-h-[100px] border-border resize-none"
                  />
                </div>

                {/* Outputs Section */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Columnas de Salida</Label>
                  
                  <div className="space-y-3">
                    {aiOutputs.map((output, index) => (
                      <AIOutputItem
                        key={output.id}
                        output={output}
                        index={index}
                        canDelete={aiOutputs.length > 1}
                        onUpdate={handleUpdateOutput}
                        onDelete={handleDeleteOutput}
                      />
                    ))}
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full mt-2"
                    onClick={handleAddOutput}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Añadir otra salida
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex-shrink-0 gap-2 sm:gap-0 pt-4 border-t border-border bg-background shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button onClick={handleCreate} disabled={!isValid}>
            {getButtonText()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
