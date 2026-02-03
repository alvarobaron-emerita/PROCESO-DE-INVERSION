"""
Data Chat - Asistente lateral para hablar con los datos visibles
"""
import streamlit as st
import pandas as pd
import json
import re
from tool_2_dataviewer.llm_factory import LLMFactory
from shared.config import GOOGLE_API_KEY


def render_data_chat(df_view: pd.DataFrame, key_prefix: str = "default") -> pd.DataFrame:
    """
    Renderiza el panel de chat para interactuar con los datos visibles.

    Args:
        df_view: DataFrame con los datos visibles en la tabla actual
        key_prefix: Prefijo único para las claves de los widgets (evita duplicados)

    Returns:
        DataFrame filtrado (o el original si no hay filtros aplicados)
    """
    with st.expander("💬 Asistente de Datos", expanded=False):
        st.markdown("""
        **Pregunta sobre los datos visibles:**
        - "¿Cuántas empresas hay en total?"
        - "Fíltrame las empresas de Valencia con EBITDA > 1M€"
        - "¿Cuál es el promedio de revenue?"
        """)

        # Inicializar historial de chat en session state con clave única
        chat_history_key = f'data_chat_history_{key_prefix}'
        if chat_history_key not in st.session_state:
            st.session_state[chat_history_key] = []

        # Inicializar DataFrame filtrado en session state
        filtered_df_key = f'data_chat_filtered_df_{key_prefix}'
        if filtered_df_key not in st.session_state:
            st.session_state[filtered_df_key] = df_view.copy()

        # Mostrar historial de conversación
        if st.session_state[chat_history_key]:
            st.markdown("### Historial de Conversación")
            for i, msg in enumerate(st.session_state[chat_history_key]):
                if msg['role'] == 'user':
                    st.markdown(f"**Tú:** {msg['content']}")
                else:
                    st.markdown(f"**Asistente:** {msg['content']}")
                    # Mostrar resultados si hay tablas o métricas
                    if 'result_data' in msg and msg['result_data']:
                        result_data = msg['result_data']
                        if 'table' in result_data:
                            st.dataframe(result_data['table'], use_container_width=True)
                        if 'metrics' in result_data:
                            cols = st.columns(len(result_data['metrics']))
                            for idx, (key, value) in enumerate(result_data['metrics'].items()):
                                with cols[idx]:
                                    st.metric(key, value)
                if i < len(st.session_state[chat_history_key]) - 1:
                    st.markdown("---")

        # Input de pregunta con clave única
        user_question = st.text_input(
            "Escribe tu pregunta:",
            key=f"data_chat_input_{key_prefix}",
            placeholder="Ej: ¿Cuántas empresas hay en total?"
        )

        if st.button("Enviar", key=f"data_chat_send_{key_prefix}") and user_question:
            with st.spinner("🤔 Analizando y ejecutando..."):
                try:
                    # Procesar pregunta y ejecutar acciones
                    answer, result_data = _process_question(
                        user_question,
                        st.session_state[filtered_df_key],
                        df_view  # DataFrame original para referencia
                    )

                    # Aplicar filtros si se detectaron
                    if result_data and 'filter_applied' in result_data:
                        st.session_state[filtered_df_key] = result_data['filtered_df']
                        st.info(f"✅ Filtro aplicado: {len(result_data['filtered_df'])} empresas encontradas")

                    # Guardar en historial
                    st.session_state[chat_history_key].append({
                        'role': 'user',
                        'content': user_question
                    })
                    st.session_state[chat_history_key].append({
                        'role': 'assistant',
                        'content': answer,
                        'result_data': result_data if result_data else None
                    })

                    # Rerun para actualizar historial
                    st.rerun()

                except Exception as e:
                    st.error(f"❌ Error al procesar pregunta: {e}")
                    with st.expander("Detalles del error"):
                        import traceback
                        st.code(traceback.format_exc(), language="text")

        # Botón para limpiar historial y resetear filtros
        # Verificar si hay filtros aplicados comparando longitudes
        has_filters = len(st.session_state[filtered_df_key]) != len(df_view)
        if st.session_state[chat_history_key] or has_filters:
            col1, col2 = st.columns(2)
            with col1:
                if st.button("🗑️ Limpiar Historial", key=f"data_chat_clear_{key_prefix}"):
                    st.session_state[chat_history_key] = []
                    st.session_state[filtered_df_key] = df_view.copy()
                    st.rerun()
            with col2:
                if st.button("🔄 Resetear Filtros", key=f"data_chat_reset_{key_prefix}"):
                    st.session_state[filtered_df_key] = df_view.copy()
                    st.rerun()

        # Retornar el DataFrame filtrado (o el original si no hay filtros)
        return st.session_state[filtered_df_key]


def _process_question(question: str, df: pd.DataFrame, original_df: pd.DataFrame) -> tuple:
    """
    Procesa la pregunta del usuario y ejecuta acciones reales.

    Returns:
        Tupla (respuesta_texto, resultado_datos)
    """
    question_lower = question.lower()
    result_data = {}

    # 1. Detectar y ejecutar filtros
    if any(word in question_lower for word in ['filtra', 'filtro', 'muéstrame', 'busca', 'encuentra', 'filtrame']):
        filtered_df, filter_info = _apply_filters(question, df)
        if filtered_df is not None and len(filtered_df) != len(df):
            result_data['filter_applied'] = True
            result_data['filtered_df'] = filtered_df
            result_data['filter_info'] = filter_info
            result_data['table'] = filtered_df.head(20)  # Mostrar primeras 20 filas
            df = filtered_df  # Usar DataFrame filtrado para siguientes operaciones

    # 2. Calcular estadísticas si se pregunta
    if any(word in question_lower for word in ['promedio', 'media', 'prom', 'average', 'mean']):
        stats = _calculate_statistics(question, df)
        if stats:
            result_data['metrics'] = stats

    # 3. Contar filas si se pregunta
    if any(word in question_lower for word in ['cuántas', 'cuantos', 'cuántos', 'total', 'count', 'hay']):
        count = len(df)
        if 'metrics' not in result_data:
            result_data['metrics'] = {}
        result_data['metrics']['Total empresas'] = count

    # 4. Generar respuesta con LLM usando resultados reales
    answer = _generate_llm_response(question, df, original_df, result_data)

    return answer, result_data


def _apply_filters(question: str, df: pd.DataFrame) -> tuple:
    """
    Aplica filtros basados en la pregunta del usuario.

    Returns:
        Tupla (DataFrame_filtrado, info_filtro)
    """
    filtered_df = df.copy()
    filter_info = []
    original_len = len(filtered_df)

    # Buscar nombres de ciudades (mejorado)
    city_patterns = ['valencia', 'madrid', 'barcelona', 'sevilla', 'bilbao', 'zaragoza', 'málaga', 'murcia']
    for city in city_patterns:
        if city in question.lower():
            # Buscar columna de ciudad (más flexible)
            city_cols = [col for col in df.columns if any(word in col.lower() for word in ['city', 'ciudad', 'localidad', 'país'])]
            if city_cols:
                col = city_cols[0]
                # Filtrar (manejar NaN correctamente)
                mask = filtered_df[col].astype(str).str.contains(city, case=False, na=False)
                filtered_df = filtered_df[mask]
                if len(filtered_df) < original_len:
                    filter_info.append(f"{col} contiene '{city}'")
                    original_len = len(filtered_df)

    # Buscar filtros numéricos - MEJORADO
    # Patrón más flexible: "EBITDA > 1000", "EBITDA mayor que 1000", "EBITDA > 1M€"
    ebitda_patterns = [
        r'ebitda\s*([><=]+)\s*(\d+)',  # EBITDA > 1000
        r'ebitda\s+(mayor|menor|igual)\s+(que|a)\s+(\d+)',  # EBITDA mayor que 1000
        r'ebitda\s*>\s*(\d+)',  # EBITDA > 1000 (más simple)
    ]

    for pattern in ebitda_patterns:
        ebitda_match = re.search(pattern, question.lower())
        if ebitda_match:
            # Extraer operador y valor
            if len(ebitda_match.groups()) == 2:
                operator = ebitda_match.group(1)
                value_str = ebitda_match.group(2)
            else:
                # Para patrones con "mayor que", "menor que"
                operator_word = ebitda_match.group(1) if ebitda_match.group(1) else '>'
                value_str = ebitda_match.group(3) if len(ebitda_match.groups()) >= 3 else ebitda_match.group(2)
                operator = '>' if 'mayor' in operator_word else '<' if 'menor' in operator_word else '='

            # Convertir valor (manejar "1M" = 1000)
            value = float(value_str)
            if 'm' in question.lower() and value < 100:
                value = value * 1000  # 1M = 1000 (en miles de euros)

            # Buscar columna EBITDA
            ebitda_cols = [col for col in filtered_df.columns if 'ebitda' in col.lower()]
            if ebitda_cols:
                col = ebitda_cols[0]
                # Convertir a numérico
                filtered_df[col] = pd.to_numeric(filtered_df[col], errors='coerce')
                # Aplicar filtro
                if '>' in operator or operator == '>':
                    mask = filtered_df[col] > value
                elif '<' in operator or operator == '<':
                    mask = filtered_df[col] < value
                else:
                    mask = filtered_df[col] == value

                filtered_df = filtered_df[mask]
                if len(filtered_df) < original_len:
                    filter_info.append(f"{col} {operator} {value}")
                    original_len = len(filtered_df)
            break  # Solo aplicar el primer match

    # Si no se encontró patrón específico, buscar genérico "> 1000" o "> 1M€"
    if not any('ebitda' in info.lower() for info in filter_info) and ('>' in question or '<' in question):
        number_match = re.search(r'([><=]+)\s*(\d+)', question)
        if number_match and 'ebitda' in question.lower():
            operator = number_match.group(1)
            value = float(number_match.group(2))
            if 'm' in question.lower() and value < 100:
                value = value * 1000

            ebitda_cols = [col for col in filtered_df.columns if 'ebitda' in col.lower()]
            if ebitda_cols:
                col = ebitda_cols[0]
                filtered_df[col] = pd.to_numeric(filtered_df[col], errors='coerce')
                if '>' in operator:
                    filtered_df = filtered_df[filtered_df[col] > value]
                elif '<' in operator:
                    filtered_df = filtered_df[filtered_df[col] < value]
                filter_info.append(f"{col} {operator} {value}")

    # Buscar revenue (similar a EBITDA)
    revenue_match = re.search(r'revenue\s*([><=]+)\s*(\d+)', question.lower())
    if revenue_match:
        operator = revenue_match.group(1)
        value = float(revenue_match.group(2))
        if 'm' in question.lower() and value < 100:
            value = value * 1000
        revenue_cols = [col for col in filtered_df.columns if 'revenue' in col.lower() or 'ingresos' in col.lower()]
        if revenue_cols:
            col = revenue_cols[0]
            filtered_df[col] = pd.to_numeric(filtered_df[col], errors='coerce')
            if '>' in operator:
                filtered_df = filtered_df[filtered_df[col] > value]
            elif '<' in operator:
                filtered_df = filtered_df[filtered_df[col] < value]
            filter_info.append(f"{col} {operator} {value}")

    return filtered_df, filter_info


def _calculate_statistics(question: str, df: pd.DataFrame) -> dict:
    """
    Calcula estadísticas basadas en la pregunta.

    Returns:
        Diccionario con métricas calculadas
    """
    stats = {}
    question_lower = question.lower()

    # Buscar revenue
    if 'revenue' in question_lower or 'ingresos' in question_lower:
        revenue_cols = [col for col in df.columns if 'revenue' in col.lower() or 'ingresos' in col.lower()]
        if revenue_cols:
            col = revenue_cols[0]
            df[col] = pd.to_numeric(df[col], errors='coerce')
            mean_val = df[col].mean()
            if not pd.isna(mean_val):
                stats['Promedio Revenue'] = f"{mean_val:,.2f}"

    # Buscar EBITDA
    if 'ebitda' in question_lower:
        ebitda_cols = [col for col in df.columns if 'ebitda' in col.lower()]
        if ebitda_cols:
            col = ebitda_cols[0]
            df[col] = pd.to_numeric(df[col], errors='coerce')
            mean_val = df[col].mean()
            if not pd.isna(mean_val):
                stats['Promedio EBITDA'] = f"{mean_val:,.2f}"

    return stats


def _generate_llm_response(question: str, df: pd.DataFrame, original_df: pd.DataFrame, result_data: dict) -> str:
    """
    Genera respuesta del LLM usando los resultados reales calculados.
    """
    if not GOOGLE_API_KEY:
        return "⚠️ GOOGLE_API_KEY no configurada."

    # Preparar contexto con resultados reales
    context = f"""
DATASET:
- Total de filas: {len(df)}
- Columnas: {', '.join(df.columns[:15].tolist())}...

RESULTADOS CALCULADOS:
"""

    if result_data:
        if 'metrics' in result_data:
            context += f"\nMétricas calculadas: {result_data['metrics']}"
        if 'filter_info' in result_data:
            context += f"\nFiltros aplicados: {', '.join(result_data['filter_info'])}"
            context += f"\nFilas después del filtro: {len(result_data['filtered_df'])} (de {len(original_df)} originales)"

    # Construir prompt mejorado
    prompt = f"""
Eres un asistente experto en análisis de datos que EJECUTA acciones reales, no solo da instrucciones.

CONTEXTO:
{context}

PREGUNTA DEL USUARIO: {question}

INSTRUCCIONES CRÍTICAS:
1. Si se aplicaron filtros, confirma que se aplicaron y muestra el resultado real
2. Si se calcularon estadísticas, muestra los valores reales calculados (ya están en el contexto)
3. Sé directo y ejecutivo: muestra resultados, no solo instrucciones
4. Si el usuario pregunta por algo que ya calculaste, muestra el resultado directamente
5. NO des instrucciones sobre cómo hacer algo, muestra que YA LO HICISTE

Responde en español de forma profesional y directa. Sé conciso pero informativo.
"""

    try:
        api_keys = {'GOOGLE': GOOGLE_API_KEY}
        model = LLMFactory.get_model("long_context", api_keys)
        response = model.invoke(prompt)
        return response.content if hasattr(response, 'content') else str(response)
    except Exception as e:
        return f"Error al generar respuesta: {e}"


def _prepare_data_context(df_view: pd.DataFrame) -> str:
    """
    Prepara un resumen del contexto de datos para el LLM.
    (Mantenido para compatibilidad, pero ahora se usa _generate_llm_response)
    """
    if df_view.empty:
        return "No hay datos visibles en este momento."

    num_rows = len(df_view)
    num_cols = len(df_view.columns)
    columns_list = list(df_view.columns)

    numeric_cols = df_view.select_dtypes(include=['number']).columns.tolist()
    stats_summary = []

    for col in numeric_cols[:10]:  # Aumentado a 10
        try:
            stats = df_view[col].describe()
            stats_summary.append(f"- {col}: min={stats['min']:.2f}, max={stats['max']:.2f}, mean={stats['mean']:.2f}")
        except:
            pass

    categorical_info = []
    important_cats = ['name', 'city', 'país', 'description', 'localidad']
    for col in important_cats:
        if col in df_view.columns:
            unique_vals = df_view[col].dropna().unique()[:10]
            if len(unique_vals) > 0:
                categorical_info.append(f"- {col}: {len(df_view[col].dropna().unique())} valores únicos")

    context = f"""
DATASET ACTUAL:
- Total de filas: {num_rows}
- Total de columnas: {num_cols}
- Columnas disponibles: {', '.join(columns_list[:30])}...

ESTADÍSTICAS NUMÉRICAS:
{chr(10).join(stats_summary) if stats_summary else 'No hay columnas numéricas disponibles'}

INFORMACIÓN CATEGÓRICA:
{chr(10).join(categorical_info) if categorical_info else 'No hay información categórica disponible'}
"""

    return context
