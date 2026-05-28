"use client";

import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { createOrder } from "@/lib/api";
import { pesoFormatter } from "@/lib/format";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";

const fallbackImage = "https://images.unsplash.com/photo-1544441893-675973e31985?w=300&q=85";
const paymentMethods = ["Cash on Delivery", "GCash", "Bank Transfer", "Online Payment"];

export default function CartPage() {
  const { user, token } = useAuth();
  const { cart, updateQuantity, removeFromCart, clearCart, subtotal, totalItems } = useCart();
  const [form, setForm] = useState({
    customer_name: user?.name || "",
    customer_phone: "",
    shipping_address: "",
    payment_method: paymentMethods[0],
    delivery_zone: "Zone 1",
  });
  const [error, setError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const shippingFee = form.delivery_zone === "Zone 1" ? 120 : 180;
  const grandTotal = useMemo(() => subtotal + (cart.length > 0 ? shippingFee : 0), [subtotal, shippingFee, cart.length]);
  const customerName = form.customer_name || user?.name || "";

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleCheckout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setOrderId(null);

    if (!token) {
      setError("Please log in before checkout.");
      return;
    }
    if (cart.length === 0) {
      setError("Your cart is empty.");
      return;
    }
    if (customerName.trim().length < 2 || form.customer_phone.trim().length < 7 || form.shipping_address.trim().length < 5) {
      setError("Complete your name, phone number, and shipping address.");
      return;
    }

    try {
      setSubmitting(true);
      const order = await createOrder(
        {
          ...form,
          customer_name: customerName,
          items: cart.map((item) => ({ product_id: item.id, quantity: item.quantity })),
        },
        token,
      );
      setOrderId(order.id);
      clearCart();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Checkout failed.");
    } finally {
      setSubmitting(false);
    }
  }

  if (orderId) {
    return (
      <main id="main-content" className="min-h-screen bg-archive-ivory px-4 pt-28 sm:px-6">
        <div className="mx-auto max-w-2xl rounded-sm border border-archive-gold/30 bg-white p-10 text-center shadow-xl">
          <CheckCircle2 className="mx-auto text-archive-green" size={56} />
          <h1 className="mt-6 font-playfair text-5xl font-semibold tracking-normal text-archive-green-dark">
            Order confirmed
          </h1>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            Order #{orderId} was created successfully. Refresh the dashboard to see updated store performance.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/dashboard"
              className="inline-flex h-12 items-center justify-center rounded-sm bg-archive-green-dark px-5 text-sm font-black uppercase tracking-[0.14em] text-white hover:bg-archive-gold hover:text-archive-green-dark"
            >
              View dashboard
            </Link>
            <Link
              href="/products"
              className="inline-flex h-12 items-center justify-center rounded-sm border border-slate-300 px-5 text-sm font-black uppercase tracking-[0.14em] text-slate-950 hover:bg-slate-100"
            >
              Keep shopping
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main id="main-content" className="min-h-screen bg-archive-ivory px-4 pb-20 pt-28 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <section className="mb-8">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-archive-gold">Checkout flow</p>
          <h1 className="mt-3 font-playfair text-5xl font-semibold tracking-normal text-archive-green-dark">Cart</h1>
        </section>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_420px]">
          <section className="space-y-4">
            {cart.length === 0 ? (
              <div className="rounded-sm border border-archive-gold/25 bg-white p-12 text-center shadow-sm">
                <ShoppingBag className="mx-auto text-slate-400" size={42} />
                <h2 className="mt-5 font-playfair text-3xl font-semibold tracking-normal text-archive-green-dark">
                  Your cart is empty
                </h2>
                <p className="mt-3 text-sm text-slate-500">Add a thrift item before checkout.</p>
                <Link
                  href="/products"
                  className="mt-7 inline-flex h-12 items-center justify-center rounded-sm bg-archive-green-dark px-5 text-sm font-black uppercase tracking-[0.14em] text-white hover:bg-archive-gold hover:text-archive-green-dark"
                >
                  Shop products
                </Link>
              </div>
            ) : (
              cart.map((item) => (
                <article key={item.id} className="rounded-sm border border-archive-gold/25 bg-white p-4 shadow-sm">
                  <div className="grid grid-cols-[90px_1fr] gap-4 sm:grid-cols-[110px_1fr_auto] sm:items-center">
                    <div className="relative aspect-[4/5] overflow-hidden rounded-sm bg-slate-100">
                      <Image
                        src={item.image || fallbackImage}
                        alt={item.name}
                        fill
                        sizes="110px"
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-black uppercase tracking-normal text-slate-950">{item.name}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">{item.category}</p>
                      <p className="mt-3 text-sm font-black tabular-nums text-slate-950">
                        {pesoFormatter.format(item.price)}
                      </p>
                    </div>
                    <div className="col-span-2 flex items-center justify-between gap-4 sm:col-span-1 sm:flex-col sm:items-end">
                      <div className="flex h-10 items-center rounded-sm border border-slate-200">
                        <button
                          type="button"
                          aria-label="Decrease quantity"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="flex h-10 w-10 items-center justify-center hover:bg-slate-100"
                        >
                          <Minus size={15} />
                        </button>
                        <span className="w-9 text-center text-xs font-black tabular-nums">{item.quantity}</span>
                        <button
                          type="button"
                          aria-label="Increase quantity"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="flex h-10 w-10 items-center justify-center hover:bg-slate-100"
                        >
                          <Plus size={15} />
                        </button>
                      </div>
                      <button
                        type="button"
                        aria-label={`Remove ${item.name}`}
                        onClick={() => removeFromCart(item.id)}
                        className="flex h-10 items-center gap-2 rounded-sm px-3 text-xs font-black uppercase tracking-[0.12em] text-rose-800 hover:bg-rose-50"
                      >
                        <Trash2 size={16} />
                        Remove
                      </button>
                    </div>
                  </div>
                </article>
              ))
            )}
          </section>

          <aside className="rounded-sm border border-archive-gold/25 bg-white p-5 shadow-sm lg:sticky lg:top-28 lg:self-start">
            <h2 className="font-playfair text-3xl font-semibold tracking-normal text-archive-green-dark">Order summary</h2>

            {!user && (
              <div className="mt-5 rounded-sm border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">
                Sign in or register to complete checkout.
                <div className="mt-3 flex gap-3">
                  <Link href="/login?next=/cart" className="font-black text-slate-950 underline">
                    Login
                  </Link>
                  <Link href="/register?next=/cart" className="font-black text-slate-950 underline">
                    Register
                  </Link>
                </div>
              </div>
            )}

            <form onSubmit={handleCheckout} className="mt-6 space-y-4">
              <TextField
                label="Name"
                value={customerName}
                onChange={(value) => updateField("customer_name", value)}
                autoComplete="name"
              />
              <TextField
                label="Phone"
                value={form.customer_phone}
                onChange={(value) => updateField("customer_phone", value)}
                autoComplete="tel"
              />
              <label className="block">
                <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Address</span>
                <textarea
                  value={form.shipping_address}
                  onChange={(event) => updateField("shipping_address", event.target.value)}
                  rows={3}
                  className="mt-2 w-full rounded-sm border border-archive-gold/25 bg-archive-ivory px-4 py-3 text-sm font-semibold outline-none transition-colors focus:border-archive-green-dark"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Delivery</span>
                  <select
                    value={form.delivery_zone}
                    onChange={(event) => updateField("delivery_zone", event.target.value)}
                    className="mt-2 h-12 w-full rounded-sm border border-archive-gold/25 bg-archive-ivory px-3 text-sm font-semibold outline-none focus:border-archive-green-dark"
                  >
                    <option>Zone 1</option>
                    <option>Zone 2</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Payment</span>
                  <select
                    value={form.payment_method}
                    onChange={(event) => updateField("payment_method", event.target.value)}
                    className="mt-2 h-12 w-full rounded-sm border border-archive-gold/25 bg-archive-ivory px-3 text-sm font-semibold outline-none focus:border-archive-green-dark"
                  >
                    {paymentMethods.map((method) => (
                      <option key={method}>{method}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="space-y-3 border-t border-archive-gold/25 pt-5 text-sm">
                <SummaryRow label={`Subtotal (${totalItems} items)`} value={pesoFormatter.format(subtotal)} />
                <SummaryRow label="Shipping" value={cart.length > 0 ? pesoFormatter.format(shippingFee) : pesoFormatter.format(0)} />
                <SummaryRow label="Total" value={pesoFormatter.format(grandTotal)} strong />
              </div>

              {error && (
                <p className="rounded-sm border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-800">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting || cart.length === 0 || !user}
                className="flex h-12 w-full items-center justify-center rounded-sm bg-archive-green-dark px-5 text-sm font-black uppercase tracking-[0.14em] text-white transition-colors hover:bg-archive-gold hover:text-archive-green-dark disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-archive-green-dark"
              >
                {submitting ? "Creating order..." : "Place order"}
              </button>
            </form>
          </aside>
        </div>
      </div>
    </main>
  );
}

function TextField({
  label,
  value,
  autoComplete,
  onChange,
}: {
  label: string;
  value: string;
  autoComplete?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">{label}</span>
      <input
        value={value}
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-12 w-full rounded-sm border border-archive-gold/25 bg-archive-ivory px-4 text-sm font-semibold outline-none transition-colors focus:border-archive-green-dark"
      />
    </label>
  );
}

function SummaryRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between ${strong ? "text-lg font-black text-slate-950" : "text-slate-600"}`}>
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}
