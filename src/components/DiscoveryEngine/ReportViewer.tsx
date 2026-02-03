import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Button } from "~/components/ui/button";
import { Plus, FileText } from "lucide-react";
import { ReportSkeleton } from "./ReportSkeleton";
import { AnalysisReport } from "./types";

interface ReportViewerProps {
  markdown: string | null;
  report: AnalysisReport | null;
  isLoading: boolean;
  onCreateProject: () => void;
}

export function ReportViewer({
  markdown,
  report,
  isLoading,
  onCreateProject,
}: ReportViewerProps) {
  if (isLoading) {
    return <ReportSkeleton />;
  }

  if (!markdown) {
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

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1">
        <div className="p-8 max-w-4xl">
          <article className="prose prose-sm max-w-none prose-headings:text-foreground prose-headings:font-semibold prose-h1:text-2xl prose-h1:mb-6 prose-h1:pb-4 prose-h1:border-b prose-h1:border-border/50 prose-h2:text-lg prose-h2:mt-8 prose-h2:mb-4 prose-p:text-muted-foreground prose-p:leading-relaxed prose-strong:text-foreground prose-code:text-primary prose-code:bg-primary/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:font-normal prose-table:border prose-table:border-border/50 prose-table:rounded-lg prose-table:overflow-hidden prose-th:bg-muted/30 prose-th:text-foreground prose-th:font-medium prose-th:px-4 prose-th:py-2 prose-th:text-left prose-th:border-b prose-th:border-border/50 prose-td:px-4 prose-td:py-2 prose-td:border-b prose-td:border-border/30 prose-td:text-muted-foreground prose-li:text-muted-foreground prose-li:marker:text-primary prose-hr:border-border/50 prose-hr:my-6">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {markdown}
            </ReactMarkdown>
          </article>
        </div>
      </ScrollArea>

      {/* Footer Action */}
      {report && (
        <div className="p-4 border-t border-border/50 bg-background/50">
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
