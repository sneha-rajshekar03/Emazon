"use client";
import { useCart } from "@app/context/CartContent";
import { ShoppingCart } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function CartButton() {
  const { getCartCount } = useCart();
  const cartCount = getCartCount();
  const pathname = usePathname();
  return (
    <Link
      href="/Cart"
      className="relative flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
    >
      <ShoppingCart className="w-5 h-5" />
      <span className="font-semibold">Cart</span>
      {pathname !== "/Cart" && cartCount > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
          {cartCount}
        </span>
      )}
    </Link>
  );
}
