import { useState, useEffect } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { MainContent } from "@/components/MainContent";
import { AIChatSidebar } from "@/components/AIChatSidebar";
import { ToolType } from "@/components/ToolSwitcher";
import { Project, initialSearchProjects, initialDiscoveryProjects } from "@/components/ProjectSelector";
import { PermissionsProvider } from "@/contexts/PermissionsContext";

const Index = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [chatCollapsed, setChatCollapsed] = useState(false);
  const [activeTool, setActiveTool] = useState<ToolType>("search");
  const [activeProject, setActiveProject] = useState<Project | null>(initialSearchProjects[0]);
  const [showSettings, setShowSettings] = useState(false);

  // When tool changes, reset active project to first project of that tool or null
  useEffect(() => {
    const toolProjects = activeTool === "search" ? initialSearchProjects : initialDiscoveryProjects;
    // Only reset if current project doesn't match the tool
    if (activeProject && activeProject.tool !== activeTool) {
      setActiveProject(toolProjects[0] || null);
    }
    // Close settings when switching tools (optional)
    setShowSettings(false);
  }, [activeTool]);

  return (
    <PermissionsProvider>
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
    </PermissionsProvider>
  );
};

export default Index;
