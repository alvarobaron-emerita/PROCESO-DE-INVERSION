import { DiscoverySettings } from "./DiscoverySettings";
import { SearchSettings } from "./SearchSettings";
import type { ToolType } from "@/components/ToolSwitcher";

interface SettingsViewProps {
  activeTool: ToolType;
}

export function SettingsView({ activeTool }: SettingsViewProps) {
  if (activeTool === "discovery") {
    return <DiscoverySettings />;
  }
  
  return <SearchSettings />;
}
