"""
Prompts para el Análisis Inicial (Fase 4 del Pipeline)
Genera el informe sectorial completo en formato JSON estructurado
"""
import json

# Tesis de Inversión de Emerita (Hardcoded - sin Manifiesto por ahora)
EMERITA_THESIS = {
    "TARGET_GEO": "España (prioritario), Europa Occidental (secundario)",
    "TARGET_SIZE": "Ventas 5-40M€, EBITDA 1-5M€",
    "TARGET_MARGINS": "EBITDA ≥15%, Bruto ≥40%",
    "DEAL_KILLERS": [
        "Riesgo tecnológico alto",
        "Dependencia de un solo cliente",
        "Sector en declive",
        "Márgenes muy bajos (<10%)"
    ],
    "VALUE_LEVERS": [
        "Digitalización (pasar de papel a software)",
        "Profesionalización comercial (outbound)",
        "Eficiencia operativa"
    ]
}

# Estructura de secciones del informe (10 secciones obligatorias)
REPORT_SECTIONS = {
    "1_executive_summary": "1. Resumen Ejecutivo y Semáforo",
    "2_financials": "2. Unit Economics y Financieros",
    "3_market_size": "3. Tamaño y Segmentación",
    "4_value_chain": "4. Cadena de Valor",
    "5_competition": "5. Estructura Competitiva",
    "6_regulations": "6. Regulación y Riesgos",
    "7_opportunities": "7. Oportunidades (Tesis Emerita)",
    "8_gtm_targets": "8. Hipótesis y Targets",
    "9_conclusion": "9. Conclusión Estructurada",
    "10_sourcing_signals": "10. Señales de Búsqueda"
}

# Instrucciones por defecto para cada sección. Si el frontend envía custom_prompts, se usan esas; si no, estas.
DEFAULT_SECTION_INSTRUCTIONS = {
    "1_executive_summary": """- Conclusión directa.
- **VEREDICTO:** [VERDE / ÁMBAR / ROJO]. Justifica el color basándote en márgenes y fragmentación.
- Si el margen es <15%, el semáforo DEBE ser ROJO o ÁMBAR.""",
    "2_financials": """- ¿Cómo gana dinero una empresa aquí? Desglose de costes típicos.
- Márgenes medios observados (Bruto y EBITDA).
- Ciclo de caja (¿Quién financia a quién?).""",
    "3_market_size": """- Estimación TAM/SAM en España. Tendencia (CAGR).
- Segmentos más atractivos para un Search Fund.""",
    "4_value_chain": """- Diagrama textual (Proveedor → Fabricante → Distribuidor → Cliente).
- ¿Quién tiene la sartén por el mango (poder de negociación)?""",
    "5_competition": """- Grado de concentración.
- Menciona nombres de competidores reales encontrados en el contexto.
- Busca el "Arquetipo Ideal": Empresa familiar, 20+ años historia, dueños ≥60 años.""",
    "6_regulations": """- Barreras de entrada reales. Normativas críticas (ej. ISOs, Marcado CE).
- Deal Killers: {deal_killers}.""",
    "7_opportunities": """- ¿Dónde está la ineficiencia? (Ej. Procesos en papel, sin equipo comercial).
- Palancas de valor disponibles: {value_levers}.
- ¿Cómo puede Emerita multiplicar el EBITDA?""",
    "8_gtm_targets": """- Perfil ideal de empresa target.
- Criterios de búsqueda específicos.""",
    "9_conclusion": """- Síntesis ejecutiva de hallazgos clave.
- Recomendación final.""",
    "10_sourcing_signals": """- Qué buscar en Google/LinkedIn para encontrar al target (señales).""",
}


def _section_title(key: str, custom_section_titles: dict = None) -> str:
    """Título efectivo de una sección: custom o por defecto."""
    if custom_section_titles and custom_section_titles.get(key):
        return str(custom_section_titles[key]).strip()
    return REPORT_SECTIONS.get(key, key)


def _build_section_instructions(thesis: dict, custom_prompts: dict = None, custom_section_titles: dict = None) -> str:
    """Construye el bloque de instrucciones por sección usando custom_prompts o defaults."""
    custom = custom_prompts or {}
    parts = []
    for i, (key, _) in enumerate(REPORT_SECTIONS.items(), start=1):
        title = _section_title(key, custom_section_titles)
        raw = custom.get(key)
        instruction = (str(raw).strip() if raw else "")
        if not instruction:
            instruction = DEFAULT_SECTION_INSTRUCTIONS.get(key, "")
            if key == "6_regulations" and "{deal_killers}" in instruction:
                deal_killers = thesis.get("DEAL_KILLERS") or [
                    "Riesgo tecnológico alto",
                    "Dependencia de un solo cliente",
                    "Sector en declive",
                    "Márgenes muy bajos (<10%)",
                ]
                instruction = instruction.format(deal_killers=", ".join(deal_killers))
            elif key == "7_opportunities" and "{value_levers}" in instruction:
                value_levers = thesis.get("VALUE_LEVERS") or [
                    "Digitalización",
                    "Profesionalización comercial",
                    "Eficiencia operativa",
                ]
                instruction = instruction.format(value_levers=", ".join(value_levers))
        if instruction:
            # Mostrar título sin número si ya lo lleva (ej. "1. Resumen...") o con número
            display = title.split(". ", 1)[-1] if ". " in title else title
            parts.append(f"**{i}. {display}:**\n{instruction}")
    return "\n\n".join(parts)


def _format_sections_json_example(custom_section_titles: dict = None) -> str:
    """Genera las líneas del ejemplo JSON de secciones con títulos efectivos."""
    lines = []
    for key in REPORT_SECTIONS:
        title = _section_title(key, custom_section_titles)
        lines.append(f'        "{key}": {{"title": {json.dumps(title)}, "content": "..."}}')
    return ",\n".join(lines)


def _build_section_instructions_from_custom(custom_sections: list, thesis: dict) -> str:
    """Construye el bloque de instrucciones cuando se usa lista dinámica de secciones."""
    parts = []
    for i, sec in enumerate(custom_sections):
        key = sec.get("key") or f"section_{i + 1}"
        title = (sec.get("title") or key).strip()
        instruction = (sec.get("prompt") or "").strip()
        if not instruction:
            instruction = DEFAULT_SECTION_INSTRUCTIONS.get(key, "")
            if key == "6_regulations" and "{deal_killers}" in instruction:
                deal_killers = thesis.get("DEAL_KILLERS") or [
                    "Riesgo tecnológico alto",
                    "Dependencia de un solo cliente",
                    "Sector en declive",
                    "Márgenes muy bajos (<10%)",
                ]
                instruction = instruction.format(deal_killers=", ".join(deal_killers))
            elif key == "7_opportunities" and "{value_levers}" in instruction:
                value_levers = thesis.get("VALUE_LEVERS") or [
                    "Digitalización",
                    "Profesionalización comercial",
                    "Eficiencia operativa",
                ]
                instruction = instruction.format(value_levers=", ".join(value_levers))
        display = title.split(". ", 1)[-1] if ". " in title else title
        parts.append(f"**{i}. {display}:**\n{instruction}")
    return "\n\n".join(parts)


def _format_sections_json_example_from_custom(custom_sections: list) -> str:
    """Genera las líneas del ejemplo JSON cuando se usa lista dinámica de secciones."""
    lines = []
    for i, sec in enumerate(custom_sections):
        key = sec.get("key") or f"section_{i + 1}"
        title = (sec.get("title") or key).strip()
        lines.append(f'        "{key}": {{"title": {json.dumps(title)}, "content": "..."}}')
    return ",\n".join(lines)


def get_initial_analysis_prompt(sector_name: str, additional_context: str = "", cnae_codes: list = None, web_context: str = "", emerita_thesis: dict = None, custom_prompts: dict = None, custom_section_titles: dict = None, custom_sections: list = None) -> str:
    """
    Genera el prompt maestro para el análisis inicial.

    Args:
        sector_name: Nombre del sector a analizar
        additional_context: Contexto adicional proporcionado por el usuario
        cnae_codes: Lista de códigos CNAE mapeados
        web_context: Contexto web obtenido de Tavily
        emerita_thesis: Tesis/Manifiesto Emerita (opcional). Si no se pasa, se usa EMERITA_THESIS.
        custom_prompts: Dict section_key -> texto de instrucción por sección (opcional). Si no se pasa o una clave está vacía, se usan DEFAULT_SECTION_INSTRUCTIONS.
        custom_section_titles: Dict section_key -> título de sección (opcional). Si no se pasa o una clave está vacía, se usan REPORT_SECTIONS.
        custom_sections: Lista de secciones dinámicas [{"key", "title", "prompt"?}]. Si se pasa y no está vacía, se usa en lugar de REPORT_SECTIONS + custom_prompts/titles.

    Returns:
        Prompt completo para Gemini
    """

    # Usar tesis personalizada o por defecto
    thesis = emerita_thesis if emerita_thesis else EMERITA_THESIS

    cnae_info = ""
    if cnae_codes:
        cnae_info = f"\n**Códigos CNAE mapeados:** {', '.join(cnae_codes)}"

    context_info = ""
    if additional_context:
        context_info = f"\n**Contexto adicional:** {additional_context}"

    use_custom_sections = custom_sections and len(custom_sections) > 0
    if use_custom_sections:
        section_keys = [sec.get("key") or f"section_{i+1}" for i, sec in enumerate(custom_sections)]
        section_keys_str = ", ".join([f'"{k}"' for k in section_keys])
        section_instructions_block = _build_section_instructions_from_custom(custom_sections, thesis)
        sections_json_block = _format_sections_json_example_from_custom(custom_sections)
    else:
        section_keys_str = ", ".join([f'"{k}"' for k in REPORT_SECTIONS.keys()])
        section_instructions_block = _build_section_instructions(thesis, custom_prompts, custom_section_titles)
        sections_json_block = _format_sections_json_example(custom_section_titles)

    prompt = f"""ERES EL DIRECTOR DE INVERSIONES (CIO) DE 'EMERITA', UN SEARCH FUND DE ÉLITE EN ESPAÑA.

TU MISIÓN:
Tu objetivo NO es solo informar, sino JUZGAR. Debes redactar un Análisis Sectorial Preliminar basado en los datos que te proporciono, determinando si el sector es apto para adquirir una PYME.

## 1. EL ADN DE EMERITA (CRITERIOS INNEGABLES)

Debes evaluar el sector usando ESTRICTAMENTE estos filtros. Si el sector falla en alguno, debes destacarlo como un RIESGO CRÍTICO (Red Flag).

**TAMAÑO TARGET:** {thesis.get('TARGET_SIZE', 'Buscamos nichos donde existan empresas facturando 5-40M€ con EBITDA 1-5M€.')}.
**RENTABILIDAD:** {thesis.get('TARGET_MARGINS', 'Margen Bruto ≥40% y Margen EBITDA ≥15% (ESENCIAL).')}.
**MODELO:** B2B, ingresos recurrentes, bajo riesgo tecnológico (evitar startups/disrupción).
**CAJA:** Negocios "Asset Light". Capex bajo (<5% ventas). Conversión de caja ≥70%.
**DINÁMICA:** Sectores fragmentados (sin un líder con ≥20% cuota) y poco digitalizados.

## 2. INSTRUCCIONES DE REDACCIÓN

**Tono:** Profesional, escéptico, directo. Evita adjetivos vacíos ("interesante", "bueno"). Usa datos.
**Formato:** Markdown estricto. Usa negritas para cifras clave.
**Idioma:** Español de Negocios (España).

## 3. ESTRUCTURA DEL INFORME (OBLIGATORIA)

Debes generar un JSON válido donde las claves sean exactamente:
{section_keys_str}

Cada sección debe tener la estructura:
{{"title": "Título de la sección", "content": "Contenido en Markdown"}}

### CONTENIDO POR SECCIÓN:

{section_instructions_block}

## 4. DATOS PROPORCIONADOS

**Sector a analizar:** {sector_name}{cnae_info}{context_info}

**Contexto Web (Investigación Tavily):**
{web_context if web_context else "No se encontró contexto web adicional."}

## 5. INSTRUCCIONES CRÍTICAS

- Si el margen es <15%, el semáforo DEBE ser ROJO o ÁMBAR.
- Prioriza datos de España.
- Formato del contenido dentro del JSON: Markdown.
- Sé escéptico. Si no hay datos suficientes, indícalo claramente.
- NO omitas ninguna sección.

## 6. FORMATO DE RESPUESTA

Debes devolver ÚNICAMENTE un JSON válido con esta estructura exacta:

{{
    "meta": {{
        "sector_name": "{sector_name}",
        "cnae_codes": {cnae_codes if cnae_codes else "[]"},
        "verdict": "VERDE|ÁMBAR|ROJO",
        "timestamp": "YYYY-MM-DD"
    }},
    "sections": {{
{sections_json_block}
    }}
}}

IMPORTANTE: Responde SOLO con el JSON, sin texto adicional antes o después.
"""

    return prompt
