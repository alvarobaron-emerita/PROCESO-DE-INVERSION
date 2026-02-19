"""
Router para Tool 2: Data Viewer
Endpoints para gestión de proyectos, vistas, datos y columnas
"""
from fastapi import APIRouter, HTTPException, UploadFile, File, Query
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import sys
import math
import json
import hashlib
from pathlib import Path
import pandas as pd
import numpy as np
import io


def _clean_for_json(obj: Any) -> Any:
    """Reemplaza NaN, Inf y -Inf por None para que sean serializables en JSON."""
    if isinstance(obj, dict):
        return {k: _clean_for_json(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_clean_for_json(v) for v in obj]
    if isinstance(obj, float) and (math.isnan(obj) or math.isinf(obj)):
        return None
    return obj

# Añadir search-os al path
search_os_path = Path(__file__).parent.parent.parent / "search-os"
sys.path.insert(0, str(search_os_path / "src"))

from shared import data_manager
from tool_2_dataviewer.csv_loader import normalize_sabi_data
from tool_2_dataviewer import ai_columns

router = APIRouter()

# Caché del DataFrame filtrado para paginación (evita recalcular en offset=750, 1500...)
# Clave: (project_id, view_id, filters_hash, sort_hash, global_filter)
# Se invalida al modificar datos del proyecto
_query_cache: Dict[str, pd.DataFrame] = {}
_QUERY_CACHE_MAX_SIZE = 20


def _query_cache_key(
    project_id: str,
    view_id: str,
    column_filters: Dict[str, List[str]],
    sort_payload: List[Dict],
    global_filter: Optional[str],
) -> str:
    f = json.dumps(dict(sorted((k, sorted(v)) for k, v in (column_filters or {}).items())), sort_keys=True)
    s = json.dumps(sort_payload or [], sort_keys=True)
    g = (global_filter or "").strip()
    h = hashlib.md5((f + s + g).encode()).hexdigest()
    return f"{project_id}:{view_id}:{h}"


def _clear_project_query_cache(project_id: str) -> None:
    """Invalida todas las entradas de caché para un proyecto."""
    global _query_cache
    keys_to_remove = [k for k in _query_cache if k.startswith(f"{project_id}:")]
    for k in keys_to_remove:
        del _query_cache[k]


# ============================================================================
# MODELS (Pydantic)
# ============================================================================

class ProjectCreate(BaseModel):
    name: str


class ProjectInfo(BaseModel):
    id: str
    name: str


class ViewInfo(BaseModel):
    id: str
    name: str
    icon: str
    type: str  # 'system' o 'custom'
    visibleColumns: Optional[List[str]] = None
    rowCount: Optional[int] = None


class ViewCreate(BaseModel):
    name: str
    icon: str
    visibleColumns: List[str]


class RowMove(BaseModel):
    rowUids: List[str]
    targetViewId: str


class ColumnDefinition(BaseModel):
    type: str
    label: Optional[str] = None
    options: Optional[List[str]] = None
    prompt: Optional[str] = None
    modelSelected: Optional[str] = None
    smartContext: Optional[bool] = None


class ColumnCreate(BaseModel):
    name: str
    definition: ColumnDefinition


class EnrichRequest(BaseModel):
    columnName: str
    rowUids: Optional[List[str]] = None  # None = todas las filas


class SortSpec(BaseModel):
    id: str
    desc: bool = False


class DataQueryRequest(BaseModel):
    offset: int = 0
    limit: int = 500
    globalFilter: Optional[str] = None
    searchableColumns: Optional[List[str]] = None
    columnFilters: Dict[str, List[str]] = {}
    sort: List[SortSpec] = []


class ColumnValuesRequest(BaseModel):
    columnId: str
    globalFilter: Optional[str] = None
    searchableColumns: Optional[List[str]] = None
    columnFilters: Dict[str, List[str]] = {}
    limit: int = 200


# ============================================================================
# ENDPOINTS: Proyectos
# ============================================================================

@router.get("/projects", response_model=List[ProjectInfo])
async def list_projects():
    """Lista todos los proyectos disponibles"""
    try:
        project_ids = data_manager.list_projects()
        # list_projects retorna una lista de IDs, necesitamos obtener los nombres
        projects = []
        for project_id in project_ids:
            try:
                schema = data_manager.load_schema(project_id)
                # Intentar obtener el nombre del proyecto desde el schema o usar el ID
                project_name = schema.get("project_name", project_id)
                projects.append(ProjectInfo(id=project_id, name=project_name))
            except:
                # Si no podemos cargar el schema, usar el ID como nombre
                projects.append(ProjectInfo(id=project_id, name=project_id))
        return projects
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/projects", response_model=ProjectInfo)
async def create_project(project: ProjectCreate):
    """Crea un nuevo proyecto"""
    try:
        project_id = data_manager.create_project(project.name)
        return ProjectInfo(id=project_id, name=project.name)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/projects")
async def wipe_all_projects(confirm: str = Query(..., description="Escriba 'wipe-all' para confirmar")):
    """Elimina TODOS los proyectos y sus datos. Deja Search OS limpio."""
    if confirm != "wipe-all":
        raise HTTPException(
            status_code=400,
            detail="Para borrar todos los proyectos debe enviar ?confirm=wipe-all",
        )
    try:
        count = data_manager.wipe_all_projects()
        return {"message": f"Se eliminaron {count} proyectos. Search OS está limpio."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/projects/{project_id}")
async def delete_project(project_id: str):
    """Elimina un proyecto"""
    try:
        data_manager.delete_project(project_id)
        return {"message": "Proyecto eliminado correctamente"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/projects/{project_id}/upload")
async def upload_file(
    project_id: str,
    file: UploadFile = File(...),
    append: bool = Query(False, description="Si true, añade las filas a los datos existentes en lugar de reemplazarlos"),
):
    """Sube un archivo Excel/CSV/TXT y lo procesa para el proyecto"""
    try:
        # Verificar que el proyecto existe
        if not data_manager.project_exists(project_id):
            raise HTTPException(status_code=404, detail="Proyecto no encontrado")

        # Leer el archivo
        contents = await file.read()
        file_io = io.BytesIO(contents)
        file_io.name = file.filename  # Necesario para normalize_sabi_data

        # Normalizar datos SABI
        df_normalized = normalize_sabi_data(file_io)

        if append:
            data_manager.append_master_data(project_id, df_normalized)
        else:
            data_manager.save_master_data(project_id, df_normalized)
        _clear_project_query_cache(project_id)

        return {
            "message": "Archivo cargado correctamente" + (" (añadido)" if append else ""),
            "rowCount": len(df_normalized),
            "columnCount": len(df_normalized.columns)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# ENDPOINTS: Vistas
# ============================================================================

@router.get("/projects/{project_id}/views", response_model=List[ViewInfo])
async def list_views(project_id: str):
    """Lista todas las vistas (sistema + personalizadas) de un proyecto.
    Optimizado: carga el Parquet una sola vez para todos los conteos."""
    try:
        views = data_manager.get_all_views(project_id)
        row_counts = data_manager.get_all_view_row_counts(project_id)
        result = []
        for view in views:
            row_count = row_counts.get(view["id"], 0)
            result.append(ViewInfo(
                id=view["id"],
                name=view["name"],
                icon=view.get("icon", "LayoutGrid"),
                type=view.get("type", "system"),
                visibleColumns=view.get("visibleColumns"),
                rowCount=row_count
            ))
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/projects/{project_id}/views", response_model=ViewInfo)
async def create_view(project_id: str, view: ViewCreate):
    """Crea una nueva vista personalizada"""
    try:
        view_id = data_manager.create_custom_view(
            project_id,
            view.name,
            view.icon,
            view.visibleColumns
        )
        return ViewInfo(
            id=view_id,
            name=view.name,
            icon=view.icon,
            type="custom",
            visibleColumns=view.visibleColumns,
            rowCount=0
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/projects/{project_id}/views/{view_id}")
async def delete_view(project_id: str, view_id: str):
    """Elimina una vista personalizada"""
    try:
        data_manager.delete_custom_view(project_id, view_id)
        return {"message": "Vista eliminada correctamente"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# ENDPOINTS: Datos
# ============================================================================

@router.get("/projects/{project_id}/views/{view_id}/data")
async def get_view_data(project_id: str, view_id: str):
    """Obtiene los datos de una vista específica"""
    try:
        df = data_manager.get_view_data(project_id, view_id)

        # Convertir DataFrame a JSON (NaN, Inf → None para serialización)
        records = df.replace({pd.NA: None, pd.NaT: None}).to_dict('records')
        records = _clean_for_json(records)

        return {
            "data": records,
            "columns": list(df.columns),
            "rowCount": len(df)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/projects/{project_id}/views/{view_id}/data/query")
async def query_view_data(project_id: str, view_id: str, payload: DataQueryRequest):
    """Obtiene datos paginados de una vista con filtros, ordenación y búsqueda.
    Usa caché del DataFrame filtrado para peticiones con offset>0 (paginación)."""
    try:
        global _query_cache
        limit = max(1, min(payload.limit or 500, 2000))
        offset = max(payload.offset or 0, 0)
        sort_payload = [spec.dict() for spec in payload.sort] if payload.sort else None

        cache_key = _query_cache_key(
            project_id, view_id, payload.columnFilters, sort_payload, payload.globalFilter
        )
        df_filtered = _query_cache.get(cache_key)

        if df_filtered is None:
            df_filtered = data_manager.query_view_dataframe(
                project_id,
                view_id,
                global_filter=payload.globalFilter,
                searchable_columns=payload.searchableColumns,
                column_filters=payload.columnFilters,
                sort=sort_payload,
            )
            # Guardar en caché (limitado por tamaño)
            if len(_query_cache) >= _QUERY_CACHE_MAX_SIZE:
                # Eliminar la primera clave (FIFO simple)
                first_key = next(iter(_query_cache))
                del _query_cache[first_key]
            _query_cache[cache_key] = df_filtered

        total_count = len(df_filtered)
        columns = list(df_filtered.columns)

        # Asegurar que offset no supere el total
        if offset >= total_count:
            offset = max(total_count - limit, 0)

        df_slice = df_filtered.iloc[offset: offset + limit].copy()
        if not df_slice.empty:
            df_slice = df_slice.replace({pd.NA: None, pd.NaT: None})

        records = df_slice.to_dict("records")
        records = _clean_for_json(records)

        next_cursor = offset + limit if (offset + limit) < total_count else None

        return {
            "data": records,
            "columns": columns,
            "totalRowCount": total_count,
            "offset": offset,
            "limit": limit,
            "nextCursor": next_cursor,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/projects/{project_id}/views/{view_id}/column-values")
async def get_column_values(project_id: str, view_id: str, payload: ColumnValuesRequest):
    """Obtiene los valores únicos de una columna considerando los filtros actuales."""
    try:
        # Excluir el filtro actual de la columna para mostrar todas las opciones posibles
        column_filters = {
            key: value
            for key, value in payload.columnFilters.items()
            if key != payload.columnId
        }

        values = data_manager.get_column_unique_values(
            project_id,
            view_id,
            payload.columnId,
            global_filter=payload.globalFilter,
            searchable_columns=payload.searchableColumns,
            column_filters=column_filters,
            limit=payload.limit,
        )

        return {"values": values}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/projects/{project_id}/views/{view_id}/rows/move")
async def move_rows(project_id: str, view_id: str, move: RowMove):
    """Mueve filas de una vista a otra"""
    try:
        # Obtener información de la vista destino
        all_views = data_manager.get_all_views(project_id)
        target_view = next((v for v in all_views if v["id"] == move.targetViewId), None)

        if not target_view:
            raise HTTPException(status_code=404, detail="Vista destino no encontrada")

        # Si es vista del sistema, actualizar _list_id
        if target_view.get("type") == "system":
            df_master = data_manager.load_master_data(project_id)
            df_master.loc[
                df_master['_uid'].isin(move.rowUids),
                '_list_id'
            ] = move.targetViewId
            data_manager.save_master_data(project_id, df_master)
        else:
            # Si es vista personalizada, añadir a rowIds
            data_manager.add_rows_to_view(
                project_id,
                move.targetViewId,
                move.rowUids
            )

        # Si la vista actual es personalizada, remover las filas
        current_view = next((v for v in all_views if v["id"] == view_id), None)
        if current_view and current_view.get("type") == "custom":
            data_manager.remove_rows_from_view(
                project_id,
                view_id,
                move.rowUids
            )
        _clear_project_query_cache(project_id)

        return {"message": f"{len(move.rowUids)} fila(s) movida(s) correctamente"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/projects/{project_id}/views/{view_id}/rows/copy")
async def copy_rows(project_id: str, view_id: str, move: RowMove):
    """Copia filas de una vista a otra (sin eliminarlas de la original)"""
    try:
        # Obtener información de la vista destino
        all_views = data_manager.get_all_views(project_id)
        target_view = next((v for v in all_views if v["id"] == move.targetViewId), None)

        if not target_view:
            raise HTTPException(status_code=404, detail="Vista destino no encontrada")

        # Si es vista del sistema, actualizar _list_id
        if target_view.get("type") == "system":
            df_master = data_manager.load_master_data(project_id)
            df_master.loc[
                df_master['_uid'].isin(move.rowUids),
                '_list_id'
            ] = move.targetViewId
            data_manager.save_master_data(project_id, df_master)
        else:
            # Si es vista personalizada, añadir a rowIds
            data_manager.add_rows_to_view(
                project_id,
                move.targetViewId,
                move.rowUids
            )
        _clear_project_query_cache(project_id)

        return {"message": f"{len(move.rowUids)} fila(s) copiada(s) correctamente"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/projects/{project_id}/rows")
async def delete_rows(project_id: str, row_uids: List[str]):
    """Elimina filas del proyecto"""
    try:
        df_master = data_manager.load_master_data(project_id)
        df_master = df_master[~df_master['_uid'].isin(row_uids)]
        data_manager.save_master_data(project_id, df_master)
        _clear_project_query_cache(project_id)
        return {"message": f"{len(row_uids)} fila(s) eliminada(s) correctamente"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# ENDPOINTS: Columnas
# ============================================================================

@router.get("/projects/{project_id}/columns")
async def list_columns(project_id: str):
    """Lista todas las columnas del proyecto (incluyendo personalizadas)"""
    try:
        schema = data_manager.load_schema(project_id)
        custom_defs = schema.get("custom_columns_definitions", {})

        # Obtener columnas del DataFrame maestro
        df_master = data_manager.load_master_data(project_id)
        all_columns = list(df_master.columns)

        return {
            "columns": all_columns,
            "customColumns": custom_defs
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/projects/{project_id}/columns")
async def create_column(project_id: str, column: ColumnCreate):
    """Crea una nueva columna personalizada"""
    try:
        schema = data_manager.load_schema(project_id)
        custom_defs = schema.get("custom_columns_definitions", {})

        col_def = {
            "type": column.definition.type,
            "label": column.definition.label,
            "options": column.definition.options,
        }
        if column.definition.type == "ai_score":
            col_def["config"] = {
                "user_prompt": column.definition.prompt or "",
                "model_selected": column.definition.modelSelected or "instant",
                "smart_context": column.definition.smartContext is not False,
            }
        else:
            col_def["prompt"] = column.definition.prompt
            col_def["modelSelected"] = column.definition.modelSelected
            col_def["smartContext"] = column.definition.smartContext
        custom_defs[column.name] = col_def

        schema["custom_columns_definitions"] = custom_defs
        data_manager.update_schema(project_id, schema)

        # Añadir columna(s) al DataFrame maestro
        df_master = data_manager.load_master_data(project_id)
        if column.name not in df_master.columns:
            df_master[column.name] = ""
            if column.definition.type == "ai_score":
                reason_col = f"{column.name}_reason"
                if reason_col not in df_master.columns:
                    df_master[reason_col] = ""
            data_manager.save_master_data(project_id, df_master)
        _clear_project_query_cache(project_id)

        return {"message": "Columna creada correctamente"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/projects/{project_id}/rows/{row_uid}")
async def update_row(project_id: str, row_uid: str, updates: Dict[str, Any]):
    """Actualiza una fila específica"""
    try:
        df_master = data_manager.load_master_data(project_id)
        row_idx = df_master[df_master['_uid'] == row_uid].index

        if len(row_idx) == 0:
            raise HTTPException(status_code=404, detail="Fila no encontrada")

        for col, value in updates.items():
            if col in df_master.columns:
                df_master.loc[row_idx[0], col] = str(value) if value is not None else ""

        data_manager.save_master_data(project_id, df_master)
        _clear_project_query_cache(project_id)
        return {"message": "Fila actualizada correctamente"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/projects/{project_id}/enrich")
async def enrich_column(project_id: str, body: EnrichRequest):
    """Ejecuta enriquecimiento IA sobre filas seleccionadas"""
    try:
        df_master = data_manager.load_master_data(project_id)
        row_indices = None
        if body.rowUids and len(body.rowUids) > 0:
            mask = df_master["_uid"].isin(body.rowUids)
            row_indices = df_master[mask].index.tolist()
        result = ai_columns.enrich_column_batch(
            project_id=project_id,
            column_name=body.columnName,
            row_indices=row_indices,
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
