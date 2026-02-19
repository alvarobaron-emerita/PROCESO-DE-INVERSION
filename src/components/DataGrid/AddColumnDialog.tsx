import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import { Switch } from "~/components/ui/switch";
import { Textarea } from "~/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

interface AddColumnDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddColumn: (config: {
    name: string;
    type: "text" | "single_select" | "ai_score";
    options?: string[];
    prompt?: string;
    modelSelected?: string;
    smartContext?: boolean;
  }) => void;
  isPending?: boolean;
}

export function AddColumnDialog({
  open,
  onOpenChange,
  onAddColumn,
  isPending = false,
}: AddColumnDialogProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<"text" | "single_select" | "ai_score">("text");
  const [optionsText, setOptionsText] = useState("");
  const [prompt, setPrompt] = useState("");
  const [modelSelected, setModelSelected] = useState("instant");
  const [smartContext, setSmartContext] = useState(true);

  const reset = () => {
    setName("");
    setType("text");
    setOptionsText("");
    setPrompt("");
    setModelSelected("instant");
    setSmartContext(true);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;
    if (type === "single_select") {
      const options = optionsText
        .split(/[,;]/)
        .map((s) => s.trim())
        .filter(Boolean);
      if (options.length === 0) return;
      onAddColumn({ name: trimmedName, type: "single_select", options });
    } else if (type === "ai_score") {
      const trimmedPrompt = prompt.trim();
      if (!trimmedPrompt) return;
      onAddColumn({
        name: trimmedName,
        type: "ai_score",
        prompt: trimmedPrompt,
        modelSelected,
        smartContext,
      });
    } else {
      onAddColumn({ name: trimmedName, type: "text" });
    }
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Añadir columna</DialogTitle>
          <DialogDescription>
            Crea una columna nueva de texto, etiquetas o IA (prompt + modelo).
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="col-name">Nombre de la columna</Label>
            <Input
              id="col-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Estado, Prioridad, Notas"
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <Label>Tipo</Label>
            <RadioGroup
              value={type}
              onValueChange={(v) => setType(v as "text" | "single_select" | "ai_score")}
              className="flex flex-col gap-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="text" id="type-text" />
                <Label htmlFor="type-text" className="font-normal cursor-pointer">
                  Texto libre
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="single_select" id="type-select" />
                <Label htmlFor="type-select" className="font-normal cursor-pointer">
                  Etiqueta (opciones fijas)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="ai_score" id="type-ai" />
                <Label htmlFor="type-ai" className="font-normal cursor-pointer">
                  Columna IA (prompt + modelo)
                </Label>
              </div>
            </RadioGroup>
          </div>
          {type === "single_select" && (
            <div className="space-y-2">
              <Label htmlFor="col-options">Opciones (separadas por coma o punto y coma)</Label>
              <Input
                id="col-options"
                value={optionsText}
                onChange={(e) => setOptionsText(e.target.value)}
                placeholder="Ej. Alta, Media, Baja o Pendiente; Contactado; Descartado"
                className="w-full"
              />
            </div>
          )}
          {type === "ai_score" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="col-prompt">Prompt de IA</Label>
                <Textarea
                  id="col-prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Ej. Analiza el riesgo regulatorio de la empresa..."
                  className="w-full min-h-[120px]"
                />
              </div>
              <div className="space-y-2">
                <Label>Modelo</Label>
                <Select value={modelSelected} onValueChange={setModelSelected}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un modelo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="instant">⚡ Instantáneo (Groq)</SelectItem>
                    <SelectItem value="batch">🏭 Batch/Económico (DeepInfra)</SelectItem>
                    <SelectItem value="complex">🧠 Razonamiento complejo (OpenAI)</SelectItem>
                    <SelectItem value="long_context">📚 Contexto largo (Gemini)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between rounded-md border px-3 py-2">
                <div className="space-y-0.5">
                  <Label className="text-sm">Smart Context</Label>
                  <p className="text-xs text-muted-foreground">
                    Optimiza columnas de contexto automáticamente.
                  </p>
                </div>
                <Switch checked={smartContext} onCheckedChange={setSmartContext} />
              </div>
            </>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={
                !name.trim() ||
                (type === "single_select" &&
                  !optionsText
                    .split(/[,;]/)
                    .map((s) => s.trim())
                    .filter(Boolean).length) ||
                (type === "ai_score" && !prompt.trim()) ||
                isPending
              }
            >
              {isPending ? "Añadiendo…" : "Añadir columna"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
