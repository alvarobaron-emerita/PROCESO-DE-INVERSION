"""
Script de prueba para verificar que el Data Manager funciona correctamente
Ejecutar después de instalar dependencias: python test_data_manager.py
"""
import sys
from pathlib import Path

# Añadir src al path
sys.path.insert(0, str(Path(__file__).parent / "src"))

from shared import data_manager
import pandas as pd


def test_data_manager():
    """Prueba básica del Data Manager"""
    print("🧪 Probando Data Manager...")

    # Test 1: Crear proyecto
    print("\n1. Creando proyecto de prueba...")
    project_id = data_manager.create_project("Test Sector")
    print(f"   ✓ Proyecto creado: {project_id}")

    # Test 2: Verificar que existe
    assert data_manager.project_exists(project_id), "Proyecto no existe"
    print(f"   ✓ Proyecto existe: {project_id}")

    # Test 3: Cargar schema
    print("\n2. Cargando schema...")
    schema = data_manager.load_schema(project_id)
    assert 'lists' in schema, "Schema inválido"
    print(f"   ✓ Schema cargado: {len(schema['lists'])} listas")

    # Test 4: Crear DataFrame de prueba
    print("\n3. Creando DataFrame de prueba...")
    test_data = {
        'name': ['Empresa A', 'Empresa B', 'Empresa C'],
        'revenue': [1000000, 2000000, 1500000],
        'ebitda': [150000, 300000, 225000]
    }
    df = pd.DataFrame(test_data)

    # Añadir columnas de sistema
    from shared.parquet_manager import add_system_columns
    df = add_system_columns(df)

    print(f"   ✓ DataFrame creado: {len(df)} filas")
    print(f"   ✓ Columnas de sistema: {df.columns[df.columns.str.startswith('_')].tolist()}")

    # Test 5: Guardar master_data
    print("\n4. Guardando master_data...")
    data_manager.save_master_data(project_id, df)
    print(f"   ✓ master_data.parquet guardado")

    # Test 6: Cargar master_data
    print("\n5. Cargando master_data...")
    df_loaded = data_manager.load_master_data(project_id)
    assert len(df_loaded) == len(df), "Número de filas no coincide"
    assert '_uid' in df_loaded.columns, "Columna _uid no encontrada"
    assert '_list_id' in df_loaded.columns, "Columna _list_id no encontrada"
    print(f"   ✓ master_data.parquet cargado: {len(df_loaded)} filas")

    # Test 7: Listar proyectos
    print("\n6. Listando proyectos...")
    projects = data_manager.list_projects()
    assert project_id in projects, "Proyecto no aparece en lista"
    print(f"   ✓ Proyectos encontrados: {len(projects)}")

    # Test 8: Actualizar schema
    print("\n7. Actualizando schema...")
    schema['lists'].append({"id": "watchlist", "name": "👀 Watchlist"})
    data_manager.update_schema(project_id, schema)
    schema_updated = data_manager.load_schema(project_id)
    assert len(schema_updated['lists']) == 4, "Schema no actualizado"
    print(f"   ✓ Schema actualizado: {len(schema_updated['lists'])} listas")

    # Test 9: Limpiar (opcional - comentar si quieres mantener el proyecto)
    print("\n8. Limpiando proyecto de prueba...")
    data_manager.delete_project(project_id)
    assert not data_manager.project_exists(project_id), "Proyecto no eliminado"
    print(f"   ✓ Proyecto eliminado")

    print("\n✅ Todos los tests pasaron correctamente!")
    print("\n📝 El Data Manager está funcionando correctamente.")
    return True


if __name__ == "__main__":
    try:
        test_data_manager()
    except Exception as e:
        print(f"\n❌ Error en test: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
