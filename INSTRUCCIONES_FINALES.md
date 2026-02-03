# ✅ Instrucciones Finales - Todo Listo para Probar

## 🎉 Estado: Imports Corregidos

He corregido automáticamente todos los imports de `@/` a `~/` en los componentes UI. Ahora sigue estos pasos:

## Paso 1: Instalar Dependencias Faltantes

```bash
cd "/Users/alvaro.baron@jobandtalent.com/Downloads/Proceso de Inversión"
npm install react-markdown remark-gfm @tanstack/react-table @radix-ui/react-toast class-variance-authority lucide-react clsx tailwind-merge @radix-ui/react-label @radix-ui/react-slot
```

O si usas pnpm:
```bash
pnpm add react-markdown remark-gfm @tanstack/react-table @radix-ui/react-toast class-variance-authority lucide-react clsx tailwind-merge @radix-ui/react-label @radix-ui/react-slot
```

## Paso 2: Configurar el Backend FastAPI

### 2.1. Crear entorno virtual e instalar dependencias

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2.2. Configurar variables de entorno (opcional para pruebas)

Si tienes API keys de Google y Tavily, crea un archivo `.env` en la raíz del proyecto:

```bash
# .env (en la raíz del proyecto, al mismo nivel que backend/ y src/)
GOOGLE_API_KEY=tu_api_key_de_google
TAVILY_API_KEY=tu_api_key_de_tavily
```

**Nota:** Si no tienes las API keys, el backend intentará usar las del sistema o fallará de forma controlada. La UI funcionará con datos mock.

### 2.3. Ejecutar el backend

En una terminal:

```bash
cd backend
source venv/bin/activate  # Si no está activado
python main.py
```

Deberías ver:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
```

Verifica que funciona visitando: `http://localhost:8000/health` (debería devolver `{"status":"ok"}`)

## Paso 3: Ejecutar el Frontend

En **otra terminal nueva**:

```bash
cd "/Users/alvaro.baron@jobandtalent.com/Downloads/Proceso de Inversión"
npm run dev
# o
pnpm dev
```

El frontend estará disponible en `http://localhost:3000` (o el puerto que indique la consola)

## Paso 4: Probar la Aplicación

### Tool 2 - Data Viewer (Search OS)

1. Abre `http://localhost:3000` en tu navegador
2. En el sidebar izquierdo, verás "Search OS" y "Discovery Engine"
3. Selecciona "Search OS" (Tool 2)
4. Haz clic en "Nuevo Proyecto" para crear un proyecto
5. Una vez creado, verás las vistas por defecto:
   - 📥 Inbox
   - ⭐ Shortlist
   - 🗑️ Discarded
6. Haz clic en el botón "Nueva Vista" para crear una vista personalizada
7. Selecciona un icono, nombre y columnas visibles
8. Si tienes datos en el proyecto, aparecerán en la tabla

**Para añadir datos:**
- Puedes usar la aplicación Streamlit original (`search-os/src/tool_2_dataviewer/app.py`) para subir CSV/Excel
- O crear proyectos y datos desde la nueva UI (funcionalidad pendiente de implementar)

### Tool 1 - Discovery Engine

1. Selecciona "Discovery Engine" (Tool 1) en el sidebar
2. Ingresa un sector (ej: "Sector vitivinícola en España")
3. Opcionalmente añade contexto adicional
4. Haz clic en "ARRANCAR ANÁLISIS"
5. Observa el progreso de los 3 agentes:
   - 🗂️ CNAE Mapping Agent
   - 🔍 Tavily Research Agent
   - 🧠 Gemini Analysis Agent
6. Una vez completado, verás el reporte en Markdown con:
   - Veredicto (🟢/🟡/🔴)
   - Clasificación CNAE
   - Métricas financieras
   - Empresas objetivo
7. Puedes hacer preguntas en el chat sobre el análisis

## Solución de Problemas

### Error: "Cannot find module 'react-markdown'"
**Solución:** Ejecuta `npm install` de nuevo con todas las dependencias listadas arriba

### Error: "Failed to fetch" o errores de CORS
**Solución:**
- Asegúrate de que el backend FastAPI esté corriendo en `http://localhost:8000`
- Verifica que el CORS en `backend/main.py` incluya el puerto correcto del frontend
- Si el frontend corre en otro puerto, añádelo a `allow_origins` en `backend/main.py`

### Error: "Module not found" para componentes UI
**Solución:** Los imports ya están corregidos. Si aún hay errores, verifica que el archivo exista en `src/components/ui/`

### El backend no inicia
**Solución:**
- Verifica que todas las dependencias Python estén instaladas: `pip install -r requirements.txt`
- Asegúrate de tener las rutas correctas. El backend debe encontrar `search-os/src`
- Si hay errores de importación, verifica que `search-os/src/shared/data_manager.py` exista

### No aparecen proyectos o datos
**Solución:**
- Los proyectos se crean desde la UI. Crea uno nuevo haciendo clic en "Nuevo Proyecto"
- Si necesitas datos de prueba, usa la aplicación Streamlit para subir CSV/Excel
- Los datos se guardan en `search-os/data/projects/[project_id]/`

### Error: "useIsMobile is not defined"
**Solución:** Ya está creado el hook en `src/hooks/use-mobile.ts`. Si persiste, reinicia el servidor de desarrollo.

## Estructura de Archivos Importantes

```
Proceso de Inversión/
├── backend/
│   ├── main.py              # Servidor FastAPI
│   ├── routers/
│   │   ├── tool1.py        # Endpoints Discovery Engine
│   │   └── tool2.py        # Endpoints Data Viewer
│   └── requirements.txt
├── src/
│   ├── components/
│   │   ├── AppSidebar.tsx
│   │   ├── MainContent.tsx
│   │   ├── DataGrid/       # Componentes Tool 2
│   │   └── DiscoveryEngine/ # Componentes Tool 1
│   ├── server/trpc/routers/
│   │   ├── tool1.ts        # Router tRPC Tool 1
│   │   ├── tool2.ts        # Router tRPC Tool 2
│   │   └── fastapi-client.ts
│   └── hooks/
│       ├── use-toast.ts
│       └── use-mobile.ts
└── search-os/              # Código Python original
    └── src/
        └── shared/
            └── data_manager.py
```

## Próximos Pasos (Opcional)

Una vez que todo funcione:

1. **Mejorar DataGrid:** Añadir reordenamiento de columnas, resize, filtros avanzados
2. **Integrar chat IA completo:** Conectar el sidebar derecho con el backend
3. **Añadir más funcionalidades:** Exportar datos, edición in-cell, etc.
4. **Mejoras visuales:** Animaciones, transiciones, etc.

## ✅ Checklist Final

- [ ] Dependencias instaladas (`npm install`)
- [ ] Backend FastAPI corriendo (`python main.py` en `backend/`)
- [ ] Frontend corriendo (`npm run dev`)
- [ ] Puedes crear proyectos en Tool 2
- [ ] Puedes crear vistas personalizadas
- [ ] Puedes ejecutar análisis en Tool 1
- [ ] El chat funciona en Tool 1

¡Todo listo para probar! 🚀

Si encuentras algún error, revisa la consola del navegador y la terminal del backend para ver los mensajes de error específicos.
