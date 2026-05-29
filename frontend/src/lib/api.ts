import type {
  AnalyticsSummary,
  AuthResponse,
  Category,
  CreateOrderPayload,
  CustomerPoint,
  Order,
  Product,
  RecentSale,
  SalesPoint,
  TopProduct,
  User,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

interface RequestOptions extends RequestInit {
  token?: string | null;
}

async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }
  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    let message = `Request failed with ${response.status}`;
    try {
      const payload = await response.json();
      if (typeof payload.detail === "string") message = payload.detail;
      if (Array.isArray(payload.detail)) message = payload.detail[0]?.msg || message;
    } catch {
      message = response.statusText || message;
    }
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export function fetchProducts(filters: { category?: Category | "All"; search?: string } = {}) {
  const params = new URLSearchParams();
  if (filters.category && filters.category !== "All") params.set("category", filters.category);
  if (filters.search?.trim()) params.set("search", filters.search.trim());
  const query = params.toString();
  return apiRequest<Product[]>(`/products${query ? `?${query}` : ""}`);
}

export function fetchProduct(productId: number) {
  return apiRequest<Product>(`/products/${productId}`);
}

export function registerUser(payload: {
  name: string;
  email: string;
  password: string;
  confirm_password: string;
}) {
  return apiRequest<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function loginUser(payload: { email: string; password: string }) {
  return apiRequest<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function fetchCurrentUser(token: string) {
  return apiRequest<User>("/auth/me", { token });
}

export function createOrder(payload: CreateOrderPayload, token: string) {
  return apiRequest<Order>("/orders", {
    method: "POST",
    body: JSON.stringify(payload),
    token,
  });
}

export function fetchMyOrders(token: string) {
  return apiRequest<Order[]>("/orders/me", { token });
}

export function fetchAnalyticsSummary() {
  return apiRequest<AnalyticsSummary>("/analytics/summary");
}

export function fetchAnalyticsSales() {
  return apiRequest<SalesPoint[]>("/analytics/sales");
}

export function fetchTopProducts() {
  return apiRequest<TopProduct[]>("/analytics/top-products");
}

export function fetchRecentSales() {
  return apiRequest<RecentSale[]>("/analytics/recent-sales");
}

export function fetchCustomerAnalytics() {
  return apiRequest<CustomerPoint[]>("/analytics/customers");
}


export function reserveProduct(productId: number) {
  return apiRequest<{ message: string; ttl: number }>(`/products/${productId}/reserve`, {
    method: "POST",
  });
}

export function unreserveProduct(productId: number) {
  return apiRequest<{ message: string }>(`/products/${productId}/unreserve`, {
    method: "POST",
  });
}
