import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { AgentStatus } from "./types";

interface AgentIndicatorProps {
  agents: AgentStatus[];
}

export function AgentIndicator({ agents }: AgentIndicatorProps) {
  return (
    <div className="space-y-3">
      {agents.map((agent) => (
        <div
          key={agent.name}
          className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-lg border transition-all",
            agent.status === "running"
              ? "bg-primary/10 border-primary/30"
              : agent.status === "complete"
              ? "bg-green-500/10 border-green-500/30"
              : "bg-muted/30 border-border/50"
          )}
        >
          <span className="text-lg">{agent.icon}</span>
          <span className="flex-1 text-sm font-medium text-foreground">
            {agent.name}
          </span>
          {agent.status === "running" ? (
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          ) : agent.status === "complete" ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />
          )}
        </div>
      ))}
    </div>
  );
}
