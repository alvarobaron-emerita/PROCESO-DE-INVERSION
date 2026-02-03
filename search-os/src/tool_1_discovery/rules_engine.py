"""
Motor de Reglas: Evalúa sectores según criterios Emerita
Asigna veredicto (VERDE/ÁMBAR/ROJO) basado en métricas y Deal Killers
"""

from typing import Dict, List, Optional
import re

# Importar tesis por defecto
from tool_1_discovery.prompts.initial_analysis import EMERITA_THESIS


def evaluate_sector(margins_data: Dict = None, market_data: Dict = None, report_content: str = "", emerita_thesis: Dict = None) -> Dict:
    """
    Evalúa sector y retorna veredicto (VERDE/ÁMBAR/ROJO) con razones.

    Args:
        margins_data: Diccionario con datos de márgenes (opcional)
            - ebitda_margin: float (ej. 0.15 para 15%)
            - gross_margin: float (ej. 0.40 para 40%)
        market_data: Diccionario con datos de mercado (opcional)
            - top3_concentration: float (ej. 0.50 para 50%)
            - market_fragmentation: str ("high", "medium", "low")
        report_content: Contenido del informe para análisis de texto (opcional)

    Returns:
        Diccionario con:
        {
            'verdict': 'VERDE' | 'ÁMBAR' | 'ROJO',
            'reasons': [lista de razones],
            'score': float (0-10)
        }
    """

    # Usar tesis personalizada o por defecto
    thesis = emerita_thesis if emerita_thesis else EMERITA_THESIS

    reasons = []
    score = 10.0  # Empezar con score perfecto, ir restando

    # ========================================================================
    # REGLA 1: Márgenes EBITDA
    # ========================================================================
    ebitda_margin = None
    if margins_data and 'ebitda_margin' in margins_data:
        ebitda_margin = margins_data['ebitda_margin']
    elif report_content:
        # Intentar extraer de texto
        ebitda_margin = _extract_ebitda_from_text(report_content)

    # Extraer márgenes objetivo de la tesis
    target_margins = thesis.get('TARGET_MARGINS', 'EBITDA ≥15%, Bruto ≥40%')
    ebitda_target = 0.15  # Por defecto 15%
    gross_target = 0.40   # Por defecto 40%

    # Intentar extraer valores numéricos de la tesis
    if '≥' in target_margins:
        try:
            if 'EBITDA' in target_margins:
                ebitda_match = re.search(r'EBITDA\s*≥\s*(\d+)%', target_margins)
                if ebitda_match:
                    ebitda_target = float(ebitda_match.group(1)) / 100
            if 'Bruto' in target_margins or 'bruto' in target_margins:
                gross_match = re.search(r'[Bb]ruto\s*≥\s*(\d+)%', target_margins)
                if gross_match:
                    gross_target = float(gross_match.group(1)) / 100
        except:
            pass  # Mantener valores por defecto

    if ebitda_margin is not None:
        if ebitda_margin < ebitda_target * 0.67:  # Deal killer: menos del 67% del objetivo
            reasons.append(f"❌ Margen EBITDA <{ebitda_target*100:.0f}% (Deal Killer)")
            score -= 5.0
        elif ebitda_margin < ebitda_target:
            reasons.append(f"⚠️ Margen EBITDA <{ebitda_target*100:.0f}% (Objetivo)")
            score -= 2.0
        elif ebitda_margin >= ebitda_target:
            reasons.append(f"✅ Margen EBITDA ≥{ebitda_target*100:.0f}% (Cumple objetivo)")

    # ========================================================================
    # REGLA 2: Margen Bruto
    # ========================================================================
    gross_margin = None
    if margins_data and 'gross_margin' in margins_data:
        gross_margin = margins_data['gross_margin']
    elif report_content:
        gross_margin = _extract_gross_margin_from_text(report_content)

    if gross_margin is not None:
        if gross_margin < gross_target:
            reasons.append(f"⚠️ Margen Bruto <{gross_target*100:.0f}% (Objetivo)")
            score -= 1.5
        elif gross_margin >= gross_target:
            reasons.append(f"✅ Margen Bruto ≥{gross_target*100:.0f}% (Cumple objetivo)")

    # ========================================================================
    # REGLA 3: Concentración de Mercado (Fragmentación)
    # ========================================================================
    top3_concentration = None
    if market_data and 'top3_concentration' in market_data:
        top3_concentration = market_data['top3_concentration']
    elif report_content:
        top3_concentration = _extract_top3_concentration_from_text(report_content)

    if top3_concentration is not None:
        if top3_concentration > 0.50:  # >50%
            reasons.append("⚠️ Top 3 concentración >50% (Poco fragmentado)")
            score -= 1.5
        elif top3_concentration > 0.20:  # >20%
            reasons.append("⚠️ Top 3 concentración >20% (Moderadamente fragmentado)")
            score -= 0.5
        else:
            reasons.append("✅ Mercado fragmentado (Atractivo para Search Fund)")

    # ========================================================================
    # REGLA 4: Deal Killers (análisis de texto)
    # ========================================================================
    custom_deal_killers = thesis.get('DEAL_KILLERS', [])
    deal_killers = _detect_deal_killers(report_content, custom_deal_killers)
    if deal_killers:
        for killer in deal_killers:
            reasons.append(f"❌ Deal Killer detectado: {killer}")
            score -= 3.0

    # ========================================================================
    # REGLA 5: Digitalización (análisis de texto)
    # ========================================================================
    digitalization_level = _assess_digitalization(report_content)
    if digitalization_level == "low":
        reasons.append("✅ Sector poco digitalizado (Oportunidad de valor)")
    elif digitalization_level == "high":
        reasons.append("⚠️ Sector altamente digitalizado (Menor oportunidad)")
        score -= 0.5

    # ========================================================================
    # DETERMINAR VEREDICTO FINAL
    # ========================================================================
    # Asegurar score entre 0 y 10
    score = max(0.0, min(10.0, score))

    if score >= 8.0:
        verdict = "VERDE"
    elif score >= 5.0:
        verdict = "ÁMBAR"
    else:
        verdict = "ROJO"

    # Si hay Deal Killers, forzar ROJO o ÁMBAR
    if deal_killers:
        if score < 5.0:
            verdict = "ROJO"
        else:
            verdict = "ÁMBAR"

    return {
        'verdict': verdict,
        'reasons': reasons,
        'score': round(score, 1)
    }


def _extract_ebitda_from_text(text: str) -> Optional[float]:
    """Extrae margen EBITDA del texto del informe."""
    if not text:
        return None

    # Patrones comunes: "EBITDA 15%", "margen EBITDA del 15%", "15% EBITDA"
    patterns = [
        r'EBITDA[:\s]+(\d+\.?\d*)%',
        r'margen\s+EBITDA[:\s]+(\d+\.?\d*)%',
        r'(\d+\.?\d*)%\s+EBITDA',
        r'EBITDA\s+≥\s*(\d+\.?\d*)%',
        r'EBITDA\s+>\s*(\d+\.?\d*)%'
    ]

    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            try:
                value = float(match.group(1))
                return value / 100.0  # Convertir a decimal
            except:
                continue

    return None


def _extract_gross_margin_from_text(text: str) -> Optional[float]:
    """Extrae margen bruto del texto del informe."""
    if not text:
        return None

    patterns = [
        r'margen\s+bruto[:\s]+(\d+\.?\d*)%',
        r'gross\s+margin[:\s]+(\d+\.?\d*)%',
        r'(\d+\.?\d*)%\s+margen\s+bruto',
        r'bruto\s+≥\s*(\d+\.?\d*)%'
    ]

    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            try:
                value = float(match.group(1))
                return value / 100.0
            except:
                continue

    return None


def _extract_top3_concentration_from_text(text: str) -> Optional[float]:
    """Extrae concentración Top 3 del texto del informe."""
    if not text:
        return None

    patterns = [
        r'top\s*3[:\s]+(\d+\.?\d*)%',
        r'principales\s+3[:\s]+(\d+\.?\d*)%',
        r'concentración[:\s]+(\d+\.?\d*)%',
        r'cuota\s+mercado\s+top\s*3[:\s]+(\d+\.?\d*)%'
    ]

    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            try:
                value = float(match.group(1))
                return value / 100.0
            except:
                continue

    return None


def _detect_deal_killers(text: str, custom_deal_killers: List[str] = None) -> List[str]:
    """Detecta Deal Killers en el texto del informe."""
    if not text:
        return []

    deal_killers = []
    text_lower = text.lower()

    # Deal killers por defecto
    default_patterns = {
        "Riesgo tecnológico alto": [
            r'riesgo\s+tecnológico',
            r'alto\s+riesgo\s+tecnológico',
            r'disrupción\s+tecnológica',
            r'startup',
            r'tech\s+disruption'
        ],
        "Dependencia de un solo cliente": [
            r'dependencia\s+de\s+un\s+solo\s+cliente',
            r'cliente\s+único',
            r'concentración\s+de\s+clientes',
            r'>\s*50%\s+de\s+un\s+cliente'
        ],
        "Sector en declive": [
            r'sector\s+en\s+declive',
            r'mercado\s+en\s+caída',
            r'decrecimiento',
            r'declining\s+market'
        ],
        "Márgenes muy bajos": [
            r'márgenes\s+muy\s+bajos',
            r'margen\s+<\s*10%',
            r'rentabilidad\s+muy\s+baja'
        ]
    }

    # Combinar con deal killers personalizados
    all_patterns = default_patterns.copy()
    if custom_deal_killers:
        for killer in custom_deal_killers:
            if killer not in all_patterns:
                # Crear patrones simples para deal killers personalizados
                all_patterns[killer] = [
                    re.escape(killer.lower()),
                    r'\b' + re.escape(killer.lower()) + r'\b'
                ]

    for killer_name, killer_patterns in all_patterns.items():
        for pattern in killer_patterns:
            if re.search(pattern, text_lower):
                deal_killers.append(killer_name)
                break  # Solo añadir una vez por tipo

    return deal_killers


def _assess_digitalization(text: str) -> str:
    """Evalúa nivel de digitalización del sector."""
    if not text:
        return "unknown"

    text_lower = text.lower()

    # Indicadores de baja digitalización (positivo para Emerita)
    low_digitalization_keywords = [
        'papel', 'manual', 'tradicional', 'poco digitalizado',
        'procesos manuales', 'sin software', 'analógico'
    ]

    # Indicadores de alta digitalización
    high_digitalization_keywords = [
        'digitalizado', 'software avanzado', 'tecnología moderna',
        'plataforma digital', 'cloud', 'saas'
    ]

    low_count = sum(1 for keyword in low_digitalization_keywords if keyword in text_lower)
    high_count = sum(1 for keyword in high_digitalization_keywords if keyword in text_lower)

    if low_count > high_count:
        return "low"
    elif high_count > low_count:
        return "high"
    else:
        return "medium"
