"""
Pipeline Batch de Enriquecimiento IA para columnas inteligentes.

Procesa múltiples filas en lotes, aplicando análisis IA según la configuración
de la columna IA definida en el schema.
"""
import json
import re
from typing import List, Optional, Dict
import pandas as pd
import streamlit as st

from shared import data_manager
from shared.config import (
    GROQ_API_KEY,
    DEEPINFRA_API_KEY,
    OPENAI_API_KEY,
    GOOGLE_API_KEY
)
from tool_2_dataviewer.llm_factory import LLMFactory
from tool_2_dataviewer.smart_context import optimize_context


def parse_json_response(response_text: str) -> Dict:
    """
    Parsea la respuesta del LLM extrayendo JSON.

    Args:
        response_text: Texto de respuesta del LLM

    Returns:
        Diccionario con 'score' (0-10) y 'reason' (string)

    Raises:
        ValueError: Si no se puede parsear el JSON o falta algún campo
    """
    if not response_text or not response_text.strip():
        raise ValueError("Respuesta vacía del LLM")

    # Limpiar respuesta (puede venir con markdown code blocks)
    cleaned = response_text.strip()

    # Remover markdown code blocks si existen
    if cleaned.startswith("```json"):
        cleaned = cleaned.replace("```json", "").replace("```", "").strip()
    elif cleaned.startswith("```"):
        cleaned = cleaned.replace("```", "").strip()

    # Intentar parsear JSON directamente
    try:
        result = json.loads(cleaned)
    except json.JSONDecodeError:
        # Intentar extraer JSON embebido en texto
        json_match = re.search(r'\{.*?\}', cleaned, re.DOTALL)
        if json_match:
            try:
                result = json.loads(json_match.group())
            except json.JSONDecodeError:
                raise ValueError(f"No se pudo parsear JSON de la respuesta: {cleaned[:200]}")
        else:
            raise ValueError(f"No se encontró JSON en la respuesta: {cleaned[:200]}")

    # Validar estructura
    if not isinstance(result, dict):
        raise ValueError(f"La respuesta no es un objeto JSON: {type(result)}")

    # Validar campos requeridos
    if 'score' not in result:
        raise ValueError("La respuesta no contiene 'score'")

    # Validar y normalizar score (0-10)
    try:
        score = float(result['score'])
        if score < 0:
            score = 0
        elif score > 10:
            score = 10
        result['score'] = str(score)  # Guardar como string para compatibilidad con Parquet
    except (ValueError, TypeError):
        raise ValueError(f"Score inválido: {result.get('score')}")

    # Validar reason (puede ser opcional, pero mejor tenerlo)
    if 'reason' not in result:
        result['reason'] = "Sin explicación proporcionada"
    elif not isinstance(result['reason'], str):
        result['reason'] = str(result['reason'])

    return result


def enrich_column_batch(
    project_id: str,
    column_name: str,
    row_indices: Optional[List[int]] = None,
    progress_bar=None,
    status_text=None
) -> Dict[str, any]:
    """
    Ejecuta enriquecimiento IA sobre filas seleccionadas.

    Args:
        project_id: ID del proyecto
        column_name: Nombre de la columna IA a enriquecer
        row_indices: Lista de índices de filas a procesar (None = todas las filas)
        progress_bar: Streamlit progress bar (opcional)
        status_text: Streamlit text element para mostrar estado (opcional)

    Returns:
        Diccionario con estadísticas: {'processed': int, 'success': int, 'errors': int, 'errors_list': List[str]}

    Raises:
        ValueError: Si el proyecto no existe o la columna IA no está definida
    """
    # 1. Cargar datos y schema
    df = data_manager.load_master_data(project_id)
    schema = data_manager.load_schema(project_id)

    # 2. Validar que la columna IA existe
    if 'custom_columns_definitions' not in schema:
        raise ValueError("No hay columnas personalizadas definidas en el proyecto")

    if column_name not in schema['custom_columns_definitions']:
        raise ValueError(f"La columna '{column_name}' no está definida en el schema")

    column_def = schema['custom_columns_definitions'][column_name]

    if column_def.get('type') != 'ai_score':
        raise ValueError(f"La columna '{column_name}' no es una columna IA")

    # 3. Preparar API keys
    api_keys = {
        'GROQ': GROQ_API_KEY,
        'DEEPINFRA': DEEPINFRA_API_KEY,
        'OPENAI': OPENAI_API_KEY,
        'GOOGLE': GOOGLE_API_KEY
    }

    # 4. Smart Context: Determinar columnas necesarias
    if column_def['config'].get('smart_context', True):
        try:
            needed_cols = optimize_context(
                column_def['config']['user_prompt'],
                df.columns.tolist()
            )
            if status_text:
                status_text.text(f"📊 Columnas seleccionadas por Smart Context: {len(needed_cols)} de {len(df.columns)}")
        except Exception as e:
            # Si falla Smart Context, usar todas las columnas
            print(f"⚠️ Error en Smart Context Optimizer: {e}. Usando todas las columnas.")
            needed_cols = df.columns.tolist()
    else:
        needed_cols = df.columns.tolist()

    # 5. Filtrar filas a procesar
    if row_indices is None:
        rows_to_process = df.copy()
    else:
        rows_to_process = df.iloc[row_indices].copy()

    if len(rows_to_process) == 0:
        return {'processed': 0, 'success': 0, 'errors': 0, 'errors_list': []}

    # 6. Instanciar modelo LLM
    try:
        model = LLMFactory.get_model(
            column_def['config']['model_selected'],
            api_keys
        )
    except Exception as e:
        raise ValueError(f"Error al instanciar modelo LLM: {e}")

    # 7. Procesar filas en lotes
    stats = {
        'processed': 0,
        'success': 0,
        'errors': 0,
        'errors_list': []
    }

    total_rows = len(rows_to_process)
    score_col = column_name
    reason_col = f"{column_name}_reason"

    # Asegurar que las columnas existen y tienen el tipo correcto
    if score_col not in df.columns:
        df[score_col] = pd.Series(dtype='float64')
    else:
        # Convertir columna existente a float64 si no lo es
        df[score_col] = pd.to_numeric(df[score_col], errors='coerce')

    if reason_col not in df.columns:
        df[reason_col] = ''

    # Construir prompt base
    user_prompt = column_def['config']['user_prompt']
    system_prompt = f"""Eres un analista experto. Analiza los datos proporcionados y responde según las instrucciones.

INSTRUCCIONES:
{user_prompt}

IMPORTANTE: Debes devolver ÚNICAMENTE un JSON con este formato exacto:
{{
    "score": <número entre 0 y 10>,
    "reason": "<explicación breve de 1-2 frases>"
}}

El score debe ser un número entre 0 y 10, donde:
- 0-3: Bajo/No aplicable
- 4-6: Medio
- 7-8: Alto
- 9-10: Muy alto/Crítico

Responde SOLO con el JSON, sin texto adicional."""

    for idx, (row_idx, row) in enumerate(rows_to_process.iterrows()):
        try:
            # Actualizar progreso
            if progress_bar:
                progress_bar.progress((idx + 1) / total_rows)
            if status_text:
                status_text.text(f"🔄 Procesando fila {idx + 1}/{total_rows}...")

            # Construir contexto JSON mínimo (solo columnas necesarias)
            context = {}
            for col in needed_cols:
                if col in row:
                    val = row[col]
                    # Convertir NaN/None a string vacío
                    if pd.isna(val):
                        context[col] = ""
                    else:
                        context[col] = str(val)

            # Construir prompt completo
            prompt = f"""{system_prompt}

DATOS DE LA EMPRESA:
{json.dumps(context, indent=2, ensure_ascii=False)}

Responde con el JSON solicitado:"""

            # Llamada al LLM
            response = model.invoke(prompt)
            result = parse_json_response(response.content)

            # Actualizar DataFrame
            # Convertir score a float para mantener consistencia de tipo
            try:
                score_value = float(result['score']) if result['score'] else pd.NA
            except (ValueError, TypeError):
                score_value = pd.NA
            df.loc[row_idx, score_col] = score_value
            df.loc[row_idx, reason_col] = result['reason']

            stats['success'] += 1

        except Exception as e:
            error_msg = f"Fila {row_idx}: {str(e)}"
            stats['errors_list'].append(error_msg)
            stats['errors'] += 1
            print(f"❌ Error procesando fila {row_idx}: {e}")
            # Continuar con la siguiente fila

        stats['processed'] += 1

    # 8. Guardar datos actualizados
    try:
        data_manager.save_master_data(project_id, df)
    except Exception as e:
        raise ValueError(f"Error al guardar datos: {e}")

    return stats
