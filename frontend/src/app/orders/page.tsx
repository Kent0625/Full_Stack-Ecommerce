"use client";

import Link from "next/link";
import { ArrowLeft, CheckCircle2, Clock, Package, RefreshCw, ShoppingBag, Truck } from "lucide-react";
import { useEffect, useState } from "react";
import { fetchMyOrders } from "@/lib/api";
import { formatDate, pesoFormatter } from "@/lib/format";
import type { Order } from "@/lib/types";
import { useAuth } from "@/contexts/AuthContext";

export default function OrdersPage() {
  const { user, token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadOrders() {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);
      const data = await fetchMyOrders(token);
      setOrders(data);
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Unable to load orders.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token) {
      loadOrders();
    } else {
      setLoading(false);
    }
  }, [token]);

  if (!token || !user) {
    return (
      <main id="main-content" className="min-h-screen bg-archive-ivory px-4 pb-20 pt-28 sm:px-6">
        <div className="mx-auto max-w-xl rounded-sm border border-archive-gold/25 bg-white p-10 text-center shadow-md">
          <Package className="mx-auto text-archive-gold" size={48} aria-hidden="true" />
          <h1 className="mt-5 font-playfair text-4xl font-semibold tracking-normal text-archive-green-dark">
            Order History
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Please log in or use the demo account to view your past orders and tracking updates.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/login?next=/orders"
              className="inline-flex h-11 items-center justify-center rounded-sm bg-archive-green-dark px-6 text-xs font-black uppercase tracking-[0.14em] text-white hover:bg-archive-gold hover:text-archive-green-dark"
            >
              Sign In
            </Link>
            <Link
              href="/products"
              className="inline-flex h-11 items-center justify-center rounded-sm border border-slate-300 px-6 text-xs font-black uppercase tracking-[0.14em] text-slate-800 hover:bg-slate-100"
            >
              Browse Shop
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main id="main-content" className="min-h-screen bg-archive-ivory px-4 pb-20 pt-28 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-archive-green hover:text-archive-gold"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Back to Shop
          </Link>

          <button
            type="button"
            onClick={loadOrders}
            className="inline-flex h-9 items-center gap-2 rounded-sm border border-archive-gold/30 bg-white px-3 text-xs font-bold text-slate-700 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-archive-green-dark"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} aria-hidden="true" />
            Refresh
          </button>
        </div>

        <section className="mb-8 rounded-sm bg-archive-green-dark px-6 py-10 text-white luxury-shadow sm:px-8">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-archive-gold">Customer Portal</p>
          <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="font-playfair text-5xl font-semibold tracking-normal text-white">Your Orders</h1>
              <p className="mt-2 text-sm leading-6 text-slate-200">
                Logged in as <span className="font-bold text-white">{user.name}</span> ({user.email})
              </p>
            </div>
            <div className="rounded-sm border border-archive-gold/35 bg-white/10 px-4 py-2 text-xs font-bold text-white">
              {orders.length} {orders.length === 1 ? "order" : "orders"} placed
            </div>
          </div>
        </section>

        {error && (
          <p className="mb-6 rounded-sm border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-800">
            {error}
          </p>
        )}

        {loading ? (
          <div className="space-y-4" aria-live="polite">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="animate-pulse rounded-sm border border-archive-gold/20 bg-white p-6">
                <div className="h-6 w-1/3 rounded bg-slate-200" />
                <div className="mt-4 h-4 w-1/2 rounded bg-slate-200" />
                <div className="mt-6 h-16 rounded bg-slate-100" />
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-sm border border-archive-gold/25 bg-white p-12 text-center shadow-sm">
            <ShoppingBag className="mx-auto text-slate-400" size={44} aria-hidden="true" />
            <h2 className="mt-5 font-playfair text-3xl font-semibold tracking-normal text-archive-green-dark">
              No orders found
            </h2>
            <p className="mt-2 text-sm text-slate-500">You haven&apos;t placed any orders with this account yet.</p>
            <Link
              href="/products"
              className="mt-6 inline-flex h-11 items-center justify-center rounded-sm bg-archive-green-dark px-6 text-xs font-black uppercase tracking-[0.14em] text-white hover:bg-archive-gold hover:text-archive-green-dark"
            >
              Explore Collection
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <article
                key={order.id}
                className="overflow-hidden rounded-sm border border-archive-gold/25 bg-white shadow-sm transition-all hover:shadow-md"
              >
                {/* Order Header */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 bg-slate-50/70 p-5">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-playfair text-xl font-bold text-archive-green-dark">
                      Order #{order.id}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-sm bg-emerald-100 px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.1em] text-emerald-800">
                      <CheckCircle2 size={13} aria-hidden="true" />
                      {order.status || "Paid"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <Clock size={14} aria-hidden="true" />
                    <span>{formatDate(order.created_at)}</span>
                  </div>
                </div>

                {/* Order Details & Logistics */}
                <div className="grid gap-6 p-5 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.14em] text-archive-gold">Customer</p>
                    <p className="mt-1 text-sm font-bold text-slate-800">{order.customer_name || user.name}</p>
                    <p className="text-xs text-slate-500">{order.customer_phone || "No phone provided"}</p>
                  </div>

                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.14em] text-archive-gold">Delivery Address</p>
                    <p className="mt-1 text-sm font-medium text-slate-700">{order.shipping_address}</p>
                    {order.delivery_zone && (
                      <p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-archive-green">
                        <Truck size={13} aria-hidden="true" />
                        Courier: {order.delivery_zone}
                      </p>
                    )}
                  </div>

                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.14em] text-archive-gold">Payment Method</p>
                    <p className="mt-1 text-sm font-bold text-slate-800">{order.payment_method}</p>
                    <p className="mt-1 text-base font-black tabular-nums text-archive-green-dark">
                      Total: {pesoFormatter.format(order.total_amount)}
                    </p>
                  </div>
                </div>

                {/* Line Items */}
                <div className="border-t border-slate-100 bg-archive-ivory/40 p-5">
                  <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">
                    Purchased Items ({order.items.length})
                  </p>
                  <ul className="mt-3 divide-y divide-slate-100">
                    {order.items.map((item) => (
                      <li key={item.id} className="flex items-center justify-between py-2 text-sm">
                        <div className="min-w-0 pr-4">
                          <Link
                            href={`/products/${item.product_id}`}
                            className="font-bold text-slate-800 hover:text-archive-green"
                          >
                            {item.product_name || `Product #${item.product_id}`}
                          </Link>
                          <span className="ml-2 text-xs text-slate-500">× {item.quantity}</span>
                        </div>
                        <span className="shrink-0 font-bold tabular-nums text-slate-800">
                          {pesoFormatter.format(item.subtotal)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
