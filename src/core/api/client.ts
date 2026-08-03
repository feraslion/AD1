// Unified HTTP API Client for Enterprise POS & ERP System with Automatic JWT Refresh
import { logger } from '../../shared/utils/logger';
import { ErrorHandler, AppError } from '../../shared/utils/errorHandler';

// Standard API Response structure
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  timestamp?: string;
}

// Helper to resolve absolute or relative API URLs
export const resolveApiUrl = (url: string): string => {
  if (!url) return url;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;

  let baseUrl = '';
  if (typeof window !== 'undefined') {
    const metaEnv = (import.meta as any)?.env;
    if ((window as any).VITE_API_BASE_URL) {
      baseUrl = (window as any).VITE_API_BASE_URL;
    } else if (metaEnv && metaEnv.VITE_API_BASE_URL) {
      baseUrl = metaEnv.VITE_API_BASE_URL;
    } else if (window.location.protocol === 'file:' || window.location.protocol === 'capacitor:') {
      baseUrl = 'http://localhost:3000';
    }
  }

  if (baseUrl) {
    const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const cleanUrl = url.startsWith('/') ? url : `/${url}`;
    return `${cleanBase}${cleanUrl}`;
  }

  return url;
};

// Helper to retrieve auth token headers
const getHeaders = (headers: Record<string, string> = {}) => {
  const activeUser = localStorage.getItem('erp_active_user');
  const result: Record<string, string> = { 
    'Content-Type': 'application/json',
    ...headers 
  };

  if (activeUser) {
    try {
      const u = JSON.parse(activeUser);
      if (u && u.token) {
        result['Authorization'] = `Bearer ${u.token}`;
      } else if (u && u.code) {
        result['Authorization'] = `Bearer ${u.code}`;
      }
    } catch (e) {
      logger.error('APIClient', 'Error parsing user for auth header:', e);
    }
  }

  const refreshToken = localStorage.getItem('erp_refresh_token');
  if (refreshToken) {
    result['X-Refresh-Token'] = refreshToken;
  }

  return result;
};

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

async function attemptTokenRefresh(): Promise<string | null> {
  if (isRefreshing && refreshPromise) return refreshPromise;

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const refreshToken = localStorage.getItem('erp_refresh_token');
      if (!refreshToken) return null;

      const res = await fetch(resolveApiUrl('/api/auth/refresh'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });

      if (!res.ok) {
        localStorage.removeItem('erp_active_user');
        localStorage.removeItem('erp_refresh_token');
        return null;
      }

      const data = await res.json();
      if (data.success && data.token) {
        // Update user session token
        const activeUserStr = localStorage.getItem('erp_active_user');
        if (activeUserStr) {
          const u = JSON.parse(activeUserStr);
          u.token = data.token;
          localStorage.setItem('erp_active_user', JSON.stringify(u));
        }
        if (data.refreshToken) {
          localStorage.setItem('erp_refresh_token', data.refreshToken);
        }
        return data.token;
      }
      return null;
    } catch (err) {
      return null;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export const apiClient = {
  /**
   * Base request runner with automatic token refresh handling
   */
  async request<T>(
    url: string,
    options: RequestInit = {},
    isRetry = false
  ): Promise<T> {
    const method = options.method || 'GET';
    const start = Date.now();
    const targetUrl = resolveApiUrl(url);
    
    logger.debug('APIClient', `Outgoing Request: ${method} ${targetUrl}`);

    try {
      const response = await fetch(targetUrl, {
        ...options,
        headers: getHeaders(options.headers as Record<string, string>),
      });

      const duration = Date.now() - start;
      logger.info('APIClient', `Incoming Response: ${method} ${url} Status: ${response.status} (${duration}ms)`);

      // If 401 Unauthorized and not already retried, try refreshing token
      if (response.status === 401 && !isRetry && !url.includes('/api/auth/')) {
        const newToken = await attemptTokenRefresh();
        if (newToken) {
          return apiClient.request<T>(url, options, true);
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const message = errorData.error || 'حدث خطأ في الاتصال بالخادم';
        const code = errorData.code || 'SERVER_ERROR';
        throw new AppError(message, code, response.status, errorData.details);
      }

      const json = await response.json();
      
      if (json && typeof json === 'object') {
        if (json.success === false) {
          throw new AppError(json.error || 'حدث خطأ غير معروف', json.code || 'SERVER_ERROR', response.status, json.details);
        }
        if ('success' in json && 'data' in json) {
          return json.data as T;
        }
      }
      return json as T;
    } catch (error) {
      const stdError = ErrorHandler.standardize(error);
      const friendlyMessage = ErrorHandler.handle(stdError, `APIClient::${method}::${url.split('?')[0]}`);
      
      throw new AppError(
        friendlyMessage,
        stdError.code,
        stdError.statusCode,
        stdError.details
      );
    }
  },

  /**
   * HTTP GET Request
   */
  async get<T>(url: string, params?: Record<string, any>): Promise<T> {
    let finalUrl = url;
    if (params) {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query.append(key, value.toString());
        }
      });
      finalUrl += `?${query.toString()}`;
    }
    return apiClient.request<T>(finalUrl, { method: 'GET' });
  },

  /**
   * HTTP POST Request
   */
  async post<T>(url: string, body: any): Promise<T> {
    return apiClient.request<T>(url, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  },

  /**
   * HTTP DELETE Request
   */
  async delete<T>(url: string): Promise<T> {
    return apiClient.request<T>(url, { method: 'DELETE' });
  }
};
