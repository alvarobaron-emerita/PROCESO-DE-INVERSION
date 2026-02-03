const DEFAULT_FASTAPI_URL = "http://localhost:8000";

/**
 * Configuración de la URL base del backend FastAPI.
 * Nunca devuelve cadena vacía: si no hay config, usa http://localhost:8000.
 */
export function getFastApiBaseUrl(): string {
  // En el cliente (navegador), usar import.meta.env
  if (typeof window !== "undefined") {
    const envUrl =
      typeof import.meta !== "undefined" &&
      (import.meta as { env?: Record<string, string> }).env?.VITE_FASTAPI_BASE_URL;
    if (envUrl && envUrl.trim()) {
      return envUrl.trim();
    }
    return DEFAULT_FASTAPI_URL;
  }
  // En el servidor, usar process.env
  const url = process.env.FASTAPI_BASE_URL || DEFAULT_FASTAPI_URL;
  return url.trim() || DEFAULT_FASTAPI_URL;
}

export const FASTAPI_BASE_URL = getFastApiBaseUrl();
