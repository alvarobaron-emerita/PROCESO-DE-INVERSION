"""
Configuración de AgGrid para visualización de datos
Incluye virtualización obligatoria para rendimiento
"""
import pandas as pd
import re
from st_aggrid import AgGrid, GridOptionsBuilder, GridUpdateMode, JsCode
from typing import Dict, Optional


def format_number(value: float) -> str:
    """
    Formatea números en formato compacto (1.5M€, 150K€, etc.)
    """
    if pd.isna(value) or value == 0:
        return "0"

    abs_value = abs(value)

    if abs_value >= 1_000_000:
        return f"{value / 1_000_000:.1f}M€"
    elif abs_value >= 1_000:
        return f"{value / 1_000:.1f}K€"
    else:
        return f"{value:.0f}€"


def render_grid(
    df_view: pd.DataFrame,
    custom_defs: Optional[Dict] = None,
    key: str = "main_grid"
) -> Dict:
    """
    Renderiza AgGrid con virtualización y funcionalidades avanzadas.

    Características principales:
    - Scroll infinito (sin paginación) para experiencia tipo Excel
    - Virtualización automática para rendimiento con 1000+ filas
    - Selección múltiple con checkboxes
    - Panel lateral para filtros y gestión de columnas
    - Ordenamiento numérico correcto para columna "Mark"
    - Formato numérico compacto (1.5M€, 150K€) para columnas financieras

    Args:
        df_view: DataFrame a mostrar (ya filtrado por lista y sin filas vacías)
        custom_defs: Diccionario con definiciones de columnas personalizadas
        key: Clave única para el componente Streamlit

    Returns:
        Diccionario con la respuesta del grid. Siempre incluye 'selected_rows' como lista
        (puede estar vacía). Si grid_response es None, retorna {'selected_rows': [], 'data': []}.

    Notas:
        - La columna "Mark" se configura automáticamente como numérica para ordenamiento correcto
        - Las filas vacías deben filtrarse ANTES de pasar el DataFrame a esta función
        - El scroll solo muestra filas hasta la última con datos (sin filas en blanco al final)
    """
    if df_view.empty:
        return {'selected_rows': [], 'data': []}

    # Inicializar custom_defs si es None
    if custom_defs is None:
        custom_defs = {}

    # ========================================================================
    # LIMPIAR DATOS IA ANTES DE CREAR EL GRID
    # ========================================================================
    # Limpiar columnas IA que puedan tener HTML guardado
    df_view_clean = df_view.copy()
    for col_name, col_config in custom_defs.items():
        if col_config.get('type') == 'ai_score' and col_name in df_view_clean.columns:
            def clean_score_value(val):
                """Extrae el valor numérico de un score, incluso si contiene HTML"""
                if pd.isna(val) or val == '' or val is None:
                    return pd.NA
                val_str = str(val)
                # Si contiene HTML, intentar extraer el número
                match = re.search(r'(\d+\.?\d*)/10|(\d+\.?\d*)', val_str)
                if match:
                    return float(match.group(1) or match.group(2))
                # Si no hay HTML, intentar parsear directamente
                try:
                    return float(val_str)
                except:
                    return pd.NA

            # Limpiar la columna ANTES de crear el grid
            df_view_clean[col_name] = df_view_clean[col_name].apply(clean_score_value)
            df_view_clean[col_name] = pd.to_numeric(df_view_clean[col_name], errors='coerce')

    # Crear GridOptionsBuilder desde el DataFrame LIMPIO
    gb = GridOptionsBuilder.from_dataframe(df_view_clean)

    # ========================================================================
    # 1. HABILITAR SELECCIÓN Y CHECKBOXES
    # ========================================================================
    gb.configure_selection(
        selection_mode="multiple",
        use_checkbox=True,
        pre_selected_rows=[],
        header_checkbox=True
    )

    # ========================================================================
    # 2. HABILITAR PANEL LATERAL (SideBar) para mover/ocultar columnas
    # ========================================================================
    gb.configure_side_bar()

    # ========================================================================
    # 3. SCROLL INFINITO (SIN PAGINACIÓN)
    # ========================================================================
    # AgGrid usa virtualización automática por defecto
    # No configuramos paginación para permitir scroll infinito como Excel
    # La virtualización asegura rendimiento fluido con 1000+ filas

    # ========================================================================
    # 4. CONFIGURAR COLUMNAS CUSTOM (Etiquetas, Texto Libre, y Columnas IA)
    # ========================================================================
    for col_name, col_config in custom_defs.items():
        if col_name in df_view_clean.columns:
            col_type = col_config.get('type')

            if col_type == 'single_select':
                # Columna tipo "Etiqueta" - dropdown con opciones predefinidas
                gb.configure_column(
                    col_name,
                    editable=True,
                    cellEditor='agSelectCellEditor',
                    cellEditorParams={'values': col_config.get('options', [])}
                )
            elif col_type == 'text':
                # Columna tipo "Texto Libre" - editable con input de texto
                gb.configure_column(
                    col_name,
                    editable=True
                )
            elif col_type == 'ai_score':
                # Columna tipo "IA Score" - renderizado con badges y tooltip
                reason_col = f"{col_name}_reason"

                # Cell renderer - Solución simple: texto con emojis Unicode, sin HTML
                score_renderer = JsCode("""
                function(params) {
                    // Manejar valores vacíos, null, undefined, o NaN
                    if (params.value == null || params.value === undefined || params.value === '' || (typeof params.value === 'number' && isNaN(params.value))) {
                        return '-';
                    }

                    // Convertir a número (los datos ya están limpios, solo números o NaN)
                    let scoreValue = parseFloat(params.value);
                    if (isNaN(scoreValue)) {
                        return '-';
                    }

                    let emoji;
                    if (scoreValue >= 8) {
                        emoji = '🟢';
                    } else if (scoreValue >= 5) {
                        emoji = '🟡';
                    } else {
                        emoji = '🔴';
                    }

                    // Devolver texto simple con emoji y score (sin HTML)
                    return emoji + ' ' + scoreValue.toFixed(1) + '/10';
                }
                """)

                # Configurar columna con renderer y tooltip
                gb.configure_column(
                    col_name,
                    editable=False,  # Las columnas IA no son editables manualmente
                    cellRenderer=score_renderer,
                    tooltipField=reason_col if reason_col in df_view_clean.columns else None,
                    width=120,
                    headerName=col_name.replace('_', ' ').title(),  # Formato más legible del nombre
                    type="numericColumn"  # Asegurar que se trata como numérica
                )

    # ========================================================================
    # 5. OCULTAR COLUMNAS DE SISTEMA
    # ========================================================================
    # Columnas de sistema que no deben mostrarse en la tabla
    system_columns = ['_uid', '_list_id', '_rows_consolidated']
    for col in system_columns:
        if col in df_view_clean.columns:
            gb.configure_column(col, hide=True)

    # ========================================================================
    # 6. FORMATO NUMÉRICO COMPACTO
    # ========================================================================
    numeric_columns = ['revenue', 'ebitda', 'net_income']

    # Crear JavaScript formatter para números
    number_formatter = JsCode("""
    function(params) {
        if (params.value == null || params.value === undefined) {
            return '0';
        }
        const value = parseFloat(params.value);
        if (value === 0) return '0';
        const absValue = Math.abs(value);
        if (absValue >= 1000000) {
            return (value / 1000000).toFixed(1) + 'M€';
        } else if (absValue >= 1000) {
            return (value / 1000).toFixed(1) + 'K€';
        } else {
            return value.toFixed(0) + '€';
        }
    }
    """)

    for col in numeric_columns:
        if col in df_view_clean.columns:
            gb.configure_column(
                col,
                valueFormatter=number_formatter,
                type=["numericColumn", "numberColumnFilter", "customNumericFormat"],
                aggFunc='sum'
            )

    # ========================================================================
    # 6.5. CONFIGURAR COLUMNA "MARK" COMO NUMÉRICA
    # ========================================================================
    # La columna "Mark" debe ordenarse numéricamente, no alfabéticamente
    # Esto corrige el problema donde "66" aparecía entre "659" y "660" al ordenar
    # Buscar columna "Mark" de forma flexible (puede tener espacios, mayúsculas, etc.)
    mark_col = None
    for col in df_view_clean.columns:
        col_clean = col.strip().lower()
        if col_clean == 'mark':
            mark_col = col
            break

    if mark_col:
        # Configurar como columna numérica con comparador personalizado
        # El comparador asegura ordenamiento numérico incluso si los valores llegan como strings
        gb.configure_column(
            mark_col,
            type=["numericColumn", "numberColumnFilter"],
            sort='asc',  # Ordenamiento por defecto ascendente
            # Comparador personalizado para asegurar ordenamiento numérico correcto
            # Esto es crítico porque los valores pueden llegar como strings ("1.0", "10.0", etc.)
            comparator=JsCode("""
            function(valueA, valueB, nodeA, nodeB, isDescending) {
                // Convertir a número para comparar (maneja strings y números)
                const numA = parseFloat(valueA);
                const numB = parseFloat(valueB);

                // Manejar NaN (valores no numéricos)
                if (isNaN(numA) && isNaN(numB)) return 0;
                if (isNaN(numA)) return 1;  // NaN va al final
                if (isNaN(numB)) return -1;  // NaN va al final

                // Comparación numérica
                return numA - numB;
            }
            """),
            # Parser para asegurar que se trata como número, no texto
            valueParser=JsCode("""
            function(params) {
                if (params.newValue == null || params.newValue === undefined || params.newValue === '') {
                    return null;
                }
                const parsed = parseFloat(params.newValue);
                return isNaN(parsed) ? null : parsed;
            }
            """)
        )

    # ========================================================================
    # 7. CONFIGURACIÓN ADICIONAL
    # ========================================================================
    # Fijar columna 'name' a la izquierda si existe
    if 'name' in df_view_clean.columns:
        gb.configure_column(
            'name',
            pinned='left',
            width=250,
            cellRenderer=JsCode("""
            function(params) {
                if (params.value) {
                    return '<b>' + params.value + '</b>';
                }
                return '';
            }
            """)
        )

    # Configurar altura de filas
    gb.configure_default_column(
        resizable=True,
        sortable=True,
        filter=True,
        flex=1,
        minWidth=100
    )

    # ========================================================================
    # 8. CONSTRUIR Y RENDERIZAR
    # ========================================================================
    grid_options = gb.build()

    # Configurar para scroll infinito (sin paginación)
    grid_options['suppressPaginationPanel'] = True
    grid_options['domLayout'] = 'normal'  # Permite scroll vertical

    # Renderizar AgGrid con el DataFrame LIMPIO
    grid_response = AgGrid(
        df_view_clean,
        gridOptions=grid_options,
        enable_enterprise_modules=True,  # Necesario para SideBar completo
        update_mode=GridUpdateMode.MODEL_CHANGED,
        allow_unsafe_jscode=True,  # Para formatters personalizados
        theme='streamlit',  # Tema Streamlit
        height=600,  # Altura fija del grid (scroll dentro de este espacio)
        key=key,
        reload_data=False
    )

    return grid_response
