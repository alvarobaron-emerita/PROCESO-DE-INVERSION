"""
Agente Clasificador: Mapea sectores a códigos CNAE 2009 (España)
Usa Gemini para mapeo inteligente de nombres de sectores a códigos CNAE
"""

import json
from typing import List, Optional
from langchain_google_genai import ChatGoogleGenerativeAI
from shared.config import GOOGLE_API_KEY


def classify_sector(sector_name: str, additional_context: str = "") -> List[str]:
    """
    Mapea un sector a códigos CNAE 2009 (España) usando Gemini.

    Args:
        sector_name: Nombre del sector a clasificar (ej. "Mantenimiento de Ascensores")
        additional_context: Contexto adicional para refinar la clasificación

    Returns:
        Lista de códigos CNAE (ej. ["4322", "4321"])
    """

    if not GOOGLE_API_KEY:
        raise ValueError("GOOGLE_API_KEY no está configurada en variables de entorno")

    # Prompt para clasificación CNAE
    prompt = f"""Eres un experto en clasificación industrial CNAE 2009 (España).

TU TAREA:
Mapear el sector "{sector_name}" a uno o más códigos CNAE 2009 relevantes.

{f"**Contexto adicional:** {additional_context}" if additional_context else ""}

## INSTRUCCIONES:

1. Identifica el código CNAE PRIMARIO más relevante para este sector.
2. Si el sector es amplio, identifica también códigos CNAE SECUNDARIOS relacionados.
3. Los códigos CNAE tienen formato de 4 dígitos (ej. "4322", "4321").
4. Prioriza códigos que representen actividades B2B, no B2C.
5. Si no estás seguro, incluye códigos relacionados que puedan ser relevantes.

## FORMATO DE RESPUESTA:

Devuelve ÚNICAMENTE un JSON con esta estructura:
{{
    "primary_cnae": "4322",
    "secondary_cnae": ["4321", "4329"],
    "description": "Breve descripción del código primario"
}}

IMPORTANTE: Responde SOLO con el JSON, sin texto adicional.
"""

    try:
        model = ChatGoogleGenerativeAI(
            model="models/gemini-2.5-flash",
            google_api_key=GOOGLE_API_KEY,
            temperature=0.1
        )

        response = model.invoke(prompt)
        response_text = response.content if hasattr(response, 'content') else str(response)

        # Limpiar respuesta (eliminar markdown code blocks si existen)
        response_text = response_text.strip()
        if response_text.startswith('```'):
            # Extraer JSON del code block
            lines = response_text.split('\n')
            json_lines = []
            in_json = False
            for line in lines:
                if line.strip().startswith('{'):
                    in_json = True
                if in_json:
                    json_lines.append(line)
                if in_json and line.strip().endswith('}'):
                    break
            response_text = '\n'.join(json_lines)
        elif response_text.startswith('{'):
            # Ya es JSON puro
            pass
        else:
            # Intentar extraer JSON del texto
            start_idx = response_text.find('{')
            end_idx = response_text.rfind('}') + 1
            if start_idx >= 0 and end_idx > start_idx:
                response_text = response_text[start_idx:end_idx]

        # Parsear JSON
        result = json.loads(response_text)

        # Construir lista de códigos CNAE
        cnae_codes = []
        if result.get('primary_cnae'):
            cnae_codes.append(str(result['primary_cnae']))
        if result.get('secondary_cnae'):
            cnae_codes.extend([str(code) for code in result['secondary_cnae']])

        # Eliminar duplicados manteniendo orden
        seen = set()
        unique_codes = []
        for code in cnae_codes:
            if code not in seen:
                seen.add(code)
                unique_codes.append(code)

        return unique_codes if unique_codes else ["0000"]  # Código por defecto si falla

    except Exception as e:
        print(f"⚠️ Error en clasificación CNAE: {e}")
        # Retornar código por defecto
        return ["0000"]
