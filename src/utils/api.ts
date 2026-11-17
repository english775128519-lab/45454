export function apiUrl(path: string): string {
  const base = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/+$/, '') || '';
  return `${base}${path}`;
}

export function isNativeCapacitorApp(): boolean {
  if (typeof window === 'undefined') return false;
  const w = window as unknown as {
    Capacitor?: { isNativePlatform?: () => boolean };
  };
  return Boolean(
    w.Capacitor?.isNativePlatform?.() ||
      window.location.protocol === 'capacitor:' ||
      window.location.protocol === 'file:'
  );
}

export function shouldUseOfflineApiFallback(): boolean {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return true;
  }
  const hasRemoteApiBase = Boolean(
    (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim()
  );
  if (isNativeCapacitorApp() && !hasRemoteApiBase) {
    return true;
  }
  return false;
}

export async function postApiJson<T>(path: string, payload: unknown): Promise<T> {
  if (shouldUseOfflineApiFallback()) {
    throw new Error('Offline mode');
  }
  const res = await fetch(apiUrl(path), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const contentType = res.headers.get('content-type') || '';
  if (!res.ok || !contentType.includes('application/json')) {
    throw new Error('Server unavailable');
  }
  return (await res.json()) as T;
}
