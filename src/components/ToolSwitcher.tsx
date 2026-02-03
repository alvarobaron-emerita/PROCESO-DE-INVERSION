import { Zap, Search, ChevronDown, Check } from "lucide-react";
import { cn } from "~/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";

export type ToolType = "discovery" | "search";

interface Tool {
  id: ToolType;
  name: string;
  icon: React.ElementType;
  description: string;
}

const tools: Tool[] = [
  {
    id: "discovery",
    name: "Discovery Engine",
    icon: Zap,
    description: "Descubre nuevas oportunidades",
  },
  {
    id: "search",
    name: "Search OS",
    icon: Search,
    description: "Gestiona y analiza datos",
  },
];

interface ToolSwitcherProps {
  activeTool: ToolType;
  onToolChange: (tool: ToolType) => void;
  /** Cuando true, solo muestra el icono (para sidebar colapsado) */
  compact?: boolean;
}

export function ToolSwitcher({ activeTool, onToolChange, compact = false }: ToolSwitcherProps) {
  const currentTool = tools.find((t) => t.id === activeTool) || tools[1];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "flex items-center rounded-md hover:bg-accent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            compact ? "justify-center p-2 w-full" : "gap-2 px-3 py-1.5"
          )}
        >
          <currentTool.icon className="h-4 w-4 text-primary shrink-0" />
          {!compact && (
            <>
              <span className="font-medium text-sm text-foreground truncate">
                {currentTool.name}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            </>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="right"
        align="start"
        sideOffset={8}
        className="z-[100] w-56 bg-popover shadow-lg"
      >
        {tools.map((tool) => (
          <DropdownMenuItem
            key={tool.id}
            onClick={() => onToolChange(tool.id)}
            className="flex items-center gap-3 cursor-pointer py-2.5"
          >
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-md",
                activeTool === tool.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              <tool.icon className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{tool.name}</p>
              <p className="text-xs text-muted-foreground">{tool.description}</p>
            </div>
            {activeTool === tool.id && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
