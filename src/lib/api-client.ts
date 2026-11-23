/**
 * Unified Client HTTP Transport for Candy Loz /api/v1/*
 * - Holds Bearer JWT strictly in memory (never in localStorage/sessionStorage).
 * - Sends HttpOnly session cookies via credentials: 'include' plus X-Requested-With CSRF header.
 */

export class ApiClientError extends Error {
  status: number;
  code: string;
  details?: Array<{ field: string; message: string }>;

  constructor(
    message: string,
    status = 400,
    code = 'API_ERROR',
    details?: Array<{ field: string; message: string }>
  ) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

let inMemoryBearerToken: string | null = null;

export function setAuthToken(token: string | null): void {
  inMemoryBearerToken = token;
}

export function getAuthToken(): string | null {
  return inMemoryBearerToken;
}

export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
  idempotencyKey?: string;
  cache?: RequestCache;
}

interface EnvelopeResponse<T> {
  success?: boolean;
  data?: T;
  error?: {
    code?: string;
    message?: string;
    details?: Array<{ field: string; message: string }>;
  };
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const { method = 'GET', body, headers = {}, idempotencyKey, cache = 'no-store' } = options;

  const requestHeaders: Record<string, string> = {
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    ...headers,
  };

  if (body !== undefined) {
    requestHeaders['Content-Type'] = 'application/json';
  }

  if (inMemoryBearerToken) {
    requestHeaders.Authorization = `Bearer ${inMemoryBearerToken}`;
  }

  if (idempotencyKey) {
    requestHeaders['Idempotency-Key'] = idempotencyKey;
  }

  const baseUrl =
    typeof window !== 'undefined'
      ? ''
      : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: requestHeaders,
    credentials: 'include',
    cache,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  const text = await res.text();
  let parsed: EnvelopeResponse<T> | null = null;
  if (text) {
    try {
      parsed = JSON.parse(text) as EnvelopeResponse<T>;
    } catch {
      parsed = null;
    }
  }

  if (!res.ok || (parsed && parsed.success === false)) {
    const errMsg =
      parsed?.error?.message ||
      (res.status === 401
        ? 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى'
        : res.status === 403
        ? 'ليس لديك صلاحية لتنفيذ هذا الإجراء'
        : res.status === 429
        ? 'تم تجاوز الحد المسموح من المحاولات، يرجى المحاولة لاحقاً'
        : 'تعذّر إتمام العملية على الخادم، يرجى المحاولة مجدداً');

    throw new ApiClientError(
      errMsg,
      res.status,
      parsed?.error?.code || `HTTP_${res.status}`,
      parsed?.error?.details
    );
  }

  if (parsed && 'data' in parsed) {
    return parsed.data as T;
  }

  return parsed as unknown as T;
}
