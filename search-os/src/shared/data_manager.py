"""
Gestor de datos para proyectos Search OS
Maneja la persistencia en archivos Parquet y JSON
"""
import json
import uuid
import time
from pathlib import Path
from typing import Dict, List, Optional
import pandas as pd

from .config import PROCESSED_DATA_DIR
from .parquet_manager import (
    save_parquet,
    load_parquet,
    add_system_columns,
    normalize_column_names
)


# Schema config por defecto
DEFAULT_SCHEMA_CONFIG = {
    "lists": [
        {"id": "inbox", "name": "📥 Bandeja de Entrada"},
        {"id": "shortlist", "name": "⭐ Shortlist"},
        {"id": "discarded", "name": "🗑 Descartados"}
    ],
    "custom_views": [],
    "custom_columns_definitions": {}
}


def _get_default_icon_for_list(list_id: str) -> str:
    """
    Obtiene el icono por defecto para una lista del sistema.
    
    Args:
        list_id: ID de la lista del sistema
        
    Returns:
        Nombre del icono (compatible con lucide-react)
    """
    icon_mapping = {
        "inbox": "Inbox",
        "shortlist": "Star",
        "discarded": "Trash2"
    }
    return icon_mapping.get(list_id, "LayoutGrid")


def _ensure_custom_views_in_schema(schema: Dict) -> Dict:
    """
    Asegura que el schema tenga la clave 'custom_views'.
    Compatibilidad hacia atrás para proyectos existentes.
    
    Args:
        schema: Diccionario de schema
        
    Returns:
        Schema actualizado con custom_views si no existía
    """
    if 'custom_views' not in schema:
        schema['custom_views'] = []
    return schema


def create_project(name: str) -> str:
    """
    Crea un nuevo proyecto con estructura de carpetas y schema_config.json.

    Args:
        name: Nombre del proyecto

    Returns:
        project_id: ID único del proyecto generado
    """
    # Generar project_id único (slug del nombre + UUID corto)
    import re
    slug = re.sub(r'[^a-z0-9]+', '_', name.lower().strip())
    project_id = f"{slug}_{str(uuid.uuid4())[:8]}"

    # Crear directorio del proyecto
    project_dir = PROCESSED_DATA_DIR / project_id
    project_dir.mkdir(parents=True, exist_ok=True)

    # Crear schema_config.json por defecto
    schema_path = project_dir / "schema_config.json"
    with open(schema_path, 'w', encoding='utf-8') as f:
        json.dump(DEFAULT_SCHEMA_CONFIG, f, indent=2, ensure_ascii=False)

    return project_id


def save_master_data(project_id: str, df: pd.DataFrame) -> None:
    """
    Guarda el DataFrame maestro como archivo Parquet.

    Args:
        project_id: ID del proyecto
        df: DataFrame a guardar

    Raises:
        ValueError: Si el proyecto no existe
    """
    project_dir = PROCESSED_DATA_DIR / project_id
    if not project_dir.exists():
        raise ValueError(f"Proyecto no encontrado: {project_id}")

    parquet_path = project_dir / "master_data.parquet"
    save_parquet(df, parquet_path)


def load_master_data(project_id: str) -> pd.DataFrame:
    """
    Carga el DataFrame maestro desde archivo Parquet.

    Args:
        project_id: ID del proyecto

    Returns:
        DataFrame cargado

    Raises:
        FileNotFoundError: Si el proyecto o archivo no existe
    """
    parquet_path = PROCESSED_DATA_DIR / project_id / "master_data.parquet"

    if not parquet_path.exists():
        # Si no existe, retornar DataFrame vacío con columnas de sistema
        df = pd.DataFrame()
        df = add_system_columns(df)
        return df

    return load_parquet(parquet_path)


def update_schema(project_id: str, new_config: Dict) -> None:
    """
    Actualiza el schema_config.json del proyecto.

    Args:
        project_id: ID del proyecto
        new_config: Nuevo diccionario de configuración

    Raises:
        ValueError: Si el proyecto no existe o la configuración es inválida
    """
    project_dir = PROCESSED_DATA_DIR / project_id
    if not project_dir.exists():
        raise ValueError(f"Proyecto no encontrado: {project_id}")

    schema_path = project_dir / "schema_config.json"

    # Validar estructura básica
    if 'lists' not in new_config or 'custom_columns_definitions' not in new_config:
        raise ValueError("Configuración inválida: debe contener 'lists' y 'custom_columns_definitions'")

    # Guardar
    with open(schema_path, 'w', encoding='utf-8') as f:
        json.dump(new_config, f, indent=2, ensure_ascii=False)


def load_schema(project_id: str) -> Dict:
    """
    Carga el schema_config.json del proyecto.

    Args:
        project_id: ID del proyecto

    Returns:
        Diccionario de configuración

    Raises:
        FileNotFoundError: Si el proyecto no existe
    """
    project_dir = PROCESSED_DATA_DIR / project_id
    if not project_dir.exists():
        raise ValueError(f"Proyecto no encontrado: {project_id}")

    schema_path = project_dir / "schema_config.json"

    if not schema_path.exists():
        # Si no existe, crear uno por defecto
        update_schema(project_id, DEFAULT_SCHEMA_CONFIG)
        return DEFAULT_SCHEMA_CONFIG

    with open(schema_path, 'r', encoding='utf-8') as f:
        schema = json.load(f)
    
    # Compatibilidad hacia atrás: asegurar que custom_views existe
    schema = _ensure_custom_views_in_schema(schema)
    
    # Si se añadió custom_views, guardar el schema actualizado
    if 'custom_views' not in schema or not isinstance(schema.get('custom_views'), list):
        schema['custom_views'] = []
        update_schema(project_id, schema)
    
    return schema


def list_projects() -> List[str]:
    """
    Lista todos los project_id disponibles.

    Returns:
        Lista de project_id
    """
    if not PROCESSED_DATA_DIR.exists():
        return []

    projects = []
    for item in PROCESSED_DATA_DIR.iterdir():
        if item.is_dir() and (item / "schema_config.json").exists():
            projects.append(item.name)

    return sorted(projects)


def project_exists(project_id: str) -> bool:
    """
    Verifica si un proyecto existe.

    Args:
        project_id: ID del proyecto

    Returns:
        True si el proyecto existe, False en caso contrario
    """
    project_dir = PROCESSED_DATA_DIR / project_id
    return project_dir.exists() and (project_dir / "schema_config.json").exists()


def delete_project(project_id: str) -> None:
    """
    Elimina un proyecto y todos sus datos.

    Args:
        project_id: ID del proyecto

    Raises:
        ValueError: Si el proyecto no existe
    """
    project_dir = PROCESSED_DATA_DIR / project_id
    if not project_dir.exists():
        raise ValueError(f"Proyecto no encontrado: {project_id}")

    import shutil
    shutil.rmtree(project_dir)


def add_custom_column(
    project_id: str,
    col_name: str,
    col_type: str,
    options: Optional[List[str]] = None
) -> None:
    """
    Añade una columna personalizada al DataFrame y actualiza el schema.

    Args:
        project_id: ID del proyecto
        col_name: Nombre de la nueva columna
        col_type: Tipo de columna ('text' o 'single_select')
        options: Lista de opciones para columnas tipo 'single_select' (etiquetas)

    Raises:
        ValueError: Si el proyecto no existe, la columna ya existe, o los parámetros son inválidos
    """
    # Validar proyecto
    if not project_exists(project_id):
        raise ValueError(f"Proyecto no encontrado: {project_id}")

    # Validar tipo
    if col_type not in ['text', 'single_select']:
        raise ValueError(f"Tipo de columna inválido: {col_type}. Debe ser 'text' o 'single_select'")

    # Validar opciones para single_select
    if col_type == 'single_select':
        if not options or len(options) == 0:
            raise ValueError("Las columnas tipo 'single_select' requieren al menos una opción")
        # Limpiar opciones (eliminar espacios, vacíos)
        options = [opt.strip() for opt in options if opt.strip()]

    # Cargar datos y schema actuales
    df = load_master_data(project_id)
    schema = load_schema(project_id)

    # Verificar que la columna no exista ya
    if col_name in df.columns:
        raise ValueError(f"La columna '{col_name}' ya existe en el proyecto")

    # Añadir columna al DataFrame (inicializada a string vacío para compatibilidad con Parquet)
    df[col_name] = ''

    # Actualizar schema_config.json
    if 'custom_columns_definitions' not in schema:
        schema['custom_columns_definitions'] = {}

    if col_type == 'single_select':
        schema['custom_columns_definitions'][col_name] = {
            'type': 'single_select',
            'options': options
        }
    else:  # col_type == 'text'
        schema['custom_columns_definitions'][col_name] = {
            'type': 'text'
        }

    # Guardar ambos
    save_master_data(project_id, df)
    update_schema(project_id, schema)


def add_ai_column(
    project_id: str,
    col_name: str,
    user_prompt: str,
    model_selected: str,
    smart_context: bool = True
) -> None:
    """
    Añade una columna IA al DataFrame y actualiza el schema.

    Args:
        project_id: ID del proyecto
        col_name: Nombre de la nueva columna IA
        user_prompt: Prompt/instrucciones para la IA
        model_selected: Modelo seleccionado ('instant', 'batch', 'complex', 'long_context')
        smart_context: Si True, usa Smart Context Optimizer para reducir tokens

    Raises:
        ValueError: Si el proyecto no existe, la columna ya existe, o los parámetros son inválidos
    """
    # Validar proyecto
    if not project_exists(project_id):
        raise ValueError(f"Proyecto no encontrado: {project_id}")

    # Validar modelo
    valid_models = ['instant', 'batch', 'complex', 'long_context']
    if model_selected not in valid_models:
        raise ValueError(f"Modelo inválido: {model_selected}. Debe ser uno de: {valid_models}")

    # Validar prompt
    if not user_prompt or not user_prompt.strip():
        raise ValueError("El prompt de la columna IA es obligatorio")

    # Cargar datos y schema actuales
    df = load_master_data(project_id)
    schema = load_schema(project_id)

    # Verificar que la columna no exista ya
    if col_name in df.columns:
        raise ValueError(f"La columna '{col_name}' ya existe en el proyecto")

    # Generar field name (slug del nombre)
    import re
    field_name = re.sub(r'[^a-z0-9]+', '_', col_name.lower().strip())

    # Añadir columnas al DataFrame (score y reason)
    # Inicializar como float64 para columnas IA (no string vacío)
    if len(df) > 0:
        df[col_name] = None  # Se convertirá a NaN automáticamente
        df[col_name] = df[col_name].astype('float64')
    else:
        df[col_name] = pd.Series(dtype='float64')
    df[f"{col_name}_reason"] = ''  # Razón/explicación

    # Actualizar schema_config.json
    if 'custom_columns_definitions' not in schema:
        schema['custom_columns_definitions'] = {}

    schema['custom_columns_definitions'][col_name] = {
        'type': 'ai_score',
        'field': field_name,
        'config': {
            'user_prompt': user_prompt.strip(),
            'model_selected': model_selected,
            'smart_context': smart_context
        }
    }

    # Guardar ambos
    save_master_data(project_id, df)
    update_schema(project_id, schema)


# ============================================================================
# FUNCIONES PARA VISTAS PERSONALIZADAS
# ============================================================================

def create_custom_view(
    project_id: str,
    name: str,
    icon: str,
    visible_columns: List[str]
) -> str:
    """
    Crea una nueva vista personalizada.
    
    Args:
        project_id: ID del proyecto
        name: Nombre de la vista
        icon: Nombre del icono (compatible con lucide-react)
        visible_columns: Lista de IDs de columnas visibles
        
    Returns:
        view_id: ID de la vista creada
        
    Raises:
        ValueError: Si el proyecto no existe
    """
    if not project_exists(project_id):
        raise ValueError(f"Proyecto no encontrado: {project_id}")
    
    schema = load_schema(project_id)
    schema = _ensure_custom_views_in_schema(schema)
    
    # Generar ID único para la vista
    view_id = f"custom_{int(time.time() * 1000)}"
    
    # Crear nueva vista
    new_view = {
        "id": view_id,
        "name": name,
        "icon": icon,
        "visibleColumns": visible_columns,
        "rowIds": [],
        "isCustom": True
    }
    
    schema['custom_views'].append(new_view)
    update_schema(project_id, schema)
    
    return view_id


def delete_custom_view(project_id: str, view_id: str) -> None:
    """
    Elimina una vista personalizada.
    
    Args:
        project_id: ID del proyecto
        view_id: ID de la vista a eliminar
        
    Raises:
        ValueError: Si el proyecto no existe o la vista no es personalizada
    """
    if not project_exists(project_id):
        raise ValueError(f"Proyecto no encontrado: {project_id}")
    
    # No permitir eliminar vistas del sistema
    system_list_ids = ['inbox', 'shortlist', 'discarded']
    if view_id in system_list_ids:
        raise ValueError(f"No se puede eliminar la vista del sistema: {view_id}")
    
    schema = load_schema(project_id)
    schema = _ensure_custom_views_in_schema(schema)
    
    # Filtrar la vista a eliminar
    original_count = len(schema['custom_views'])
    schema['custom_views'] = [
        v for v in schema['custom_views'] 
        if v.get('id') != view_id
    ]
    
    if len(schema['custom_views']) == original_count:
        raise ValueError(f"Vista personalizada no encontrada: {view_id}")
    
    update_schema(project_id, schema)


def get_all_views(project_id: str) -> List[Dict]:
    """
    Obtiene todas las vistas (sistema + personalizadas) del proyecto.
    
    Args:
        project_id: ID del proyecto
        
    Returns:
        Lista de vistas con formato unificado
        
    Raises:
        ValueError: Si el proyecto no existe
    """
    if not project_exists(project_id):
        raise ValueError(f"Proyecto no encontrado: {project_id}")
    
    schema = load_schema(project_id)
    schema = _ensure_custom_views_in_schema(schema)
    
    views = []
    
    # Añadir vistas del sistema
    system_lists = schema.get('lists', [])
    for list_item in system_lists:
        views.append({
            "id": list_item['id'],
            "name": list_item['name'],
            "icon": _get_default_icon_for_list(list_item['id']),
            "visibleColumns": [],
            "rowIds": [],
            "isCustom": False,
            "type": "system"
        })
    
    # Añadir vistas personalizadas
    custom_views = schema.get('custom_views', [])
    for view in custom_views:
        # Asegurar que tiene todos los campos necesarios
        view_dict = {
            "id": view.get('id', ''),
            "name": view.get('name', ''),
            "icon": view.get('icon', 'Eye'),
            "visibleColumns": view.get('visibleColumns', []),
            "rowIds": view.get('rowIds', []),
            "isCustom": True,
            "type": "custom"
        }
        views.append(view_dict)
    
    return views


def add_rows_to_view(
    project_id: str,
    view_id: str,
    row_uids: List[str]
) -> None:
    """
    Añade filas a una vista.
    Para vistas del sistema, actualiza _list_id en el DataFrame.
    Para vistas personalizadas, actualiza rowIds en el schema.
    
    Args:
        project_id: ID del proyecto
        view_id: ID de la vista
        row_uids: Lista de UIDs de las filas a añadir
        
    Raises:
        ValueError: Si el proyecto no existe o la vista no existe
    """
    if not project_exists(project_id):
        raise ValueError(f"Proyecto no encontrado: {project_id}")
    
    system_list_ids = ['inbox', 'shortlist', 'discarded']
    
    # Si es vista del sistema, actualizar _list_id en el DataFrame
    if view_id in system_list_ids:
        df = load_master_data(project_id)
        
        # Validar que los UIDs existen
        existing_uids = set(df['_uid'].tolist() if '_uid' in df.columns else [])
        valid_uids = [uid for uid in row_uids if uid in existing_uids]
        
        if valid_uids:
            df.loc[df['_uid'].isin(valid_uids), '_list_id'] = view_id
            save_master_data(project_id, df)
        return
    
    # Si es vista personalizada, actualizar rowIds en el schema
    schema = load_schema(project_id)
    schema = _ensure_custom_views_in_schema(schema)
    
    view_found = False
    for view in schema['custom_views']:
        if view.get('id') == view_id:
            current_row_ids = set(view.get('rowIds', []))
            current_row_ids.update(row_uids)
            view['rowIds'] = list(current_row_ids)
            view_found = True
            break
    
    if not view_found:
        raise ValueError(f"Vista personalizada no encontrada: {view_id}")
    
    update_schema(project_id, schema)


def remove_rows_from_view(
    project_id: str,
    view_id: str,
    row_uids: List[str]
) -> None:
    """
    Elimina filas de una vista personalizada.
    No aplica a vistas del sistema (usar add_rows_to_view con otra lista).
    
    Args:
        project_id: ID del proyecto
        view_id: ID de la vista personalizada
        row_uids: Lista de UIDs de las filas a eliminar
        
    Raises:
        ValueError: Si el proyecto no existe, la vista no existe o es del sistema
    """
    if not project_exists(project_id):
        raise ValueError(f"Proyecto no encontrado: {project_id}")
    
    system_list_ids = ['inbox', 'shortlist', 'discarded']
    if view_id in system_list_ids:
        raise ValueError(f"No se puede eliminar filas de una vista del sistema: {view_id}")
    
    schema = load_schema(project_id)
    schema = _ensure_custom_views_in_schema(schema)
    
    view_found = False
    for view in schema['custom_views']:
        if view.get('id') == view_id:
            current_row_ids = set(view.get('rowIds', []))
            current_row_ids.difference_update(row_uids)
            view['rowIds'] = list(current_row_ids)
            view_found = True
            break
    
    if not view_found:
        raise ValueError(f"Vista personalizada no encontrada: {view_id}")
    
    update_schema(project_id, schema)


def get_view_data(
    project_id: str,
    view_id: str
) -> pd.DataFrame:
    """
    Obtiene los datos filtrados para una vista específica.
    
    Args:
        project_id: ID del proyecto
        view_id: ID de la vista
        
    Returns:
        DataFrame filtrado según la vista
        
    Raises:
        ValueError: Si el proyecto no existe
    """
    if not project_exists(project_id):
        raise ValueError(f"Proyecto no encontrado: {project_id}")
    
    df = load_master_data(project_id)
    
    if df.empty:
        return df
    
    system_list_ids = ['inbox', 'shortlist', 'discarded']
    
    # Si es vista del sistema, filtrar por _list_id
    if view_id in system_list_ids:
        if '_list_id' not in df.columns:
            return pd.DataFrame()
        return df[df['_list_id'] == view_id].copy()
    
    # Si es vista personalizada, filtrar por rowIds
    schema = load_schema(project_id)
    schema = _ensure_custom_views_in_schema(schema)
    
    custom_views = schema.get('custom_views', [])
    for view in custom_views:
        if view.get('id') == view_id:
            row_ids = view.get('rowIds', [])
            if not row_ids:
                return pd.DataFrame()
            
            if '_uid' not in df.columns:
                return pd.DataFrame()
            
            return df[df['_uid'].isin(row_ids)].copy()
    
    # Vista no encontrada, retornar DataFrame vacío
    return pd.DataFrame()
