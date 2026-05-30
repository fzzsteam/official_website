export interface ApiError extends Error {
  code?: string;
  status?: number;
}

interface ApiSuccessResponse<T> {
  data: T;
}

interface ApiFailureResponse {
  error?: {
    code?: string;
    message?: string;
  };
}

async function parseApiResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => null)) as
    | ApiSuccessResponse<T>
    | ApiFailureResponse
    | null;

  if (!response.ok || !payload || typeof payload !== 'object' || !('data' in payload)) {
    const message =
      payload && 'error' in payload && payload.error?.message
        ? payload.error.message
        : '请求失败';
    const error = new Error(message) as ApiError;
    error.code = payload && 'error' in payload ? payload.error?.code : undefined;
    error.status = response.status;
    throw error;
  }

  return payload.data;
}

export async function apiGet<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    method: 'GET',
    credentials: 'include',
  });

  return parseApiResponse<T>(response);
}

export async function apiPost<T>(url: string, body?: unknown): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  return parseApiResponse<T>(response);
}
