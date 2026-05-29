"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { BarChart3, LogOut, ShoppingBag, Store, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";

export default function Navbar() {
  const { totalItems, setIsCartOpen } = useCart();
  const { user, logout } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <nav className="fixed inset-x-0 top-0 z-40 animate-fade-in border-b border-white/10 bg-archive-green-dark/95 text-white backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-3 px-3 sm:px-6">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white sm:gap-3"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border border-archive-gold/50 bg-white/5 text-archive-gold sm:h-11 sm:w-11">
            <Store size={19} strokeWidth={1.8} />
          </span>
          <span className="min-w-0 leading-none">
            <span className="block truncate font-playfair text-xl tracking-normal sm:text-2xl">Archive</span>
            <span className="block truncate text-[8px] font-bold uppercase tracking-[0.12em] text-archive-gold sm:text-[10px] sm:tracking-[0.18em]">
              Curated Thrift
            </span>
          </span>
        </Link>

        <div className="flex shrink-0 items-center gap-1 sm:gap-3">
          <NavLink href="/products">Shop</NavLink>
          <Link
            href="/dashboard"
            aria-label="Analytics dashboard"
            className="flex h-10 items-center gap-1 rounded-sm px-2 text-[10px] font-bold uppercase tracking-[0.08em] text-white/80 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:gap-2 sm:px-3 sm:text-xs sm:tracking-[0.12em]"
          >
            <BarChart3 size={15} />
            <span>Dashboard</span>
          </Link>

          {mounted && user ? (
            <div className="flex items-center gap-1 sm:gap-2">
              <span className="hidden max-w-32 truncate text-xs font-bold text-white/75 md:block">{user.name}</span>
              <button
                type="button"
                aria-label="Log out"
                onClick={logout}
                className="flex h-10 items-center gap-1 rounded-sm px-2 text-[10px] font-bold uppercase tracking-[0.08em] text-white/80 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:px-3 sm:text-xs"
              >
                <LogOut size={18} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="flex h-10 items-center gap-1 rounded-sm px-2 text-[10px] font-bold uppercase tracking-[0.08em] text-white/80 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:px-3 sm:text-xs"
            >
              <UserRound size={18} />
              <span>Login</span>
            </Link>
          )}

          <button
            type="button"
            aria-label="Open cart"
            onClick={() => setIsCartOpen(true)}
            className="relative flex h-10 w-10 items-center justify-center rounded-sm bg-archive-gold text-archive-green-dark transition-colors hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <ShoppingBag size={18} />
            {mounted && totalItems > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-700 px-1 text-[10px] font-bold tabular-nums text-white">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </div>
    </nav>
  );
}

function NavLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-sm px-3 py-3 text-xs font-bold uppercase tracking-[0.12em] text-white/80 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
    >
      {children}
    </Link>
  );
}
