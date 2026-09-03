export function socketPayload<T>(raw: unknown): T | null {
  if (raw == null) return null;
  if (typeof raw !== "object") return null;
  const obj = raw as { payload?: T };
  if ("payload" in obj && obj.payload != null) return obj.payload;
  return raw as T;
}
