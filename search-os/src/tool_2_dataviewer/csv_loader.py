"""
Motor de Ingesta SABI - Normalización de datos
Convierte archivos Excel/CSV de SABI al formato interno
"""
import pandas as pd
import io
import json
from typing import Union, List, Dict
from pathlib import Path

from shared.parquet_manager import add_system_columns, normalize_column_names


# Mapeo de columnas SABI a formato interno
SABI_COLUMN_MAPPING = {
    # Nombres comunes en SABI (case-insensitive matching)
    'nombre': 'name',
    'razón social': 'name',
    'razon social': 'name',
    'denominación': 'name',

    'dirección web': 'website',
    'direccion web': 'website',
    'web': 'website',
    'url': 'website',
    'página web': 'website',
    'pagina web': 'website',

    'código nif': 'nif',
    'codigo nif': 'nif',
    'nif': 'nif',
    'cif': 'nif',
    'nif/cif': 'nif',

    'ingresos de explotación': 'revenue',
    'ingresos de explotacion': 'revenue',
    'ventas': 'revenue',
    'facturación': 'revenue',
    'facturacion': 'revenue',
    'ingresos': 'revenue',
    'ingresos explotación': 'revenue',
    'ingresos explotacion': 'revenue',

    'ebitda': 'ebitda',
    'ebitda (€)': 'ebitda',
    'resultado ebitda': 'ebitda',

    'resultado del ejercicio': 'net_income',
    'resultado ejercicio': 'net_income',
    'beneficio': 'net_income',
    'pérdidas': 'net_income',
    'perdidas': 'net_income',
    'resultado neto': 'net_income',

    'localidad': 'city',
    'ciudad': 'city',
    'municipio': 'city',

    'descripción actividad': 'description',
    'descripcion actividad': 'description',
    'actividad': 'description',
    'actividad principal': 'description',
    'sector': 'description',

    'provincia': 'province',
    'código postal': 'postal_code',
    'codigo postal': 'postal_code',
    'cp': 'postal_code',

    'empleados': 'employees',
    'número empleados': 'employees',
    'numero empleados': 'employees',
    'plantilla': 'employees',
}


def consolidate_sabi_hierarchical_data(df: pd.DataFrame) -> pd.DataFrame:
    """
    Consolida múltiples filas de la misma empresa en una sola fila usando la columna "Mark".

    LÓGICA DE CONSOLIDACIÓN:
    - La columna "Mark" actúa como identificador de grupo.
    - Si una fila tiene un número en "Mark", es una fila principal.
    - Si "Mark" está vacío, esa fila pertenece a la fila anterior que tenía un número.
    - Todas las filas con el mismo "Mark" se consolidan en una sola fila.
    - Los valores múltiples de cada columna se consolidan en arrays JSON.

    Ejemplo:
        Mark 66: Fila principal con datos de empresa
        (vacío): Fila secundaria con accionista 1
        (vacío): Fila secundaria con accionista 2
        ...
        (vacío): Fila secundaria con accionista 36

        Resultado: 1 fila con:
        - Mark: 66 (valor único, NO JSON - permite ordenamiento)
        - "Accionista - Número de identificación BvD": JSON array con los 36 valores
        - _rows_consolidated: 36 (número total de filas consolidadas)

    NOTA: La columna "Mark" se excluye de la consolidación JSON para mantener
    ordenamiento numérico correcto. Todas las demás columnas se consolidan normalmente.

    Args:
        df: DataFrame con datos SABI (con nombres originales de columnas)

    Returns:
        DataFrame consolidado con una fila por grupo "Mark"
    """
    if df.empty:
        return df

    # Hacer una copia para no modificar el original
    df_work = df.copy()

    # 1. Buscar columna "Mark" (case-insensitive, puede tener espacios)
    mark_col = None
    for col in df_work.columns:
        if col.strip().lower() == 'mark':
            mark_col = col
            break

    # Si no encontramos "Mark", no podemos consolidar - retornar original
    if mark_col is None:
        return df_work

    # 2. Asignar "Mark" a filas vacías (forward fill)
    # Si una fila tiene "Mark" vacío, usar el valor de la fila anterior
    # Primero, normalizar valores vacíos a pd.NA
    df_work[mark_col] = df_work[mark_col].replace(['', 'nan', 'None', 'NaN', None], pd.NA)

    # Forward fill: propagar el valor de "Mark" hacia abajo hasta encontrar el siguiente valor
    df_work[mark_col] = df_work[mark_col].ffill()

    # 3. Convertir "Mark" a string para agrupar (manejar números y strings)
    # Esto permite agrupar correctamente incluso si hay valores numéricos y strings mezclados
    df_work['_group_id'] = df_work[mark_col].astype(str)

    # 4. Agrupar por "Mark" y consolidar
    consolidated_rows = []

    for group_id, group in df_work.groupby('_group_id'):
        group = group.copy()

        # La primera fila del grupo es la principal (tiene el Mark original)
        main_row = group.iloc[0].copy()

        # Obtener todas las filas del grupo (incluyendo la principal)
        all_rows = group.copy()

        # Contar número total de filas consolidadas (para la columna _rows_consolidated)
        total_rows_consolidated = len(all_rows)

        # 5. Para cada columna, consolidar valores si hay múltiples
        # EXCEPCIÓN: La columna "Mark" NO se consolida - se mantiene como valor único
        for col in df_work.columns:
            if col == '_group_id':
                continue

            # EXCLUIR "Mark" de la consolidación JSON
            # "Mark" debe mantenerse como valor único (no JSON) para permitir ordenamiento
            if col == mark_col:
                # Mantener solo el valor de la primera fila (ya está en main_row)
                # No hacer nada más - el valor ya está correcto
                continue

            # Obtener todos los valores no vacíos de esta columna en el grupo
            # Aceptar números y strings para no perder datos que vienen del Excel como número
            values = []
            for idx, row in all_rows.iterrows():
                val = row[col]
                if val is None or val == '':
                    continue
                if isinstance(val, (int, float)):
                    if pd.isna(val):
                        continue
                    val_str = str(int(val)) if isinstance(val, float) and val == int(val) else str(val)
                else:
                    val_str = str(val).strip()
                    if val_str.lower() in ('', 'nan', 'none', 'nonetype'):
                        continue
                values.append(val_str)

            # Si hay múltiples valores, consolidar en JSON array
            if len(values) > 1:
                # Si la fila principal tiene un valor, ponerlo primero para conservar orden
                main_val = main_row[col]
                main_val_str = None
                if main_val is not None and main_val != '':
                    if isinstance(main_val, (int, float)) and not pd.isna(main_val):
                        main_val_str = str(int(main_val)) if isinstance(main_val, float) and main_val == int(main_val) else str(main_val)
                    else:
                        s = str(main_val).strip()
                        if s.lower() not in ('', 'nan', 'none'):
                            main_val_str = s
                if main_val_str:
                    if main_val_str in values:
                        values.remove(main_val_str)
                        values.insert(0, main_val_str)
                    else:
                        values.insert(0, main_val_str)
                main_row[col] = json.dumps(values, ensure_ascii=False)
            elif len(values) == 1:
                # Solo un valor, mantenerlo como está
                main_row[col] = values[0]
            # Si no hay valores, mantener el valor original (puede ser vacío)

        # Añadir columna con el número de filas consolidadas
        main_row['_rows_consolidated'] = total_rows_consolidated

        # Eliminar columna temporal
        main_row = main_row.drop(['_group_id'])

        consolidated_rows.append(main_row)

    # 6. Crear nuevo DataFrame consolidado
    if consolidated_rows:
        df_consolidated = pd.DataFrame(consolidated_rows)
        df_consolidated = df_consolidated.reset_index(drop=True)
        return df_consolidated
    else:
        return df_work


def _detect_delimiter(sample: str) -> str:
    """
    Detecta el delimitador más probable en un fragmento de texto.
    Revisa tabulaciones, punto y coma, coma y barra vertical.
    """
    candidates = ['\t', ';', ',', '|']
    counts = {delimiter: sample.count(delimiter) for delimiter in candidates}
    # Si todos son cero, usar coma por defecto
    delimiter, max_count = max(counts.items(), key=lambda item: item[1])
    if max_count == 0:
        return ','
    return delimiter


def _read_text_table(buffer: io.BytesIO, encoding: str = "utf-8") -> pd.DataFrame:
    """
    Lee un archivo de texto tabular detectando automáticamente el delimitador.
    """
    # Guardar posición actual para restaurar después
    buffer.seek(0)
    raw_bytes = buffer.read()

    # Intentar decodificar con encoding indicado, fallback a latin-1
    try:
        text_content = raw_bytes.decode(encoding)
    except UnicodeDecodeError:
        text_content = raw_bytes.decode("latin-1")

    # Eliminar bytes nulos que causan error en pd.read_csv
    text_content = text_content.replace('\x00', '')

    # Detectar delimitador usando las primeras líneas
    sample = "\n".join(text_content.splitlines()[:10])
    delimiter = _detect_delimiter(sample)

    buffer.seek(0)
    df = pd.read_csv(
        io.StringIO(text_content),
        sep=delimiter,
        engine="c",
        dtype=object,
    )
    df = df.fillna('')
    return df


def normalize_sabi_data(uploaded_file: Union[io.BytesIO, Path, str]) -> pd.DataFrame:
    """
    Normaliza datos de SABI al formato interno.

    Args:
        uploaded_file: Archivo subido (BytesIO), Path o string con ruta

    Returns:
        DataFrame normalizado con columnas de sistema añadidas

    Raises:
        ValueError: Si el archivo no se puede leer o no tiene formato válido
    """
    # Leer archivo según el tipo
    if isinstance(uploaded_file, io.BytesIO):
        # Archivo subido desde Streamlit
        file_extension = uploaded_file.name.split('.')[-1].lower() if hasattr(uploaded_file, 'name') else 'xlsx'

        if file_extension in ['xlsx', 'xls']:
            # Leer sin inferir tipos agresivamente para no perder valores (evitar NaN en celdas con formato)
            df = pd.read_excel(uploaded_file, engine='openpyxl', dtype=object)
            df = df.fillna('')  # Unificar vacíos como string vacío antes de consolidar
        elif file_extension == 'csv':
            df = pd.read_csv(uploaded_file, encoding='utf-8', sep=',')
            df = df.fillna('')  # Unificar vacíos como string vacío (igual que Excel)
        elif file_extension == 'txt':
            df = _read_text_table(uploaded_file)
        else:
            raise ValueError(f"Formato de archivo no soportado: {file_extension}")

    elif isinstance(uploaded_file, (Path, str)):
        # Archivo desde ruta
        file_path = Path(uploaded_file)
        if not file_path.exists():
            raise FileNotFoundError(f"Archivo no encontrado: {file_path}")

        if file_path.suffix.lower() in ['.xlsx', '.xls']:
            df = pd.read_excel(file_path, engine='openpyxl', dtype=object)
            df = df.fillna('')
        elif file_path.suffix.lower() == '.csv':
            df = pd.read_csv(file_path, encoding='utf-8', sep=',')
            df = df.fillna('')  # Unificar vacíos como string vacío (igual que Excel)
        elif file_path.suffix.lower() == '.txt':
            with open(file_path, 'rb') as f:
                buffer = io.BytesIO(f.read())
            df = _read_text_table(buffer)
        else:
            raise ValueError(f"Formato de archivo no soportado: {file_path.suffix}")
    else:
        raise ValueError(f"Tipo de archivo no soportado: {type(uploaded_file)}")

    if df.empty:
        raise ValueError("El archivo está vacío")

    # Eliminar filas completamente vacías (todas las celdas vacías o NaN)
    df = df.dropna(how='all')
    df = df[~df.apply(lambda row: row.astype(str).str.strip().eq('').all(), axis=1)]
    df = df.reset_index(drop=True)

    if df.empty:
        raise ValueError("El archivo está vacío (solo contenía líneas en blanco)")

    # MANTENER NOMBRES ORIGINALES DE COLUMNAS (según requerimiento del usuario)
    # No normalizamos ni mapeamos columnas, trabajamos directamente con nombres originales

    # Manejar columnas duplicadas (renombrar con sufijo numérico si es necesario)
    if df.columns.duplicated().any():
        cols = pd.Series(df.columns)
        for dup in cols[cols.duplicated()].unique():
            dup_indices = cols[cols == dup].index.values.tolist()
            cols[dup_indices] = [
                dup if idx == 0 else f"{dup}_{idx}"
                for idx in range(len(dup_indices))
            ]
        df.columns = cols

    # ========================================================================
    # CONSOLIDACIÓN DE DATOS JERÁRQUICOS (TICKET-08)
    # ========================================================================
    # Antes de convertir a string, consolidar múltiples filas por empresa
    # Esto agrupa datos de accionistas, participadas, etc. en arrays JSON
    df = consolidate_sabi_hierarchical_data(df)

    # Asegurar que las columnas numéricas sean del tipo correcto
    # Buscar columnas numéricas por nombre original (sin mapeo)
    # Intentar convertir columnas que parezcan numéricas (revenue, ebitda, etc.)
    for col in df.columns:
        if col in ['_uid', '_list_id', '_is_main_row', '_company_id']:
            continue
        col_lower = col.lower()
        # Identificar columnas que probablemente sean numéricas
        if any(keyword in col_lower for keyword in ['revenue', 'ebitda', 'income', 'empleados', 'employees', 'facturación', 'facturacion', 'ingresos', 'resultado']):
            try:
                # Intentar convertir a numérico
                df.loc[:, col] = pd.to_numeric(df.loc[:, col], errors='ignore')
            except (TypeError, ValueError):
                # Si falla, intentar elemento por elemento
                try:
                    df[col] = df[col].apply(lambda x: pd.to_numeric(x, errors='ignore') if pd.notna(x) else x)
                except:
                    pass  # Si todo falla, dejar la columna como está

    # Añadir columnas de sistema (_uid, _list_id)
    df = add_system_columns(df)

    # CONVERSIÓN FINAL: Convertir TODAS las columnas (excepto sistema y Mark) a string
    # Esto evita problemas con tipos mixtos en Parquet
    # IMPORTANTE: "Mark" se mantiene como numérico para permitir ordenamiento correcto
    mark_col_final = None
    for col in df.columns:
        if col.strip().lower() == 'mark':
            mark_col_final = col
            break

    for col in df.columns:
        if col not in ['_uid', '_list_id']:
            # EXCEPCIÓN: Mantener "Mark" como numérico para ordenamiento correcto
            if col == mark_col_final:
                # Convertir "Mark" a numérico si es posible
                try:
                    df[col] = pd.to_numeric(df[col], errors='coerce')
                except:
                    pass
                continue

            # Convertir a string: evitar "1801.0" cuando es entero; vacíos como ''
            def _to_display_str(x):
                if x is None or (isinstance(x, float) and pd.isna(x)):
                    return ''
                if isinstance(x, float) and x == int(x):
                    return str(int(x))
                return str(x).strip() if pd.notna(x) else ''

            df[col] = df[col].apply(_to_display_str)
            df[col] = df[col].astype(str)

    return df


def detect_sabi_columns(df: pd.DataFrame) -> dict:
    """
    Detecta qué columnas del DataFrame coinciden con el mapeo SABI.

    Args:
        df: DataFrame a analizar

    Returns:
        Diccionario con columnas detectadas y su mapeo
    """
    detected = {}
    df_normalized = normalize_column_names(df.copy())

    for sabi_col in df_normalized.columns:
        sabi_col_lower = sabi_col.lower().strip()

        for sabi_key, internal_name in SABI_COLUMN_MAPPING.items():
            if sabi_key in sabi_col_lower or sabi_col_lower in sabi_key:
                detected[sabi_col] = {
                    'original': sabi_col,
                    'mapped_to': internal_name,
                    'confidence': 'high' if sabi_key == sabi_col_lower else 'medium'
                }
                break

    return detected
