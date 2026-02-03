import { useState } from "react";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { FileIcon } from "./FileIcon";
import type { FileItem as FileItemType } from "./types";

interface FileItemProps {
  file: FileItemType;
  isActive?: boolean;
  onSelect: (file: FileItemType) => void;
  onDelete: (file: FileItemType) => void;
}

export function FileItemComponent({
  file,
  isActive = false,
  onSelect,
  onDelete,
}: FileItemProps) {
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    onSelect(file);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(file);
  };

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-2 py-1.5 cursor-pointer rounded-sm transition-colors group",
        "hover:bg-sidebar-accent",
        isActive && "bg-sidebar-accent"
      )}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <FileIcon extension={file.extension} size={14} />
      
      <span className="text-xs text-sidebar-foreground truncate flex-1">
        {file.name}
      </span>

      {isHovered && (
        <button
          onClick={handleDelete}
          className="p-0.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
        >
          <Trash2 size={12} />
        </button>
      )}
    </div>
  );
}
