"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { CartItem, Product } from "@/lib/types";

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  removeFromCart: (id: number) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  subtotal: number;
  totalItems: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);
const STORAGE_KEY = "archive_thrift_cart";

function readStoredCart(): CartItem[] {
  if (typeof window === "undefined") return [];

  try {
    const savedCart = window.localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = savedCart ? JSON.parse(savedCart) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is CartItem => {
      return (
        typeof item === "object" &&
        item !== null &&
        "id" in item &&
        "name" in item &&
        "price" in item &&
        "quantity" in item
      );
    });
  } catch {
    return [];
  }
}

function toCartItem(product: Product, quantity: number): CartItem {
  return {
    id: product.id,
    name: product.name,
    price: product.price,
    image: product.image_url || product.images?.[0] || "",
    category: product.category,
    stock_quantity: product.stock_quantity,
    quantity,
  };
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>(readStoredCart);
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);
  const totalItems = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);

  const addToCart = (product: Product, quantity = 1) => {
    if (product.stock_quantity <= 0 || product.status !== "available") return;

    setCart((previous) => {
      const existing = previous.find((item) => item.id === product.id);
      if (!existing) return [...previous, toCartItem(product, Math.min(quantity, product.stock_quantity))];

      return previous.map((item) =>
        item.id === product.id
          ? {
              ...item,
              stock_quantity: product.stock_quantity,
              quantity: Math.min(item.quantity + quantity, product.stock_quantity),
            }
          : item,
      );
    });
    setIsCartOpen(true);
  };

  const updateQuantity = (id: number, quantity: number) => {
    setCart((previous) =>
      previous.map((item) =>
        item.id === id
          ? {
              ...item,
              quantity: Math.max(1, Math.min(quantity, item.stock_quantity || quantity)),
            }
          : item,
      ),
    );
  };

  const removeFromCart = (id: number) => {
    setCart((previous) => previous.filter((item) => item.id !== id));
  };

  const clearCart = () => {
    setCart([]);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        isCartOpen,
        setIsCartOpen,
        subtotal,
        totalItems,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
