"""
Script para extraer texto de los PDFs
Instrucciones:
1. Instala las dependencias: pip install PyPDF2
2. Ejecuta: python extract_pdfs.py
"""
from pathlib import Path

# Intentar importar PyPDF2, si no está disponible, sugerir instalación
try:
    import PyPDF2
except ImportError:
    print("❌ PyPDF2 no está instalado.")
    print("📦 Instala con: pip install PyPDF2")
    print("   O con: python3 -m pip install PyPDF2")
    exit(1)

docs_dir = Path(__file__).parent / "docs"
output_dir = Path(__file__).parent / "docs" / "extracted"

output_dir.mkdir(exist_ok=True)

pdfs = {
    "tool1": "Tool_1_Discovery.pdf",
    "tool2": "Tool_2_DataViewer.pdf",
    "roadmap": "ROADMAP_DESARROLLO.pdf"
}

print("🔍 Iniciando extracción de PDFs...\n")

for key, filename in pdfs.items():
    pdf_path = docs_dir / filename
    if pdf_path.exists():
        print(f"📄 Extrayendo {filename}...")
        text_content = []

        try:
            with open(pdf_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                total_pages = len(pdf_reader.pages)
                print(f"   Total de páginas: {total_pages}")

                for page_num, page in enumerate(pdf_reader.pages):
                    text = page.extract_text()
                    if text.strip():  # Solo agregar si hay texto
                        text_content.append(f"=== Página {page_num + 1} ===\n{text}\n")
                    if (page_num + 1) % 10 == 0:
                        print(f"   Procesadas {page_num + 1}/{total_pages} páginas...")

            if text_content:
                output_file = output_dir / f"{key}_extracted.txt"
                with open(output_file, 'w', encoding='utf-8') as f:
                    f.write('\n'.join(text_content))

                print(f"   ✅ Extraído: {output_file} ({len(text_content)} páginas con contenido)\n")
            else:
                print(f"   ⚠️  No se pudo extraer texto de {filename}\n")
        except Exception as e:
            print(f"   ❌ Error extrayendo {filename}: {e}\n")
    else:
        print(f"   ❌ No encontrado: {filename}\n")

print("✅ Extracción completada!")
print(f"📁 Archivos guardados en: {output_dir}")
