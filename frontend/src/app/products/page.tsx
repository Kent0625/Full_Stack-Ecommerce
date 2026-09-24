"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import { fetchProducts } from "@/lib/api";
import type { Category, Product } from "@/lib/types";

const categories: Array<Category | "All"> = ["All", "Clothing", "Bags", "Accessories"];

function getInitialFilter(name: string) {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get(name) || "";
}

export default function ProductsPage() {
  const router = useRouter();
  const initialCategory = (getInitialFilter("category") as Category | "") || "All";

  const [category, setCategory] = useState<Category | "All">(
    categories.includes(initialCategory) ? initialCategory : "All",
  );
  const [search, setSearch] = useState(getInitialFilter("search"));
  const [sortBy, setSortBy] = useState<"featured" | "price-asc" | "price-desc" | "newest">("featured");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams();
    if (category !== "All") params.set("category", category);
    if (search.trim()) params.set("search", search.trim());
    router.replace(`/products${params.toString() ? `?${params}` : ""}`, { scroll: false });

    const timeout = window.setTimeout(() => {
      setLoading(true);
      setError(null);
      fetchProducts({ category, search })
        .then(setProducts)
        .catch((err: unknown) => setError(err instanceof Error ? err.message : "Unable to load products."))
        .finally(() => setLoading(false));
    }, 180);

    return () => window.clearTimeout(timeout);
  }, [category, search, router]);

  const sortedProducts = useMemo(() => {
    const list = [...products];
    if (sortBy === "price-asc") {
      return list.sort((a, b) => a.price - b.price);
    }
    if (sortBy === "price-desc") {
      return list.sort((a, b) => b.price - a.price);
    }
    if (sortBy === "newest") {
      return list.sort((a, b) => b.id - a.id);
    }
    return list;
  }, [products, sortBy]);

  const availableCount = useMemo(
    () => products.filter((product) => product.status === "available" && product.stock_quantity > 0).length,
    [products],
  );

  function resetFilters() {
    setCategory("All");
    setSearch("");
    setSortBy("featured");
  }

  return (
    <main id="main-content" className="min-h-screen bg-archive-ivory px-4 pb-20 pt-28 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <section className="mb-8 rounded-sm bg-archive-green-dark px-6 py-10 text-white luxury-shadow sm:px-8">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-archive-gold">Shop the Archive</p>
          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="font-playfair text-5xl font-semibold tracking-normal text-white">Products</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-200">
                Browse curated pre-loved clothing, bags, and accessories.
              </p>
            </div>
            <div className="rounded-sm border border-archive-gold/35 bg-white/10 px-4 py-3 text-sm font-bold tabular-nums text-white shadow-sm">
              {availableCount} available / {products.length} shown
            </div>
          </div>
        </section>

        <section className="mb-8 grid gap-4 rounded-sm border border-archive-gold/25 bg-white p-4 shadow-sm lg:grid-cols-[1fr_auto_auto]">
          <label className="flex min-h-12 items-center gap-3 rounded-sm border border-archive-gold/25 bg-archive-ivory px-3 focus-within:border-archive-green-dark">
            <Search size={18} className="text-slate-400" aria-hidden="true" />
            <span className="sr-only">Search products</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search denim, tote, watch…"
              className="w-full bg-transparent text-sm font-semibold text-slate-950 outline-none placeholder:text-slate-400"
            />
          </label>

          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 hidden items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-slate-500 sm:flex">
              <SlidersHorizontal size={16} aria-hidden="true" />
              Category
            </span>
            {categories.map((item) => (
              <button
                type="button"
                key={item}
                onClick={() => setCategory(item)}
                className={`h-10 rounded-sm px-4 text-xs font-black uppercase tracking-[0.12em] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-950 ${
                  category === item
                    ? "bg-archive-green-dark text-white"
                    : "bg-archive-ivory text-slate-600 hover:bg-archive-gold hover:text-archive-green-dark"
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="sort-select" className="sr-only">
              Sort by
            </label>
            <select
              id="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="h-10 rounded-sm border border-archive-gold/25 bg-archive-ivory px-3 text-xs font-bold text-slate-800 focus:border-archive-green-dark focus:outline-none"
            >
              <option value="featured">Featured</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="newest">Newest First</option>
            </select>
          </div>
        </section>

        {loading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4" aria-live="polite">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="animate-pulse rounded-sm border border-archive-gold/20 bg-white p-4">
                <div className="aspect-[4/5] rounded-sm bg-slate-200" />
                <div className="mt-4 h-4 w-3/4 rounded bg-slate-200" />
                <div className="mt-3 h-4 w-1/2 rounded bg-slate-200" />
                <div className="mt-5 h-10 rounded bg-slate-200" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div
            role="alert"
            className="rounded-sm border border-rose-200 bg-rose-50 p-6 text-sm font-semibold text-rose-800"
          >
            {error}
          </div>
        ) : sortedProducts.length === 0 ? (
          <div className="rounded-sm border border-slate-200 bg-white p-12 text-center shadow-sm">
            <h2 className="font-playfair text-3xl font-semibold tracking-normal text-slate-950">No Matches Found</h2>
            <p className="mt-3 text-sm text-slate-500">
              No products match your current filters. Try changing or clearing your search.
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className="mt-6 inline-flex h-11 items-center justify-center rounded-sm bg-archive-green-dark px-6 text-xs font-black uppercase tracking-[0.14em] text-white hover:bg-archive-gold hover:text-archive-green-dark"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {sortedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
