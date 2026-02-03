import { CheckCircle2, Loader2, Circle } from "lucide-react";
import { AgentStatus } from "./types";
import { cn } from "~/lib/utils";

interface AgentIndicatorProps {
  agents: AgentStatus[];
}

export function AgentIndicator({ agents }: AgentIndicatorProps) {
  return (
    <div className="space-y-2">
      {agents.map((agent, index) => (
        <div
          key={index}
          className="flex items-center gap-3 p-2 rounded-md bg-muted/30"
        >
          <span className="text-lg">{agent.icon}</span>
          <span className="text-sm text-foreground flex-1">{agent.name}</span>
          {agent.status === "complete" && (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          )}
          {agent.status === "running" && (
            <Loader2 className="h-4 w-4 text-primary animate-spin" />
          )}
          {agent.status === "pending" && (
            <Circle className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      ))}
    </div>
  );
}
