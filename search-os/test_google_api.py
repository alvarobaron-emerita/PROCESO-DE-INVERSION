"""
Script de prueba para verificar la API key de Google Gemini
"""
import os
from dotenv import load_dotenv
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent
load_dotenv(PROJECT_ROOT / ".env")

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")

if not GOOGLE_API_KEY:
    print("❌ GOOGLE_API_KEY no encontrada")
    exit(1)

print(f"✅ API Key encontrada: {GOOGLE_API_KEY[:10]}...{GOOGLE_API_KEY[-5:]}")
print(f"🔍 Longitud: {len(GOOGLE_API_KEY)} caracteres")

# Probar directamente con google.generativeai
try:
    import google.generativeai as genai
    genai.configure(api_key=GOOGLE_API_KEY)

    # Listar modelos disponibles
    print("\n🔍 Listando modelos disponibles...")
    models = genai.list_models()
    available_models = []
    for model in models:
        if 'generateContent' in model.supported_generation_methods:
            available_models.append(model.name)
            print(f"  ✅ {model.name}")

    if not available_models:
        print("  ⚠️ No se encontraron modelos con 'generateContent'")
    else:
        print(f"\n📊 Total de modelos disponibles: {len(available_models)}")

    # Probar con diferentes nombres de modelo
    test_models = ['gemini-pro', 'gemini-1.5-pro', 'gemini-1.5-pro-latest', 'models/gemini-pro']

    print("\n🧪 Probando diferentes nombres de modelo...")
    for model_name in test_models:
        try:
            print(f"\n  Probando: {model_name}")
            model = genai.GenerativeModel(model_name)
            response = model.generate_content("Di 'Hola' en una palabra")
            print(f"  ✅ {model_name} funciona! Respuesta: {response.text}")
            break
        except Exception as e:
            print(f"  ❌ {model_name} falló: {str(e)[:100]}")

except ImportError as e:
    print(f"❌ Error: No se pudo importar google.generativeai")
    print(f"   Instala con: pip install google-generativeai")
    import traceback
    traceback.print_exc()
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
