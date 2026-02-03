"""
Agente Investigador: Genera queries y ejecuta búsquedas Tavily
Obtiene contexto web relevante para el análisis sectorial
Fallback: Usa Gemini cuando Tavily no está disponible
"""

from typing import List, Optional
from tavily import TavilyClient
from langchain_google_genai import ChatGoogleGenerativeAI
from shared.config import TAVILY_API_KEY, GOOGLE_API_KEY


def get_research_queries(sector_name: str, cnae_codes: List[str] = None) -> List[str]:
    """
    Genera lista de queries optimizadas para Tavily.

    Args:
        sector_name: Nombre del sector
        cnae_codes: Lista de códigos CNAE (opcional, para refinar búsquedas)

    Returns:
        Lista de queries de búsqueda
    """

    queries = [
        f"Tamaño mercado {sector_name} España 2024 facturación",
        f"Márgenes EBITDA sector {sector_name} España",
        f"Principales empresas {sector_name} España cuota mercado",
        f"Asociación nacional empresas {sector_name} España",
        f"Normativa y regulación {sector_name} España riesgos",
        f"Tendencias M&A {sector_name} Europa 2024"
    ]

    # Añadir queries específicas si hay códigos CNAE
    if cnae_codes and len(cnae_codes) > 0:
        primary_cnae = cnae_codes[0]
        queries.append(f"CNAE {primary_cnae} empresas España sector {sector_name}")

    return queries


def research_sector(sector_name: str, cnae_codes: List[str] = None, max_results_per_query: int = 3) -> str:
    """
    Genera queries de búsqueda y ejecuta búsquedas Tavily.
    Consolida los resultados en un contexto web estructurado.
    Si Tavily no está disponible, usa Gemini como fallback.

    Args:
        sector_name: Nombre del sector a investigar
        cnae_codes: Lista de códigos CNAE mapeados (opcional)
        max_results_per_query: Número máximo de resultados por query

    Returns:
        Contexto web consolidado en formato texto estructurado
    """

    # Verificar si TAVILY_API_KEY está configurada y no está vacía
    if not TAVILY_API_KEY or TAVILY_API_KEY.strip() == "":
        print("⚠️ TAVILY_API_KEY no configurada. Usando Gemini como fallback.")
        return research_sector_with_gemini(sector_name, cnae_codes)

    try:
        client = TavilyClient(api_key=TAVILY_API_KEY)

        # Generar queries
        queries = get_research_queries(sector_name, cnae_codes)

        # Ejecutar búsquedas y consolidar resultados
        all_results = []
        errors_count = 0
        auth_error = False

        for query in queries:
            try:
                response = client.search(
                    query=query,
                    search_depth="advanced",
                    max_results=max_results_per_query,
                    include_answer=True,
                    include_raw_content=False
                )

                # Procesar resultados
                if response.get('results'):
                    for result in response['results']:
                        all_results.append({
                            'title': result.get('title', 'Sin título'),
                            'url': result.get('url', ''),
                            'content': result.get('content', ''),
                            'score': result.get('score', 0)
                        })

                # Si hay respuesta directa, añadirla
                if response.get('answer'):
                    all_results.append({
                        'title': f'Respuesta directa: {query}',
                        'url': '',
                        'content': response['answer'],
                        'score': 1.0
                    })

            except Exception as e:
                errors_count += 1
                error_str = str(e)
                print(f"⚠️ Error en búsqueda Tavily para query '{query}': {e}")

                # Si es error de autenticación, activar fallback inmediatamente
                if "Unauthorized" in error_str or "invalid API key" in error_str.lower() or "missing or invalid" in error_str.lower():
                    auth_error = True
                    print("⚠️ API key de Tavily inválida. Cambiando a fallback Gemini.")
                    return research_sector_with_gemini(sector_name, cnae_codes)
                continue

        # Si todas las búsquedas fallaron, usar fallback
        if errors_count == len(queries) and not all_results:
            print("⚠️ Todas las búsquedas Tavily fallaron. Usando Gemini como fallback.")
            return research_sector_with_gemini(sector_name, cnae_codes)

        # Ordenar por score (relevancia)
        all_results.sort(key=lambda x: x.get('score', 0), reverse=True)

        # Consolidar en texto estructurado
        if not all_results:
            print("⚠️ No se encontraron resultados en Tavily. Usando Gemini como fallback.")
            return research_sector_with_gemini(sector_name, cnae_codes)

        # Construir contexto consolidado
        context_parts = []
        context_parts.append(f"# INVESTIGACIÓN WEB: {sector_name}\n")
        context_parts.append(f"Total de fuentes encontradas: {len(all_results)}\n\n")

        # Agrupar por queries (opcional) o simplemente listar resultados
        for idx, result in enumerate(all_results[:15], 1):  # Limitar a 15 resultados más relevantes
            context_parts.append(f"## Fuente {idx}: {result['title']}")
            if result['url']:
                context_parts.append(f"URL: {result['url']}")
            context_parts.append(f"\n{result['content']}\n")
            context_parts.append("---\n")

        return "\n".join(context_parts)

    except Exception as e:
        # Cualquier error general, usar fallback
        error_str = str(e)
        print(f"⚠️ Error en investigación Tavily: {e}. Usando Gemini como fallback.")
        if "Unauthorized" in error_str or "invalid API key" in error_str.lower():
            return research_sector_with_gemini(sector_name, cnae_codes)
        return research_sector_with_gemini(sector_name, cnae_codes)


def research_sector_with_gemini(sector_name: str, cnae_codes: List[str] = None) -> str:
    """
    Usa Gemini para generar contexto sobre un sector cuando Tavily no está disponible.
    Basado en el conocimiento entrenado de Gemini (no búsqueda web en tiempo real).

    Args:
        sector_name: Nombre del sector
        cnae_codes: Lista de códigos CNAE (opcional)

    Returns:
        Contexto generado por Gemini
    """

    if not GOOGLE_API_KEY:
        return "⚠️ GOOGLE_API_KEY no configurada. No se puede realizar investigación."

    try:
        # Generar queries
        queries = get_research_queries(sector_name, cnae_codes)

        # Construir prompt para Gemini
        cnae_info = ""
        if cnae_codes:
            cnae_info = f"\nCódigos CNAE: {', '.join(cnae_codes)}"

        prompt = f"""Eres un experto en análisis sectorial en España.

Sector a investigar: {sector_name}{cnae_info}

Genera un análisis completo del sector basándote en tu conocimiento, respondiendo a estas preguntas clave:

1. Tamaño de mercado: ¿Cuál es el tamaño del mercado de {sector_name} en España? (facturación, número de empresas)
2. Márgenes típicos: ¿Qué márgenes EBITDA y brutos son típicos en este sector en España?
3. Principales empresas: ¿Cuáles son las principales empresas del sector en España? ¿Cuál es la cuota de mercado de las top 3?
4. Asociaciones: ¿Existen asociaciones nacionales o gremios relevantes para este sector?
5. Regulación: ¿Qué normativas o regulaciones son críticas para este sector en España?
6. Tendencias: ¿Cuáles son las tendencias actuales y de M&A en este sector en Europa/España?

Formato tu respuesta como un informe estructurado con secciones claras. Sé específico con cifras y datos cuando sea posible.
"""

        model = ChatGoogleGenerativeAI(
            model="models/gemini-2.5-flash",
            google_api_key=GOOGLE_API_KEY,
            temperature=0.2
        )

        response = model.invoke(prompt)
        context = response.content if hasattr(response, 'content') else str(response)

        # Formatear como contexto estructurado
        formatted = f"""# INVESTIGACIÓN: {sector_name}
(Generado con Gemini - conocimiento entrenado, no búsqueda web en tiempo real)

{context}

---
Nota: Esta información está basada en el conocimiento entrenado de Gemini. Para búsquedas web en tiempo real, configura TAVILY_API_KEY.
"""

        return formatted

    except Exception as e:
        return f"Error al generar contexto con Gemini: {str(e)}"


def search_internet(query: str, max_results: int = 5) -> str:
    """
    Función auxiliar para búsquedas puntuales desde el chat.
    Usa Tavily si está disponible, sino usa Gemini como fallback.

    Args:
        query: Query de búsqueda
        max_results: Número máximo de resultados

    Returns:
        Contexto web consolidado
    """

    if not TAVILY_API_KEY:
        # Fallback a Gemini
        if not GOOGLE_API_KEY:
            return "⚠️ TAVILY_API_KEY y GOOGLE_API_KEY no configuradas."

        return search_internet_with_gemini(query)

    try:
        client = TavilyClient(api_key=TAVILY_API_KEY)

        response = client.search(
            query=query,
            search_depth="advanced",
            max_results=max_results,
            include_answer=True,
            include_raw_content=False
        )

        results = []

        if response.get('answer'):
            results.append({
                'title': 'Respuesta directa',
                'content': response['answer'],
                'url': ''
            })

        if response.get('results'):
            for result in response['results']:
                results.append({
                    'title': result.get('title', 'Sin título'),
                    'content': result.get('content', ''),
                    'url': result.get('url', '')
                })

        if not results:
            # Si no hay resultados, intentar fallback a Gemini
            if GOOGLE_API_KEY:
                return search_internet_with_gemini(query)
            return "No se encontraron resultados para esta búsqueda."

        # Formatear resultados
        formatted = []
        for idx, result in enumerate(results, 1):
            formatted.append(f"**{idx}. {result['title']}**")
            if result['url']:
                formatted.append(f"URL: {result['url']}")
            formatted.append(f"\n{result['content']}\n")
            formatted.append("---\n")

        return "\n".join(formatted)

    except Exception as e:
        error_str = str(e)
        # Si es error de autenticación, usar fallback
        if "Unauthorized" in error_str or "invalid API key" in error_str.lower() or "missing or invalid" in error_str.lower():
            if GOOGLE_API_KEY:
                print("⚠️ API key de Tavily inválida. Usando Gemini como fallback.")
                return search_internet_with_gemini(query)
        return f"Error en búsqueda: {str(e)}"


def search_internet_with_gemini(query: str) -> str:
    """
    Usa Gemini para responder una query cuando Tavily no está disponible.

    Args:
        query: Query de búsqueda

    Returns:
        Respuesta generada por Gemini
    """

    if not GOOGLE_API_KEY:
        return "⚠️ GOOGLE_API_KEY no configurada."

    try:
        prompt = f"""Eres un asistente experto que responde preguntas basándote en tu conocimiento.

Pregunta del usuario: {query}

Proporciona una respuesta completa, específica y basada en datos. Si la información es sobre España o Europa, prioriza datos de esas regiones.
Si no tienes información actualizada o específica, indícalo claramente.

Formato tu respuesta de forma clara y estructurada.
"""

        model = ChatGoogleGenerativeAI(
            model="models/gemini-2.5-flash",
            google_api_key=GOOGLE_API_KEY,
            temperature=0.2
        )

        response = model.invoke(prompt)
        answer = response.content if hasattr(response, 'content') else str(response)

        formatted = f"""**Búsqueda:** {query}
(Respuesta generada con Gemini - conocimiento entrenado, no búsqueda web en tiempo real)

{answer}

---
Nota: Para búsquedas web en tiempo real, configura TAVILY_API_KEY.
"""

        return formatted

    except Exception as e:
        return f"Error en búsqueda con Gemini: {str(e)}"
