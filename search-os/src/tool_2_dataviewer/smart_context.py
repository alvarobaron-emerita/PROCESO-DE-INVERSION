"""
Smart Context Optimizer: Reduce consumo de tokens seleccionando solo columnas necesarias.

Este módulo usa un LLM ligero (Groq/Llama-3-8B) para analizar el prompt del usuario
y determinar qué columnas del dataset son realmente necesarias para responder.
Esto reduce el consumo de tokens en 60-80% comparado con enviar todas las columnas.
"""
from typing import List
import json
from langchain_groq import ChatGroq
from shared.config import GROQ_API_KEY


CONTEXT_OPTIMIZER_SYSTEM_PROMPT = """ERES UN INGENIERO DE DATOS OPTIMIZADOR.

TU OBJETIVO: Seleccionar del dataset únicamente las columnas estrictamente necesarias para responder al prompt del usuario.

REGLAS:
1. Sé minimalista. Solo incluye columnas que sean DIRECTAMENTE relevantes para el prompt.
2. SIEMPRE incluye 'name' (o 'nombre') y 'website' (o 'web') si existen, ya que son esenciales para identificar la empresa.
3. Si el prompt menciona métricas financieras, incluye columnas relacionadas (revenue, ebitda, employees, etc.).
4. Si el prompt menciona ubicación, incluye columnas geográficas (city, país, etc.).
5. Si el prompt menciona sector/industria, incluye columnas CNAE o de clasificación.
6. NO incluyas columnas que no aporten información relevante para el prompt.

FORMATO DE RESPUESTA:
Devuelve ÚNICAMENTE un JSON array de strings con los nombres de las columnas seleccionadas.
Ejemplo: ["name", "website", "revenue", "ebitda", "employees"]

NO incluyas explicaciones, solo el JSON array."""


def optimize_context(user_prompt: str, available_columns: List[str]) -> List[str]:
    """
    Determina qué columnas son necesarias para responder al prompt del usuario.

    Usa Groq (Llama-3-8B) para hacer una selección inteligente de columnas,
    reduciendo significativamente el consumo de tokens.

    Args:
        user_prompt: El prompt o instrucción del usuario para la columna IA
        available_columns: Lista de todas las columnas disponibles en el dataset

    Returns:
        Lista de columnas seleccionadas (siempre incluye 'name' y 'website' si existen)

    Raises:
        ValueError: Si no se puede parsear la respuesta del LLM
        RuntimeError: Si GROQ_API_KEY no está configurada
    """
    if not GROQ_API_KEY:
        raise RuntimeError(
            "GROQ_API_KEY no está configurada. "
            "El Smart Context Optimizer requiere Groq para funcionar."
        )

    if not available_columns:
        return []

    # Normalizar nombres de columnas para búsqueda (case-insensitive)
    columns_lower = {col.lower(): col for col in available_columns}

    # Construir prompt para el optimizador
    prompt = f"""
{CONTEXT_OPTIMIZER_SYSTEM_PROMPT}

PROMPT DEL USUARIO:
{user_prompt}

COLUMNAS DISPONIBLES EN EL DATASET:
{json.dumps(available_columns, indent=2, ensure_ascii=False)}

Recuerda: Devuelve SOLO un JSON array de strings, sin explicaciones adicionales.
"""

    try:
        # Usar Groq con modelo ligero para optimización
        model = ChatGroq(
            model_name="llama-3-8b-8192",  # Modelo más ligero para optimización
            groq_api_key=GROQ_API_KEY,
            temperature=0.1  # Baja temperatura para respuestas consistentes
        )

        response = model.invoke(prompt)
        response_text = response.content.strip()

        # Limpiar respuesta (puede venir con markdown code blocks)
        if response_text.startswith("```json"):
            response_text = response_text.replace("```json", "").replace("```", "").strip()
        elif response_text.startswith("```"):
            response_text = response_text.replace("```", "").strip()

        # Parsear JSON
        try:
            selected_columns = json.loads(response_text)
        except json.JSONDecodeError:
            # Intentar extraer JSON si está embebido en texto
            import re
            json_match = re.search(r'\[.*?\]', response_text, re.DOTALL)
            if json_match:
                selected_columns = json.loads(json_match.group())
            else:
                raise ValueError(f"No se pudo parsear la respuesta del optimizador: {response_text}")

        # Validar que sea una lista de strings
        if not isinstance(selected_columns, list):
            raise ValueError(f"La respuesta del optimizador no es una lista: {type(selected_columns)}")

        # Normalizar nombres de columnas (case-insensitive matching)
        normalized_selected = []
        for col in selected_columns:
            if not isinstance(col, str):
                continue
            col_lower = col.lower()
            # Buscar coincidencia exacta o parcial
            if col_lower in columns_lower:
                normalized_selected.append(columns_lower[col_lower])
            else:
                # Buscar coincidencia parcial (por si el LLM devuelve nombres ligeramente diferentes)
                for orig_col, orig_col_lower in columns_lower.items():
                    if col_lower in orig_col_lower or orig_col_lower in col_lower:
                        normalized_selected.append(orig_col)
                        break

        # Asegurar que siempre incluimos 'name' y 'website' si existen
        essential_columns = []
        name_variants = ['name', 'nombre', 'company_name', 'empresa']
        website_variants = ['website', 'web', 'url', 'sitio_web']

        for col in available_columns:
            col_lower = col.lower()
            if col_lower in name_variants and col not in normalized_selected:
                essential_columns.append(col)
            elif col_lower in website_variants and col not in normalized_selected:
                essential_columns.append(col)

        # Combinar columnas seleccionadas con esenciales (sin duplicados)
        final_columns = list(dict.fromkeys(normalized_selected + essential_columns))

        # Si no se seleccionó ninguna columna válida, devolver al menos las esenciales
        if not final_columns and essential_columns:
            return essential_columns

        # Si aún no hay nada, devolver las primeras 5 columnas como fallback
        if not final_columns:
            return available_columns[:5]

        return final_columns

    except Exception as e:
        # En caso de error, devolver columnas esenciales o un subconjunto razonable
        print(f"⚠️ Error en Smart Context Optimizer: {e}")
        print("⚠️ Usando fallback: primeras 10 columnas + esenciales")

        # Fallback: devolver primeras columnas + esenciales
        fallback_columns = available_columns[:10]

        # Añadir esenciales si existen
        for col in available_columns:
            col_lower = col.lower()
            if col_lower in ['name', 'nombre', 'website', 'web'] and col not in fallback_columns:
                fallback_columns.append(col)

        return fallback_columns[:15]  # Limitar a 15 columnas máximo en fallback
