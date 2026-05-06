import Cookies from 'js-cookie';
import type { ApiResponse } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

// 请求配置
interface RequestConfig extends RequestInit {
  params?: Record<string, any>;
}

// 获取 Token
function getToken(): string | undefined {
  return Cookies.get('token');
}

// 设置 Token
export function setToken(token: string): void {
  Cookies.set('token', token, { expires: 7 });
}

// 移除 Token
export function removeToken(): void {
  Cookies.remove('token');
}

// 检查是否登录
export function isAuthenticated(): boolean {
  return !!getToken();
}

// API 错误类
export class ApiError extends Error {
  code: number;

  constructor(code: number, message: string) {
    super(message);
    this.code = code;
    this.name = 'ApiError';
  }
}

// 请求函数
async function request<T>(
  endpoint: string,
  config: RequestConfig = {}
): Promise<T> {
  const { params, ...init } = config;

  // 构建 URL
  let url = `${API_BASE_URL}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  // 构建 Headers
  const headers = new Headers(init.headers);

  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json');
  }

  const token = getToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // 发送请求
  const response = await fetch(url, {
    ...init,
    headers,
  });

  // 解析响应
  const data: ApiResponse<T> = await response.json();

  // 处理错误
  if (data.code !== 0) {
    // Token 过期或无效
    if (data.code === 2000 || data.code === 2001 || data.code === 2002) {
      removeToken();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    throw new ApiError(data.code, data.message);
  }

  return data.data;
}

// HTTP 方法封装
export const api = {
  get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    return request<T>(endpoint, { method: 'GET', params });
  },

  post<T>(endpoint: string, body?: any, config?: RequestConfig): Promise<T> {
    return request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      ...config,
    });
  },

  put<T>(endpoint: string, body?: any): Promise<T> {
    return request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  delete<T>(endpoint: string): Promise<T> {
    return request<T>(endpoint, { method: 'DELETE' });
  },
};

export default api;
