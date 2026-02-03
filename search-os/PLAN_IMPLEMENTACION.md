# 🏗️ PLAN DE IMPLEMENTACIÓN - SEARCH OS

**Versión:** 1.0
**Fecha:** 2025-01-08
**Estado:** Pendiente de Inicio

---

## 📋 ÍNDICE

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Arquitectura General](#arquitectura-general)
3. [Fase 0: Setup y Arquitectura Base](#fase-0-setup-y-arquitectura-base)
4. [Fase 1: Tool 2 - Data Viewer (Base)](#fase-1-tool-2---data-viewer-base)
5. [Fase 2: Tool 2 - Enriquecimiento IA](#fase-2-tool-2---enriquecimiento-ia)
6. [Fase 3: Tool 2 - UX Polish](#fase-3-tool-2---ux-polish)
7. [Fase 4: Tool 1 - Discovery Engine (Base)](#fase-4-tool-1---discovery-engine-base)
8. [Fase 5: Tool 1 - Integración Manifiesto](#fase-5-tool-1---integración-manifiesto)
9. [Fase 6: Integración y Launcher](#fase-6-integración-y-launcher)
10. [Cronograma y Priorización](#cronograma-y-priorización)

---

## 📊 RESUMEN EJECUTIVO

### Objetivo General
Construir un sistema completo de herramientas de inversión (Search OS) con dos componentes principales:
- **Tool 1: Discovery Engine** - Copiloto de inversión automatizado para análisis sectorial
- **Tool 2: Data Viewer** - Visualizador inteligente de CSVs con enriquecimiento IA

### Reglas de Oro (Hard Constraints)
1. ✅ **Fuente de Verdad**: Usar PDFs solo para lógica de negocio, ignorar código obsoleto
2. ✅ **Arquitectura de Datos**: Archivos `.parquet` locales (NO SQL)
3. ✅ **Rendimiento Crítico**: AgGrid con virtualización obligatoria (paginación 50 filas)
4. ✅ **Manifiesto**: Se implementará en Fase 5, cuando Tool 1 esté 100% funcional

### Stack Tecnológico
- **Frontend**: Streamlit (multi-page)
- **Backend**: Python 3.10+
- **Datos**: Pandas, PyArrow, Fastparquet
- **Grid**: streamlit-aggrid (con virtualización)
- **IA**: Google Gemini 1.5 Pro, Groq, DeepInfra, OpenAI (GPT-4o), Tavily
- **PDFs**: PyPDF2 (solo para extracción inicial)

---

## 🏛️ ARQUITECTURA GENERAL

### Estructura de Directorios Final

```
search-os/
├── docs/
│   ├── Tool_1_Discovery.pdf
│   ├── Tool_2_DataViewer.pdf
│   ├── ROADMAP_DESARROLLO.pdf
│   └── extracted/              # Textos extraídos (ya completado)
│
├── src/
│   ├── tool_1_discovery/
│   │   ├── app.py                    # UI Split-Screen
│   │   ├── agents/
│   │   │   ├── __init__.py
│   │   │   ├── classifier.py         # CNAE mapping
│   │   │   ├── researcher.py         # Tavily integration
│   │   │   └── analyst.py            # Gemini analysis
│   │   ├── prompts/
│   │   │   ├── __init__.py
│   │   │   ├── initial_analysis.py   # Prompt maestro
│   │   │   └── chat_system.py        # Prompt copiloto
│   │   ├── rules_engine.py           # Hard constraints (sin Manifiesto por ahora)
│   │   └── report_generator.py       # JSON structure
│   │
│   ├── tool_2_dataviewer/
│   │   ├── app.py                    # UI Principal
│   │   ├── csv_loader.py             # Ingesta SABI
│   │   ├── aggrid_config.py          # Config AgGrid
│   │   ├── llm_factory.py            # Factory pattern
│   │   ├── smart_context.py          # Optimizador
│   │   └── ai_columns.py             # Columnas IA
│   │
│   ├── shared/
│   │   ├── __init__.py
│   │   ├── data_manager.py           # CRUD Parquet
│   │   ├── parquet_manager.py        # Utilidades
│   │   ├── config.py                  # Config global
│   │   └── utils.py                  # Helpers
│   │
│   └── main.py                       # Launcher multi-page
│
└── data/
    ├── raw/                          # CSVs originales
    ├── processed/                    # Parquets por proyecto
    │   └── {project_id}/
    │       ├── master_data.parquet
    │       └── schema_config.json
    └── cache/                        # Cache temporal
```

---

## 🔧 FASE 0: SETUP Y ARQUITECTURA BASE

**Objetivo**: Establecer la infraestructura de datos y gestión de proyectos

**Duración Estimada**: 1-2 días

### TICKET-00: Configuración Inicial del Proyecto
**Tipo**: Setup
**Prioridad**: Crítica

**Tareas**:
- [ ] Verificar estructura de directorios
- [ ] Configurar `requirements.txt` con todas las dependencias
- [ ] Crear `env.template` con variables de entorno necesarias
- [ ] Configurar `.gitignore` apropiado
- [ ] Crear `README.md` con instrucciones de setup

**Criterios de Aceptación**:
- ✅ Proyecto se puede clonar y configurar en un entorno limpio
- ✅ Todas las dependencias se instalan correctamente

---

### TICKET-01: Data Manager Backend
**Tipo**: Backend / Core
**Prioridad**: Crítica

**Descripción**:
Crear el módulo central de gestión de datos que maneja la persistencia en archivos Parquet y JSON.

**Requerimientos Técnicos**:

**Archivo**: `src/shared/data_manager.py`

```python
# Funciones principales:
- create_project(name: str) -> str
  # Crea carpeta en data/processed/{project_id}/
  # Genera schema_config.json por defecto
  # Retorna project_id

- save_master_data(project_id: str, df: pd.DataFrame) -> None
  # Guarda DataFrame como master_data.parquet
  # Usa compresión snappy o gzip

- load_master_data(project_id: str) -> pd.DataFrame
  # Lee master_data.parquet
  # Retorna DataFrame con tipos preservados

- update_schema(project_id: str, new_config: dict) -> None
  # Actualiza schema_config.json
  # Valida estructura JSON

- list_projects() -> List[str]
  # Lista todos los project_id disponibles
```

**Archivo**: `src/shared/parquet_manager.py`

```python
# Utilidades para manejo de Parquet:
- normalize_column_names(df: pd.DataFrame) -> pd.DataFrame
- add_system_columns(df: pd.DataFrame) -> pd.DataFrame
  # Añade _uid (UUID) y _list_id ('inbox' por defecto)
```

**Estructura `schema_config.json` inicial**:
```json
{
  "lists": [
    { "id": "inbox", "name": "📥 Bandeja de Entrada" },
    { "id": "shortlist", "name": "⭐ Shortlist" },
    { "id": "discarded", "name": "🗑 Descartados" }
  ],
  "custom_columns_definitions": {}
}
```

**Criterios de Aceptación**:
- ✅ Se pueden crear proyectos programáticamente
- ✅ Se puede guardar y recuperar DataFrames manteniendo tipos (float/int/str)
- ✅ El schema_config.json se crea con estructura correcta
- ✅ Los UUIDs se generan correctamente

---

## 📊 FASE 1: TOOL 2 - DATA VIEWER (BASE)

**Objetivo**: Construir el visualizador de CSVs con AgGrid virtualizado y gestión básica

**Duración Estimada**: 3-4 días

### SPRINT 1.1: Data Engine & Grid Básico

#### TICKET-02: Interfaz de Gestión de Proyectos (Landing)
**Tipo**: Frontend / UI
**Prioridad**: Alta

**Descripción**:
Pantalla inicial que permite crear o cargar proyectos existentes.

**Archivo**: `src/tool_2_dataviewer/app.py` (sección inicial)

**Requerimientos Técnicos**:
- Sidebar de Streamlit:
  - Lista carpetas existentes en `data/processed/`
  - Al hacer clic, carga `project_id` en `st.session_state['project_id']`
- Área Principal (si no hay proyecto seleccionado):
  - Input Text: "Nombre del Nuevo Proyecto"
  - Botón: "Crear"
  - Al crear, llama a `data_manager.create_project()` y redirige

**Criterios de Aceptación**:
- ✅ Usuario ve lista de proyectos guardados
- ✅ Usuario puede crear "Sector X" y se genera la carpeta
- ✅ Al seleccionar proyecto, la interfaz cambia para mostrar título del proyecto activo

---

#### TICKET-03: Motor de Ingesta SABI (ETL)
**Tipo**: Backend / Data Processing
**Prioridad**: Alta

**Descripción**:
Procesar el Excel "sucio" de SABI y normalizarlo al formato interno.

**Archivo**: `src/tool_2_dataviewer/csv_loader.py`

**Requerimientos Técnicos**:

```python
def normalize_sabi_data(uploaded_file) -> pd.DataFrame:
    """
    Normaliza datos de SABI al formato interno.

    Mapeo de columnas:
    - "Nombre" → name
    - "Dirección web" → website
    - "Código NIF" → nif
    - "Ingresos de explotación..." → revenue
    - "EBITDA..." → ebitda
    - "Resultado del Ejercicio..." → net_income
    - "Localidad" → city
    - "Descripción actividad" → description

    Columnas de Sistema:
    - _uid: UUID único por fila
    - _list_id: Valor por defecto 'inbox'
    """
```

**Integración en UI**:
- Añadir `st.file_uploader` en la pantalla principal si el proyecto está vacío
- Al subir archivo, ejecutar `normalize_sabi_data()`
- Guardar automáticamente como `master_data.parquet`

**Criterios de Aceptación**:
- ✅ Sistema acepta archivo .xlsx de SABI real
- ✅ DataFrame resultante tiene columnas renombradas correctamente
- ✅ Cada fila tiene `_uid` único
- ✅ Archivo se guarda automáticamente como `master_data.parquet` tras la subida

---

#### TICKET-04: Implementación de AgGrid Básico y Sidebar
**Tipo**: Frontend / Grid
**Prioridad**: Crítica

**Descripción**:
Renderizar la tabla principal usando `streamlit-aggrid` con virtualización obligatoria.

**Archivo**: `src/tool_2_dataviewer/aggrid_config.py`

**Requerimientos Técnicos**:

```python
from st_aggrid import AgGrid, GridOptionsBuilder, GridUpdateMode

def render_grid(df_view: pd.DataFrame, custom_defs: dict) -> dict:
    """
    Configura AgGrid con virtualización y funcionalidades avanzadas.
    """
    gb = GridOptionsBuilder.from_dataframe(df_view)

    # 1. HABILITAR SELECCIÓN Y CHECKBOXES
    gb.configure_selection(selection_mode="multiple", use_checkbox=True)

    # 2. HABILITAR PANEL LATERAL (SideBar) para mover/ocultar columnas
    gb.configure_side_bar()

    # 3. PAGINACIÓN (VIRTUALIZACIÓN CRÍTICA)
    gb.configure_pagination(
        pagination=True,
        paginationPageSize=50,  # CRÍTICO: No cargar todas las filas
        paginationAutoPageSize=False
    )

    # 4. CONFIGURAR COLUMNAS CUSTOM (Etiquetas)
    for col_name, config in custom_defs.items():
        if config['type'] == 'single_select':
            gb.configure_column(
                col_name,
                editable=True,
                cellEditor='agSelectCellEditor',
                cellEditorParams={'values': config['options']}
            )

    # 5. OCULTAR COLUMNAS DE SISTEMA
    gb.configure_column("_uid", hide=True)
    gb.configure_column("_list_id", hide=True)

    # 6. FORMATO NUMÉRICO COMPACTO
    # Configurar formatters para revenue, ebitda, etc.
    # Usar valueFormatter JS para mostrar "1.5M€"

    grid_options = gb.build()

    response = AgGrid(
        df_view,
        gridOptions=grid_options,
        enable_enterprise_modules=True,  # Necesario para SideBar completo
        update_mode=GridUpdateMode.MODEL_CHANGED,
        allow_unsafe_jscode=True  # Para formatters personalizados
    )

    return response
```

**Criterios de Aceptación**:
- ✅ La tabla carga datos del Parquet
- ✅ Se pueden seleccionar filas con checkboxes
- ✅ Existe panel lateral donde usuario puede arrastrar columnas para reordenar u ocultar
- ✅ Los números se ven formateados (no 1500000 sino 1.5M)
- ✅ **CRÍTICO**: Tabla maneja 10,000+ filas sin congelar (paginación activa)

---

### SPRINT 1.2: Interacciones Core

#### TICKET-05: Navegación por Pestañas (Filtrado de Vistas)
**Tipo**: Frontend / Logic
**Prioridad**: Media

**Descripción**:
Implementar la lógica para ver diferentes "listas" (Inbox, Shortlist, Descartados) usando pestañas.

**Requerimientos Técnicos**:
- Leer las listas definidas en `schema_config.json`
- Crear Tabs en Streamlit (`st.tabs`) iterando sobre esas listas
- Lógica de Filtrado:
  ```python
  # Cuando usuario está en Tab "Shortlist"
  df_view = df_master[df_master['_list_id'] == 'shortlist']
  # Pasar df_view al AgGrid
  ```

**Criterios de Aceptación**:
- ✅ Al cambiar de pestaña, la tabla muestra solo las empresas correspondientes a esa lista
- ✅ Las empresas recién subidas aparecen solo en "Inbox"

---

#### TICKET-06: Acciones en Lote (Mover Filas)
**Tipo**: Fullstack
**Prioridad**: Alta

**Descripción**:
Permitir al usuario seleccionar filas y moverlas a otra lista.

**Requerimientos Técnicos**:

**Frontend**:
- Detectar selección de filas en AgGrid (`grid_response['selected_rows']`)
- UI Flotante: Si hay selección, mostrar `st.container` debajo de la tabla con:
  - Selectbox: "Mover a..." (Lista de tablas disponibles)
  - Botón: "Confirmar"

**Backend Logic**:
```python
def move_rows(project_id: str, selected_uids: List[str], target_list_id: str) -> None:
    """
    Mueve filas entre listas actualizando solo _list_id.
    """
    # 1. Cargar master_data.parquet
    df = load_master_data(project_id)

    # 2. Actualizar solo la columna de control _list_id
    df.loc[df['_uid'].isin(selected_uids), '_list_id'] = target_list_id

    # 3. Guardar y recargar
    save_master_data(project_id, df)
    st.session_state['df_master'] = df
    st.rerun()
```

**Criterios de Aceptación**:
- ✅ Seleccionar 3 empresas en "Inbox", moverlas a "Shortlist"
- ✅ Al ir a pestaña "Shortlist", las empresas están ahí
- ✅ Al volver a "Inbox", ya no están

---

#### TICKET-07: Gestión de Columnas Personalizadas (Manuales)
**Tipo**: Fullstack
**Prioridad**: Media

**Descripción**:
Permitir al usuario añadir nuevas columnas (Tags o Texto) que se persisten en el esquema y en el dataframe.

**Requerimientos Técnicos**:

**UI Modal**:
- Botón "[+ Columna]" que abre un formulario (`st.form`)
- Inputs:
  - Nombre columna
  - Tipo (Radio: "Texto Libre" vs "Etiqueta")
  - Si es Etiqueta: Input text para opciones ("Alta,Media,Baja")

**Backend**:
```python
def add_custom_column(project_id: str, col_name: str, col_type: str, options: List[str] = None) -> None:
    """
    Añade columna nueva al master_data.parquet y actualiza schema_config.json.
    """
    # 1. Cargar datos
    df = load_master_data(project_id)
    schema = load_schema(project_id)

    # 2. Añadir columna al DataFrame (inicializada a None o "")
    df[col_name] = None

    # 3. Actualizar schema_config.json
    if col_type == 'single_select':
        schema['custom_columns_definitions'][col_name] = {
            'type': 'single_select',
            'options': options
        }

    # 4. Guardar ambos
    save_master_data(project_id, df)
    update_schema(project_id, schema)
```

**AgGrid Update**:
- Si columna es tipo "Etiqueta", configurar `cellEditor='agSelectCellEditor'` con opciones guardadas
- Hacer columna `editable=True`

**Criterios de Aceptación**:
- ✅ Usuario crea columna "Estado" con opciones "Pendiente, Contactado"
- ✅ La columna aparece en la tabla
- ✅ Usuario puede hacer doble clic en celda de "Estado" y elegir "Contactado" de dropdown
- ✅ Al recargar página, el valor "Contactado" persiste

---

#### TICKET-08: Consolidación de Datos SABI Jerárquicos
**Tipo**: Backend / Data Processing
**Prioridad**: Alta

**Descripción**:
Consolidar datos jerárquicos de SABI (múltiples filas por empresa) en una sola fila por empresa, agrupando datos repetidos en arrays JSON. Esto permite manejar empresas con 36+ filas de información relacionada (accionistas, participadas, etc.) sin perder datos.

**Requerimientos Técnicos**:

**Detección de Filas Principales vs Secundarias**:
- Filas principales: Tienen datos en columnas clave (nombre, NIF, revenue, etc.)
- Filas secundarias: Tienen valores vacíos/NaN en columnas clave pero datos en columnas relacionadas (accionistas, participadas, etc.)

**Algoritmo de Consolidación**:
```python
def consolidate_sabi_hierarchical_data(df: pd.DataFrame) -> pd.DataFrame:
    """
    Consolida múltiples filas de la misma empresa en una sola fila.

    Estrategia:
    1. Identificar filas principales (tienen nombre/NIF/revenue)
    2. Agrupar filas secundarias por empresa (mismo NIF o nombre similar)
    3. Para cada grupo:
       - Mantener datos de fila principal
       - Consolidar columnas con múltiples valores en arrays JSON
       - Conservar orden original de elementos
    4. Retornar DataFrame con una fila por empresa
    """
    # 1. Identificar columnas clave (empresa principal)
    key_columns = ['name', 'nif', 'revenue', 'ebitda']

    # 2. Identificar filas principales (tienen al menos 2 columnas clave con datos)
    df['_is_main_row'] = df[key_columns].notna().sum(axis=1) >= 2

    # 3. Agrupar por NIF o nombre (normalizado)
    # 4. Para cada grupo, consolidar columnas con múltiples valores
    # 5. Convertir arrays a JSON strings para almacenamiento en Parquet
```

**Reglas de Consolidación**:
- **Mantener nombres originales de columnas** (no renombrar)
- **Conservar orden** de elementos en arrays
- **Sin límite de elementos** (puede haber 36+ elementos por array)
- **Tipos de datos**: Los arrays JSON pueden contener números, texto, fechas, porcentajes (todo como string en JSON)

**Columnas a Consolidar** (ejemplos):
- `accionista_-_nombre` → `accionistas: ["Juan", "Pedro", "María"]`
- `accionista_-_%_directo` → `accionistas_pct_directo: ["50", "30", "20"]`
- `participada_-_nombre` → `participadas: ["Empresa A", "Empresa B"]`

**Formato de Salida**:
- Columnas principales: Mantienen valores originales
- Columnas consolidadas: JSON arrays como strings (compatibles con Parquet)
- Ejemplo: `accionistas: '["Juan", "Pedro", "María"]'`

**Criterios de Aceptación**:
- ✅ Empresa con 36 filas se consolida en 1 fila
- ✅ Todos los datos se conservan (sin pérdida de información)
- ✅ Arrays JSON mantienen orden original
- ✅ Nombres de columnas originales se preservan
- ✅ Funciona con empresas que tienen 1-100+ filas relacionadas

---

#### TICKET-09: AgGrid sin Paginación (Scroll Infinito)
**Tipo**: Frontend / Grid Configuration
**Prioridad**: Alta

**Descripción**:
Eliminar paginación de AgGrid y mostrar todas las filas con scroll infinito, manteniendo virtualización para rendimiento. El usuario quiere ver todas las filas como en Excel, sin páginas.

**Requerimientos Técnicos**:

**Modificar `aggrid_config.py`**:
- Eliminar `configure_pagination()` completamente
- Habilitar virtualización automática de AgGrid (por defecto)
- Configurar altura de grid para permitir scroll vertical
- Mantener todas las demás configuraciones (filtros, ordenamiento, selección)

**Cambios Específicos**:
```python
# ELIMINAR estas líneas:
gb.configure_pagination(
    paginationPageSize=50,
    paginationAutoPageSize=False
)

# AGREGAR configuración de altura para scroll:
grid_options = {
    'domLayout': 'normal',  # Permite scroll vertical
    'rowHeight': 35,
    'headerHeight': 40,
    'suppressPaginationPanel': True,  # Ocultar controles de paginación si aparecen
}
```

**Criterios de Aceptación**:
- ✅ No hay controles de paginación visibles
- ✅ Todas las filas se muestran (scroll infinito)
- ✅ Rendimiento fluido con 1000+ filas (virtualización activa)
- ✅ Sensación de "Excel desktop" (scroll continuo hacia abajo)
- ✅ Filtros y ordenamiento funcionan sobre todas las filas

---

## 🤖 FASE 2: TOOL 2 - ENRIQUECIMIENTO IA

**Objetivo**: Implementar sistema de columnas IA configurables con múltiples modelos

**Duración Estimada**: 3-4 días

### SPRINT 2.1: LLM Factory & Smart Context

#### TICKET-10: LLM Factory Pattern
**Tipo**: Backend / AI Integration
**Prioridad**: Alta

**Descripción**:
Implementar patrón Factory para instanciar el cliente LLM correcto según la elección del usuario.

**Archivo**: `src/tool_2_dataviewer/llm_factory.py`

**Requerimientos Técnicos**:

```python
from langchain_groq import ChatGroq
from langchain_openai import ChatOpenAI
from langchain_google_genai import ChatGoogleGenerativeAI

class LLMFactory:
    @staticmethod
    def get_model(ui_selection: str, api_keys: dict):
        """
        ui_selection puede ser:
        - "instant": Groq (Llama-3-70B)
        - "batch": DeepInfra (Meta-Llama-3-70B-Instruct)
        - "complex": OpenAI (GPT-4o)
        - "long_context": Google (Gemini-1.5-Pro)
        """
        if ui_selection == "instant":
            return ChatGroq(
                model_name="llama-3-70b-8192",
                groq_api_key=api_keys['GROQ'],
                temperature=0.1
            )
        elif ui_selection == "batch":
            return ChatOpenAI(
                model="meta-llama/Meta-Llama-3-70B-Instruct",
                api_key=api_keys['DEEPINFRA'],
                base_url="https://api.deepinfra.com/v1/openai",
                temperature=0.1
            )
        elif ui_selection == "complex":
            return ChatOpenAI(
                model="gpt-4o",
                api_key=api_keys['OPENAI'],
                temperature=0.2
            )
        elif ui_selection == "long_context":
            return ChatGoogleGenerativeAI(
                model="gemini-1.5-pro",
                google_api_key=api_keys['GOOGLE'],
                temperature=0.2
            )
```

**Criterios de Aceptación**:
- ✅ Se pueden instanciar los 4 tipos de modelos correctamente
- ✅ Las API keys se cargan desde variables de entorno
- ✅ Cada modelo tiene configuración de temperatura apropiada

---

#### TICKET-11: Smart Context Optimizer
**Tipo**: Backend / AI Optimization
**Prioridad**: Media

**Descripción**:
Agente intermedio que reduce consumo de tokens seleccionando solo las columnas necesarias antes de enviar al LLM principal.

**Archivo**: `src/tool_2_dataviewer/smart_context.py`

**Requerimientos Técnicos**:

```python
CONTEXT_OPTIMIZER_SYSTEM_PROMPT = """
ERES UN INGENIERO DE DATOS OPTIMIZADOR.
TU OBJETIVO: Seleccionar del dataset únicamente las columnas estrictamente necesarias para responder al prompt del usuario.

INPUTS: Prompt Usuario + Lista de Headers del CSV
REGLA: Sé minimalista. Incluye siempre 'Nombre' y 'Web'. Devuelve JSON Array de strings.
"""

def optimize_context(user_prompt: str, available_columns: List[str]) -> List[str]:
    """
    Usa Llama-3-8B (Groq) para determinar qué columnas son necesarias.
    """
    # Llamada a Groq con prompt optimizador
    # Retorna lista de columnas seleccionadas
```

**Criterios de Aceptación**:
- ✅ Para prompt "Analiza edad administradores", solo selecciona columnas relevantes
- ✅ Siempre incluye 'Nombre' y 'Web'
- ✅ Reduce tokens en 60-80% vs enviar todas las columnas

---

#### TICKET-12: Modal Creación Columna IA
**Tipo**: Frontend / UI
**Prioridad**: Alta

**Descripción**:
Interfaz para crear columnas inteligentes configurando prompt y modelo.

**Requerimientos Técnicos**:

**UI Modal** (`st.form`):
- Input: Título de la Columna (ej. "Riesgo Regulatorio")
- Text Area: Prompt (Instrucciones para la IA)
- Selector de Modelo (Dropdown):
  - ⚡ Instantáneo: Groq (Llama-3-70B) - Default
  - 🏭 Batch/Económico: DeepInfra (Llama-3/Mistral)
  - 🧠 Razonamiento Complejo: OpenAI (GPT-4o)
  - 📚 Contexto Largo: Google (Gemini-1.5-Pro)
- Switch: "Auto-optimizar columnas (Smart Context)" (Activado por defecto)

**Backend**:
- Guardar definición en `schema_config.json`:
```json
{
  "field": "ai_relevo",
  "title": "Relevo Generacional",
  "type": "ai_score",
  "config": {
    "user_prompt": "Analiza edad administradores...",
    "model_selected": "instant",
    "smart_context": true
  }
}
```

**Criterios de Aceptación**:
- ✅ Usuario puede crear columna IA con título y prompt
- ✅ Puede seleccionar modelo según necesidad
- ✅ La configuración se guarda en schema_config.json

---

### SPRINT 2.2: Pipeline de Ejecución

#### TICKET-13: Pipeline Batch de Enriquecimiento
**Tipo**: Backend / AI Processing
**Prioridad**: Alta

**Descripción**:
Procesar enriquecimiento IA por lotes sobre múltiples filas.

**Archivo**: `src/tool_2_dataviewer/ai_columns.py`

**Requerimientos Técnicos**:

```python
def enrich_column_batch(
    project_id: str,
    column_def: dict,
    row_indices: List[int] = None  # None = todas las filas
) -> None:
    """
    Ejecuta enriquecimiento IA sobre filas seleccionadas.
    """
    # 1. Cargar datos
    df = load_master_data(project_id)

    # 2. Smart Context: Determinar columnas necesarias
    if column_def['config']['smart_context']:
        needed_cols = optimize_context(
            column_def['config']['user_prompt'],
            df.columns.tolist()
        )
    else:
        needed_cols = df.columns.tolist()

    # 3. Construir JSON ligero por fila
    rows_to_process = df.iloc[row_indices] if row_indices else df

    for idx, row in rows_to_process.iterrows():
        # Construir contexto JSON mínimo
        context = {col: row[col] for col in needed_cols}

        # 4. (Opcional) Búsqueda Tavily si es necesario
        # web_data = tavily_search(row['website']) if 'website' in context

        # 5. Llamada al LLM
        model = LLMFactory.get_model(
            column_def['config']['model_selected'],
            api_keys
        )

        prompt = f"""
        {column_def['config']['user_prompt']}

        DATOS EMPRESA:
        {json.dumps(context, indent=2)}

        Devuelve un JSON con:
        - score: número 0-10
        - reason: explicación breve
        """

        response = model.invoke(prompt)
        result = parse_json_response(response.content)

        # 6. Actualizar DataFrame
        df.loc[idx, column_def['field']] = result['score']
        df.loc[idx, f"{column_def['field']}_reason"] = result['reason']

    # 7. Guardar
    save_master_data(project_id, df)
```

**Criterios de Aceptación**:
- ✅ Procesa 1000+ filas en lotes sin congelar la app
- ✅ Muestra progreso con `st.progress`
- ✅ Los scores y razones se guardan en el Parquet
- ✅ Si falla una fila, continúa con las demás

---

#### TICKET-14: Renderizado IA Scores
**Tipo**: Frontend / Grid
**Prioridad**: Media

**Descripción**:
Mostrar scores IA con badges visuales y tooltips.

**Requerimientos Técnicos**:

**Cell Renderer Personalizado** (JavaScript en AgGrid):
```javascript
function ScoreBadgeRenderer(params) {
    const score = params.value;
    let color, emoji;

    if (score >= 8) {
        color = 'green';
        emoji = '🟢';
    } else if (score >= 5) {
        color = 'yellow';
        emoji = '🟡';
    } else {
        color = 'red';
        emoji = '🔴';
    }

    return `
        <div style="display: flex; align-items: center; gap: 5px;">
            <span>${emoji}</span>
            <span style="font-weight: bold;">${score}/10</span>
        </div>
    `;
}
```

**Tooltip**:
- Usar `tooltipField` en AgGrid apuntando a `{field}_reason`

**Criterios de Aceptación**:
- ✅ Scores se muestran con badges de color (🟢🟡🔴)
- ✅ Al pasar mouse, muestra tooltip con justificación
- ✅ Formato es claro y visual

---

## 🎨 FASE 3: TOOL 2 - UX POLISH

**Objetivo**: Mejoras de UX y funcionalidades avanzadas

**Duración Estimada**: 2-3 días

#### TICKET-15: Data Chat (Asistente Lateral)
**Tipo**: Frontend / AI Integration
**Prioridad**: Media

**Descripción**:
Panel desplegable a la derecha que permite "hablar" con los datos visibles.

**Requerimientos Técnicos**:
- Panel lateral (`st.sidebar` o `st.expander`)
- Usa Groq por defecto para respuestas instantáneas
- Contexto: Solo filas visibles en la tabla actual
- Ejemplo: "Fíltrame las empresas de Valencia con EBITDA > 1M€"

**Criterios de Aceptación**:
- ✅ Usuario puede hacer preguntas sobre datos visibles
- ✅ Respuestas son instantáneas (Groq)
- ✅ Puede generar filtros y acciones

---

#### TICKET-16: Action Bar Flotante Mejorado
**Tipo**: Frontend / UI
**Prioridad**: Media

**Descripción**:
Mejorar la barra de acciones que aparece al seleccionar filas.

**Requerimientos Técnicos**:
- Aparece al seleccionar filas (checkboxes)
- Acciones disponibles:
  - Mover a... (dropdown)
  - Borrar (eliminar de master_data)
  - Ejecutar IA (aplicar columna IA a filas seleccionadas)

**Criterios de Aceptación**:
- ✅ Barra aparece solo cuando hay selección
- ✅ Todas las acciones funcionan correctamente

---

#### TICKET-17: Exportación y Descarga
**Tipo**: Backend / Data Export
**Prioridad**: Baja

**Descripción**:
Permitir exportar datos a CSV/Excel manteniendo formato.

**Criterios de Aceptación**:
- ✅ Exportar a CSV mantiene columnas IA
- ✅ Exportar a Excel con formato preservado

---

## 🔍 FASE 4: TOOL 1 - DISCOVERY ENGINE (BASE)

**Objetivo**: Construir el Copiloto de Inversión con UI Split-Screen

**Duración Estimada**: 4-5 días

### SPRINT 4.1: Backend Core

#### TICKET-18: Pipeline de Agentes
**Tipo**: Backend / AI Agents
**Prioridad**: Crítica

**Descripción**:
Implementar el pipeline de 3 agentes: Clasificador, Investigador, Analista.

**Archivos**:
- `src/tool_1_discovery/agents/classifier.py`
- `src/tool_1_discovery/agents/researcher.py`
- `src/tool_1_discovery/agents/analyst.py`

**Requerimientos Técnicos**:

**Clasificador** (CNAE Mapping):
```python
def classify_sector(sector_name: str) -> List[str]:
    """
    Mapea sector a códigos CNAE 2009 (España).
    Usa Gemini para mapeo inteligente.
    """
    # Retorna lista de códigos CNAE
```

**Investigador** (Tavily):
```python
def research_sector(sector_name: str, cnae_codes: List[str]) -> str:
    """
    Genera queries de búsqueda y ejecuta búsquedas Tavily.

    Queries base:
    - "Tamaño mercado {sector} España 2024 facturación"
    - "Márgenes EBITDA sector {sector} España"
    - "Cuota de mercado líderes {sector} España"
    - "Normativa y regulación {sector} España riesgos"
    - "Tendencias M&A {sector} Europa 2024"
    """
    # Retorna contexto web consolidado
```

**Analista** (Gemini):
```python
def generate_initial_report(sector_name: str, web_context: str) -> dict:
    """
    Genera el informe inicial completo en formato JSON.
    Usa INITIAL_ANALYSIS_SYSTEM_PROMPT.
    """
    # Retorna JSON estructurado con 10 secciones
```

**Criterios de Aceptación**:
- ✅ Pipeline completo funciona end-to-end
- ✅ JSON generado respeta estructura de 10 secciones
- ✅ Búsquedas Tavily retornan datos relevantes

---

#### TICKET-17: Sistema de Prompts Maestros
**Tipo**: Backend / AI Prompts
**Prioridad**: Alta

**Descripción**:
Definir y estructurar los prompts del sistema.

**Archivos**:
- `src/tool_1_discovery/prompts/initial_analysis.py`
- `src/tool_1_discovery/prompts/chat_system.py`

**Requerimientos Técnicos**:

**INITIAL_ANALYSIS_SYSTEM_PROMPT**:
- Define rol: Director de Inversiones de Emerita
- Inyecta Tesis Emerita (hardcoded por ahora, sin Manifiesto):
  - TARGET_GEO: "España (prioritario), Europa Occidental (secundario)"
  - TARGET_SIZE: "Ventas 5-40M€, EBITDA 1-5M€"
  - TARGET_MARGINS: "EBITDA ≥15%, Bruto ≥40%"
  - DEAL_KILLERS: "Riesgo tecnológico alto, Dependencia de un solo cliente, Sector en declive, Márgenes muy bajos (<10%)"
  - VALUE_LEVERS: "Digitalización, Profesionalización comercial, Eficiencia operativa"
- Estructura JSON obligatoria (10 secciones)
- Tono: Profesional, escéptico, basado en datos

**CHAT_SYSTEM_PROMPT**:
- Define rol: Copiloto de Inversión
- Herramientas disponibles (function calling):
  - `read_full_document()`: Lee contenido actual
  - `search_internet(query)`: Usa Tavily para búsquedas frescas
  - `update_section(section_key, user_instruction)`: Reescribe UNA sección específica
- Reglas de comportamiento

**Criterios de Aceptación**:
- ✅ Prompts están bien estructurados y documentados
- ✅ Tesis Emerita está inyectada correctamente
- ✅ Function calling está definido

---

#### TICKET-18: Motor de Reglas (Rules Engine)
**Tipo**: Backend / Business Logic
**Prioridad**: Alta

**Descripción**:
Implementar motor de reglas para evaluar sectores según criterios Emerita.

**Archivo**: `src/tool_1_discovery/rules_engine.py`

**Requerimientos Técnicos**:

```python
def evaluate_sector(margins_data: dict, market_data: dict) -> dict:
    """
    Evalúa sector y retorna veredicto (VERDE/ÁMBAR/ROJO).

    Reglas:
    - EBITDA < 15% → ROJO o ÁMBAR
    - Margen Bruto < 40% → Penalización
    - Top 3 > 50% cuota → Penalización (poco fragmentado)
    - Deal Killers detectados → ROJO
    """
    # Retorna {'verdict': 'VERDE/ÁMBAR/ROJO', 'reasons': [...]}
```

**Criterios de Aceptación**:
- ✅ Detecta correctamente Deal Killers
- ✅ Asigna veredicto correcto según métricas
- ✅ Genera razones justificadas

---

### SPRINT 4.2: UI Split-Screen

#### TICKET-19: Layout Pantalla Dividida
**Tipo**: Frontend / UI
**Prioridad**: Alta

**Descripción**:
Implementar UI split-screen con dos paneles.

**Archivo**: `src/tool_1_discovery/app.py`

**Requerimientos Técnicos**:
- Layout: `st.columns([1, 2])` para 30-40% / 60-70%
- Panel Izquierdo (30-40%):
  - Estado A: Input inicial (sector name + contexto adicional)
  - Botón CTA: "ARRANCAR ANÁLISIS"
  - Estado B: Chat interactivo (se activa tras primer borrador)
- Panel Derecho (60-70%):
  - Visor de documento Markdown
  - Renderiza JSON estructurado sección por sección

**Criterios de Aceptación**:
- ✅ Layout se divide correctamente
- ✅ Panel izquierdo cambia de estado A a B
- ✅ Panel derecho renderiza Markdown correctamente

---

#### TICKET-20: Session State JSON
**Tipo**: Backend / State Management
**Prioridad**: Alta

**Descripción**:
Gestionar estado de la aplicación en formato JSON modular.

**Requerimientos Técnicos**:

```python
# Estructura en st.session_state['discovery_report']
{
    "meta": {
        "sector_name": "Logística de Frío",
        "cnae_codes": ["5210"],
        "verdict": "ÁMBAR",
        "timestamp": "2025-01-08"
    },
    "sections": {
        "1_executive_summary": {"title": "...", "content": "..."},
        "2_financials": {"title": "...", "content": "..."},
        # ... 10 secciones totales
    }
}
```

**Criterios de Aceptación**:
- ✅ JSON se inicializa correctamente
- ✅ Secciones se pueden actualizar independientemente
- ✅ Estado persiste durante la sesión

---

#### TICKET-21: Chat Interactivo
**Tipo**: Frontend / AI Integration
**Prioridad**: Alta

**Descripción**:
Implementar chat con function calling para manipular documento.

**Requerimientos Técnicos**:
- Chat usa Gemini con function calling:
  - `read_full_document()`: Lee JSON actual
  - `search_internet(query)`: Búsqueda Tavily
  - `update_section(section_key, user_instruction)`: Reescribe sección
- Al actualizar sección, solo esa sección muestra spinner
- Resto del documento permanece estático

**Criterios de Aceptación**:
- ✅ Usuario puede hacer preguntas sobre el documento
- ✅ Usuario puede pedir cambios ("Añade esto a sección 3")
- ✅ Solo la sección afectada se actualiza
- ✅ Refresh automático del panel derecho

---

### SPRINT 4.3: Generación y Exportación

#### TICKET-22: Generación de Queries Tavily
**Tipo**: Backend / Research
**Prioridad**: Media

**Descripción**:
Implementar función que genera queries de búsqueda optimizadas.

**Archivo**: `src/tool_1_discovery/agents/researcher.py`

**Requerimientos Técnicos**:

```python
def get_research_queries(sector: str) -> List[str]:
    """
    Genera lista de queries optimizadas para Tavily.
    """
    return [
        f"Tamaño mercado {sector} España 2024 facturación",
        f"Márgenes EBITDA sector {sector} España",
        f"Principales empresas {sector} España cuota mercado",
        f"Asociación nacional empresas {sector} España",
        f"Normativa y regulación {sector} España riesgos",
        f"Tendencias M&A {sector} Europa 2024"
    ]
```

**Criterios de Aceptación**:
- ✅ Queries son relevantes y específicas
- ✅ Retornan resultados útiles de Tavily

---

#### TICKET-23: Exportación de Informes
**Tipo**: Backend / Export
**Prioridad**: Baja

**Descripción**:
Permitir descargar informes en formato Markdown y JSON.

**Criterios de Aceptación**:
- ✅ Descarga Markdown (.md) formateado para Notion
- ✅ Descarga JSON estructurado
- ✅ Formato es limpio y profesional

---

## 📄 FASE 5: TOOL 1 - INTEGRACIÓN MANIFIESTO

**Objetivo**: Integrar Manifiesto.pdf como fuente de verdad dinámica

**Duración Estimada**: 2-3 días

**NOTA**: Esta fase se ejecutará cuando Tool 1 esté 100% funcional.

#### TICKET-24: Sistema de Gestión del Manifiesto
**Tipo**: Fullstack
**Prioridad**: Media

**Descripción**:
Permitir subir, editar y actualizar el Manifiesto.pdf desde la interfaz.

**Requerimientos Técnicos**:
- Editor de texto/markdown en Streamlit
- Guardado como PDF actualizado
- Parser de reglas desde Manifiesto

**Criterios de Aceptación**:
- ✅ Usuario puede subir Manifiesto.pdf
- ✅ Puede editar contenido desde interfaz
- ✅ Cambios se guardan como PDF actualizado

---

#### TICKET-25: Actualización Dinámica de Reglas
**Tipo**: Backend / Business Logic
**Prioridad**: Alta

**Descripción**:
Cargar reglas desde Manifiesto y actualizar Rules Engine dinámicamente.

**Criterios de Aceptación**:
- ✅ Reglas se extraen correctamente del Manifiesto
- ✅ Rules Engine se actualiza sin reiniciar app
- ✅ Validación de formato de reglas

---

## 🔗 FASE 6: INTEGRACIÓN Y LAUNCHER

**Objetivo**: Unificar ambas herramientas en una app multi-page

**Duración Estimada**: 1-2 días

#### TICKET-26: Launcher Principal
**Tipo**: Frontend / Integration
**Prioridad**: Alta

**Descripción**:
Crear launcher principal que unifica Tool 1 y Tool 2.

**Archivo**: `src/main.py`

**Requerimientos Técnicos**:
- Streamlit multi-page application
- Navegación entre Tool 1 y Tool 2
- Gestión de sesiones unificada

**Criterios de Aceptación**:
- ✅ Usuario puede navegar entre herramientas
- ✅ Estado de sesión se mantiene
- ✅ UI es consistente entre herramientas

---

#### TICKET-27: Compartir Utilidades
**Tipo**: Backend / Refactoring
**Prioridad**: Media

**Descripción**:
Refactorizar código común entre herramientas.

**Criterios de Aceptación**:
- ✅ No hay duplicación de código
- ✅ Utilidades compartidas funcionan correctamente

---

## 📅 CRONOGRAMA Y PRIORIZACIÓN

### Orden de Implementación Recomendado

1. **Fase 0** (1-2 días) → Base para todo
2. **Fase 1** (3-4 días) → Tool 2 Base (funcionalidad core sin IA)
3. **Fase 2** (3-4 días) → Tool 2 IA (enriquecimiento inteligente)
4. **Fase 3** (2-3 días) → Tool 2 Polish (UX avanzada)
5. **Fase 4** (4-5 días) → Tool 1 Base (Discovery engine)
6. **Fase 5** (2-3 días) → Manifiesto (cuando Tool 1 esté funcional)
7. **Fase 6** (1-2 días) → Integración final

**Total Estimado**: 18-25 días de desarrollo

### Dependencias Críticas

- Fase 0 → Todas las demás fases
- Fase 1 → Fase 2, Fase 3
- Fase 4 → Fase 5
- Fase 1-5 → Fase 6

---

## ⚠️ CONSIDERACIONES TÉCNICAS CRÍTICAS

### Tool 2 - Rendimiento
- ✅ AgGrid con `pagination=True` (50 filas por página) - **OBLIGATORIO**
- ✅ Virtualización automática de AgGrid
- ✅ No cargar todo el DataFrame en memoria de una vez
- ✅ Usar `chunksize` en pandas para CSVs grandes

### Tool 1 - IA
- ✅ Gemini 1.5 Pro para contexto largo (2M tokens)
- ✅ Tavily para búsquedas web optimizadas
- ✅ Function calling para manipulación de JSON
- ✅ Temperatura baja (0.2-0.3) para análisis riguroso

### Arquitectura de Datos
- ✅ Parquet con compresión (snappy o gzip)
- ✅ Schema evolution compatible
- ✅ Backup automático antes de modificaciones

---

## 📝 NOTAS FINALES

- Este plan está diseñado para implementación incremental
- Cada ticket debe tener criterios de aceptación claros
- Se recomienda hacer code review después de cada sprint
- Testing manual es suficiente para MVP (no se requiere test automatizado en esta fase)

---

**Última Actualización**: 2025-01-08
**Estado**: ✅ Plan Completo - Listo para Implementación
