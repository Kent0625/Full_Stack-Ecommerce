export type Category = "Clothing" | "Bags" | "Accessories";

export interface Product {
  id: number;
  archive_id: string;
  name: string;
  description: string;
  price: number;
  category: Category;
  image_url: string;
  images: string[];
  stock_quantity: number;
  status: "available" | "reserved" | "sold" | "sold_out";
  created_at?: string;
  era?: string | null;
  brand?: string | null;
  srp?: number | null;
  size?: string | null;
  color?: string | null;
  fit_details?: string | null;
  fabric_details?: string | null;
  condition_details?: string | null;
  is_locked?: boolean;
  lock_ttl?: number;
}

export interface User {
  id: number;
  name: string;
  email: string;
  created_at?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: "bearer";
  user: User;
}

export interface CartItem {
  id: number;
  name: string;
  price: number;
  image: string;
  category: Category;
  stock_quantity: number;
  quantity: number;
}

export interface OrderItemInput {
  product_id: number;
  quantity: number;
}

export interface CreateOrderPayload {
  items: OrderItemInput[];
  customer_name: string;
  customer_phone: string;
  shipping_address: string;
  payment_method: string;
  delivery_zone?: string;
}

export interface OrderItem {
  id: number;
  product_id: number;
  product_name?: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface Order {
  id: number;
  user_id: number;
  total_amount: number;
  status: string;
  customer_name: string;
  customer_phone: string;
  shipping_address: string;
  payment_method: string;
  delivery_zone?: string;
  created_at: string;
  items: OrderItem[];
}

export interface AnalyticsSummary {
  total_revenue: number;
  total_orders: number;
  total_customers: number;
}

export interface SalesPoint {
  date: string;
  total_orders: number;
  total_items?: number;
  total_revenue: number;
}

export interface TopProduct {
  name: string;
  category?: Category;
  sold_count: number;
  revenue?: number;
}

export interface CustomerPoint {
  date: string;
  new_customers: number;
}

export interface RecentSale {
  product_name: string;
  customer_name: string;
  subtotal: number;
  created_at: string;
}
