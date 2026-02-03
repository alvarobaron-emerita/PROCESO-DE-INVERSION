# Instrucciones para Extraer Texto de los PDFs

## Opción 1: Ejecutar el Script Localmente (Recomendado)

1. **Instala PyPDF2:**
   ```bash
   cd search-os
   pip install PyPDF2
   # O si tienes problemas:
   python3 -m pip install PyPDF2
   ```

2. **Ejecuta el script:**
   ```bash
   python extract_pdfs.py
   # O:
   python3 extract_pdfs.py
   ```

3. **Los archivos extraídos estarán en:**
   ```
   search-os/docs/extracted/
   ├── tool1_extracted.txt
   ├── tool2_extracted.txt
   └── roadmap_extracted.txt
   ```

## Opción 2: Usar una Herramienta Online

Si tienes problemas instalando PyPDF2, puedes usar herramientas online como:
- https://www.ilovepdf.com/pdf-to-txt
- https://smallpdf.com/pdf-to-txt
- https://www.adobe.com/acrobat/online/pdf-to-txt.html

Sube cada PDF y descarga el texto. Luego guárdalos en `search-os/docs/extracted/` con los nombres:
- `tool1_extracted.txt`
- `tool2_extracted.txt`
- `roadmap_extracted.txt`

## Opción 3: Usar Python con Entorno Virtual

```bash
cd search-os
python3 -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate
pip install PyPDF2
python extract_pdfs.py
```

## Una vez extraídos

Una vez que tengas los archivos `.txt` en `search-os/docs/extracted/`, avísame y procederé a:
1. Analizar el contenido
2. Crear la arquitectura técnica detallada
3. Implementar las herramientas según tus reglas de oro
