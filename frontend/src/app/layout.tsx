import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import SlideOutCart from "@/components/SlideOutCart";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "Archive Thrift | Premium Pre-Loved Finds",
  description: "A premium thrift-store e-commerce experience with curated clothing, bags, accessories, checkout, and store analytics.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="bg-archive-ivory">
      <body className="font-dm-sans text-archive-graphite">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:bg-white focus:px-4 focus:py-3 focus:text-sm focus:font-bold focus:outline focus:outline-2 focus:outline-black"
        >
          Skip to content
        </a>
        <AuthProvider>
          <CartProvider>
            <Navbar />
            <SlideOutCart />
            {children}
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
