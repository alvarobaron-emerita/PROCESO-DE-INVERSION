import { AnalysisReport } from "./types";

export const generateMockReport = (sector: string): AnalysisReport => {
  const isHighMargin = Math.random() > 0.3;

  return {
    sector,
    verdict: isHighMargin
      ? "green"
      : Math.random() > 0.5
      ? "amber"
      : "red",
    ebitdaMargin: isHighMargin ? "18.5%" : "11.2%",
    grossMargin: isHighMargin ? "42%" : "28%",
    targetCompanies: [
      { name: "Bodegas Familia Martínez", revenue: "€12.5M" },
      { name: "Distribuciones Viña del Sur", revenue: "€8.2M" },
      { name: "Cooperativa Vitivinícola del Norte", revenue: "€15.1M" },
      { name: "Grupo Enológico Peninsular", revenue: "€9.8M" },
    ],
  };
};

export const generateMarkdownReport = (
  sector: string,
  report: AnalysisReport
): string => {
  const verdictEmoji =
    report.verdict === "green"
      ? "🟢"
      : report.verdict === "amber"
      ? "🟡"
      : "🔴";
  const verdictLabel =
    report.verdict === "green"
      ? "ATRACTIVO"
      : report.verdict === "amber"
      ? "MODERADO"
      : "PRECAUCIÓN";

  return `# Análisis de Inversión: ${sector}

## ${verdictEmoji} Veredicto: ${verdictLabel}

${
  report.verdict === "green"
    ? "Sector atractivo con márgenes saludables y fragmentación favorable para consolidación."
    : "Sector con márgenes ajustados. Requiere análisis adicional de nichos específicos."
}

---

## 📊 Clasificación CNAE

- \`4631 - Comercio al por mayor de frutas y hortalizas\`
- \`4634 - Comercio al por mayor de bebidas\`
- \`1102 - Elaboración de vinos\`

---

## 📈 Dimensionamiento del Mercado

| Métrica | Valor |
|---------|-------|
| **Tamaño de Mercado** | €4.2B |
| **Cuota del Líder** | 12% |
| **Fragmentación** | Alta ✓ |

---

## 💰 Métricas Financieras Clave

| Indicador | Valor | Benchmark |
|-----------|-------|-----------|
| **Margen EBITDA** | ${report.ebitdaMargin} | ${
    parseFloat(report.ebitdaMargin) >= 15
      ? "✓ Supera 15%"
      : "⚠️ Por debajo de 15%"
  } |
| **Margen Bruto** | ${report.grossMargin} | ${
    parseFloat(report.grossMargin) >= 35 ? "✓ Saludable" : "⚠️ Ajustado"
  } |

---

## 🎯 Señales de Búsqueda Recomendadas

1. Bodegas familiares con facturación €5-20M
2. Distribuidores regionales con marca propia
3. Cooperativas con proceso de profesionalización
4. Empresas con sucesión generacional pendiente

---

## 🏢 Empresas Objetivo Identificadas

${report.targetCompanies.map((c) => `- **${c.name}** - ${c.revenue}`).join("\n")}

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
