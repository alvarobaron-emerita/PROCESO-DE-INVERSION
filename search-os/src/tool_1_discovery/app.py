"""
Tool 1: Discovery Engine - Aplicación principal
Copiloto de Inversión con UI Split-Screen
"""

import streamlit as st
import sys
import json
import re
from pathlib import Path
from datetime import datetime

# Añadir src al path
sys.path.insert(0, str(Path(__file__).parent.parent))

from tool_1_discovery.agents.classifier import classify_sector
from tool_1_discovery.agents.researcher import research_sector, search_internet
from tool_1_discovery.agents.analyst import generate_initial_report
from tool_1_discovery.rules_engine import evaluate_sector
from tool_1_discovery.prompts.chat_system import get_section_update_prompt
from tool_1_discovery.prompts.initial_analysis import EMERITA_THESIS
from langchain_google_genai import ChatGoogleGenerativeAI
from shared.config import GOOGLE_API_KEY, TAVILY_API_KEY
import pandas as pd
import uuid
from datetime import datetime
from typing import Dict, List, Optional
import json

# Configuración de página
st.set_page_config(
    page_title="Discovery Engine - Search OS",
    page_icon="🔍",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# ============================================================================
# FUNCIONES AUXILIARES
# ============================================================================

def extract_companies_from_report(report: Dict) -> List[str]:
    """
    Extrae nombres de empresas del reporte generado.
    Busca en todas las secciones del informe.
    """
    companies = set()

    if not report or 'sections' not in report:
        return []

    sections = report['sections']

    # Patrones para identificar nombres de empresas
    company_patterns = [
        r'\b[A-Z][a-zA-Z\s&\-\.]+\b',  # Nombres propios con mayúscula
        r'\b[A-Z]{2,}[\s]*[A-Z]*\b',  # Acrónimos como IBM, HP, etc.
    ]

    for section_key, section_data in sections.items():
        if isinstance(section_data, dict) and 'content' in section_data:
            content = section_data['content']

            # Buscar matches con los patrones
            for pattern in company_patterns:
                matches = re.findall(pattern, content)
                for match in matches:
                    # Limpiar y normalizar
                    company = match.strip()
                    if len(company) > 3:  # Evitar abreviaturas cortas
                        companies.add(company)

    return list(companies)


def create_data_viewer_project_from_discovery(sector_name: str, companies: List[str]) -> str:
    """
    Crea un proyecto en Data Viewer a partir de los resultados del Discovery Engine.
    """
    try:
        from shared import data_manager

        # Crear ID único para el proyecto
        project_id = f"discovery_{sector_name.lower().replace(' ', '_')}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

        # Crear datos mock basados en las empresas encontradas
        if companies:
            mock_data = generate_mock_sabi_data(companies, sector_name)
        else:
            mock_data = pd.DataFrame()

        # Crear configuración del proyecto
        project_config = {
            'name': f"Discovery - {sector_name}",
            'description': f"Proyecto creado automáticamente desde Discovery Engine. Sector: {sector_name}",
            'source': 'discovery_engine',
            'created_from_discovery': True,
            'sector': sector_name,
            'companies_found': len(companies) if companies else 0,
            'companies_list': companies[:10] if companies else [],  # Guardar máximo 10
            'created_at': datetime.now().isoformat()
        }

        # Crear schema_config básico
        schema_config = {
            "lists": [
                {"id": "inbox", "name": "📥 Bandeja de Entrada"},
                {"id": "shortlist", "name": "⭐ Shortlist"},
                {"id": "discarded", "name": "🗑 Descartados"}
            ],
            "custom_columns_definitions": {}
        }

        # Crear el proyecto
        project_data = {
            'master_data': mock_data,
            'schema_config': schema_config,
            'project_config': project_config
        }

        data_manager.save_project(project_id, project_data)

        return project_id

    except Exception as e:
        st.error(f"Error creando proyecto en Data Viewer: {e}")
        return None


def process_chat_message(user_message: str):
    """
    Procesa un mensaje del chat del usuario y genera una respuesta.
    """
    try:
        memory = st.session_state.chat_memory

        # Determinar sección relevante (usar la actual o detectar del mensaje)
        current_section = memory.current_section or detect_section_key(user_message, st.session_state.discovery_report)

        # Añadir mensaje del usuario al historial
        memory.add_message(current_section, 'user', user_message)
        st.session_state.chat_history.append({
            'role': 'user',
            'content': user_message,
            'section': current_section,
            'timestamp': datetime.now().isoformat()
        })

        # Generar respuesta
        response = generate_chat_response(user_message, current_section, st.session_state.discovery_report)

        # Añadir respuesta al historial
        memory.add_message(current_section, 'assistant', response)
        st.session_state.chat_history.append({
            'role': 'assistant',
            'content': response,
            'section': current_section,
            'timestamp': datetime.now().isoformat()
        })

    except Exception as e:
        error_msg = f"Error procesando mensaje: {str(e)}"
        st.session_state.chat_history.append({
            'role': 'assistant',
            'content': f"❌ {error_msg}",
            'timestamp': datetime.now().isoformat()
        })


def render_markdown_section(section_key: str, section_data: dict):
    """Renderiza una sección del informe en formato Markdown"""
    if not isinstance(section_data, dict) or 'content' not in section_data:
        return

    title = section_data.get('title', section_key.replace('_', ' ').title())
    content = section_data['content']

    # Crear expander para la sección (expandido por defecto)
    with st.expander(f"📄 {title}", expanded=True):
        st.markdown(content)


def render_prompts_configuration():
    """Renderiza la interfaz de configuración de prompts"""
    st.markdown("### ⚙️ Configuración de Prompts y Tesis")

    # Configuración de tesis Emerita
    st.markdown("#### 🎯 Tesis de Inversión Emerita")
    st.markdown("Personaliza los criterios de evaluación sectorial:")

    # Editor de tesis
    custom_thesis = st.text_area(
        "Tesis Emerita (JSON)",
        value=json.dumps(st.session_state.get('custom_emerita_thesis', EMERITA_THESIS), indent=2),
        height=300,
        key="emerita_thesis_editor"
    )

    if st.button("💾 Guardar Tesis", key="save_thesis"):
        try:
            parsed_thesis = json.loads(custom_thesis)
            st.session_state.custom_emerita_thesis = parsed_thesis
            st.success("✅ Tesis guardada correctamente")
        except json.JSONDecodeError as e:
            st.error(f"❌ Error en formato JSON: {e}")

    st.markdown("---")

    # Configuración de prompts por sección
    st.markdown("#### 📝 Prompts por Sección")
    st.markdown("Personaliza los prompts usados para generar cada sección:")

    # Funcionalidad completa de edición de prompts
    render_section_prompts_editor()


def detect_section_key(user_message: str, report: dict) -> str:
    """Detecta a qué sección del reporte se refiere el mensaje del usuario"""
    if not report or 'sections' not in report:
        return '1_executive_summary'

    sections = report['sections']
    message_lower = user_message.lower()

    # Mapear palabras clave a secciones
    section_keywords = {
        '1_executive_summary': ['resumen', 'ejecutivo', 'overview', 'summary'],
        '2_financials': ['financieros', 'financial', 'finanzas', 'revenue', 'beneficio', 'profit'],
        '3_market_size': ['mercado', 'market', 'tamaño', 'size', 'tam'],
        '4_value_chain': ['cadena', 'value', 'chain', 'valor'],
        '5_competition': ['competencia', 'competition', 'competidores', 'rivales'],
        '6_regulations': ['regulacion', 'regulation', 'legal', 'normativa'],
        '7_opportunities': ['oportunidades', 'opportunities', 'chance', 'posibilidades'],
        '8_gtm_targets': ['objetivos', 'targets', 'gtm', 'mercado objetivo'],
        '9_conclusion': ['conclusion', 'conclusión', 'final', 'cierre'],
        '10_sourcing_signals': ['sourcing', 'señales', 'signals', 'fuentes']
    }

    # Buscar coincidencias
    for section_key, keywords in section_keywords.items():
        if any(keyword in message_lower for keyword in keywords):
            return section_key

    # Por defecto, usar executive summary
    return '1_executive_summary'


def extract_search_query(user_message: str) -> str:
    """Extrae una query de búsqueda del mensaje del usuario"""
    # Implementación simplificada
    return user_message.strip()


def format_document_for_chat(report: dict) -> str:
    """Formatea el reporte completo para contexto del chat"""
    if not report:
        return "No hay reporte disponible."

    formatted = f"Sector: {report.get('meta', {}).get('sector_name', 'N/A')}\n\n"

    sections = report.get('sections', {})
    for section_key, section_data in sections.items():
        if isinstance(section_data, dict) and 'content' in section_data:
            title = section_data.get('title', section_key)
            content = section_data['content']
            formatted += f"## {title}\n{content}\n\n"

    return formatted


def update_section_interactive(section_key: str, user_instruction: str, report: dict):
    """Actualiza interactivamente una sección del reporte"""
    try:
        # Obtener prompt para actualizar sección
        update_prompt = get_section_update_prompt(section_key, user_instruction, report)

        # Generar actualización usando Gemini
        if not GOOGLE_API_KEY:
            raise ValueError("GOOGLE_API_KEY no está configurada")

        model = ChatGoogleGenerativeAI(
            model="models/gemini-2.5-flash",
            google_api_key=GOOGLE_API_KEY,
            temperature=0.3
        )

        response = model.invoke(update_prompt)
        updated_content = response.content if hasattr(response, 'content') else str(response)

        # Actualizar el reporte
        if 'sections' not in report:
            report['sections'] = {}

        if section_key not in report['sections']:
            report['sections'][section_key] = {}

        report['sections'][section_key]['content'] = updated_content
        report['sections'][section_key]['last_updated'] = datetime.now().isoformat()

        # Actualizar en session_state
        st.session_state.discovery_report = report

        return updated_content

    except Exception as e:
        st.error(f"Error actualizando sección: {e}")
        return None


def generate_chat_response(user_message: str, section_key: str, report: dict) -> str:
    """Genera una respuesta del chat basada en el contexto del reporte"""
    try:
        if not GOOGLE_API_KEY:
            return "❌ Error: API key no configurada"

        # Obtener contexto relevante
        document_context = format_document_for_chat(report)

        # Crear prompt para el chat
        chat_prompt = f"""
        Eres un asistente especializado en análisis de inversiones. Tienes acceso al siguiente reporte sectorial:

        {document_context}

        El usuario pregunta: {user_message}

        Proporciona una respuesta útil, precisa y basada en la información del reporte.
        Si la pregunta requiere información no disponible en el reporte, indícalo claramente.
        Mantén un tono profesional y constructivo.
        """

        model = ChatGoogleGenerativeAI(
            model="models/gemini-2.5-flash",
            google_api_key=GOOGLE_API_KEY,
            temperature=0.3
        )

        response = model.invoke(chat_prompt)
        return response.content if hasattr(response, 'content') else str(response)

    except Exception as e:
        return f"❌ Error generando respuesta: {str(e)}"


def read_full_document():
    """Lee el documento completo"""
    if st.session_state.discovery_report:
        st.markdown("### 📄 Documento Completo")
        st.json(st.session_state.discovery_report)
    else:
        st.warning("No hay documento disponible")


def read_section(section_key: str):
    """Lee una sección específica"""
    if not st.session_state.discovery_report:
        st.warning("No hay documento disponible")
        return

    sections = st.session_state.discovery_report.get('sections', {})
    if section_key in sections:
        section_data = sections[section_key]
        title = section_data.get('title', section_key)
        content = section_data.get('content', 'Contenido no disponible')

        st.markdown(f"### 📄 {title}")
        st.markdown(content)
    else:
        st.warning(f"Sección {section_key} no encontrada")


def search_sections(query: str):
    """Busca en todas las secciones"""
    if not st.session_state.discovery_report:
        st.warning("No hay documento disponible")
        return

    sections = st.session_state.discovery_report.get('sections', {})
    results = []

    for section_key, section_data in sections.items():
        if isinstance(section_data, dict) and 'content' in section_data:
            content = section_data['content']
            if query.lower() in content.lower():
                title = section_data.get('title', section_key)
                results.append(f"**{title}:** {content[:200]}...")

    if results:
        st.markdown("### 🔍 Resultados de búsqueda")
        for result in results:
            st.markdown(result)
            st.markdown("---")
    else:
        st.info("No se encontraron resultados para la búsqueda")


def render_section_prompts_editor():
    """Editor de prompts por sección"""
    st.markdown("### 📝 Editor de Prompts por Sección")

    # Obtener prompts personalizados
    custom_prompts = st.session_state.get('custom_section_prompts', {})

    # Lista de secciones disponibles
    from tool_1_discovery.prompts.initial_analysis import REPORT_SECTIONS

    for section_key, section_title in REPORT_SECTIONS.items():
        with st.expander(f"📄 {section_title}", expanded=False):
            # Mostrar prompt actual
            current_prompt = custom_prompts.get(section_key, get_default_section_prompt(section_key))

            # Editor
            new_prompt = st.text_area(
                f"Prompt para {section_title}",
                value=current_prompt,
                height=150,
                key=f"prompt_{section_key}"
            )

            # Botón guardar
            if st.button(f"💾 Guardar {section_key}", key=f"save_{section_key}"):
                if section_key not in custom_prompts:
                    custom_prompts[section_key] = {}
                custom_prompts[section_key] = new_prompt
                st.session_state.custom_section_prompts = custom_prompts
                st.success(f"✅ Prompt guardado para {section_title}")


def render_backup_restore():
    """Interfaz de backup y restauración"""
    st.markdown("### 💾 Backup y Restauración")

    col1, col2 = st.columns(2)

    with col1:
        st.markdown("#### 📤 Exportar Configuración")
        if st.button("💾 Descargar Backup", use_container_width=True):
            # Crear archivo de backup
            backup_data = {
                'custom_emerita_thesis': st.session_state.get('custom_emerita_thesis', {}),
                'custom_section_prompts': st.session_state.get('custom_section_prompts', {}),
                'timestamp': datetime.now().isoformat()
            }

            # Convertir a JSON y descargar
            backup_json = json.dumps(backup_data, indent=2, ensure_ascii=False)
            st.download_button(
                label="📥 Descargar Archivo",
                data=backup_json,
                file_name=f"discovery_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json",
                mime="application/json",
                use_container_width=True
            )

    with col2:
        st.markdown("#### 📥 Importar Configuración")
        uploaded_file = st.file_uploader("Seleccionar archivo de backup", type=['json'])

        if uploaded_file is not None:
            if st.button("🔄 Restaurar", use_container_width=True):
                try:
                    backup_data = json.load(uploaded_file)

                    # Restaurar configuración
                    if 'custom_emerita_thesis' in backup_data:
                        st.session_state.custom_emerita_thesis = backup_data['custom_emerita_thesis']
                    if 'custom_section_prompts' in backup_data:
                        st.session_state.custom_section_prompts = backup_data['custom_section_prompts']

                    st.success("✅ Configuración restaurada correctamente")
                    st.rerun()

                except Exception as e:
                    st.error(f"❌ Error restaurando backup: {e}")


def get_default_section_prompt(section_key: str) -> str:
    """Obtiene el prompt por defecto para una sección"""
    from tool_1_discovery.prompts.initial_analysis import get_initial_analysis_prompt

    # Esto es una simplificación - en realidad necesitarías acceder a los prompts individuales
    return f"Genera el contenido para la sección {section_key} del análisis sectorial."


def generate_mock_sabi_data(companies: list, sector_name: str) -> pd.DataFrame:
    """Genera datos mock similares a SABI para las empresas encontradas"""
    import random

    data = []
    for company in companies[:50]:  # Limitar a 50 empresas para evitar datasets muy grandes
        # Generar datos realistas basados en el sector
        base_revenue = random.randint(100000, 50000000)  # 100K a 50M€
        base_ebitda = int(base_revenue * random.uniform(0.05, 0.25))  # 5-25% de revenue

        company_data = {
            'company_name': company,
            'sector': sector_name,
            'revenue': base_revenue,
            'ebitda': base_ebitda,
            'employees': random.randint(5, 5000),
            'founded_year': random.randint(1980, 2020),
            'location': 'España',  # Simplificación
            'status': random.choice(['Activa', 'Activa', 'Activa', 'En proceso de disolución']),
            'source': 'Discovery Engine - Mock Data'
        }
        data.append(company_data)

    return pd.DataFrame(data)


def run_analysis_pipeline(sector_name: str, additional_context: str = ""):
    """
    Ejecuta el pipeline completo de análisis:
    1. Clasificador (CNAE Mapping)
    2. Investigador (Tavily)
    3. Analista (Generación de informe)
    4. Rules Engine (Evaluación)
    """
    try:
        # Paso 1: Clasificación CNAE
        st.info("🔍 Paso 1/4: Clasificando sector (mapeo CNAE)...")
        cnae_codes = classify_sector(sector_name, additional_context)

        # Paso 2: Investigación Web
        st.info("🌐 Paso 2/4: Investigando en internet (Tavily)...")
        web_context = research_sector(sector_name, cnae_codes)

        # Paso 3: Generación de Informe
        st.info("📊 Paso 3/4: Generando análisis sectorial...")
        # Usar configuración personalizada si está disponible
        custom_thesis = st.session_state.get('custom_emerita_thesis', EMERITA_THESIS)
        custom_prompts = st.session_state.get('custom_section_prompts', {})

        report = generate_initial_report(
            sector_name=sector_name,
            additional_context=additional_context,
            cnae_codes=cnae_codes,
            web_context=web_context,
            emerita_thesis=custom_thesis,
            custom_prompts=custom_prompts
        )

        # Paso 4: Evaluación con Rules Engine
        st.info("⚖️ Paso 4/4: Evaluando según criterios Emerita...")

        # Extraer contenido del informe para evaluación
        executive_summary = report.get('sections', {}).get('1_executive_summary', {}).get('content', '')
        financials = report.get('sections', {}).get('2_financials', {}).get('content', '')
        full_content = executive_summary + "\n\n" + financials

        evaluation = evaluate_sector(
            report_content=full_content,
            emerita_thesis=custom_thesis
        )

        # Actualizar veredicto en el meta
        report['meta']['verdict'] = evaluation['verdict']
        report['meta']['evaluation'] = {
            'score': evaluation['score'],
            'reasons': evaluation['reasons']
        }

        # Guardar en session state
        st.session_state.discovery_report = report

        st.success(f"✅ Análisis completado! Veredicto: {evaluation['verdict']}")

        return report

    except Exception as e:
        error_msg = f"Error en el pipeline: {str(e)}"
        st.error(f"❌ {error_msg}")

        # Crear un reporte de error
        error_report = {
            'meta': {
                'sector_name': sector_name,
                'error': error_msg,
                'timestamp': datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            },
            'sections': {}
        }

        st.session_state.discovery_report = error_report
        return None

# ============================================================================
# SISTEMA DE MEMORIA CONVERSACIONAL INTELIGENTE
# ============================================================================

class ChatMemory:
    """
    Sistema de memoria conversacional que mantiene contexto por sección
    y permite referencias inteligentes a conversaciones anteriores.
    """

    def __init__(self):
        self.conversations: Dict[str, List[Dict]] = {}  # Por sección
        self.current_section = None
        self.max_memory_per_section = 50

    def add_message(self, section_key: str, role: str, content: str):
        """Añade un mensaje al historial de una sección"""
        if section_key not in self.conversations:
            self.conversations[section_key] = []

        message = {
            'role': role,
            'content': content,
            'timestamp': datetime.now().isoformat(),
            'section': section_key
        }

        self.conversations[section_key].append(message)

        # Mantener límite de memoria
        if len(self.conversations[section_key]) > self.max_memory_per_section:
            self.conversations[section_key] = self.conversations[section_key][-self.max_memory_per_section:]

    def get_section_context(self, section_key: str, max_messages: int = 10) -> List[Dict]:
        """Obtiene el contexto de conversación de una sección"""
        if section_key not in self.conversations:
            return []
        return self.conversations[section_key][-max_messages:]

    def switch_section(self, section_key: str):
        """Cambia la sección activa"""
        self.current_section = section_key

    def get_all_conversations(self) -> Dict[str, List[Dict]]:
        """Obtiene todas las conversaciones"""
        return self.conversations.copy()

# Inicializar memoria del chat en session_state
if 'chat_memory' not in st.session_state:
    st.session_state.chat_memory = ChatMemory()

if 'chat_history' not in st.session_state:
    st.session_state.chat_history = []

if 'discovery_report' not in st.session_state:
    st.session_state.discovery_report = None

if 'analysis_in_progress' not in st.session_state:
    st.session_state.analysis_in_progress = False

# ============================================================================
# FUNCIONES AUXILIARES
# ============================================================================

def extract_companies_from_report(report: Dict) -> List[str]:
    """
    Extrae nombres de empresas del reporte generado.
    Busca en todas las secciones del informe.
    """
    companies = set()

    if not report or 'sections' not in report:
        return []

    sections = report['sections']

    # Patrones para identificar nombres de empresas
    company_patterns = [
        r'\b[A-Z][a-zA-Z\s&\-\.]+\b',  # Nombres propios con mayúscula
        r'\b[A-Z]{2,}[\s]*[A-Z]*\b',  # Acrónimos como IBM, HP, etc.
    ]

    for section_key, section_data in sections.items():
        if isinstance(section_data, dict) and 'content' in section_data:
            content = section_data['content']

            # Buscar matches con los patrones
            for pattern in company_patterns:
                matches = re.findall(pattern, content)
                for match in matches:
                    # Limpiar y normalizar
                    company = match.strip()
                    if len(company) > 3:  # Evitar abreviaturas cortas
                        companies.add(company)

    return list(companies)


def create_data_viewer_project_from_discovery(sector_name: str, companies: List[str]) -> str:
    """
    Crea un proyecto en Data Viewer a partir de los resultados del Discovery Engine.
    """
    try:
        from shared import data_manager

        # Crear ID único para el proyecto
        project_id = f"discovery_{sector_name.lower().replace(' ', '_')}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

        # Crear datos mock basados en las empresas encontradas
        if companies:
            mock_data = generate_mock_sabi_data(companies, sector_name)
        else:
            mock_data = pd.DataFrame()

        # Crear configuración del proyecto
        project_config = {
            'name': f"Discovery - {sector_name}",
            'description': f"Proyecto creado automáticamente desde Discovery Engine. Sector: {sector_name}",
            'source': 'discovery_engine',
            'created_from_discovery': True,
            'sector': sector_name,
            'companies_found': len(companies) if companies else 0,
            'companies_list': companies[:10] if companies else [],  # Guardar máximo 10
            'created_at': datetime.now().isoformat()
        }

        # Crear schema_config básico
        schema_config = {
            "lists": [
                {"id": "inbox", "name": "📥 Bandeja de Entrada"},
                {"id": "shortlist", "name": "⭐ Shortlist"},
                {"id": "discarded", "name": "🗑 Descartados"}
            ],
            "custom_columns_definitions": {}
        }

        # Crear el proyecto
        project_data = {
            'master_data': mock_data,
            'schema_config': schema_config,
            'project_config': project_config
        }

        data_manager.save_project(project_id, project_data)

        return project_id

    except Exception as e:
        st.error(f"Error creando proyecto en Data Viewer: {e}")
        return None


def process_chat_message(user_message: str):
    """
    Procesa un mensaje del chat del usuario y genera una respuesta.
    """
    try:
        memory = st.session_state.chat_memory

        # Determinar sección relevante (usar la actual o detectar del mensaje)
        current_section = memory.current_section or detect_section_key(user_message, st.session_state.discovery_report)

        # Añadir mensaje del usuario al historial
        memory.add_message(current_section, 'user', user_message)
        st.session_state.chat_history.append({
            'role': 'user',
            'content': user_message,
            'section': current_section,
            'timestamp': datetime.now().isoformat()
        })

        # Generar respuesta
        response = generate_chat_response(user_message, current_section, st.session_state.discovery_report)

        # Añadir respuesta al historial
        memory.add_message(current_section, 'assistant', response)
        st.session_state.chat_history.append({
            'role': 'assistant',
            'content': response,
            'section': current_section,
            'timestamp': datetime.now().isoformat()
        })

    except Exception as e:
        error_msg = f"Error procesando mensaje: {str(e)}"
        st.session_state.chat_history.append({
            'role': 'assistant',
            'content': f"❌ {error_msg}",
            'timestamp': datetime.now().isoformat()
        })


# ============================================================================
# FUNCIONES PRINCIPALES
# ============================================================================

st.title("🔍 Discovery Engine - Copiloto de Inversión")

# Control de qué contenido mostrar
show_main_content = True

# Layout Split-Screen: 40% izquierda / 60% derecha
col_left, col_right = st.columns([0.4, 0.6])

with col_left:
    # ========================================================================
    # PANEL IZQUIERDO: Control y Navegación
    # ========================================================================

    # ========================================================================
    # CONTENIDO PRINCIPAL (FUERA DE TABS)
    # ========================================================================

    # Si NO hay reporte, mostrar inputs de análisis
    if st.session_state.discovery_report is None:
        st.markdown("### 📝 Configuración del Análisis")

        sector_name = st.text_input(
            "Nombre del Sector / Nicho",
            placeholder="Ej: Mantenimiento de Ascensores",
            key="sector_input"
        )

        additional_context = st.text_area(
            "Contexto Adicional (Opcional)",
            placeholder="Ej: Centrarse en mantenimiento, no instalación",
            key="context_input",
            height=100
        )

        st.markdown("---")

        if st.button("🚀 ARRANCAR ANÁLISIS", use_container_width=True, type="primary"):
            if sector_name:
                st.session_state.analysis_in_progress = True
                st.rerun()
            else:
                st.error("⚠️ Por favor, introduce un nombre de sector")

    # Si HAY reporte, mostrar chat interactivo
    else:
        st.markdown("### 💬 Copiloto de Inversión")

        # Mostrar información de contexto inteligente
        if hasattr(st.session_state, 'chat_memory') and st.session_state.chat_memory:
            memory = st.session_state.chat_memory
            if memory.current_section:
                section_name = memory.current_section.replace('_', ' ').title()
                st.info(f"🎯 **Contexto activo:** {section_name} | Conversación: {len(memory.get_section_context(memory.current_section))} mensajes")

        # Mostrar historial de chat
        if st.session_state.chat_history:
            st.markdown("#### Historial de Conversación")
            for msg in st.session_state.chat_history[-10:]:  # Mostrar últimos 10
                section_indicator = ""
                if msg.get('section'):
                    section_num = msg['section'].split('_')[0]
                    section_indicator = f" [Sección {section_num}]"

                if msg['role'] == 'user':
                    st.markdown(f"**Tú{section_indicator}:** {msg['content']}")
                else:
                    st.markdown(f"**Asistente{section_indicator}:** {msg['content']}")
                st.markdown("---")

        # Input de chat
        user_message = st.text_input(
            "Escribe tu pregunta o instrucción:",
            placeholder="Ej: ¿Qué margen EBITDA mencionas en la sección 2?",
            key="chat_input"
        )

        col_btn1, col_btn2 = st.columns(2)

        with col_btn1:
            if st.button("💬 Enviar", use_container_width=True, key="chat_send"):
                if user_message:
                    process_chat_message(user_message)

        with col_btn2:
            if st.button("🔄 Nuevo Análisis", use_container_width=True, key="new_analysis"):
                st.session_state.discovery_report = None
                st.session_state.chat_history = []
                # Reiniciar memoria del chat
                st.session_state.chat_memory = ChatMemory()
                st.rerun()

    # ========================================================================
    # CONFIGURACIÓN (COLAPSABLE)
    # ========================================================================

    st.markdown("---")
    with st.expander("⚙️ Configuración de Prompts y Tesis", expanded=False):
        render_prompts_configuration()

with col_right:
    # ========================================================================
    # PANEL DERECHO: Visor de Documento (Markdown)
    # ========================================================================

    if st.session_state.analysis_in_progress:
        # Mostrar progreso durante análisis
        st.info("🔄 Ejecutando análisis... Por favor, espera.")
        if st.session_state.discovery_report is None:
            # Ejecutar pipeline
            sector_name = st.session_state.get('sector_input', '')
            additional_context = st.session_state.get('context_input', '')
            run_analysis_pipeline(sector_name, additional_context)
            st.session_state.analysis_in_progress = False
            st.rerun()

    elif st.session_state.discovery_report:
        # Mostrar informe completo
        report = st.session_state.discovery_report

        # Header con información del sector
        meta = report.get('meta', {})
        st.markdown(f"## 📊 {meta.get('sector_name', 'Sector')}")

        # Badge de veredicto
        verdict = meta.get('verdict', 'ÁMBAR')
        verdict_colors = {
            'VERDE': '🟢',
            'ÁMBAR': '🟡',
            'ROJO': '🔴'
        }
        st.markdown(f"**Veredicto:** {verdict_colors.get(verdict, '⚪')} {verdict}")

        if 'evaluation' in meta:
            eval_data = meta['evaluation']
            st.markdown(f"**Score:** {eval_data.get('score', 'N/A')}/10")
            if eval_data.get('reasons'):
                with st.expander("📋 Razones de evaluación"):
                    for reason in eval_data['reasons']:
                        st.markdown(f"- {reason}")

        st.markdown("---")

        # Renderizar secciones
        sections = report.get('sections', {})
        for section_key in sorted(sections.keys()):
            render_markdown_section(section_key, sections[section_key])

        # INTEGRACIÓN CON DATA VIEWER
        companies_found = extract_companies_from_report(report)
        if companies_found:
            st.markdown("### 🔗 Integración con Data Viewer")
            st.markdown(f"**Empresas identificadas:** {len(companies_found)}")

            with st.expander("📋 Empresas encontradas"):
                for company in companies_found[:10]:  # Mostrar máximo 10
                    st.markdown(f"- {company}")
                if len(companies_found) > 10:
                    st.markdown(f"... y {len(companies_found) - 10} más")

            # Botón para crear proyecto en Data Viewer
            if st.button("🚀 Crear Proyecto en Data Viewer", use_container_width=True, type="secondary"):
                with st.spinner("Creando proyecto en Data Viewer..."):
                    project_id = create_data_viewer_project_from_discovery(
                        meta.get('sector_name', 'Sector Desconocido'),
                        companies_found
                    )

                    if project_id:
                        st.success(f"✅ Proyecto creado exitosamente: **{project_id}**")

                        # Mostrar flujo integrado
                        st.success(f"""
                        🎉 **¡Flujo integrado completado!**

                        **📊 Proyecto creado:** `{project_id}`
                        **🏢 Empresas encontradas:** {len(companies_found)}
                        **📈 Datos generados:** Métricas simuladas basadas en el sector analizado

                        El proyecto está listo para análisis detallado en Data Viewer.
                        """)

                        # Opción de navegación integrada
                        col_back, col_navigate = st.columns(2)

                        with col_back:
                            if st.button("🔄 Continuar en Discovery", use_container_width=True):
                                st.rerun()

                        with col_navigate:
                            if st.button("🚀 Ir a Data Viewer ahora", use_container_width=True, type="primary"):
                                # Establecer navegación automática al Data Viewer
                                st.session_state.navigate_to_data_viewer = True
                                st.session_state.target_project_id = project_id
                                st.rerun()
                    else:
                        st.error("❌ Error al crear el proyecto. Revisa los logs para más detalles.")

    else:
        # Estado inicial: mostrar instrucciones
        st.markdown("""
        ### 👋 Bienvenido al Discovery Engine

        Esta herramienta te permite:

        1. **Analizar sectores** de forma automatizada
        2. **Investigar en internet** usando agentes IA
        3. **Generar informes** estructurados con 10 secciones
        4. **Evaluar sectores** según criterios Emerita

        #### 📋 Para empezar:

        1. Introduce el nombre del sector en el panel izquierdo
        2. (Opcional) Añade contexto adicional
        3. Haz clic en "ARRANCAR ANÁLISIS"

        El sistema ejecutará automáticamente:
        - 🔍 Clasificación CNAE
        - 🌐 Investigación web (Tavily)
        - 📊 Generación de informe
        - ⚖️ Evaluación según criterios Emerita
        """)
