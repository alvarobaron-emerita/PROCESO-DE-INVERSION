import { 
  File, 
  FileText, 
  FileSpreadsheet, 
  FileImage, 
  FileCode
} from "lucide-react";

interface FileIconProps {
  extension?: string;
  size?: number;
}

export function FileIcon({ extension, size = 14 }: FileIconProps) {
  const ext = extension?.toLowerCase();

  switch (ext) {
    case 'pdf':
      return <FileText size={size} className="text-red-500 shrink-0" />;
    case 'csv':
    case 'xlsx':
    case 'xls':
      return <FileSpreadsheet size={size} className="text-green-600 shrink-0" />;
    case 'doc':
    case 'docx':
      return <FileText size={size} className="text-blue-600 shrink-0" />;
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'svg':
    case 'webp':
      return <FileImage size={size} className="text-purple-500 shrink-0" />;
    case 'js':
    case 'ts':
    case 'tsx':
    case 'jsx':
    case 'py':
    case 'json':
    case 'html':
    case 'css':
      return <FileCode size={size} className="text-yellow-600 shrink-0" />;
    default:
      return <File size={size} className="text-muted-foreground shrink-0" />;
  }
}
