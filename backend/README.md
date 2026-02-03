# Backend FastAPI - Search OS

Backend API REST que expone las funcionalidades de Python (Tool 1 y Tool 2) para consumo desde el frontend React.

## Estructura

```
backend/
├── main.py              # Aplicación FastAPI principal
├── routers/
│   ├── __init__.py
│   ├── tool1.py        # Endpoints para Discovery Engine
│   └── tool2.py        # Endpoints para Data Viewer
└── requirements.txt    # Dependencias Python
```

## Instalación

1. Crear un entorno virtual:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate
```

2. Instalar dependencias:
```bash
pip install -r requirements.txt
```

3. Configurar variables de entorno:
Crear un archivo `.env` en la raíz del proyecto con:
```
GOOGLE_API_KEY=tu_api_key
TAVILY_API_KEY=tu_api_key
```

## Ejecución

```bash
python main.py
```

O con uvicorn directamente:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

La API estará disponible en: `http://localhost:8000`

## Documentación

Una vez ejecutando, la documentación interactiva estará disponible en:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Endpoints

### Tool 2 - Data Viewer

- `GET /api/tool2/projects` - Lista todos los proyectos
- `POST /api/tool2/projects` - Crea un nuevo proyecto
- `DELETE /api/tool2/projects/{project_id}` - Elimina un proyecto
- `GET /api/tool2/projects/{project_id}/views` - Lista todas las vistas
- `POST /api/tool2/projects/{project_id}/views` - Crea una nueva vista
- `DELETE /api/tool2/projects/{project_id}/views/{view_id}` - Elimina una vista
- `GET /api/tool2/projects/{project_id}/views/{view_id}/data` - Obtiene datos de una vista
- `POST /api/tool2/projects/{project_id}/views/{view_id}/rows/move` - Mueve filas entre vistas
- `POST /api/tool2/projects/{project_id}/views/{view_id}/rows/copy` - Copia filas entre vistas
- `DELETE /api/tool2/projects/{project_id}/rows` - Elimina filas
- `GET /api/tool2/projects/{project_id}/columns` - Lista columnas
- `POST /api/tool2/projects/{project_id}/columns` - Crea una columna personalizada
- `PUT /api/tool2/projects/{project_id}/rows/{row_uid}` - Actualiza una fila

### Tool 1 - Discovery Engine

- `POST /api/tool1/classify` - Clasifica un sector a códigos CNAE
- `POST /api/tool1/research` - Investiga un sector
- `POST /api/tool1/generate-report` - Genera un reporte inicial
- `POST /api/tool1/evaluate` - Evalúa un sector según la tesis de Emerita
- `POST /api/tool1/chat` - Procesa mensajes del chat interactivo
- `POST /api/tool1/update-section` - Actualiza una sección del reporte

## CORS

El backend está configurado para aceptar peticiones desde:
- `http://localhost:3000`
- `http://localhost:5173`

Si necesitas añadir más orígenes, modifica `main.py`.
