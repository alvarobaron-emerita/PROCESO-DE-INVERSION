"""
Launcher principal de Search OS
Streamlit multi-page application
"""
import streamlit as st
import sys
from pathlib import Path

# Añadir src al path
sys.path.insert(0, str(Path(__file__).parent))

st.set_page_config(
    page_title="Search OS - Herramientas de Inversión",
    page_icon="🔍",
    layout="wide",
    initial_sidebar_state="expanded"
)

st.title("🔍 Search OS")
st.markdown("### Sistema de herramientas para análisis y descubrimiento de oportunidades de inversión")

# Crear dashboard central visual en lugar de sidebar
st.markdown("""
# 🚀 Search OS - Sistema de Análisis de Inversiones

Sistema completo para discovery y análisis de oportunidades de inversión.
""")

# Breadcrumbs / Migas de pan
current_page = st.session_state.get('selected_page', '🏠 Inicio')
page_names = {
    '🏠 Inicio': 'Dashboard',
    '🔍 Discovery Engine': 'Discovery Engine',
    '📊 Data Viewer': 'Data Viewer'
}

st.markdown(f"**📍 Ubicación:** {page_names.get(current_page, current_page)}")

# Definir variables necesarias antes de usarlas
discovery_active = st.session_state.get('discovery_report') is not None

# Obtener lista de proyectos del Data Viewer
try:
    from shared import data_manager
    projects = data_manager.list_projects()
except:
    projects = []

# Indicador de flujo activo
if discovery_active or projects:
    flow_status = []
    if discovery_active:
        flow_status.append("🔍 Análisis activo")
    if projects:
        flow_status.append(f"📊 {len(projects)} proyectos")
    if flow_status:
        st.info(" | ".join(flow_status))

# Estado del sistema
col_status1, col_status2, col_status3, col_status4 = st.columns(4)

with col_status1:
    if discovery_active:
        sector_name = st.session_state.discovery_report.get('meta', {}).get('sector_name', 'Sector')
        verdict = st.session_state.discovery_report.get('meta', {}).get('verdict', 'N/A')
        verdict_icon = {'VERDE': '🟢', 'ÁMBAR': '🟡', 'ROJO': '🔴'}.get(verdict, '⚪')
        st.success(f"🔍 Discovery: {sector_name} {verdict_icon}{verdict}")
    else:
        st.info("🔍 Discovery Engine: Sin análisis activo")

with col_status2:
    # Mostrar estado de proyectos (ya obtenidos arriba)
    if projects:
        st.success(f"📊 Data Viewer: {len(projects)} proyectos")
    else:
        st.info("📊 Data Viewer: Sin proyectos")

with col_status3:
    # Estado de integración
    integration_active = (discovery_active and projects)
    if integration_active:
        st.success("🔄 Integración: Flujo activo disponible")
    else:
        st.info("🔄 Integración: Lista para conectar herramientas")

with col_status4:
    st.info("⚙️ Configuración: Personalización completa")

st.markdown("---")

# Dashboard de herramientas con cards visuales
st.markdown("## 🛠️ Herramientas Disponibles")

# Fila 1: Herramientas principales
col1, col2 = st.columns(2)

with col1:
    st.markdown("""
    ### 🔍 Discovery Engine
    **Copiloto de inversión automatizado**

    - Análisis sectorial completo con IA
    - Evaluación según tesis Emerita
    - Chat interactivo con contexto inteligente
    - Configuración personalizable de prompts
    """)

    if st.button("🚀 Abrir Discovery Engine", use_container_width=True, type="primary"):
        st.session_state.selected_page = "🔍 Discovery Engine"
        st.rerun()

with col2:
    st.markdown("""
    ### 📊 Data Viewer
    **Visualizador inteligente de datos SABI**

    - Gestión avanzada de proyectos
    - AgGrid virtualizado para datasets grandes
    - Columnas IA y chat conversacional
    - Exportación y análisis detallado
    """)

    if st.button("📈 Abrir Data Viewer", use_container_width=True, type="primary"):
        st.session_state.selected_page = "📊 Data Viewer"
        st.rerun()

# Fila 2: Flujo integrado
st.markdown("---")
st.markdown("## 🔄 Flujo de Trabajo Integrado")

col_flow1, col_flow2, col_flow3 = st.columns(3)

with col_flow1:
    st.markdown("### 1️⃣ Análisis Sectorial")
    st.markdown("🔍 Discovery Engine analiza el sector y identifica oportunidades")

with col_flow2:
    st.markdown("### 2️⃣ Transferencia Automática")
    st.markdown("🔄 Un clic crea proyecto en Data Viewer con empresas encontradas")

with col_flow3:
    st.markdown("### 3️⃣ Análisis Detallado")
    st.markdown("📊 Data Viewer permite análisis profundo y toma de decisiones")

# Sección de acciones rápidas si hay análisis activo
if discovery_active and projects:
    st.markdown("---")
    st.markdown("## ⚡ Acciones Rápidas")

    col_quick1, col_quick2, col_quick3 = st.columns(3)

    with col_quick1:
        if st.button("🔄 Continuar Análisis", use_container_width=True):
            st.session_state.selected_page = "🔍 Discovery Engine"
            st.rerun()

    with col_quick2:
        if st.button("📊 Ver Proyectos Recientes", use_container_width=True):
            st.session_state.selected_page = "📊 Data Viewer"
            st.rerun()

    with col_quick3:
        # Verificar si hay un proyecto reciente de Discovery
        recent_projects = [p for p in projects if 'Discovery' in p]
        if recent_projects:
            if st.button(f"🎯 Ver último análisis ({recent_projects[-1]})", use_container_width=True, type="secondary"):
                st.session_state.selected_page = "📊 Data Viewer"
                st.session_state.target_project_id = recent_projects[-1]
                st.rerun()

# Navegación interna (mantener compatibilidad)
page = st.session_state.get('selected_page', '🏠 Inicio')

st.sidebar.markdown("---")
st.sidebar.markdown("### 📝 Estado del Proyecto")
st.sidebar.info("""
**Fase 0**: ✅ Completada
**Fase 1**: ⏳ En progreso
- ✅ TICKET-02: Gestión de Proyectos
- ✅ TICKET-03: Ingesta SABI
- ✅ TICKET-04: AgGrid
- ✅ TICKET-05: Pestañas
- ✅ TICKET-06: Mover Filas
- ⏳ TICKET-07: Columnas Personalizadas
""")

# Sistema de navegación mejorado
if 'navigate_to_data_viewer' in st.session_state and st.session_state.navigate_to_data_viewer:
    page = "📊 Data Viewer"
    del st.session_state.navigate_to_data_viewer

    # Si hay un proyecto target, seleccionarlo automáticamente
    if 'target_project_id' in st.session_state:
        target_project = st.session_state.target_project_id
        del st.session_state.target_project_id

# Determinar página actual (con fallback)
if 'selected_page' not in st.session_state:
    st.session_state.selected_page = '🏠 Inicio'

page = st.session_state.selected_page

# Manejar navegación desde botones del dashboard
if st.session_state.selected_page == '🏠 Inicio':
    # Los botones están definidos en el dashboard, aquí solo manejamos la lógica
    pass

# Routing de páginas mejorado
if page == "🏠 Inicio":
    st.markdown("---")

    col1, col2 = st.columns([2, 1])

    with col1:
        st.markdown("""
        #### 🚀 Bienvenido a Search OS

        Sistema completo de herramientas para análisis y descubrimiento de oportunidades de inversión.

        ### 🛠️ Herramientas Disponibles

        #### 📊 Data Viewer
        - Visualizador de CSVs pesados con AgGrid virtualizado
        - Gestión de proyectos con archivos Parquet
        - Normalización automática de datos SABI
        - Organización en listas (Inbox, Shortlist, Descartados)
        - **Estado**: ✅ Funcional (Fase 1 en progreso)

        #### 🔍 Discovery Engine
        - Copiloto de inversión automatizado
        - Análisis sectorial con IA
        - Generación de informes estructurados
        - **Estado**: ⏳ Pendiente (Fase 4)
        """)

    with col2:
        st.info("""
        **💡 Quick Start**

        1. Ve a **Data Viewer** desde el menú
        2. Crea un nuevo proyecto
        3. Sube un archivo CSV/Excel de SABI
        4. ¡Empieza a analizar!
        """)

        st.markdown("### 📊 Arquitectura")
        st.code("""
        data/processed/
        └── {project_id}/
            ├── master_data.parquet
            └── schema_config.json
        """, language="text")

elif page == "📊 Data Viewer":
    # Header con navegación
    col_nav, col_title = st.columns([1, 4])
    with col_nav:
        if st.button("🏠 Volver al Dashboard", use_container_width=True):
            st.session_state.selected_page = '🏠 Inicio'
            st.rerun()

    with col_title:
        st.markdown("## 📊 Data Viewer - Visualizador de Datos SABI")

    # Verificar si viene desde Discovery Engine con proyecto específico
    if 'target_project' in locals() and target_project:
        st.success(f"🎯 **Proyecto creado automáticamente desde Discovery Engine**")
        st.info(f"📁 **Proyecto:** `{target_project}`  \n"
                f"📋 **Contenido:** Empresas identificadas durante el análisis sectorial  \n"
                f"🚀 **Estado:** Listo para análisis detallado")

        # Mostrar resumen del proyecto creado
        try:
            from shared import data_manager
            df = data_manager.load_master_data(target_project)
            if not df.empty:
                st.markdown("### 📈 Resumen del Proyecto")
                col1, col2, col3 = st.columns(3)
                with col1:
                    st.metric("Empresas", len(df))
                with col2:
                    if 'revenue' in df.columns:
                        total_rev = df['revenue'].sum()
                        st.metric("Revenue Total", f"{total_rev/1e6:.1f}M€")
                with col3:
                    if 'ebitda' in df.columns:
                        total_ebitda = df['ebitda'].sum()
                        st.metric("EBITDA Total", f"{total_ebitda/1e6:.1f}M€")
        except Exception as e:
            st.warning(f"No se pudo cargar el resumen del proyecto: {e}")

        st.markdown("---")

    # Redirigir al Data Viewer
    # Nota: Para ejecutar el Data Viewer directamente, usa: streamlit run src/tool_2_dataviewer/app.py
    st.info("""
    💡 **Para usar el Data Viewer completo:**

    Ejecuta directamente:
    ```bash
    python3 -m streamlit run src/tool_2_dataviewer/app.py
    ```

    O desde la raíz del proyecto:
    ```bash
    cd search-os
    python3 -m streamlit run src/tool_2_dataviewer/app.py
    ```
    """)

    st.markdown("### 📊 Funcionalidades del Data Viewer")
    st.markdown("""
    - ✅ Gestión de proyectos
    - ✅ Carga de archivos CSV/Excel de SABI
    - ✅ Normalización automática de columnas
    - ✅ Visualización con AgGrid virtualizado (50 filas por página)
    - ✅ Navegación por pestañas (Inbox, Shortlist, Descartados)
    - ✅ Mover filas entre listas
    - ⏳ Columnas personalizadas (próximamente)
    """)

elif page == "🔍 Discovery Engine":
    # Header con navegación
    col_nav, col_title = st.columns([1, 4])
    with col_nav:
        if st.button("🏠 Volver al Dashboard", use_container_width=True):
            st.session_state.selected_page = '🏠 Inicio'
            st.rerun()

    with col_title:
        st.markdown("## 🔍 Discovery Engine - Análisis Sectorial con IA")

    # Redirigir al Discovery Engine
    # Nota: Para ejecutar el Discovery Engine directamente, usa: streamlit run src/tool_1_discovery/app.py
    st.success("""
    ✅ **Discovery Engine completamente funcional**

    El sistema incluye:
    - Pipeline de agentes (Clasificador CNAE, Investigador Tavily, Analista Gemini)
    - UI Split-Screen con chat interactivo y memoria conversacional
    - Evaluación automática según tesis Emerita personalizable
    - Integración directa con Data Viewer
    - Configuración completa de prompts y tesis
    """)

    st.info("""
    💡 **Para usar el Discovery Engine completo:**

    Ejecuta directamente:
    ```bash
    python3 -m streamlit run src/tool_1_discovery/app.py
    ```

    O desde la raíz del proyecto:
    ```bash
    cd search-os
    python3 -m streamlit run src/tool_1_discovery/app.py
    ```
    """)
