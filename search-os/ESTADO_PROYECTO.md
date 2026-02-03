# Estado del Proyecto - Search OS

## 📋 Fase Actual: Análisis de Documentación

**Estado:** Esperando extracción de PDFs

### Archivos Pendientes de Análisis

Una vez que ejecutes `extract_pdfs.py`, deberíamos tener:

```
search-os/docs/extracted/
├── tool1_extracted.txt      ← Tool 1: Discovery Engine
├── tool2_extracted.txt      ← Tool 2: Data Viewer
└── roadmap_extracted.txt    ← Arquitectura de Datos
```

### Próximos Pasos

1. ✅ **Estructura de carpetas creada**
2. ✅ **Script de extracción preparado**
3. ⏳ **Extraer PDFs** (pendiente - ejecutar `extract_pdfs.py`)
4. ⏳ **Analizar contenido** (lógica de negocio, flujos funcionales)
5. ⏳ **Definir arquitectura técnica** (basada en ROADMAP)
6. ⏳ **Extraer reglas del Manifiesto** (Hard Constraints)
7. ⏳ **Implementar Tool 2** (Data Viewer con AgGrid virtualizado)
8. ⏳ **Implementar Tool 1** (Discovery Engine con reglas)
9. ⏳ **Sistema de gestión del Manifiesto** (actualización desde UI)

## 🎯 Reglas de Oro del Proyecto

1. **Fuente de la Verdad**: Usar PDFs solo para lógica de negocio, ignorar código obsoleto
2. **Arquitectura de Datos**: Archivos .parquet locales (no SQL)
3. **Rendimiento Crítico**: AgGrid con virtualización para CSVs pesados (4MB+)
4. **Cerebro de Inversión**: Reglas de filtrado del Manifiesto como Hard Constraints

## 📁 Estructura Actual

```
search-os/
├── docs/
│   ├── Tool_1_Discovery.pdf
│   ├── Tool_2_DataViewer.pdf
│   ├── ROADMAP_DESARROLLO.pdf
│   └── extracted/              ← Aquí irán los .txt extraídos
├── src/
│   ├── tool_1_discovery/
│   ├── tool_2_dataviewer/
│   ├── shared/
│   └── main.py
├── data/
│   ├── raw/                    ← CSVs originales
│   ├── processed/              ← Parquets procesados
│   └── cache/                  ← Cache temporal
├── extract_pdfs.py             ← Script de extracción
├── requirements.txt
└── README.md
```

## 🔄 Cuando Tengas los PDFs Extraídos

1. Avísame cuando los archivos `.txt` estén en `docs/extracted/`
2. Analizaré el contenido completo
3. Crearemos el plan de implementación detallado
4. Empezaremos a desarrollar siguiendo las reglas de oro

---

**Última actualización:** Esperando extracción de PDFs
