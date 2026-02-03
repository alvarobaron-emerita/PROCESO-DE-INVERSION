import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppSidebar, type Project } from "~/components/AppSidebar";
import { MainContent } from "~/components/MainContent";
import { AIChatSidebar } from "~/components/AIChatSidebar";
import type { ToolType } from "~/components/ToolSwitcher";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [chatCollapsed, setChatCollapsed] = useState(false);
  const [activeTool, setActiveTool] = useState<ToolType>("search");
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        activeProject={activeProject}
        onProjectChange={setActiveProject}
        showSettings={showSettings}
        onSettingsToggle={setShowSettings}
        activeTool={activeTool}
      />
      <MainContent
        activeTool={activeTool}
        onToolChange={setActiveTool}
        activeProject={activeProject}
        showSettings={showSettings}
      />
      <AIChatSidebar
        collapsed={chatCollapsed}
        onToggle={() => setChatCollapsed(!chatCollapsed)}
      />
    </div>
  );
}
