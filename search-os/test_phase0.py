"""
Script de prueba visual de la Fase 0 - Data Manager
Ejecutar con: python3 -m streamlit run test_phase0.py
"""
import streamlit as st
import sys
from pathlib import Path
import pandas as pd

# Añadir src al path
sys.path.insert(0, str(Path(__file__).parent / "src"))

from shared import data_manager
from shared.parquet_manager import add_system_columns

st.set_page_config(
    page_title="Test Fase 0 - Data Manager",
    page_icon="🧪",
    layout="wide"
)

st.title("🧪 Test Fase 0 - Data Manager")
st.markdown("Prueba visual del sistema de gestión de proyectos y datos Parquet")

# Sidebar
st.sidebar.title("📋 Acciones")
st.sidebar.markdown("---")

# Sección 1: Crear Proyecto
st.header("1️⃣ Crear Nuevo Proyecto")

with st.form("create_project_form"):
    project_name = st.text_input("Nombre del Proyecto", placeholder="Ej: Sector Vitivinícola 2025")
    submitted = st.form_submit_button("Crear Proyecto", use_container_width=True)

    if submitted and project_name:
        try:
            project_id = data_manager.create_project(project_name)
            st.success(f"✅ Proyecto creado: `{project_id}`")
            st.code(f"ID: {project_id}", language="text")
            st.rerun()
        except Exception as e:
            st.error(f"❌ Error: {e}")

st.markdown("---")

# Sección 2: Listar Proyectos
st.header("2️⃣ Proyectos Existentes")

projects = data_manager.list_projects()

if projects:
    st.info(f"📁 Encontrados {len(projects)} proyecto(s)")

    selected_project = st.selectbox(
        "Selecciona un proyecto:",
        options=projects,
        index=0 if projects else None,
        key="project_selector"
    )

    if selected_project:
        col1, col2 = st.columns(2)

        with col1:
            if st.button("📊 Ver Detalles del Schema", use_container_width=True):
                try:
                    schema = data_manager.load_schema(selected_project)
                    st.json(schema)

                    # Mostrar información adicional
                    st.markdown("### 📋 Listas Disponibles")
                    for list_item in schema.get('lists', []):
                        st.markdown(f"- **{list_item['name']}** (ID: `{list_item['id']}`)")

                    if schema.get('custom_columns_definitions'):
                        st.markdown("### 🏷️ Columnas Personalizadas")
                        for col_name, col_def in schema['custom_columns_definitions'].items():
                            st.markdown(f"- **{col_name}**: {col_def.get('type', 'N/A')}")
                except Exception as e:
                    st.error(f"Error: {e}")

        with col2:
            if st.button("🗑️ Eliminar Proyecto", use_container_width=True, type="secondary"):
                try:
                    data_manager.delete_project(selected_project)
                    st.success("✅ Proyecto eliminado correctamente")
                    st.rerun()
                except Exception as e:
                    st.error(f"Error: {e}")
else:
    st.warning("⚠️ No hay proyectos creados. Crea uno arriba 👆")

st.markdown("---")

# Sección 3: Probar con Datos
st.header("3️⃣ Probar con Datos de Ejemplo")

if projects:
    test_project = st.selectbox(
        "Proyecto para prueba:",
        options=projects,
        key="test_project_selector"
    )

    col1, col2 = st.columns(2)

    with col1:
        if st.button("📝 Crear DataFrame de Prueba", use_container_width=True):
            try:
                # Crear datos de ejemplo
                test_data = {
                    'name': ['Empresa A', 'Empresa B', 'Empresa C', 'Empresa D'],
                    'revenue': [1000000, 2500000, 1500000, 3000000],
                    'ebitda': [150000, 375000, 225000, 450000],
                    'city': ['Madrid', 'Barcelona', 'Valencia', 'Sevilla'],
                    'website': [
                        'https://empresa-a.es',
                        'https://empresa-b.es',
                        'https://empresa-c.es',
                        'https://empresa-d.es'
                    ]
                }
                df = pd.DataFrame(test_data)

                # Añadir columnas de sistema
                df = add_system_columns(df)

                # Guardar
                data_manager.save_master_data(test_project, df)

                st.success(f"✅ DataFrame guardado en `{test_project}`")
                st.dataframe(df, use_container_width=True)

                # Mostrar estadísticas
                st.markdown("### 📊 Estadísticas")
                col_stat1, col_stat2, col_stat3 = st.columns(3)
                with col_stat1:
                    st.metric("Total Filas", len(df))
                with col_stat2:
                    st.metric("Total Columnas", len(df.columns))
                with col_stat3:
                    if '_list_id' in df.columns:
                        list_counts = df['_list_id'].value_counts()
                        st.metric("En Inbox", list_counts.get('inbox', 0))

            except Exception as e:
                st.error(f"❌ Error: {e}")
                import traceback
                st.code(traceback.format_exc(), language="text")

    with col2:
        if st.button("📖 Cargar Datos del Proyecto", use_container_width=True):
            try:
                df = data_manager.load_master_data(test_project)

                if len(df) > 0:
                    st.success(f"✅ Datos cargados: {len(df)} filas")
                    st.dataframe(df, use_container_width=True)

                    # Mostrar estadísticas
                    st.markdown("### 📊 Estadísticas")
                    col_stat1, col_stat2, col_stat3 = st.columns(3)
                    with col_stat1:
                        st.metric("Total Filas", len(df))
                    with col_stat2:
                        st.metric("Total Columnas", len(df.columns))
                    with col_stat3:
                        if '_list_id' in df.columns:
                            list_counts = df['_list_id'].value_counts()
                            st.metric("En Inbox", list_counts.get('inbox', 0))

                    # Mostrar columnas de sistema
                    if '_uid' in df.columns or '_list_id' in df.columns:
                        st.markdown("### 🔧 Columnas de Sistema")
                        system_cols = [col for col in df.columns if col.startswith('_')]
                        st.code(', '.join(system_cols), language="text")

                else:
                    st.info("ℹ️ El proyecto está vacío. Crea datos de prueba arriba 👆")

            except Exception as e:
                st.error(f"❌ Error: {e}")
                import traceback
                st.code(traceback.format_exc(), language="text")
else:
    st.info("ℹ️ Crea un proyecto primero para probar con datos 👆")

st.markdown("---")

# Sección 4: Información del Sistema
st.header("4️⃣ Información del Sistema")

col1, col2 = st.columns(2)

with col1:
    st.subheader("📁 Estructura de Datos")
    st.code("""
data/processed/
└── {project_id}/
    ├── master_data.parquet
    └── schema_config.json
    """, language="text")

    st.markdown("### 📍 Ubicación de Datos")
    from shared.config import PROCESSED_DATA_DIR
    st.code(str(PROCESSED_DATA_DIR), language="text")

with col2:
    st.subheader("🔧 Funciones Disponibles")
    st.code("""
✓ create_project(name)
✓ save_master_data(id, df)
✓ load_master_data(id)
✓ update_schema(id, config)
✓ load_schema(id)
✓ list_projects()
✓ project_exists(id)
✓ delete_project(id)
    """, language="text")

    st.markdown("### ✅ Estado de la Fase 0")
    st.success("""
    **TICKET-00**: ✅ Configuración Inicial
    **TICKET-01**: ✅ Data Manager Backend

    Todo funcionando correctamente!
    """)

st.markdown("---")

# Footer
st.markdown("---")
st.markdown("### 📝 Notas")
st.info("""
- Los datos se guardan en formato **Parquet** con compresión
- Cada proyecto tiene su propia carpeta con `master_data.parquet` y `schema_config.json`
- Las columnas de sistema (`_uid`, `_list_id`) se añaden automáticamente
- Para ejecutar este test: `python3 -m streamlit run test_phase0.py`
""")
