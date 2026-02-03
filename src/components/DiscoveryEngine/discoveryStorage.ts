/**
 * Persistencia de análisis del Discovery Engine en localStorage.
 * Lista de análisis guardados para poder reabrir y ver el reporte.
 */

import type { SavedAnalysis } from "./types";

const DISCOVERY_ANALYSES_KEY = "discovery_saved_analyses";

function loadAnalyses(): SavedAnalysis[] {
  try {
    const raw = localStorage.getItem(DISCOVERY_ANALYSES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed as SavedAnalysis[];
  } catch {
    return [];
  }
}

function saveAnalysesList(list: SavedAnalysis[]): void {
  try {
    localStorage.setItem(DISCOVERY_ANALYSES_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn("discoveryStorage: no se pudo guardar la lista de análisis", e);
  }
}

/** Devuelve todos los análisis guardados, más recientes primero */
export function getAnalyses(): SavedAnalysis[] {
  const list = loadAnalyses();
  return list.slice().sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
}

/** Añade un análisis al final de la lista y lo persiste */
export function saveAnalysis(analysis: SavedAnalysis): void {
  const list = loadAnalyses();
  list.unshift(analysis);
  saveAnalysesList(list);
}

/** Busca un análisis por id */
export function getAnalysisById(id: string): SavedAnalysis | null {
  const list = loadAnalyses();
  return list.find((a) => a.id === id) ?? null;
}

/** Actualiza un análisis existente por id (merge parcial) y persiste */
export function updateAnalysis(id: string, updates: Partial<SavedAnalysis>): void {
  const list = loadAnalyses();
  const idx = list.findIndex((a) => a.id === id);
  if (idx < 0) return;
  list[idx] = { ...list[idx], ...updates };
  saveAnalysesList(list);
}

/** Elimina un análisis por id */
export function deleteAnalysis(id: string): void {
  const list = loadAnalyses().filter((a) => a.id !== id);
  saveAnalysesList(list);
}

/** Nombre del evento que se dispara cuando la lista de análisis cambia (para refrescar sidebar) */
export const DISCOVERY_ANALYSES_CHANGED = "discovery-analyses-changed";

/** Notifica que la lista de análisis ha cambiado (ej. tras guardar). El sidebar puede escuchar para refrescar. */
export function notifyAnalysesChanged(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(DISCOVERY_ANALYSES_CHANGED));
  }
}
