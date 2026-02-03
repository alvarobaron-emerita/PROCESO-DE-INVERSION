import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { Plus, FileText, Pencil, Save, X } from "lucide-react";
import { ReportSkeleton } from "./ReportSkeleton";
import { AnalysisReport } from "./types";

interface ReportViewerProps {
  markdown: string | null;
  report: AnalysisReport | null;
  isLoading: boolean;
  onCreateProject: () => void;
  /** Si true, se muestra el textarea para editar el informe */
  isEditing?: boolean;
  onStartEdit?: () => void;
  onCancelEdit?: () => void;
  onSaveEdited?: (markdown: string) => void;
}

export function ReportViewer({
  markdown,
  report,
  isLoading,
  onCreateProject,
  isEditing = false,
  onStartEdit,
  onCancelEdit,
  onSaveEdited,
}: ReportViewerProps) {
  const [editDraft, setEditDraft] = useState(markdown ?? "");

  useEffect(() => {
    if (isEditing) setEditDraft(markdown ?? "");
  }, [isEditing, markdown]);

  if (isLoading) {
    return <ReportSkeleton />;
  }

  if (!markdown && !isEditing) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-6">
          <FileText className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">
          Lienzo de Análisis
        </h3>
        <p className="text-muted-foreground max-w-md">
          Configura el sector que deseas analizar en el panel izquierdo. El
          informe detallado aparecerá aquí con métricas, señales y empresas
          objetivo.
        </p>
      </div>
    );
  }

  const displayMarkdown = isEditing ? editDraft : (markdown ?? "");
  if (isEditing) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 p-4 overflow-hidden flex flex-col">
          <Textarea
            value={editDraft}
            onChange={(e) => setEditDraft(e.target.value)}
            className="flex-1 min-h-0 font-mono text-sm resize-none"
            placeholder="Edita el informe en Markdown..."
          />
        </div>
        <div className="p-4 border-t border-border/50 bg-background/50 flex gap-2">
          <Button
            onClick={() => onSaveEdited?.(editDraft)}
            size="lg"
            className="flex-1"
          >
            <Save className="h-4 w-4 mr-2" />
            Guardar informe
          </Button>
          <Button variant="outline" onClick={onCancelEdit} size="lg">
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1">
        <div className="p-8 max-w-4xl">
          <article className="prose prose-sm max-w-none prose-headings:text-foreground prose-headings:font-semibold prose-h1:text-2xl prose-h1:mb-6 prose-h1:pb-4 prose-h1:border-b prose-h1:border-border/50 prose-h2:text-lg prose-h2:mt-8 prose-h2:mb-4 prose-p:text-muted-foreground prose-p:leading-relaxed prose-strong:text-foreground prose-code:text-primary prose-code:bg-primary/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:font-normal prose-table:border prose-table:border-border/50 prose-table:rounded-lg prose-table:overflow-hidden prose-th:bg-muted/30 prose-th:text-foreground prose-th:font-medium prose-th:px-4 prose-th:py-2 prose-th:text-left prose-th:border-b prose-th:border-border/50 prose-td:px-4 prose-td:py-2 prose-td:border-b prose-td:border-border/30 prose-td:text-muted-foreground prose-li:text-muted-foreground prose-li:marker:text-primary prose-hr:border-border/50 prose-hr:my-6">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {displayMarkdown}
            </ReactMarkdown>
          </article>
        </div>
      </ScrollArea>

      {/* Footer: Editar informe + Crear proyecto */}
      {report && (
        <div className="p-4 border-t border-border/50 bg-background/50 flex flex-col gap-2">
          {onStartEdit && (
            <Button
              variant="outline"
              onClick={onStartEdit}
              className="w-full"
              size="lg"
            >
              <Pencil className="h-4 w-4 mr-2" />
              Editar informe
            </Button>
          )}
          <Button
            onClick={onCreateProject}
            className="w-full h-12 text-base font-semibold"
            size="lg"
          >
            <Plus className="h-5 w-5 mr-2" />
            Crear Proyecto en Data Viewer (Search OS)
          </Button>
        </div>
      )}
    </div>
  );
}
