"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, BarChart3, Leaf } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import ProductCard from "@/components/ProductCard";
import { fetchProducts } from "@/lib/api";
import type { Category, Product } from "@/lib/types";

const categories: Array<{ name: Category; image: string; copy: string }> = [
  {
    name: "Clothing",
    copy: "Jackets, shirts, trousers, and wearable archive staples.",
    image: "https://images.unsplash.com/photo-1516762689617-e1cffcef479d?w=900&q=85",
  },
  {
    name: "Bags",
    copy: "Daily totes, leather shoulders, and compact carry pieces.",
    image: "https://images.unsplash.com/photo-1594223274512-ad4803739b7c?w=900&q=85",
  },
  {
    name: "Accessories",
    copy: "Sunglasses, bracelets, watches, and finishing details.",
    image: "https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?w=900&q=85",
  },
];

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts()
      .then(setProducts)
      .catch((err: unknown) => {
        console.error(err);
        setError(err instanceof Error ? err.message : "Products are unavailable.");
      })
      .finally(() => setLoading(false));
  }, []);

  const featuredProducts = useMemo(() => products.slice(0, 8), [products]);

  return (
    <main id="main-content" className="min-h-screen bg-archive-ivory">
      <section className="relative min-h-[92vh] overflow-hidden bg-archive-green-dark pt-24 text-white">
        <Image
          src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1800&q=85"
          alt="Premium thrift store interior with curated clothing racks"
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-38"
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_25%,rgba(185,161,107,0.28),transparent_32%),linear-gradient(90deg,#03281f_0%,rgba(3,40,31,0.92)_44%,rgba(6,59,47,0.55)_100%)]" />
        <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-archive-ivory to-transparent" />
        <div className="relative z-10 mx-auto grid min-h-[calc(92vh-6rem)] max-w-7xl grid-cols-1 items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="max-w-3xl">
            <p className="mb-6 inline-flex items-center gap-2 rounded-sm border border-archive-gold/40 bg-white/10 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-archive-gold">
              <Leaf size={15} />
              Curated pre-loved pieces
            </p>
            <h1 className="font-playfair text-5xl font-semibold leading-[0.95] tracking-normal sm:text-7xl lg:text-8xl">
              Archive Thrift
            </h1>
            <div className="my-7 h-px w-56 bg-archive-gold" />
            <p className="mt-7 max-w-2xl text-base leading-8 text-slate-100 sm:text-lg">
              A premium thrift-store marketplace for curated clothing, bags, and accessories, made for
              easy browsing and a smooth checkout experience.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/products"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-sm bg-archive-gold px-5 text-sm font-black uppercase tracking-[0.14em] text-archive-green-dark transition-colors hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
              >
                Shop Collection
                <ArrowRight size={17} />
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-sm border border-archive-gold/50 px-5 text-sm font-black uppercase tracking-[0.14em] text-white transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
              >
                View Analytics
                <BarChart3 size={17} />
              </Link>
            </div>
          </div>

          <div className="hidden rounded-sm border border-archive-gold/25 bg-white/10 p-5 backdrop-blur-md luxury-shadow lg:block">
            <div className="grid grid-cols-2 gap-3">
              {categories.map((category) => (
                <Link
                  href={`/products?category=${category.name}`}
                  key={category.name}
                  className="group relative min-h-44 overflow-hidden rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white first:col-span-2"
                >
                  <Image
                    src={category.image}
                    alt={`${category.name} category`}
                    fill
                    sizes="(min-width: 1024px) 22vw, 50vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-slate-950/35" />
                  <div className="absolute inset-x-0 bottom-0 p-4">
                    <p className="font-playfair text-2xl font-semibold">{category.name}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-100">{category.copy}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-archive-gold/25 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-4 py-6 sm:px-6 md:grid-cols-3">
          {[
            ["Three Categories", "Clothing, Bags, Accessories"],
            ["Secure Checkout", "Fast, personal order flow"],
            ["Store Insights", "Performance at a glance"],
          ].map(([title, copy]) => (
            <div key={title} className="flex items-center gap-3">
              <BadgeCheck className="text-archive-gold" size={21} />
              <div>
                <p className="text-sm font-black uppercase tracking-[0.12em] text-archive-green-dark">{title}</p>
                <p className="text-sm text-slate-500">{copy}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-24">
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-archive-gold">Latest Drops</p>
            <h2 className="mt-3 font-playfair text-4xl font-semibold tracking-normal text-archive-green-dark">
              Featured products
            </h2>
          </div>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-[0.14em] text-archive-green-dark hover:text-archive-gold"
          >
            See all products
            <ArrowRight size={17} />
          </Link>
        </div>

        {loading ? (
          <ProductSkeleton />
        ) : error ? (
          <div className="rounded-sm border border-rose-200 bg-rose-50 p-6 text-sm font-semibold text-rose-800">
            {error}
          </div>
        ) : featuredProducts.length === 0 ? (
          <div className="rounded-sm border border-archive-gold/25 bg-white p-10 text-center text-slate-500">
            No products yet. Run the backend seed script to load the thrift catalog.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} compact />
            ))}
          </div>
        )}
      </section>

      <section className="bg-archive-green-dark text-white">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-16 sm:px-6 lg:grid-cols-3">
          {categories.map((category) => (
            <Link
              href={`/products?category=${category.name}`}
              key={category.name}
              className="group focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
            >
              <div className="relative aspect-[4/3] overflow-hidden rounded-sm">
                <Image
                  src={category.image}
                  alt={`${category.name} thrift category`}
                  fill
                  sizes="(min-width: 1024px) 33vw, 100vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <h3 className="mt-5 font-playfair text-3xl font-semibold tracking-normal">{category.name}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">{category.copy}</p>
              <div className="mt-5 h-px w-20 bg-archive-gold" />
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}

function ProductSkeleton() {
  return (
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
  );
}
