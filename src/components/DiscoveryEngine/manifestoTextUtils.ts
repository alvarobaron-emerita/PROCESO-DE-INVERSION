/**
 * Convierte entre el objeto "Tesis Emerita" (JSON) y un texto plano editable.
 * Formato: líneas "CLAVE: valor" y para listas (DEAL_KILLERS, VALUE_LEVERS)
 * una línea "CLAVE:" seguida de líneas "- elemento".
 */

export interface EmeritaThesisObject {
  TARGET_GEO?: string;
  TARGET_SIZE?: string;
  TARGET_MARGINS?: string;
  DEAL_KILLERS?: string[];
  VALUE_LEVERS?: string[];
  [k: string]: unknown;
}

const ARRAY_KEYS = new Set(["DEAL_KILLERS", "VALUE_LEVERS"]);
const SCALAR_KEYS = ["TARGET_GEO", "TARGET_SIZE", "TARGET_MARGINS"];

/** Convierte el objeto tesis a texto plano para editar */
export function thesisToManifestoText(thesis: EmeritaThesisObject): string {
  const lines: string[] = [];

  for (const key of SCALAR_KEYS) {
    const val = thesis[key];
    if (val != null && typeof val === "string") {
      lines.push(`${key}: ${val.trim()}`);
    }
  }

  for (const key of ARRAY_KEYS) {
    const arr = thesis[key];
    if (Array.isArray(arr) && arr.length > 0) {
      lines.push(`${key}:`);
      for (const item of arr) {
        lines.push(`- ${typeof item === "string" ? item.trim() : String(item)}`);
      }
    } else {
      lines.push(`${key}:`);
    }
  }

  return lines.join("\n");
}

/** Parsea el texto plano al objeto tesis. */
export function manifestoTextToThesis(text: string): EmeritaThesisObject {
  const result: EmeritaThesisObject = {};
  const lines = text.split(/\r?\n/).map((l) => l.trimEnd());
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (line === "") {
      i++;
      continue;
    }

    const colonIdx = line.indexOf(":");
    if (colonIdx <= 0) {
      i++;
      continue;
    }

    const key = line.slice(0, colonIdx).trim();
    const value = line.slice(colonIdx + 1).trim();

    if (ARRAY_KEYS.has(key)) {
      const arr: string[] = [];
      if (value) {
        arr.push(value);
      }
      i++;
      while (i < lines.length && lines[i].startsWith("- ")) {
        arr.push(lines[i].slice(2).trim());
        i++;
      }
      result[key as keyof EmeritaThesisObject] = arr;
    } else {
      result[key as keyof EmeritaThesisObject] = value;
      i++;
    }
  }

  return result;
}
