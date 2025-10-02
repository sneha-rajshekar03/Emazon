"use client";
import { useState } from "react";
import { useCart } from "@app/context/CartContent";
import { useSession } from "next-auth/react";
import { ShoppingCart, Check } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";

export function BuyBox({ product, ...props }) {
  const { addToCart } = useCart();
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const handleAddToCart = () => {
    if (!session) {
      // If not logged in, redirect to login then back to this product page
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    // If logged in, add to cart normally
    addToCart(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleBuyNow = () => {
    if (!session) {
      // If not logged in, redirect to login then to checkout
      addToCart(product, quantity);
      router.push(`/login?redirect=/checkout`);
      return;
    }

    // If logged in, add to cart and go to checkout
    addToCart(product, quantity);
    router.push("/checkout");
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6" {...props}>
      <div className="mb-4">
        <span className="text-3xl font-bold text-gray-900">
          ${product.price?.toFixed(2)}
        </span>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Quantity
        </label>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
          >
            -
          </button>
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) =>
              setQuantity(Math.max(1, parseInt(e.target.value) || 1))
            }
            className="w-20 text-center border border-gray-300 rounded-lg py-2"
          />
          <button
            onClick={() => setQuantity(quantity + 1)}
            className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
          >
            +
          </button>
        </div>
      </div>

      <button
        onClick={handleAddToCart}
        className={`w-full py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${
          added
            ? "bg-green-600 text-white"
            : "bg-blue-600 text-white hover:bg-blue-700"
        }`}
      >
        {added ? (
          <>
            <Check className="w-5 h-5" />
            Added to Cart!
          </>
        ) : (
          <>
            <ShoppingCart className="w-5 h-5" />
            {!session ? "Login to Add to Cart" : "Add to Cart"}
          </>
        )}
      </button>

      <button
        onClick={handleBuyNow}
        className="w-full mt-3 py-3 rounded-lg font-semibold bg-orange-500 text-white hover:bg-orange-600 transition-colors"
      >
        {!session ? "Login to Buy Now" : "Buy Now"}
      </button>
    </div>
  );
}
