// /app/components/productCard/ProductCard.jsx
"use client";
import Image from "next/image";
import Link from "next/link";
import { useColor } from "@app/context/ColorContext";

// 🔹 Record interaction when user clicks on product
async function recordProductClick(product) {
  try {
    await fetch("/api/interaction", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        product_id: product.product_id || product._id || product.id,
        title: product.title,
        category: product.category_name || product.category,
        price: product.price,
        stars: product.stars,
        seller_name: product.seller_name,
        action: "click",
      }),
    });
  } catch (error) {
    console.error("Error recording product click:", error);
    // Don't block navigation if tracking fails
  }
}

export default function ProductCard({ product, onProductClick }) {
  const { hexColor, isDarkMode } = useColor();

  // Ensure we have a valid product ID
  const productId = product.product_id || product._id || product.id;

  // Don't render if no valid ID
  const validProductId =
    productId || product.product_id || product._id || product.id;

  if (!validProductId) {
    console.error("Invalid product ID:", product);
    return null;
  }

  // Don't render products with price of "0", 0, or invalid prices
  if (
    !product.price ||
    product.price === "0" ||
    product.price === 0 ||
    product.price === "N/A"
  ) {
    return null;
  }

  const handleClick = () => {
    // Record interaction in Python API for preference learning
    recordProductClick(product);

    // Track interaction with parent component callback (if provided)
    if (onProductClick) {
      onProductClick(product);
    }
  };

  // Calculate match score from various sources
  const getMatchScore = () => {
    // Priority: preference_score > final_score > ml_scores
    if (
      product.preference_score !== undefined &&
      product.preference_score > 0
    ) {
      return Math.round(product.preference_score * 100);
    }
    if (product.final_score !== undefined && product.final_score > 0) {
      return Math.round(product.final_score * 100);
    }
    if (product.ml_scores) {
      return Math.round(
        (product.ml_scores.recommendation_score ||
          product.ml_scores.relevance_score ||
          0) * 100
      );
    }
    return null;
  };

  const matchScore = getMatchScore();

  return (
    <Link
      href={`/products/${validProductId}`}
      prefetch={false}
      onClick={handleClick}
      scroll={true}
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
        {/* Match Score Badge - Shows personalization strength */}
        {matchScore > 0 && (
          <div
            className="absolute top-4 right-4 z-20 px-3 py-1 rounded-full text-xs font-semibold"
            style={{
              background: isDarkMode
                ? "rgba(255, 255, 255, 0.1)"
                : "rgba(0, 0, 0, 0.05)",
              backdropFilter: "blur(8px)",
              color: hexColor,
              border: `1px solid ${hexColor}40`,
            }}
          >
            {matchScore}% Match
          </div>
        )}

        {/* Hybrid Recommender Badge - Shows if from hybrid system */}
        {(product.final_score || product.preference_score) && (
          <div
            className="absolute top-4 left-4 z-20 px-2 py-1 rounded-full text-[10px] font-medium"
            style={{
              background: isDarkMode
                ? "rgba(147, 51, 234, 0.2)"
                : "rgba(147, 51, 234, 0.1)",
              backdropFilter: "blur(8px)",
              color: isDarkMode ? "#c084fc" : "#9333ea",
              border: `1px solid ${isDarkMode ? "#9333ea40" : "#9333ea20"}`,
            }}
          >
            ✨ AI Picked
          </div>
        )}

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
              <span className="text-yellow-500">⭐</span>
              <span
                className={`text-sm ${
                  isDarkMode ? "text-gray-300" : "text-gray-600"
                }`}
              >
                {product.stars}
              </span>
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
