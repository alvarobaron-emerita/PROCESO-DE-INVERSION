"""
Utilidades para manejo de archivos Parquet
"""
import pandas as pd
import uuid
from pathlib import Path
from typing import Optional


def normalize_column_names(df: pd.DataFrame) -> pd.DataFrame:
    """
    Normaliza nombres de columnas eliminando espacios y caracteres especiales.

    Args:
        df: DataFrame a normalizar

    Returns:
        DataFrame con columnas normalizadas
    """
    df = df.copy()
    df.columns = df.columns.str.strip().str.lower().str.replace(' ', '_')
    return df


def add_system_columns(df: pd.DataFrame) -> pd.DataFrame:
    """
    Añade columnas de sistema al DataFrame.

    Columnas añadidas:
    - _uid: UUID único por fila
    - _list_id: ID de lista por defecto 'inbox'

    Args:
        df: DataFrame al que añadir columnas

    Returns:
        DataFrame con columnas de sistema añadidas
    """
    df = df.copy()

    # Generar _uid si no existe
    if '_uid' not in df.columns:
        df['_uid'] = [str(uuid.uuid4()) for _ in range(len(df))]

    # Asignar _list_id por defecto si no existe
    if '_list_id' not in df.columns:
        df['_list_id'] = 'inbox'

    return df


def clean_dataframe_for_parquet(df: pd.DataFrame) -> pd.DataFrame:
    """
    Limpia el DataFrame para que sea compatible con Parquet.
    Convierte TODAS las columnas (excepto sistema) a string para evitar problemas con tipos mixtos.

    Args:
        df: DataFrame a limpiar

    Returns:
        DataFrame limpio
    """
    df = df.copy()

    for col in df.columns:
        # Saltar columnas de sistema que ya están bien tipadas
        if col in ['_uid', '_list_id']:
            continue

        # Convertir TODAS las demás columnas a string, sin importar su tipo actual
        # Esto evita problemas con tipos mixtos que PyArrow no puede manejar
        try:
            df[col] = df[col].apply(lambda x: str(x) if pd.notna(x) else '')
            # Limpiar representaciones de NaN
            df[col] = df[col].replace(['nan', 'None', 'none', '<NA>', 'NaT', 'NoneType', 'float64', 'int64'], '')
        except Exception:
            # Si falla, intentar conversión directa
            df[col] = df[col].astype(str)
            df[col] = df[col].replace(['nan', 'None', 'none', '<NA>', 'NaT'], '')

    return df


def save_parquet(
    df: pd.DataFrame,
    file_path: Path,
    compression: str = 'snappy'
) -> None:
    """
    Guarda DataFrame como archivo Parquet con compresión.
    Usa fastparquet que es más tolerante con tipos mixtos.

    Args:
        df: DataFrame a guardar
        file_path: Ruta del archivo Parquet
        compression: Tipo de compresión ('snappy', 'gzip', 'brotli')
    """
    file_path.parent.mkdir(parents=True, exist_ok=True)

    # Usar fastparquet directamente (más tolerante con tipos mixtos)
    # El DataFrame ya debería estar limpio (convertido a string en csv_loader.py)
    df.to_parquet(
        file_path,
        engine='fastparquet',
        compression=compression,
        index=False
    )


def load_parquet(file_path: Path) -> pd.DataFrame:
    """
    Carga archivo Parquet como DataFrame.
    Intenta con pyarrow primero, si falla usa fastparquet.

    Args:
        file_path: Ruta del archivo Parquet

    Returns:
        DataFrame cargado

    Raises:
        FileNotFoundError: Si el archivo no existe
    """
    if not file_path.exists():
        raise FileNotFoundError(f"Archivo no encontrado: {file_path}")

    try:
        return pd.read_parquet(file_path, engine='pyarrow')
    except Exception:
        # Si falla con pyarrow, intentar con fastparquet
        return pd.read_parquet(file_path, engine='fastparquet')
