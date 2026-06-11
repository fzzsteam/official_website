import { showAdminToast } from './toast';

export async function adminApi<T>(url: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers || {}),
      },
    });
  } catch {
    const message = '网络请求失败，请稍后重试';
    showAdminToast({ type: 'error', message });
    throw new Error(message);
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message = payload?.error?.message || '请求失败';
    showAdminToast({ type: 'error', message });
    throw new Error(message);
  }
  return payload.data as T;
}
