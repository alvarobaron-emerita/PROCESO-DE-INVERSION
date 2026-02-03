"""
Configuración global del proyecto
"""
import os
from pathlib import Path
from dotenv import load_dotenv

# Rutas base
PROJECT_ROOT = Path(__file__).parent.parent.parent

# Cargar variables de entorno desde el directorio del proyecto
env_path = PROJECT_ROOT / ".env"

# Debug: Verificar si el archivo existe
print(f"🔍 Buscando .env en: {env_path}")
print(f"🔍 Archivo existe: {env_path.exists()}")

# Intentar cargar el archivo
if env_path.exists():
    result = load_dotenv(dotenv_path=env_path, override=True)
    print(f"🔍 load_dotenv resultado: {result}")

    # Leer directamente el archivo para debug
    try:
        with open(env_path, 'r') as f:
            lines = f.readlines()
            google_line = [l for l in lines if 'GOOGLE_API_KEY' in l and not l.strip().startswith('#')]
            if google_line:
                # Mostrar solo los primeros y últimos caracteres de la línea
                line_preview = google_line[0].strip()[:20] + "..." + google_line[0].strip()[-10:] if len(google_line[0].strip()) > 30 else google_line[0].strip()
                print(f"🔍 Línea GOOGLE_API_KEY en .env: {line_preview}")
    except Exception as e:
        print(f"⚠️ Error leyendo .env: {e}")
else:
    print(f"⚠️ Archivo .env NO encontrado en: {env_path}")
    # Intentar cargar sin ruta específica (buscará en el directorio actual)
    load_dotenv(override=True)

DATA_DIR = PROJECT_ROOT / "data"
RAW_DATA_DIR = DATA_DIR / "raw"
PROCESSED_DATA_DIR = DATA_DIR / "processed"
CACHE_DIR = DATA_DIR / "cache"

# Asegurar que las carpetas existen
DATA_DIR.mkdir(exist_ok=True)
RAW_DATA_DIR.mkdir(exist_ok=True)
PROCESSED_DATA_DIR.mkdir(exist_ok=True)
CACHE_DIR.mkdir(exist_ok=True)

# API Keys
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
DEEPINFRA_API_KEY = os.getenv("DEEPINFRA_API_KEY", "")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")
TAVILY_API_KEY = os.getenv("TAVILY_API_KEY", "")

# Debug temporal: Verificar que la API key se carga (solo los primeros y últimos caracteres)
if GOOGLE_API_KEY:
    masked_key = f"{GOOGLE_API_KEY[:10]}...{GOOGLE_API_KEY[-5:]}" if len(GOOGLE_API_KEY) > 15 else "***"
    print(f"✅ GOOGLE_API_KEY cargada: {masked_key}")
    print(f"🔍 Longitud de la key: {len(GOOGLE_API_KEY)} caracteres")
else:
    print("⚠️ GOOGLE_API_KEY NO encontrada en variables de entorno")

# Configuración
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
