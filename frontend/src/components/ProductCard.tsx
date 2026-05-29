"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { pesoFormatter } from "@/lib/format";
import type { Product } from "@/lib/types";
import { useCart } from "@/contexts/CartContext";

const fallbackImage = "https://images.unsplash.com/photo-1544441893-675973e31985?w=900&q=85";

export default function ProductCard({ product, compact = false }: { product: Product; compact?: boolean }) {
  const { addToCart } = useCart();
  const isAvailable = product.status === "available" && product.stock_quantity > 0;
  const displayImage = product.image_url || product.images?.[0] || fallbackImage;

  return (
    <article className="group animate-scale-in overflow-hidden rounded-sm border border-archive-gold/25 bg-white shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl">
      <Link
        href={`/products/${product.id}`}
        className="block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-slate-950"
      >
        <div className="relative aspect-[4/5] overflow-hidden bg-slate-100">
          <Image
            src={displayImage}
            alt={product.name}
            fill
            sizes={compact ? "(min-width: 768px) 25vw, 50vw" : "(min-width: 1024px) 25vw, 50vw"}
            className={`object-cover transition-transform duration-1000 group-hover:scale-110 ${
              isAvailable ? "" : "grayscale"
            }`}
          />
          <div className="absolute left-3 top-3 rounded-sm bg-archive-green-dark/90 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white">
            {product.category}
          </div>
          {!isAvailable && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-950/45">
              <span className="rounded-sm bg-white px-4 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-950">
                Sold Out
              </span>
            </div>
          )}
        </div>
      </Link>

      <div className="space-y-4 p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <Link
              href={`/products/${product.id}`}
              className="line-clamp-2 text-sm font-extrabold uppercase tracking-normal text-archive-green-dark hover:text-archive-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-archive-green-dark"
            >
              {product.name}
            </Link>
            <p className="mt-1 truncate text-xs font-semibold text-slate-500">{product.brand || "Archive Thrift"}</p>
          </div>
          <p className="shrink-0 text-sm font-black tabular-nums text-archive-green-dark">
            {pesoFormatter.format(product.price)}
          </p>
        </div>

        <div className="flex items-center justify-between gap-3">
          <span
            className={`text-[11px] font-bold ${
              isAvailable ? "text-archive-green" : "text-rose-800"
            }`}
          >
            {isAvailable ? `${product.stock_quantity} in stock` : "Unavailable"}
          </span>
          <button
            type="button"
            disabled={!isAvailable}
            onClick={() => addToCart(product)}
            className="flex h-10 items-center gap-2 rounded-sm bg-archive-green-dark px-3 text-xs font-bold uppercase tracking-[0.1em] text-white transition-colors hover:bg-archive-gold hover:text-archive-green-dark disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-archive-green-dark"
          >
            <ShoppingBag size={16} />
            Add
          </button>
        </div>
      </div>
    </article>
  );
}
