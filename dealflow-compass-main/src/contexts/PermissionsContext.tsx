import { createContext, useContext, useState, ReactNode } from "react";

export type UserPermission = "edit" | "view";

interface PermissionsContextType {
  currentUserPermission: UserPermission;
  setCurrentUserPermission: (permission: UserPermission) => void;
  canEdit: boolean;
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const [currentUserPermission, setCurrentUserPermission] = useState<UserPermission>("edit");

  const canEdit = currentUserPermission === "edit";

  return (
    <PermissionsContext.Provider
      value={{
        currentUserPermission,
        setCurrentUserPermission,
        canEdit,
      }}
    >
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  const context = useContext(PermissionsContext);
  if (context === undefined) {
    throw new Error("usePermissions must be used within a PermissionsProvider");
  }
  return context;
}
