"""
Prompts para el Análisis Inicial (Fase 4 del Pipeline)
Genera el informe sectorial completo en formato JSON estructurado
"""

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

def get_initial_analysis_prompt(sector_name: str, additional_context: str = "", cnae_codes: list = None, web_context: str = "", emerita_thesis: dict = None, custom_prompts: dict = None) -> str:
    """
    Genera el prompt maestro para el análisis inicial.

    Args:
        sector_name: Nombre del sector a analizar
        additional_context: Contexto adicional proporcionado por el usuario
        cnae_codes: Lista de códigos CNAE mapeados
        web_context: Contexto web obtenido de Tavily

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
{', '.join([f'"{k}"' for k in REPORT_SECTIONS.keys()])}

Cada sección debe tener la estructura:
{{"title": "Título de la sección", "content": "Contenido en Markdown"}}

### CONTENIDO POR SECCIÓN:

**1. RESUMEN EJECUTIVO Y SEMÁFORO:**
- Conclusión directa.
- **VEREDICTO:** [VERDE / ÁMBAR / ROJO]. Justifica el color basándote en márgenes y fragmentación.
- Si el margen es <15%, el semáforo DEBE ser ROJO o ÁMBAR.

**2. UNIT ECONOMICS Y FINANCIEROS:**
- ¿Cómo gana dinero una empresa aquí? Desglose de costes típicos.
- Márgenes medios observados (Bruto y EBITDA).
- Ciclo de caja (¿Quién financia a quién?).

**3. TAMAÑO Y SEGMENTACIÓN:**
- Estimación TAM/SAM en España. Tendencia (CAGR).
- Segmentos más atractivos para un Search Fund.

**4. CADENA DE VALOR:**
- Diagrama textual (Proveedor → Fabricante → Distribuidor → Cliente).
- ¿Quién tiene la sartén por el mango (poder de negociación)?

**5. ESTRUCTURA COMPETITIVA:**
- Grado de concentración.
- Menciona nombres de competidores reales encontrados en el contexto.
- Busca el "Arquetipo Ideal": Empresa familiar, 20+ años historia, dueños ≥60 años.

**6. REGULACIÓN Y RIESGOS:**
- Barreras de entrada reales. Normativas críticas (ej. ISOs, Marcado CE).
- Deal Killers: {', '.join(thesis.get('DEAL_KILLERS', ['Riesgo tecnológico alto', 'Dependencia de un solo cliente', 'Sector en declive', 'Márgenes muy bajos']))}.

**7. OPORTUNIDADES (PALANCAS DE VALOR):**
- ¿Dónde está la ineficiencia? (Ej. Procesos en papel, sin equipo comercial).
- Palancas de valor disponibles: {', '.join(thesis.get('VALUE_LEVERS', ['Digitalización', 'Profesionalización comercial', 'Eficiencia operativa']))}.
- ¿Cómo puede Emerita multiplicar el EBITDA?

**8. HIPÓTESIS Y TARGETS:**
- Perfil ideal de empresa target.
- Criterios de búsqueda específicos.

**9. CONCLUSIÓN ESTRUCTURADA:**
- Síntesis ejecutiva de hallazgos clave.
- Recomendación final.

**10. SEÑALES DE BÚSQUEDA:**
- Qué buscar en Google/LinkedIn para encontrar al target (señales).

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
        "1_executive_summary": {{"title": "1. Resumen Ejecutivo y Semáforo", "content": "..."}},
        "2_financials": {{"title": "2. Unit Economics y Financieros", "content": "..."}},
        "3_market_size": {{"title": "3. Tamaño y Segmentación", "content": "..."}},
        "4_value_chain": {{"title": "4. Cadena de Valor", "content": "..."}},
        "5_competition": {{"title": "5. Estructura Competitiva", "content": "..."}},
        "6_regulations": {{"title": "6. Regulación y Riesgos", "content": "..."}},
        "7_opportunities": {{"title": "7. Oportunidades (Tesis Emerita)", "content": "..."}},
        "8_gtm_targets": {{"title": "8. Hipótesis y Targets", "content": "..."}},
        "9_conclusion": {{"title": "9. Conclusión Estructurada", "content": "..."}},
        "10_sourcing_signals": {{"title": "10. Señales de Búsqueda", "content": "..."}}
    }}
}}

IMPORTANTE: Responde SOLO con el JSON, sin texto adicional antes o después.
"""

    return prompt
