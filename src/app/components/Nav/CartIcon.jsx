"use client";
import { useCart } from "@app/context/CartContent";
import { useColor } from "@app/context/ColorContext";
import { ShoppingCart } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function CartButton() {
  const { getCartCount } = useCart();
  const { hexColor } = useColor();
  const cartCount = getCartCount();
  const pathname = usePathname();

  return (
    <Link
      href="/Cart"
      className="relative flex items-center gap-2 px-4 py-2 rounded-lg transition-all hover:opacity-90 active:scale-95"
      style={{
        background: `linear-gradient(135deg, ${hexColor} 0%, ${hexColor}dd 100%)`,
        color: "white",
      }}
    >
      <ShoppingCart className="w-4 h-4" strokeWidth={2} />
      <span className="text-sm font-medium">Cart</span>
      {pathname !== "/Cart" && cartCount > 0 && (
        <span
          className="absolute -top-1.5 -right-1.5 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-md"
          style={{
            background: "#EF4444",
            border: "2px solid white",
          }}
        >
          {cartCount}
        </span>
      )}
    </Link>
  );
}
