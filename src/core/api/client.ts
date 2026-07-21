// Unified HTTP API Client for Enterprise POS & ERP System
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
      if (u && u.code) {
        result['Authorization'] = `Bearer ${u.code}`;
      }
    } catch (e) {
      logger.error('APIClient', 'Error parsing user for auth header:', e);
    }
  }
  return result;
};

export const apiClient = {
  /**
   * Base request runner
   */
  async request<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<T> {
    const method = options.method || 'GET';
    const start = Date.now();
    
    // Log outgoing request
    logger.debug('APIClient', `Outgoing Request: ${method} ${url}`, {
      body: options.body ? JSON.parse(options.body as string) : null
    });

    try {
      const response = await fetch(url, {
        ...options,
        headers: getHeaders(options.headers as Record<string, string>),
      });

      const duration = Date.now() - start;
      logger.info('APIClient', `Incoming Response: ${method} ${url} Status: ${response.status} (${duration}ms)`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const message = errorData.error || 'حدث خطأ في الاتصال بالخادم';
        const code = errorData.code || 'SERVER_ERROR';
        throw new AppError(message, code, response.status, errorData.details);
      }

      const json = await response.json();
      
      // Standardize unwrapping of standard server payload
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
      // Standardize the error and translate it to user-facing Arabic message
      const stdError = ErrorHandler.standardize(error);
      const friendlyMessage = ErrorHandler.handle(stdError, `APIClient::${method}::${url.split('?')[0]}`);
      
      // Re-throw a standardized AppError containing the localized message
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
