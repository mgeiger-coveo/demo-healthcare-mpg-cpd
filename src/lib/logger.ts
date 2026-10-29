/* eslint-disable no-console */
const DEBUG_ENABLED =
  typeof window !== "undefined" &&
  (window.localStorage?.getItem("debug") === "true" ||
    process.env.NODE_ENV === "development");

export function logDebug(message: string, data?: unknown): void {
  if (!DEBUG_ENABLED) return;
  console.debug(`[DEBUG] ${message}`, data ?? "");
}

export function logInfo(message: string, data?: unknown): void {
  console.info(`[INFO] ${message}`, data ?? "");
}

export function logWarn(message: string, data?: unknown): void {
  console.warn(`[WARN] ${message}`, data ?? "");
}

export function logError(message: string, data?: unknown): void {
  console.error(`[ERROR] ${message}`, data ?? "");
}
