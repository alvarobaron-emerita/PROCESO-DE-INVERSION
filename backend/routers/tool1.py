"""
Router para Tool 1: Discovery Engine
Endpoints para análisis de sectores, generación de reportes y chat interactivo
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import sys
from pathlib import Path
import json
from datetime import datetime

# Añadir search-os al path
search_os_path = Path(__file__).parent.parent.parent / "search-os"
sys.path.insert(0, str(search_os_path / "src"))

from tool_1_discovery.agents.classifier import classify_sector
from tool_1_discovery.agents.researcher import research_sector, search_internet
from tool_1_discovery.agents.analyst import generate_initial_report
from tool_1_discovery.rules_engine import evaluate_sector
from tool_1_discovery.prompts.chat_system import (
    get_section_update_prompt,
    format_document_for_chat,
    build_chat_system_prompt,
)
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from shared.config import GOOGLE_API_KEY

router = APIRouter()


# ============================================================================
# MODELS (Pydantic)
# ============================================================================

class SectorAnalysisRequest(BaseModel):
    sector_name: str
    additional_context: Optional[str] = None


class CNAEClassification(BaseModel):
    primary_cnae: str
    secondary_cnae: List[str]
    description: str


class ResearchRequest(BaseModel):
    sector_name: str
    cnae_codes: Optional[List[str]] = None
    max_results_per_query: Optional[int] = 3


class ReportRequest(BaseModel):
    sector_name: str
    cnae_codes: List[str]
    research_data: str
    additional_context: Optional[str] = None
    emerita_thesis: Optional[Dict[str, Any]] = None
    custom_prompts: Optional[Dict[str, Any]] = None
    custom_section_titles: Optional[Dict[str, str]] = None
    custom_sections: Optional[List[Dict[str, Any]]] = None


class ChatHistoryEntry(BaseModel):
    role: str  # "user" | "assistant"
    content: str


class ChatMessage(BaseModel):
    message: str
    section_key: Optional[str] = None
    report: Dict[str, Any]
    history: Optional[List[ChatHistoryEntry]] = None


class SectionUpdate(BaseModel):
    section_key: str
    user_instruction: str
    report: Dict[str, Any]


class ReportSave(BaseModel):
    report_id: str
    report: Dict[str, Any]
    sector_name: str


# ============================================================================
# ENDPOINTS: Clasificación CNAE
# ============================================================================

@router.post("/classify", response_model=CNAEClassification)
async def classify_sector_endpoint(request: SectorAnalysisRequest):
    """Clasifica un sector a códigos CNAE 2009"""
    try:
        cnae_codes = classify_sector(
            request.sector_name,
            request.additional_context or ""
        )

        # La función retorna una lista, necesitamos parsear si viene como JSON string
        if isinstance(cnae_codes, list) and len(cnae_codes) > 0:
            # Si el primer elemento es un string JSON, parsearlo
            if isinstance(cnae_codes[0], str) and cnae_codes[0].startswith('{'):
                result = json.loads(cnae_codes[0])
            else:
                # Si es una lista simple de códigos
                result = {
                    "primary_cnae": cnae_codes[0] if len(cnae_codes) > 0 else "",
                    "secondary_cnae": cnae_codes[1:] if len(cnae_codes) > 1 else [],
                    "description": f"Códigos CNAE para {request.sector_name}"
                }
        else:
            raise ValueError("No se pudieron obtener códigos CNAE")

        return CNAEClassification(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# ENDPOINTS: Investigación
# ============================================================================

@router.post("/research")
async def research_sector_endpoint(request: ResearchRequest):
    """Investiga un sector y retorna información relevante"""
    try:
        research_data = research_sector(
            request.sector_name,
            request.cnae_codes,
            request.max_results_per_query or 3
        )
        return {
            "sector_name": request.sector_name,
            "research_data": research_data,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# ENDPOINTS: Generación de Reportes
# ============================================================================

@router.post("/generate-report")
async def generate_report_endpoint(request: ReportRequest):
    """Genera un reporte inicial de análisis de sector"""
    try:
        report = generate_initial_report(
            sector_name=request.sector_name,
            additional_context=request.additional_context or "",
            cnae_codes=request.cnae_codes,
            web_context=request.research_data,
            emerita_thesis=request.emerita_thesis,
            custom_prompts=request.custom_prompts,
            custom_section_titles=request.custom_section_titles,
            custom_sections=request.custom_sections,
        )

        return {
            "report": report,
            "sector_name": request.sector_name,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# ENDPOINTS: Evaluación
# ============================================================================

@router.post("/evaluate")
async def evaluate_sector_endpoint(
    margins_data: Optional[Dict[str, Any]] = None,
    market_data: Optional[Dict[str, Any]] = None,
    report_content: str = "",
    emerita_thesis: Optional[Dict[str, Any]] = None
):
    """Evalúa un sector según la tesis de inversión de Emerita"""
    try:
        evaluation = evaluate_sector(
            margins_data=margins_data,
            market_data=market_data,
            report_content=report_content,
            emerita_thesis=emerita_thesis
        )
        return {
            "evaluation": evaluation,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# ENDPOINTS: Chat Interactivo
# ============================================================================

def _create_chat_model():
    return ChatGoogleGenerativeAI(
        model="models/gemini-2.5-flash",
        google_api_key=GOOGLE_API_KEY,
        temperature=0.3,
    )


@router.post("/chat")
async def chat_endpoint(message: ChatMessage):
    """Procesa un mensaje del chat: responde desde el informe o ejecuta búsqueda web si se pide."""
    try:
        if not GOOGLE_API_KEY:
            raise ValueError("GOOGLE_API_KEY no está configurada")

        document_text = format_document_for_chat(message.report)
        system_prompt = build_chat_system_prompt(document_text)

        # Construir lista de mensajes: system + historial + mensaje actual
        messages = [SystemMessage(content=system_prompt)]
        for h in message.history or []:
            if h.role == "user":
                messages.append(HumanMessage(content=h.content))
            else:
                messages.append(AIMessage(content=h.content))
        messages.append(HumanMessage(content=message.message))

        model = _create_chat_model()
        response = model.invoke(messages)
        response_content = (response.content if hasattr(response, "content") else str(response)) or ""

        # Si el modelo pide búsqueda en internet, ejecutarla y generar respuesta final
        stripped = response_content.strip()
        if stripped.upper().startswith("INTERNET_SEARCH:"):
            query = stripped.split("INTERNET_SEARCH:", 1)[1].strip()
            if query:
                search_results = search_internet(query, max_results=5)
                follow_up_system = (
                    system_prompt
                    + "\n\n## RESULTADOS DE BÚSQUEDA RECIENTE:\n\n"
                    + search_results
                    + "\n\nResponde al usuario integrando estos resultados de forma profesional. Si no son útiles, dilo."
                )
                follow_up_messages = [
                    SystemMessage(content=follow_up_system),
                    HumanMessage(content=message.message),
                ]
                follow_up = model.invoke(follow_up_messages)
                response_content = (
                    follow_up.content if hasattr(follow_up, "content") else str(follow_up)
                ) or "No se pudo generar una respuesta a partir de la búsqueda."

        return {
            "response": response_content,
            "timestamp": datetime.now().isoformat(),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# ENDPOINTS: Actualización de Secciones
# ============================================================================

@router.post("/update-section")
async def update_section_endpoint(update: SectionUpdate):
    """Actualiza una sección específica del reporte"""
    try:
        if not GOOGLE_API_KEY:
            raise ValueError("GOOGLE_API_KEY no está configurada")

        # Obtener prompt para actualizar sección
        update_prompt = get_section_update_prompt(
            update.section_key,
            update.user_instruction,
            update.report
        )

        # Generar actualización usando Gemini
        model = ChatGoogleGenerativeAI(
            model="models/gemini-2.5-flash",
            google_api_key=GOOGLE_API_KEY,
            temperature=0.3
        )

        response = model.invoke(update_prompt)
        updated_content = response.content if hasattr(response, 'content') else str(response)

        # Actualizar el reporte
        updated_report = update.report.copy()
        if 'sections' not in updated_report:
            updated_report['sections'] = {}

        if update.section_key not in updated_report['sections']:
            updated_report['sections'][update.section_key] = {}

        updated_report['sections'][update.section_key]['content'] = updated_content
        updated_report['sections'][update.section_key]['last_updated'] = datetime.now().isoformat()

        return {
            "report": updated_report,
            "section_key": update.section_key,
            "updated_content": updated_content,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# ENDPOINTS: Persistencia de Reportes
# ============================================================================

# Nota: La persistencia de reportes se puede hacer en el frontend o aquí
# Por ahora, dejamos que el frontend maneje el almacenamiento local
# Si necesitas persistencia en servidor, podemos añadirla después

@router.get("/reports/{report_id}")
async def get_report(report_id: str):
    """Obtiene un reporte guardado (si implementamos persistencia)"""
    # TODO: Implementar persistencia de reportes si es necesario
    raise HTTPException(status_code=501, detail="Persistencia de reportes no implementada aún")


@router.post("/reports")
async def save_report(report_data: ReportSave):
    """Guarda un reporte (si implementamos persistencia)"""
    # TODO: Implementar persistencia de reportes si es necesario
    raise HTTPException(status_code=501, detail="Persistencia de reportes no implementada aún")
