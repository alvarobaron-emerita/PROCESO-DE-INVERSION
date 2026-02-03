"""
Agente Analista: Genera el informe inicial completo en formato JSON
Usa Gemini con el prompt maestro para generar el análisis sectorial estructurado
"""

import json
import re
from datetime import datetime
from typing import Dict, Optional
from langchain_google_genai import ChatGoogleGenerativeAI
from shared.config import GOOGLE_API_KEY
from tool_1_discovery.prompts.initial_analysis import get_initial_analysis_prompt


def generate_initial_report(
    sector_name: str,
    additional_context: str = "",
    cnae_codes: list = None,
    web_context: str = "",
    emerita_thesis: dict = None,
    custom_prompts: dict = None
) -> Dict:
    """
    Genera el informe inicial completo en formato JSON estructurado.

    Args:
        sector_name: Nombre del sector a analizar
        additional_context: Contexto adicional proporcionado por el usuario
        cnae_codes: Lista de códigos CNAE mapeados
        web_context: Contexto web obtenido de Tavily

    Returns:
        Diccionario con la estructura completa del informe JSON
    """

    if not GOOGLE_API_KEY:
        raise ValueError("GOOGLE_API_KEY no está configurada en variables de entorno")

    # Generar prompt maestro con configuración personalizada
    prompt = get_initial_analysis_prompt(
        sector_name=sector_name,
        additional_context=additional_context,
        cnae_codes=cnae_codes,
        web_context=web_context,
        emerita_thesis=emerita_thesis,
        custom_prompts=custom_prompts
    )

    try:
        model = ChatGoogleGenerativeAI(
            model="models/gemini-2.5-flash",
            google_api_key=GOOGLE_API_KEY,
            temperature=0.2
        )

        response = model.invoke(prompt)
        response_text = response.content if hasattr(response, 'content') else str(response)

        # Limpiar y extraer JSON de la respuesta
        json_text = _extract_json_from_response(response_text)

        # Parsear JSON
        report_data = json.loads(json_text)

        # Validar estructura básica
        if 'meta' not in report_data:
            report_data['meta'] = {}

        if 'sections' not in report_data:
            report_data['sections'] = {}

        # Asegurar que meta tiene los campos necesarios
        if 'sector_name' not in report_data['meta']:
            report_data['meta']['sector_name'] = sector_name
        if 'cnae_codes' not in report_data['meta']:
            report_data['meta']['cnae_codes'] = cnae_codes if cnae_codes else []
        if 'timestamp' not in report_data['meta']:
            report_data['meta']['timestamp'] = datetime.now().strftime("%Y-%m-%d")
        if 'verdict' not in report_data['meta']:
            report_data['meta']['verdict'] = "ÁMBAR"  # Por defecto

        # Validar que todas las secciones existen
        required_sections = [
            "1_executive_summary", "2_financials", "3_market_size",
            "4_value_chain", "5_competition", "6_regulations",
            "7_opportunities", "8_gtm_targets", "9_conclusion",
            "10_sourcing_signals"
        ]

        for section_key in required_sections:
            if section_key not in report_data['sections']:
                report_data['sections'][section_key] = {
                    "title": f"Sección {section_key}",
                    "content": "*Contenido pendiente de generación*"
                }

        return report_data

    except json.JSONDecodeError as e:
        print(f"⚠️ Error parseando JSON del informe: {e}")
        print(f"Respuesta recibida: {response_text[:500]}...")
        # Retornar estructura vacía con error
        return _create_empty_report(sector_name, cnae_codes, error=f"Error parseando JSON: {str(e)}")

    except Exception as e:
        print(f"⚠️ Error generando informe: {e}")
        return _create_empty_report(sector_name, cnae_codes, error=str(e))


def _extract_json_from_response(response_text: str) -> str:
    """
    Extrae JSON de la respuesta del LLM, limpiando markdown y caracteres de control.

    Args:
        response_text: Texto de respuesta del LLM

    Returns:
        JSON limpio como string
    """

    # Limpiar espacios
    text = response_text.strip()

    # Si está en un code block markdown
    if text.startswith('```json'):
        # Extraer contenido del code block
        pattern = r'```json\s*(.*?)\s*```'
        match = re.search(pattern, text, re.DOTALL)
        if match:
            text = match.group(1).strip()
    elif text.startswith('```'):
        # Code block sin especificar lenguaje
        pattern = r'```\s*(.*?)\s*```'
        match = re.search(pattern, text, re.DOTALL)
        if match:
            text = match.group(1).strip()

    # Buscar el primer { y último }
    start_idx = text.find('{')
    end_idx = text.rfind('}')

    if start_idx >= 0 and end_idx > start_idx:
        text = text[start_idx:end_idx + 1]

    # Intentar parsear directamente primero
    try:
        json.loads(text)
        return text
    except json.JSONDecodeError:
        # Si falla, limpiar caracteres de control problemáticos
        # Eliminar caracteres de control excepto los permitidos en JSON (\n, \r, \t)
        # Reemplazar saltos de línea y tabs dentro de strings JSON por espacios
        # Esto es un enfoque más agresivo

        # Primero, intentar eliminar caracteres de control inválidos
        # Mantener \n, \r, \t pero eliminar otros caracteres de control
        cleaned = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]', '', text)

        # Intentar parsear de nuevo
        try:
            json.loads(cleaned)
            return cleaned
        except json.JSONDecodeError:
            # Si aún falla, intentar un enfoque más agresivo:
            # Reemplazar saltos de línea dentro de strings JSON (entre comillas)
            # Esto es más complejo, pero podemos intentar una limpieza básica

            # Buscar strings JSON (texto entre comillas dobles) y reemplazar saltos de línea
            def clean_string_content(match):
                content = match.group(1)
                # Reemplazar saltos de línea y tabs por espacios dentro del string
                content = content.replace('\n', ' ').replace('\r', ' ').replace('\t', ' ')
                # Eliminar múltiples espacios
                content = re.sub(r' +', ' ', content)
                return f'"{content}"'

            # Patrón para encontrar strings JSON (simplificado)
            # Buscar "..." pero evitar comillas escapadas
            pattern = r'"([^"\\]*(\\.[^"\\]*)*)"'
            cleaned = re.sub(pattern, clean_string_content, cleaned)

            try:
                json.loads(cleaned)
                return cleaned
            except:
                # Si todo falla, retornar el texto limpiado básicamente
                return cleaned

    # Si no se encuentra JSON, retornar el texto original
    return text


def _create_empty_report(sector_name: str, cnae_codes: list = None, error: str = None) -> Dict:
    """
    Crea un informe vacío con estructura básica.

    Args:
        sector_name: Nombre del sector
        cnae_codes: Lista de códigos CNAE
        error: Mensaje de error (opcional)

    Returns:
        Diccionario con estructura de informe vacío
    """

    from tool_1_discovery.prompts.initial_analysis import REPORT_SECTIONS

    sections = {}
    for key, title in REPORT_SECTIONS.items():
        sections[key] = {
            "title": title,
            "content": f"*Error al generar contenido: {error}*" if error else "*Contenido pendiente*"
        }

    return {
        "meta": {
            "sector_name": sector_name,
            "cnae_codes": cnae_codes if cnae_codes else [],
            "verdict": "ÁMBAR",
            "timestamp": datetime.now().strftime("%Y-%m-%d")
        },
        "sections": sections
    }
