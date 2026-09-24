"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { pesoFormatter } from "@/lib/format";
import { useCart } from "@/contexts/CartContext";

const fallbackImage = "https://images.unsplash.com/photo-1544441893-675973e31985?w=300&q=85";

export default function SlideOutCart() {
  const {
    cart,
    removeFromCart,
    updateQuantity,
    isCartOpen,
    setIsCartOpen,
    subtotal,
    totalItems,
  } = useCart();

  if (!isCartOpen) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Close cart"
        onClick={() => setIsCartOpen(false)}
        className="fixed inset-0 z-50 animate-fade-in bg-slate-950/40 backdrop-blur-sm"
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md animate-scale-in flex-col bg-archive-ivory shadow-2xl transition-transform duration-500 ease-in-out overscroll-contain"
      >
        <div className="flex items-center justify-between border-b border-archive-gold/25 bg-archive-green-dark px-5 py-5 text-white">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-archive-gold">
              {totalItems} items
            </p>
            <h2 className="font-playfair text-3xl font-semibold tracking-normal text-white">Your cart</h2>
          </div>
          <button
            type="button"
            aria-label="Close cart"
            onClick={() => setIsCartOpen(false)}
            className="flex h-10 w-10 items-center justify-center rounded-sm hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {cart.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-sm bg-white text-slate-950 shadow-sm">
                <ShoppingBag size={26} aria-hidden="true" />
              </div>
              <p className="font-playfair text-2xl font-semibold tracking-normal text-slate-950">Your cart is empty</p>
              <p className="mt-2 max-w-xs text-sm leading-6 text-slate-500">
                Browse the latest thrift finds and add clothing, bags, or accessories.
              </p>
              <Link
                href="/products"
                onClick={() => setIsCartOpen(false)}
                className="mt-6 inline-flex h-11 items-center rounded-sm bg-archive-green-dark px-5 text-xs font-black uppercase tracking-[0.14em] text-white hover:bg-archive-gold hover:text-archive-green-dark"
              >
                Shop now
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map((item) => (
                <div key={item.id} className="rounded-sm border border-archive-gold/25 bg-white p-4">
                  <div className="flex gap-4">
                    <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-sm bg-slate-100">
                      <Image
                        src={item.image || fallbackImage}
                        alt={item.name}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black uppercase tracking-normal text-slate-950">
                            {item.name}
                          </p>
                          <p className="mt-1 text-xs font-semibold text-slate-500">{item.category}</p>
                        </div>
                        <button
                          type="button"
                          aria-label={`Remove ${item.name}`}
                          onClick={() => removeFromCart(item.id)}
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm text-rose-800 hover:bg-rose-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-950"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex h-9 items-center rounded-sm border border-slate-200">
                          <button
                            type="button"
                            aria-label="Decrease quantity"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="flex h-9 w-9 items-center justify-center hover:bg-slate-100"
                          >
                            <Minus size={15} />
                          </button>
                          <span className="w-8 text-center text-xs font-black tabular-nums">{item.quantity}</span>
                          <button
                            type="button"
                            aria-label="Increase quantity"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="flex h-9 w-9 items-center justify-center hover:bg-slate-100"
                          >
                            <Plus size={15} />
                          </button>
                        </div>
                        <p className="text-sm font-black tabular-nums text-slate-950">
                          {pesoFormatter.format(item.price * item.quantity)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <div className="border-t border-archive-gold/25 bg-white p-5">
            <div className="mb-5 flex items-end justify-between">
              <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Subtotal</span>
              <span className="text-2xl font-black tabular-nums text-slate-950">
                {pesoFormatter.format(subtotal)}
              </span>
            </div>
            <Link
              href="/cart"
              onClick={() => setIsCartOpen(false)}
              className="flex h-12 items-center justify-center rounded-sm bg-archive-green-dark px-5 text-sm font-black uppercase tracking-[0.14em] text-white hover:bg-archive-gold hover:text-archive-green-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-archive-green-dark"
            >
              Checkout
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}
