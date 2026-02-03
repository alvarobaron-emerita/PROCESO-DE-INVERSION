# Search OS - Herramientas de Inversión

Sistema de herramientas para análisis y descubrimiento de oportunidades de inversión.

## 📋 Estructura del Proyecto

```
search-os/
├── docs/                    # Documentos de referencia (PDFs)
│   └── extracted/           # Textos extraídos de PDFs
├── src/
│   ├── tool_1_discovery/    # Cerebro de Inversión (Discovery Engine)
│   ├── tool_2_dataviewer/   # Visualizador de CSVs pesados
│   ├── shared/              # Código compartido
│   │   ├── data_manager.py  # Gestión de proyectos y Parquet
│   │   ├── parquet_manager.py # Utilidades Parquet
│   │   └── config.py        # Configuración global
│   └── main.py              # Launcher principal
├── data/                    # Datos locales (.parquet)
│   ├── raw/                 # CSVs originales
│   ├── processed/           # Parquets procesados por proyecto
│   │   └── {project_id}/
│   │       ├── master_data.parquet
│   │       └── schema_config.json
│   └── cache/               # Cache temporal
├── requirements.txt         # Dependencias Python
├── env.template             # Template de variables de entorno
└── PLAN_IMPLEMENTACION.md   # Plan detallado de desarrollo
```

## 🚀 Instalación

### Requisitos Previos
- Python 3.10 o superior
- pip o conda

### Pasos de Instalación

```bash
# 1. Crear entorno virtual
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate

# 2. Instalar dependencias
pip install -r requirements.txt

# 3. Configurar variables de entorno
cp env.template .env
# Editar .env y añadir tus API keys
```

## ⚙️ Configuración

### Variables de Entorno

Copia `env.template` a `.env` y configura las siguientes API keys:

```bash
# AI API Keys (obligatorias para funcionalidad completa)
OPENAI_API_KEY=tu_clave_openai
GROQ_API_KEY=tu_clave_groq
DEEPINFRA_API_KEY=tu_clave_deepinfra
GOOGLE_API_KEY=tu_clave_google
TAVILY_API_KEY=tu_clave_tavily

# Opcionales
ANTHROPIC_API_KEY=tu_clave_anthropic
```

**Nota**: No todas las API keys son necesarias desde el inicio. Puedes añadirlas según vayas implementando funcionalidades.

## 🎯 Uso

### Ejecutar la Aplicación

```bash
# Desde la raíz del proyecto
streamlit run src/main.py
```

La aplicación se abrirá en `http://localhost:8501`

## 🛠️ Herramientas

### Tool 1: Discovery Engine
Motor de descubrimiento de oportunidades con análisis sectorial automatizado.
- Pipeline de agentes (Clasificador, Investigador, Analista)
- Integración con Tavily para búsquedas web
- Generación de informes estructurados en JSON
- UI Split-Screen con chat interactivo

### Tool 2: Data Viewer
Visualizador optimizado para CSVs pesados (4MB+) con virtualización AgGrid.
- Ingesta de datos SABI normalizados
- Gestión de proyectos con archivos Parquet
- Enriquecimiento con IA (múltiples modelos)
- Columnas personalizadas y etiquetas
- Sistema de listas (Inbox, Shortlist, Descartados)

## 📊 Arquitectura de Datos

El sistema utiliza archivos **Parquet locales** (NO SQL) para almacenar datos:

- **master_data.parquet**: DataFrame maestro con todas las empresas
- **schema_config.json**: Configuración de listas y columnas personalizadas
- Cada proyecto tiene su propia carpeta en `data/processed/{project_id}/`

## 🔧 Desarrollo

### Estructura de Código

- `src/shared/`: Código compartido entre herramientas
- `src/tool_1_discovery/`: Código específico del Discovery Engine
- `src/tool_2_dataviewer/`: Código específico del Data Viewer

### Plan de Implementación

Ver `PLAN_IMPLEMENTACION.md` para el plan detallado de desarrollo por fases.

## 📝 Estado del Proyecto

- ✅ **Fase 0**: Setup y Arquitectura Base (Completada)
- ⏳ **Fase 1**: Tool 2 - Data Viewer Base (En progreso)
- ⏳ **Fase 2**: Tool 2 - Enriquecimiento IA (Pendiente)
- ⏳ **Fase 3**: Tool 2 - UX Polish (Pendiente)
- ⏳ **Fase 4**: Tool 1 - Discovery Engine (Pendiente)
- ⏳ **Fase 5**: Integración Manifiesto (Pendiente)
- ⏳ **Fase 6**: Integración Final (Pendiente)

## 🐛 Troubleshooting

### Error: "Module not found"
```bash
# Asegúrate de estar en el entorno virtual
source venv/bin/activate
pip install -r requirements.txt
```

### Error: "API key not found"
- Verifica que el archivo `.env` existe y contiene las API keys
- Asegúrate de que `python-dotenv` está instalado

### Error: "Project not found"
- Los proyectos se crean automáticamente al usar la interfaz
- Verifica que `data/processed/` existe y tiene permisos de escritura

## 📄 Licencia

Proyecto privado - Uso interno
