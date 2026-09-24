"use client";

import Link from "next/link";
import { LogIn } from "lucide-react";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

function getNextUrl() {
  if (typeof window === "undefined") return "/products";
  return new URLSearchParams(window.location.search).get("next") || "/products";
}

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function fillDemoAccount() {
    setEmail("demo@example.com");
    setPassword("DemoPass123");
    setError(null);
  }

  async function handleDemoLogin() {
    setEmail("demo@example.com");
    setPassword("DemoPass123");
    setError(null);
    setSuccess(null);
    try {
      setSubmitting(true);
      await login("demo@example.com", "DemoPass123");
      setSuccess("Logged in as Demo Buyer.");
      router.push(getNextUrl());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Demo login failed.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }
    if (!password) {
      setError("Password is required.");
      return;
    }

    try {
      setSubmitting(true);
      await login(email, password);
      setSuccess("Login successful.");
      router.push(getNextUrl());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main id="main-content" className="min-h-screen bg-archive-ivory px-4 pt-28 sm:px-6">
      <div className="mx-auto grid max-w-6xl grid-cols-1 overflow-hidden rounded-sm border border-archive-gold/25 bg-white shadow-xl lg:grid-cols-[0.9fr_1.1fr]">
        <section className="bg-archive-green-dark p-8 text-white lg:p-12">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-archive-gold">Customer Access</p>
          <h1 className="mt-4 font-playfair text-5xl font-semibold tracking-normal">Welcome Back</h1>
          <p className="mt-5 text-sm leading-7 text-slate-300">
            Log in to create orders, manage checkout, view order tracking, and keep your shopping experience personal.
          </p>

          <div className="mt-10 rounded-sm border border-archive-gold/40 bg-white/10 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-archive-gold">
              Portfolio Demo Access
            </p>
            <p className="mt-2 text-xs text-slate-200">
              For recruiters and portfolio reviewers: test checkout and analytics instantly with our pre-configured demo account.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleDemoLogin}
                disabled={submitting}
                className="inline-flex h-9 items-center justify-center rounded-sm bg-archive-gold px-4 text-xs font-black uppercase tracking-[0.12em] text-archive-green-dark hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-50"
              >
                1-Click Demo Login
              </button>
              <button
                type="button"
                onClick={fillDemoAccount}
                className="inline-flex h-9 items-center justify-center rounded-sm border border-white/30 px-3 text-xs font-bold text-white hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Fill Form
              </button>
            </div>
          </div>
        </section>

        <section className="p-6 sm:p-10 lg:p-12">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                name="email"
                autoComplete="email"
                spellCheck={false}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@example.com"
                className="mt-2 h-12 w-full rounded-sm border border-archive-gold/25 bg-archive-ivory px-4 text-sm font-semibold transition-colors focus:border-archive-green-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-archive-green-dark"
              />
            </div>
            <div>
              <label htmlFor="password" className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                Password
              </label>
              <input
                id="password"
                type="password"
                name="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-2 h-12 w-full rounded-sm border border-archive-gold/25 bg-archive-ivory px-4 text-sm font-semibold transition-colors focus:border-archive-green-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-archive-green-dark"
              />
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-sm border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800"
              >
                {error}
              </p>
            )}
            {success && (
              <p
                role="status"
                className="rounded-sm border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800"
              >
                {success}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-sm bg-archive-green-dark px-5 text-sm font-black uppercase tracking-[0.14em] text-white transition-colors hover:bg-archive-gold hover:text-archive-green-dark disabled:bg-slate-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-archive-green-dark"
            >
              <LogIn size={18} aria-hidden="true" />
              {submitting ? "Signing In…" : "Sign In"}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-500">
            New to Archive?{" "}
            <Link href="/register" className="font-black text-archive-green hover:text-archive-gold">
              Create an Account
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
