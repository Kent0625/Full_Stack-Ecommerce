"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Minus, Plus, ShoppingBag } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchProduct } from "@/lib/api";
import { pesoFormatter } from "@/lib/format";
import type { Product } from "@/lib/types";
import { useCart } from "@/contexts/CartContext";

const fallbackImage = "https://images.unsplash.com/photo-1544441893-675973e31985?w=900&q=85";

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export default function ProductPage({ productId }: { productId: string }) {
  const router = useRouter();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProduct(Number.parseInt(productId, 10))
      .then((data) => {
        setProduct(data);
        setActiveImage(0);
        setQuantity(1);
      })
      .catch((err: unknown) => setError(getErrorMessage(err, "Product unavailable.")))
      .finally(() => setLoading(false));
  }, [productId]);

  const images = useMemo(() => {
    if (!product) return [fallbackImage];
    return product.images?.length ? product.images : [product.image_url || fallbackImage];
  }, [product]);

  if (loading) {
    return (
      <main id="main-content" className="min-h-screen bg-archive-ivory px-4 pt-32">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 lg:grid-cols-2">
          <div className="aspect-[4/5] animate-pulse rounded-sm bg-slate-200" />
          <div className="space-y-5">
            <div className="h-5 w-40 animate-pulse rounded bg-slate-200" />
            <div className="h-14 w-3/4 animate-pulse rounded bg-slate-200" />
            <div className="h-32 animate-pulse rounded bg-slate-200" />
          </div>
        </div>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main
        id="main-content"
        className="flex min-h-screen flex-col items-center justify-center bg-archive-ivory px-4 text-center"
      >
        <h1 className="font-playfair text-4xl font-semibold tracking-normal text-archive-green-dark">Product not found</h1>
        <p className="mt-4 max-w-md text-sm leading-6 text-slate-500">{error || "This item is unavailable."}</p>
        <button
          type="button"
          onClick={() => router.push("/products")}
          className="mt-8 inline-flex h-12 items-center gap-2 rounded-sm bg-archive-green-dark px-5 text-sm font-black uppercase tracking-[0.14em] text-white hover:bg-archive-gold hover:text-archive-green-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-archive-green-dark"
        >
          <ArrowLeft size={17} />
          Back to shop
        </button>
      </main>
    );
  }

  const isAvailable = product.status === "available" && product.stock_quantity > 0;

  return (
    <main id="main-content" className="min-h-screen bg-archive-ivory px-4 pb-20 pt-28 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-8 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-archive-green hover:text-archive-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-archive-green-dark"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <section className="mb-8 rounded-sm bg-archive-green-dark px-6 py-8 text-white luxury-shadow">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-archive-gold">Shop the archive</p>
          <h1 className="mt-3 font-playfair text-4xl font-semibold tracking-normal">Products</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-200">
            Browse curated pre-loved clothing, bags, and accessories.
          </p>
        </section>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <section>
            <div className="relative aspect-[4/5] overflow-hidden rounded-sm border border-archive-gold/25 bg-white luxury-shadow">
              <Image
                src={images[activeImage] || fallbackImage}
                alt={product.name}
                fill
                priority
                sizes="(min-width: 1024px) 55vw, 100vw"
                className="object-cover"
              />
            </div>
            {images.length > 1 && (
              <div className="mt-4 grid grid-cols-4 gap-3">
                {images.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    aria-label={`Show product image ${index + 1}`}
                    onClick={() => setActiveImage(index)}
                    className={`relative aspect-square overflow-hidden rounded-sm border bg-slate-100 ${
                      activeImage === index ? "border-slate-950" : "border-slate-200"
                    } focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-950`}
                  >
                    <Image src={image} alt="" fill sizes="25vw" className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="lg:sticky lg:top-28 lg:self-start">
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <span className="rounded-sm bg-archive-green-dark px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-white">
                {product.category}
              </span>
              <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
                {product.archive_id}
              </span>
            </div>

            <h1 className="font-playfair text-5xl font-semibold leading-tight tracking-normal text-archive-green-dark">
              {product.name}
            </h1>
            <div className="mt-6 h-px w-40 bg-archive-gold" />
            <p className="mt-4 text-sm font-bold uppercase tracking-[0.14em] text-slate-500">
              {product.brand || "Archive Thrift"} {product.era ? `/ ${product.era}` : ""}
            </p>

            <div className="mt-8 flex flex-wrap items-end gap-4">
              <p className="text-4xl font-black tabular-nums text-archive-green-dark">
                {pesoFormatter.format(product.price)}
              </p>
              {product.srp && product.srp > product.price && (
                <p className="pb-1 text-sm font-semibold text-slate-400 line-through">
                  {pesoFormatter.format(product.srp)}
                </p>
              )}
            </div>

            <p className="mt-7 max-w-2xl text-base leading-8 text-slate-600">{product.description}</p>

            <div className="mt-8 grid grid-cols-2 gap-3">
              <InfoTile label="Size" value={product.size || "One Size"} />
              <InfoTile label="Color" value={product.color || "Assorted"} />
              <InfoTile label="Availability" value={isAvailable ? `${product.stock_quantity} in stock` : "Sold out"} />
              <InfoTile label="Condition" value={product.condition_details || "Quality checked"} />
            </div>

            <div className="mt-8 rounded-sm border border-archive-gold/25 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex h-12 w-36 items-center justify-between rounded-sm border border-archive-gold/25 bg-archive-ivory px-2">
                  <button
                    type="button"
                    aria-label="Decrease quantity"
                    onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                    className="flex h-9 w-9 items-center justify-center rounded-sm hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-950"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="text-sm font-black tabular-nums">{quantity}</span>
                  <button
                    type="button"
                    aria-label="Increase quantity"
                    onClick={() => setQuantity((current) => Math.min(product.stock_quantity, current + 1))}
                    className="flex h-9 w-9 items-center justify-center rounded-sm hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-950"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <button
                  type="button"
                  disabled={!isAvailable}
                  onClick={() => addToCart(product, quantity)}
                  className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-sm bg-archive-green-dark px-5 text-sm font-black uppercase tracking-[0.14em] text-white transition-colors hover:bg-archive-gold hover:text-archive-green-dark disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-archive-green-dark"
                >
                  <ShoppingBag size={18} />
                  Add to cart
                </button>
              </div>
            </div>

            <div className="mt-8 space-y-4 border-t border-slate-200 pt-8">
              <Detail title="Fit" copy={product.fit_details || "Easy thrift-store fit for daily styling."} />
              <Detail title="Fabric" copy={product.fabric_details || "Pre-loved materials selected for reuse."} />
              <Detail title="Care" copy="Clean before first wear and follow garment care labels where available." />
            </div>

            <Link
              href="/cart"
              className="mt-8 inline-flex text-sm font-black uppercase tracking-[0.14em] text-archive-green hover:text-archive-gold"
            >
              Go to checkout
            </Link>
          </section>
        </div>
      </div>
    </main>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-sm border border-archive-gold/25 bg-white p-4">
      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-archive-gold">{label}</p>
      <p className="mt-2 text-sm font-bold text-slate-800">{value}</p>
    </div>
  );
}

function Detail({ title, copy }: { title: string; copy: string }) {
  return (
    <div>
      <h2 className="text-xs font-black uppercase tracking-[0.16em] text-archive-green-dark">{title}</h2>
      <p className="mt-2 text-sm leading-7 text-slate-600">{copy}</p>
    </div>
  );
}
