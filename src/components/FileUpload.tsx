import { useState, useRef } from "react";
import { Upload, FileSpreadsheet, Loader2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import { useToast } from "~/hooks/use-toast";
import { getFastApiBaseUrl } from "~/lib/api-config";

interface FileUploadProps {
  projectId: string;
  onUploadSuccess: () => void;
  /** Si true, añade las filas a los datos existentes en lugar de reemplazarlos */
  appendMode?: boolean;
}

interface UploadResponse {
  message: string;
  rowCount: number;
  columnCount: number;
}

export function FileUpload({ projectId, onUploadSuccess, appendMode = false }: FileUploadProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validExtensions = [".xlsx", ".xls", ".csv", ".txt"];
    const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();

    if (!validExtensions.includes(fileExtension)) {
      toast({
        title: "Formato no válido",
        description:
          "Solo se permiten archivos Excel (.xlsx, .xls), CSV (.csv) o TXT (.txt)",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    event.target.value = ""; // reset para poder volver a elegir el mismo archivo

    try {
      const formData = new FormData();
      formData.append("file", file);

      // Usar URL absoluta siempre: evitar que quede vacía y la petición vaya a localhost:3000
      const baseUrl = getFastApiBaseUrl().trim() || "http://localhost:8000";
      const uploadUrl = `${baseUrl}/api/tool2/projects/${projectId}/upload${appendMode ? "?append=true" : ""}`;

      // Timeout largo: en Render el servidor puede estar "dormido" (cold start) o el Excel tarda en procesarse.
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5 * 60 * 1000); // 5 minutos

      const response = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
        signal: controller.signal,
        // No establecer Content-Type: el navegador pone multipart/form-data con boundary
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMessage = `Error ${response.status}: ${response.statusText}`;
        try {
          const err = await response.json();
          const detail = Array.isArray(err.detail)
            ? err.detail.map((d: { msg?: string }) => d.msg).join(", ")
            : err.detail;
          errorMessage = detail || err.message || errorMessage;
        } catch {
          // Si no se puede parsear JSON, usar statusText
        }
        throw new Error(errorMessage);
      }

      const result = (await response.json()) as UploadResponse;
      toast({
        title: "Archivo cargado",
        description: appendMode
          ? `${result.rowCount} filas añadidas correctamente`
          : `${result.rowCount} filas procesadas correctamente`,
      });
      onUploadSuccess();
    } catch (error) {
      const isAbort = error instanceof Error && error.name === "AbortError";
      const isNetwork =
        error instanceof TypeError &&
        (error.message.includes("fetch") || error.message.includes("Failed to fetch"));
      const connectionReset =
        error instanceof Error &&
        (error.message.includes("CONNECTION_RESET") || error.message.includes("connection reset"));

      let description: string;
      if (isAbort) {
        description =
          "Tiempo de espera agotado. El servidor puede estar arrancando o el archivo es muy grande. Prueba con un Excel más pequeño o espera 1 minuto y vuelve a intentar.";
      } else if (isNetwork || connectionReset) {
        description =
          "La conexión se cerró (timeout o servidor ocupado). En Render el primer uso puede tardar ~1 min. Prueba de nuevo o con un archivo más pequeño.";
      } else {
        description = error instanceof Error ? error.message : "Error desconocido";
      }

      toast({
        title: "Error al cargar archivo",
        description,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-muted-foreground/25 rounded-lg bg-muted/50">
      <FileSpreadsheet className="h-16 w-16 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold mb-2">
        {appendMode ? "Añadir archivo" : "Cargar archivo Excel/CSV/TXT"}
      </h3>
      <p className="text-sm text-muted-foreground mb-6 text-center max-w-md">
        {appendMode
          ? "Sube otro archivo para añadir filas a los datos existentes. Se unirán las columnas automáticamente."
          : "Sube un archivo de SABI (CSV, Excel o TXT) para empezar. El sistema normalizará automáticamente las columnas."}
      </p>
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv,.txt"
        onChange={handleFileSelect}
        className="hidden"
      />
      <Button
        onClick={handleClick}
        disabled={isUploading}
        className="gap-2"
      >
        {isUploading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Procesando...
          </>
        ) : (
          <>
            <Upload className="h-4 w-4" />
            Seleccionar archivo
          </>
        )}
      </Button>
      {isUploading && (
        <p className="text-xs text-muted-foreground mt-2">
          Por favor espera mientras procesamos el archivo...
        </p>
      )}
    </div>
  );
}
