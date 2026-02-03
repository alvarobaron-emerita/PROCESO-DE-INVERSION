"""
Router para Tool 2: Data Viewer
Endpoints para gestión de proyectos, vistas, datos y columnas
"""
from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import sys
from pathlib import Path
import pandas as pd
import io

# Añadir search-os al path
search_os_path = Path(__file__).parent.parent.parent / "search-os"
sys.path.insert(0, str(search_os_path / "src"))

from shared import data_manager
from tool_2_dataviewer.csv_loader import normalize_sabi_data

router = APIRouter()


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


class ColumnCreate(BaseModel):
    name: str
    definition: ColumnDefinition


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


@router.delete("/projects/{project_id}")
async def delete_project(project_id: str):
    """Elimina un proyecto"""
    try:
        data_manager.delete_project(project_id)
        return {"message": "Proyecto eliminado correctamente"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/projects/{project_id}/upload")
async def upload_file(project_id: str, file: UploadFile = File(...)):
    """Sube un archivo Excel/CSV y lo procesa para el proyecto"""
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

        # Guardar en el proyecto
        data_manager.save_master_data(project_id, df_normalized)

        return {
            "message": "Archivo cargado correctamente",
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
    """Lista todas las vistas (sistema + personalizadas) de un proyecto"""
    try:
        views = data_manager.get_all_views(project_id)
        result = []
        for view in views:
            # Obtener conteo de filas
            try:
                df_view = data_manager.get_view_data(project_id, view["id"])
                row_count = len(df_view)
            except:
                row_count = 0

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

        # Convertir DataFrame a JSON
        # Reemplazar NaN por None para JSON
        records = df.replace({pd.NA: None, pd.NaT: None}).to_dict('records')

        return {
            "data": records,
            "columns": list(df.columns),
            "rowCount": len(df)
        }
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

        custom_defs[column.name] = {
            "type": column.definition.type,
            "label": column.definition.label,
            "options": column.definition.options,
            "prompt": column.definition.prompt
        }

        schema["custom_columns_definitions"] = custom_defs
        data_manager.update_schema(project_id, schema)

        # Añadir columna vacía al DataFrame maestro
        df_master = data_manager.load_master_data(project_id)
        if column.name not in df_master.columns:
            df_master[column.name] = ""
            data_manager.save_master_data(project_id, df_master)

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
        return {"message": "Fila actualizada correctamente"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
