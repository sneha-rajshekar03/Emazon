// app/components/productCard/ProductCard.jsx
"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useColor } from "@/app/context/ColorContext";

// ✅ REMOVED: Weak signal tracking (moved to page level)
// ✅ ONLY handles STRONG signals (clicks)

async function recordProductClick({ userId, product }) {
  const productId = product.product_id || product._id || product.id;
  const title = product.title || "Untitled Product";

  const cleanValue = (val) => {
    if (!val || val === "N/A" || val === "" || val === 0 || val === "0") {
      return null;
    }
    return String(val);
  };

  const payload = {
    user_id: userId || "guest_user",
    product_id: String(productId),
    title: String(title),
    category: cleanValue(product.category_name || product.category),
    price: cleanValue(product.price),
    stars: cleanValue(product.stars),
    seller_name: cleanValue(product.seller_name),
    weak_signal: false, // ✅ ALWAYS false for clicks
  };

  console.log("🟣 [CLICK] Sending strong signal:", {
    user_id: payload.user_id,
    product_id: payload.product_id,
    category: payload.category,
  });

  try {
    const res = await fetch("/api/product-interaction", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("🔴 [CLICK] Failed:", {
        status: res.status,
        data,
      });
    } else {
      console.log("✅ [CLICK] Recorded:", {
        total_clicks: data.total_clicks,
        status: data.status,
      });
    }
  } catch (err) {
    console.error("🔴 [CLICK] Error:", err);
  }
}

export default function ProductCard({ product, onProductClick }) {
  const { hexColor, isDarkMode } = useColor();
  const { data: session } = useSession();
  const clickGuardRef = useRef(false);

  const userId = session?.user?.id || session?.user?._id || "guest_user";
  const productId = product.product_id || product._id || product.id;

  if (!productId) {
    console.warn("⚠️ [ProductCard] Missing productId");
    return null;
  }

  const price = product.price;
  const isPriceValid =
    price &&
    price !== "N/A" &&
    price !== "" &&
    price !== 0 &&
    price !== "0" &&
    price !== "0.0";

  if (!isPriceValid) {
    console.warn("⚠️ [ProductCard] Invalid price, skipping");
    return null;
  }

  const handleClick = () => {
    if (clickGuardRef.current) {
      console.warn("⚠️ [CLICK] Duplicate ignored");
      return;
    }

    clickGuardRef.current = true;

    console.log("🔵 [CLICK] Product clicked", {
      userId,
      productId,
      title: product.title,
    });

    // Record strong signal
    recordProductClick({ userId, product });

    // Parent callback
    if (onProductClick) {
      onProductClick(product);
    }

    setTimeout(() => {
      clickGuardRef.current = false;
    }, 1000);
  };

  const getMatchScore = () => {
    if (product.ml_scores) {
      const score =
        product.ml_scores.final_score ||
        product.ml_scores.recommendation_score ||
        0;
      return Math.round(score * 100);
    }
    return null;
  };

  const matchScore = getMatchScore();

  return (
    <Link
      href={`/products/${productId}`}
      prefetch={false}
      onClick={handleClick}
      scroll
    >
      <div
        className="relative rounded-3xl p-6 border transition-all duration-500 cursor-pointer
                   hover:-translate-y-[4px] flex flex-col justify-between min-h-[420px]"
        style={{
          background: isDarkMode
            ? "rgba(45,45,45,0.6)"
            : "rgba(255,255,255,0.6)",
          backdropFilter: "blur(16px)",
          border: isDarkMode
            ? "1px solid rgba(255,255,255,0.1)"
            : "1px solid rgba(255,255,255,0.6)",
          boxShadow: isDarkMode
            ? "0 4px 20px rgba(0,0,0,0.3)"
            : "0 4px 20px rgba(0,0,0,0.05)",
        }}
      >
        {matchScore !== null && (
          <div
            className="absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-semibold"
            style={{
              color: hexColor,
              border: `1px solid ${hexColor}40`,
            }}
          >
            {matchScore}% Match
          </div>
        )}

        {(product.final_score || product.ml_scores) && (
          <div className="absolute top-4 left-4 text-[10px] font-medium text-purple-500">
            ✨ AI Picked
          </div>
        )}

        <div className="relative w-full h-48 flex items-center justify-center">
          {product.imgUrl ? (
            <Image
              src={product.imgUrl}
              alt={product.title || "Product"}
              fill
              className="object-contain p-4"
              unoptimized
            />
          ) : (
            <div className="text-gray-400">No Image</div>
          )}
        </div>

        <div className="text-center mt-4 space-y-2">
          <h2 className="font-semibold line-clamp-2">{product.title}</h2>
          <p className="font-medium">${product.price}</p>
          {product.category_name && (
            <p className="text-xs text-gray-400">{product.category_name}</p>
          )}
        </div>
      </div>
    </Link>
  );
}
