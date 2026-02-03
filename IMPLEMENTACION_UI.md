# Implementación de UI - Search OS

## Estado Actual

✅ **Completado:**
1. Backend FastAPI con endpoints para Tool 1 y Tool 2
2. Routers tRPC en el frontend conectados a FastAPI
3. Componentes básicos adaptados (AppSidebar, MainContent, ToolSwitcher, ProjectSelector)
4. DataGrid básico conectado al backend
5. DiscoveryEngine básico conectado al backend
6. NewViewDialog implementado

## Dependencias Necesarias

Para completar la implementación, necesitas instalar las siguientes dependencias:

```bash
pnpm add react-markdown remark-gfm @tanstack/react-table @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities @dnd-kit/modifiers lucide-react clsx tailwind-merge
```

O si usas npm:
```bash
npm install react-markdown remark-gfm @tanstack/react-table @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities @dnd-kit/modifiers lucide-react clsx tailwind-merge
```

## Configuración del Backend FastAPI

1. **Instalar dependencias Python:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate
pip install -r requirements.txt
```

2. **Configurar variables de entorno:**
Crear archivo `.env` en la raíz del proyecto con:
```
GOOGLE_API_KEY=tu_api_key
TAVILY_API_KEY=tu_api_key
```

3. **Ejecutar el backend:**
```bash
cd backend
python main.py
```

El backend estará disponible en `http://localhost:8000`

## Estructura de Archivos Creados

### Backend
- `backend/main.py` - Aplicación FastAPI principal
- `backend/routers/tool1.py` - Endpoints para Discovery Engine
- `backend/routers/tool2.py` - Endpoints para Data Viewer
- `backend/requirements.txt` - Dependencias Python

### Frontend
- `src/server/trpc/routers/tool1.ts` - Router tRPC para Tool 1
- `src/server/trpc/routers/tool2.ts` - Router tRPC para Tool 2
- `src/server/trpc/routers/fastapi-client.ts` - Cliente HTTP para FastAPI
- `src/components/AppSidebar.tsx` - Sidebar principal
- `src/components/MainContent.tsx` - Contenido principal
- `src/components/ToolSwitcher.tsx` - Selector de herramientas
- `src/components/ProjectSelector.tsx` - Selector de proyectos
- `src/components/AIChatSidebar.tsx` - Sidebar de chat IA
- `src/components/DataGrid/` - Componentes del DataGrid
- `src/components/DiscoveryEngine/` - Componentes del Discovery Engine

## Próximos Pasos

1. **Instalar dependencias faltantes** (ver arriba)
2. **Ejecutar el backend FastAPI** en `http://localhost:8000`
3. **Configurar variable de entorno** `FASTAPI_BASE_URL` si el backend está en otro puerto
4. **Probar la aplicación** ejecutando `pnpm dev` o `npm run dev`

## Notas

- El DataGrid actual es una versión simplificada. Se puede expandir con más funcionalidades del código de Lovable.
- El DiscoveryEngine está conectado al backend pero usa datos mock como fallback si hay errores.
- Los componentes UI de shadcn/ui ya están copiados en `src/components/ui/`
