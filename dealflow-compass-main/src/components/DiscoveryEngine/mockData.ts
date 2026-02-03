import { AnalysisReport } from "./types";

export const generateMockReport = (sector: string): AnalysisReport => {
  const isHighMargin = Math.random() > 0.3;
  
  return {
    verdict: isHighMargin ? "green" : Math.random() > 0.5 ? "amber" : "red",
    verdictText: isHighMargin 
      ? "Sector atractivo con márgenes saludables y fragmentación favorable para consolidación."
      : "Sector con márgenes ajustados. Requiere análisis adicional de nichos específicos.",
    cnaeClassification: [
      "4631 - Comercio al por mayor de frutas y hortalizas",
      "4634 - Comercio al por mayor de bebidas",
      "1102 - Elaboración de vinos",
    ],
    marketSize: "€4.2B",
    leaderShare: "12%",
    ebitdaMargin: isHighMargin ? "18.5%" : "11.2%",
    grossMargin: isHighMargin ? "42%" : "28%",
    cashConversion: isHighMargin ? "85%" : "62%",
    searchSignals: [
      "Bodegas familiares con facturación €5-20M",
      "Distribuidores regionales con marca propia",
      "Cooperativas con proceso de profesionalización",
      "Empresas con sucesión generacional pendiente",
    ],
    targetCompanies: [
      "Bodegas Familia Martínez",
      "Distribuciones Viña del Sur",
      "Cooperativa Vitivinícola del Norte",
      "Grupo Enológico Peninsular",
    ],
  };
};

export const generateMarkdownReport = (sector: string, report: AnalysisReport): string => {
  const verdictEmoji = report.verdict === "green" ? "🟢" : report.verdict === "amber" ? "🟡" : "🔴";
  const verdictLabel = report.verdict === "green" ? "ATRACTIVO" : report.verdict === "amber" ? "MODERADO" : "PRECAUCIÓN";
  
  return `# Análisis de Inversión: ${sector}

## ${verdictEmoji} Veredicto: ${verdictLabel}

${report.verdictText}

---

## 📊 Clasificación CNAE

${report.cnaeClassification.map(c => `- \`${c}\``).join("\n")}

---

## 📈 Dimensionamiento del Mercado

| Métrica | Valor |
|---------|-------|
| **Tamaño de Mercado** | ${report.marketSize} |
| **Cuota del Líder** | ${report.leaderShare} |
| **Fragmentación** | ${parseInt(report.leaderShare) < 15 ? "Alta ✓" : "Moderada"} |

---

## 💰 Métricas Financieras Clave

| Indicador | Valor | Benchmark |
|-----------|-------|-----------|
| **Margen EBITDA** | ${report.ebitdaMargin} | ${parseFloat(report.ebitdaMargin) >= 15 ? "✓ Supera 15%" : "⚠️ Por debajo de 15%"} |
| **Margen Bruto** | ${report.grossMargin} | ${parseFloat(report.grossMargin) >= 35 ? "✓ Saludable" : "⚠️ Ajustado"} |
| **Conversión de Caja** | ${report.cashConversion} | ${parseFloat(report.cashConversion) >= 70 ? "✓ Excelente" : "○ Aceptable"} |

---

## 🎯 Señales de Búsqueda Recomendadas

${report.searchSignals.map((s, i) => `${i + 1}. ${s}`).join("\n")}

---

## 🏢 Empresas Objetivo Identificadas

${report.targetCompanies.map(c => `- **${c}**`).join("\n")}

---

## 📋 Próximos Pasos

1. Validar hipótesis con datos financieros detallados
2. Identificar 20-30 empresas adicionales en el nicho
3. Priorizar por criterios de sucesión y tamaño
4. Iniciar proceso de contacto con intermediarios

---

*Informe generado por Discovery Engine • Tesis Emerita*
`;
};
