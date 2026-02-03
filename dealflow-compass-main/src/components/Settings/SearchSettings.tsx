import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Columns, Shield } from "lucide-react";
import { UserManagement } from "./UserManagement";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

const defaultColumns = [
  { id: "company", name: "Empresa", visible: true, locked: true },
  { id: "sector", name: "Sector", visible: true, locked: false },
  { id: "score", name: "Puntuación", visible: true, locked: false },
  { id: "status", name: "Estado", visible: true, locked: false },
  { id: "revenue", name: "Facturación", visible: true, locked: false },
  { id: "employees", name: "Empleados", visible: false, locked: false },
  { id: "location", name: "Ubicación", visible: true, locked: false },
  { id: "website", name: "Web", visible: false, locked: false },
  { id: "lastContact", name: "Último Contacto", visible: false, locked: false },
];

export function SearchSettings() {
  const { toast } = useToast();
  const [columns, setColumns] = useState(defaultColumns);

  const toggleColumn = (columnId: string) => {
    setColumns(prev => 
      prev.map(col => 
        col.id === columnId && !col.locked 
          ? { ...col, visible: !col.visible } 
          : col
      )
    );
  };

  const handleSaveColumns = () => {
    toast({
      title: "Columnas guardadas",
      description: "La configuración de columnas predeterminadas se ha actualizado.",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground mb-2">
          Ajustes de Search OS
        </h2>
        <p className="text-muted-foreground">
          Gestiona usuarios, permisos y configuración de la tabla de datos.
        </p>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" />
            Gestión de Usuarios
          </TabsTrigger>
          <TabsTrigger value="columns" className="gap-2">
            <Columns className="h-4 w-4" />
            Columnas Predeterminadas
          </TabsTrigger>
          <TabsTrigger value="permissions" className="gap-2">
            <Shield className="h-4 w-4" />
            Permisos
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users">
          <UserManagement />
        </TabsContent>

        {/* Columns Tab */}
        <TabsContent value="columns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Columnas Predeterminadas</CardTitle>
              <CardDescription>
                Define qué columnas se muestran por defecto en las nuevas vistas.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {columns.map((column) => (
                  <div 
                    key={column.id}
                    className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">{column.name}</span>
                      {column.locked && (
                        <Badge variant="secondary" className="text-xs">
                          Obligatoria
                        </Badge>
                      )}
                    </div>
                    <Switch
                      checked={column.visible}
                      onCheckedChange={() => toggleColumn(column.id)}
                      disabled={column.locked}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Button onClick={handleSaveColumns}>
            Guardar Configuración
          </Button>
        </TabsContent>

        {/* Permissions Tab */}
        <TabsContent value="permissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Configuración de Permisos</CardTitle>
              <CardDescription>
                Define los permisos predeterminados para nuevos usuarios.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Rol: Edición</h4>
                <div className="grid grid-cols-2 gap-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    Crear y editar filas
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    Crear columnas de IA
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    Mover entre vistas
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    Eliminar registros
                  </div>
                </div>
              </div>

              <div className="h-px bg-border" />

              <div className="space-y-4">
                <h4 className="text-sm font-medium">Rol: Vista</h4>
                <div className="grid grid-cols-2 gap-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    Ver todos los datos
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    Filtrar y ordenar
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    Exportar datos
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-red-500" />
                    Editar registros
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
