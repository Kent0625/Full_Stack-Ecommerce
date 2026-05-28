"use client";

import { BarChart3, RefreshCw, ShoppingBag, UsersRound, WalletCards } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  fetchAnalyticsSales,
  fetchAnalyticsSummary,
  fetchCustomerAnalytics,
  fetchTopProducts,
} from "@/lib/api";
import { compactPesoFormatter, formatDate, numberFormatter, pesoFormatter } from "@/lib/format";
import type { AnalyticsSummary, CustomerPoint, SalesPoint, TopProduct } from "@/lib/types";

const emptySummary: AnalyticsSummary = {
  total_revenue: 0,
  total_orders: 0,
  total_customers: 0,
};

async function getDashboardData() {
  const [summary, sales, topProducts, customers] = await Promise.all([
    fetchAnalyticsSummary(),
    fetchAnalyticsSales(),
    fetchTopProducts(),
    fetchCustomerAnalytics(),
  ]);

  return { summary, sales, topProducts, customers };
}

export default function Dashboard() {
  const [summary, setSummary] = useState<AnalyticsSummary>(emptySummary);
  const [sales, setSales] = useState<SalesPoint[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [customers, setCustomers] = useState<CustomerPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadData() {
    try {
      setError(null);
      setLoading(true);
      const data = await getDashboardData();

      setSummary(data.summary);
      setSales(data.sales);
      setTopProducts(data.topProducts);
      setCustomers(data.customers);
    } catch (err) {
      console.error("Failed to load dashboard data", err);
      setError("Analytics are unavailable. Please refresh this dashboard in a moment.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    getDashboardData()
      .then((data) => {
        if (cancelled) return;
        setSummary(data.summary);
        setSales(data.sales);
        setTopProducts(data.topProducts);
        setCustomers(data.customers);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Failed to load dashboard data", err);
        setError("Analytics are unavailable. Please refresh this dashboard in a moment.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const maxRevenue = useMemo(() => Math.max(...sales.map((item) => item.total_revenue), 1), [sales]);
  const maxTopCount = useMemo(() => Math.max(...topProducts.map((item) => item.sold_count), 1), [topProducts]);

  return (
    <main id="main-content" className="min-h-screen bg-archive-ivory px-4 pb-20 pt-28 text-archive-graphite sm:px-6">
      <div className="mx-auto max-w-7xl">
        <section className="mb-8 flex flex-col gap-4 rounded-sm bg-archive-green-dark px-6 py-10 text-white luxury-shadow lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-archive-gold">
              Store performance
            </p>
            <h1 className="mt-3 font-playfair text-5xl font-semibold tracking-normal">Analytics dashboard</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-200">
              Sales, revenue, top products, and customer growth for the store.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadData()}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-sm border border-archive-gold/45 bg-white/10 px-4 text-xs font-black uppercase tracking-[0.14em] text-white hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </section>

        {error && (
          <p className="mb-6 rounded-sm border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
            {error}
          </p>
        )}

        <section className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3" aria-label="Analytics summary">
          <MetricCard
            icon={<WalletCards size={22} />}
            label="Total Revenue"
            value={compactPesoFormatter.format(summary.total_revenue)}
            caption={pesoFormatter.format(summary.total_revenue)}
          />
          <MetricCard
            icon={<ShoppingBag size={22} />}
            label="Total Orders"
            value={numberFormatter.format(summary.total_orders)}
            caption="Paid checkout records"
          />
          <MetricCard
            icon={<UsersRound size={22} />}
            label="Customers"
            value={numberFormatter.format(summary.total_customers)}
            caption="Registered or checkout users"
          />
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-sm border border-archive-gold/25 bg-white p-5 shadow-sm">
            <SectionHeader title="Sales over time" subtitle="Daily order count and revenue." />
            {loading ? (
              <SkeletonRows />
            ) : sales.length === 0 ? (
              <EmptyState copy="No daily sales yet. Create an order, then refresh this dashboard." />
            ) : (
              <div className="mt-6 space-y-4">
                {sales.map((item) => (
                  <div key={item.date} className="grid gap-2 sm:grid-cols-[120px_1fr_120px] sm:items-center">
                    <div>
                      <p className="text-sm font-black text-archive-green-dark">{formatDate(item.date)}</p>
                      <p className="text-xs text-slate-500">{numberFormatter.format(item.total_orders)} orders</p>
                    </div>
                    <div className="h-3 overflow-hidden rounded-sm bg-slate-100">
                      <div
                        className="h-full rounded-sm bg-archive-green"
                        style={{ width: `${Math.max(8, (item.total_revenue / maxRevenue) * 100)}%` }}
                      />
                    </div>
                    <p className="text-right text-sm font-black tabular-nums text-archive-green-dark">
                      {compactPesoFormatter.format(item.total_revenue)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-sm border border-archive-gold/25 bg-archive-green-dark p-5 text-white shadow-sm">
            <SectionHeader title="Top products" subtitle="Units sold by product." dark />
            {loading ? (
              <SkeletonRows dark />
            ) : topProducts.length === 0 ? (
              <EmptyState copy="No sold products yet." dark />
            ) : (
              <div className="mt-6 space-y-5">
                {topProducts.map((item, index) => (
                  <div key={item.name}>
                    <div className="mb-2 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black uppercase tracking-normal">{item.name}</p>
                        <p className="text-xs text-slate-400">{item.category || "Thrift item"}</p>
                      </div>
                      <p className="text-sm font-black tabular-nums">{numberFormatter.format(item.sold_count)}</p>
                    </div>
                    <div className="h-2 rounded-sm bg-white/10">
                      <div
                        className={`h-full rounded-sm ${index === 0 ? "bg-archive-gold" : "bg-white"}`}
                        style={{ width: `${Math.max(10, (item.sold_count / maxTopCount) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-sm border border-archive-gold/25 bg-white p-5 shadow-sm xl:col-span-2">
            <SectionHeader title="Customer growth" subtitle="New customers grouped by account creation date." />
            {loading ? (
              <SkeletonRows />
            ) : customers.length === 0 ? (
              <EmptyState copy="No customer data available yet." />
            ) : (
              <div className="mt-6 overflow-x-auto">
                <table className="min-w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                      <th className="py-3">Date</th>
                      <th className="py-3 text-right">New Customers</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((item) => (
                      <tr key={item.date} className="border-b border-slate-100">
                        <td className="py-3 font-semibold text-slate-700">{formatDate(item.date)}</td>
                        <td className="py-3 text-right font-black tabular-nums text-archive-green-dark">
                          {numberFormatter.format(item.new_customers)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function MetricCard({
  icon,
  label,
  value,
  caption,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  caption: string;
}) {
  return (
    <div className="rounded-sm border border-archive-gold/25 bg-white p-5 shadow-sm">
      <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-sm bg-archive-green-dark text-archive-gold">
        {icon}
      </div>
      <h2 className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">{label}</h2>
      <p className="mt-3 text-4xl font-black tabular-nums text-archive-green-dark">{value}</p>
      <p className="mt-2 text-sm text-slate-500">{caption}</p>
    </div>
  );
}

function SectionHeader({ title, subtitle, dark = false }: { title: string; subtitle: string; dark?: boolean }) {
  return (
    <div className="flex items-start gap-3">
      <BarChart3 className={dark ? "text-archive-gold" : "text-archive-green"} size={21} />
      <div>
        <h2 className="text-lg font-black uppercase tracking-normal">{title}</h2>
        <p className={`mt-1 text-sm ${dark ? "text-slate-400" : "text-slate-500"}`}>{subtitle}</p>
      </div>
    </div>
  );
}

function EmptyState({ copy, dark = false }: { copy: string; dark?: boolean }) {
  return (
    <div className={`mt-6 rounded-sm border p-6 text-center text-sm ${dark ? "border-white/10 text-slate-300" : "border-archive-gold/25 text-slate-500"}`}>
      {copy}
    </div>
  );
}

function SkeletonRows({ dark = false }: { dark?: boolean }) {
  return (
    <div className="mt-6 space-y-4" aria-live="polite">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className={`h-10 animate-pulse rounded-sm ${dark ? "bg-white/10" : "bg-slate-100"}`} />
      ))}
    </div>
  );
}
