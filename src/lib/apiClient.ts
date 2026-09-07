/**
 * AgriFlow Production API Client
 * Clean typed HTTP, WebSocket and SSE interfaces for connecting with real backend services.
 */

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
export const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_BASE_URL || 'ws://localhost:8000';

export class ApiError extends Error {
  status: number;
  data?: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
  timeoutMs?: number;
}

export async function apiClient<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, timeoutMs = 15000, headers, ...customConfig } = options;

  let token: string | null = null;
  if (typeof window !== 'undefined') {
    token = localStorage.getItem('agriflow_auth_token');
  }

  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...headers,
  };

  let url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null) {
        searchParams.append(key, String(val));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
  }

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...customConfig,
      headers: defaultHeaders,
      signal: controller.signal,
    });

    clearTimeout(id);

    if (!response.ok) {
      let errorData: unknown;
      try {
        errorData = await response.json();
      } catch {
        errorData = await response.text();
      }
      throw new ApiError(
        (errorData as { message?: string })?.message || `API request failed with status ${response.status}`,
        response.status,
        errorData
      );
    }

    if (response.status === 204) {
      return {} as T;
    }

    return (await response.json()) as T;
  } catch (error: unknown) {
    clearTimeout(id);
    if (error instanceof ApiError) {
      throw error;
    }
    const err = error as { name?: string; message?: string };
    if (err.name === 'AbortError') {
      throw new ApiError('Request timeout. Backend server took too long to respond.', 408);
    }
    throw new ApiError(err.message || 'Network connection failed. Backend service unavailable.', 503);
  }
}

/**
 * Realtime WebSocket connection helper for live GPS tracking & telemetry
 */
export function createLiveTrackingSocket<T>(tripId: string, onMessage: (data: T) => void, onError?: (err: Event) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  let socket: WebSocket | null = null;
  try {
    const wsUrl = `${WS_BASE_URL}/ws/tracking/${tripId}`;
    socket = new WebSocket(wsUrl);

    socket.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        onMessage(parsed);
      } catch {
        // non-json or ping event
      }
    };

    socket.onerror = (err) => {
      if (onError) onError(err);
    };
  } catch (err) {
    console.error('WebSocket connection error:', err);
  }

  return () => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.close();
    }
  };
}
