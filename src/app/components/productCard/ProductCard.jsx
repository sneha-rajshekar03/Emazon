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
            ? "rgba(45, 45, 45, 0.6)"
            : "rgba(255, 255, 255, 0.6)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: isDarkMode
            ? "1px solid rgba(255, 255, 255, 0.1)"
            : "1px solid rgba(255, 255, 255, 0.6)",
          borderRadius: "28px",
          boxShadow: isDarkMode
            ? `0 4px 20px rgba(0, 0, 0, 0.3), inset 0 0 10px rgba(255, 255, 255, 0.05)`
            : `0 4px 20px rgba(0, 0, 0, 0.05), inset 0 0 10px rgba(255, 255, 255, 0.3)`,
          position: "relative",
          overflow: "hidden",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = isDarkMode
            ? `0 15px 30px rgba(0, 0, 0, 0.5)`
            : `0 15px 30px rgba(0, 0, 0, 0.08)`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = isDarkMode
            ? `0 4px 20px rgba(0, 0, 0, 0.3), inset 0 0 10px rgba(255, 255, 255, 0.05)`
            : `0 4px 20px rgba(0, 0, 0, 0.05), inset 0 0 10px rgba(255, 255, 255, 0.3)`;
        }}
      >
        {/* Color tint in bottom-right corner */}
        <div
          style={{
            content: '""',
            position: "absolute",
            bottom: "-10%",
            right: "-10%",
            width: "45%",
            height: "45%",
            background: `radial-gradient(circle at bottom right, ${hexColor}55 0%, transparent 75%)`,
            pointerEvents: "none",
            zIndex: 0,
            filter: "blur(12px)",
          }}
        />

        {/* Product Image */}
        <div className="relative w-full h-48 flex justify-center items-center z-10">
          {product.imgUrl && product.imgUrl !== "N/A" ? (
            <Image
              src={product.imgUrl}
              alt={product.title || "Product"}
              fill
              className="object-contain p-4 scale-95 transition-transform duration-500 hover:scale-100"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-200 rounded">
              <span className="text-gray-400">No Image</span>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="mt-4 text-center space-y-2 z-10">
          <h2
            className={`font-semibold text-lg tracking-tight line-clamp-2 ${
              isDarkMode ? "text-gray-100" : "text-gray-800"
            }`}
          >
            {product.title || "Untitled Product"}
          </h2>

          {/* Rating */}
          {product.stars && product.stars !== "N/A" && (
            <div className="flex items-center justify-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => {
                const rating = parseFloat(product.stars);
                const filled = star <= Math.floor(rating);
                const partial = star === Math.ceil(rating) && rating % 1 !== 0;

                return (
                  <span
                    key={star}
                    className="relative inline-block"
                    style={{ fontSize: "16px" }}
                  >
                    {filled ? (
                      <span className="text-yellow-500">★</span>
                    ) : partial ? (
                      <>
                        <span
                          className={
                            isDarkMode ? "text-gray-600" : "text-gray-300"
                          }
                        >
                          ★
                        </span>
                        <span
                          className="absolute top-0 left-0 text-yellow-500 overflow-hidden"
                          style={{ width: `${(rating % 1) * 100}%` }}
                        >
                          ★
                        </span>
                      </>
                    ) : (
                      <span
                        className={
                          isDarkMode ? "text-gray-600" : "text-gray-300"
                        }
                      >
                        ★
                      </span>
                    )}
                  </span>
                );
              })}
            </div>
          )}

          {/* Price */}
          <p
            className={`text-[1.1rem] font-medium ${
              isDarkMode ? "text-gray-200" : "text-gray-900"
            }`}
          >
            ${product.price}
          </p>

          {/* Category */}
          {product.category_name && (
            <p
              className={`text-xs ${
                isDarkMode ? "text-gray-500" : "text-gray-400"
              }`}
            >
              {product.category_name}
            </p>
          )}

          {/* Delivery info */}
          <p
            className={`text-sm ${
              isDarkMode ? "text-gray-500" : "text-gray-400"
            }`}
          >
            Free delivery · Fast shipping
          </p>
        </div>
      </div>
    </Link>
  );
}
