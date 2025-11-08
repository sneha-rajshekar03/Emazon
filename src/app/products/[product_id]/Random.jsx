"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useColor } from "@/app/context/ColorContext";
import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";

export function Random({ product, productId, userId, ...props }) {
  const { hexColor, isDarkMode } = useColor();
  const router = useRouter();
  const pathname = usePathname();

  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const hasTracked = useRef(false);
  const lastTrackedId = useRef(null);
  const currentProductId = productId || product?.product_id;

  // 🟢 Load Recently Viewed + Similar Products
  useEffect(() => {
    const loadRecentlyViewed = async () => {
      try {
        if (!currentProductId) return;

        console.log("📦 Loading recently viewed for:", currentProductId);

        if (userId) {
          const res = await fetch(`/api/user/recently-viewed?userId=${userId}`);
          if (res.ok) {
            const data = await res.json();
            const filtered = data
              .filter(
                (item) =>
                  item.product_id &&
                  item.product_id !== currentProductId &&
                  item.title &&
                  item.price
              )
              .slice(-2);
            setRecentlyViewed(filtered);
          }
        } else {
          const storedRecent = localStorage.getItem("recentlyViewed");
          const recent = storedRecent ? JSON.parse(storedRecent) : [];
          const filtered = recent
            .filter(
              (item) =>
                item.product_id &&
                item.product_id !== currentProductId &&
                item.name &&
                item.price
            )
            .slice(-2);
          setRecentlyViewed(filtered);
        }

        const storedSimilar = localStorage.getItem("similarProducts");
        const similar = storedSimilar ? JSON.parse(storedSimilar) : [];
        const validSimilar = similar.filter((p) => p.product_id && p.price);
        setSimilarProducts(validSimilar);
      } catch (error) {
        console.error("🚨 Error loading recently viewed:", error);
      } finally {
        setLoading(false);
      }
    };

    loadRecentlyViewed();
  }, [currentProductId, userId]);

  // 🟡 Track Product View (Only Once Per Product)
  useEffect(() => {
    if (!currentProductId || hasTracked.current) return;
    if (!product?.title || !product?.price) {
      console.log("⚠️ Skipping tracking — product incomplete:", product);
      return;
    }

    hasTracked.current = true;
    lastTrackedId.current = currentProductId;

    console.log("🧾 Tracking product view:", currentProductId);

    const viewedItem = {
      product_id: currentProductId,
      name: product.title,
      price: product.price,
      imgUrl: product.imgUrl,
      viewedAt: new Date().toISOString(),
    };

    const saveView = async () => {
      try {
        if (userId) {
          await fetch("/api/user/recently-viewed", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId,
              productId: currentProductId,
              productData: viewedItem,
            }),
          });
        } else {
          const storedRecent = localStorage.getItem("recentlyViewed");
          const recent = storedRecent ? JSON.parse(storedRecent) : [];
          const filtered = recent.filter(
            (item) => item.product_id !== currentProductId
          );
          const newRecent = [...filtered, viewedItem];
          localStorage.setItem(
            "recentlyViewed",
            JSON.stringify(newRecent.slice(-10))
          );
        }
      } catch (err) {
        console.error("❌ Error saving viewed product:", err);
      }
    };

    const timeout = setTimeout(saveView, 300);
    return () => clearTimeout(timeout);
  }, [
    currentProductId,
    product?.title,
    product?.price,
    product?.imgUrl,
    userId,
  ]);

  // 🟣 Reset tracking on route change
  useEffect(() => {
    hasTracked.current = false;
    lastTrackedId.current = null;
  }, [pathname]);

  // 🟠 Validate product before navigating
  const validateProductExists = async (pid) => {
    try {
      const res = await fetch(`/api/products/${pid}`);
      return res.ok;
    } catch (err) {
      console.warn("⚠️ Validation error:", err);
      return false;
    }
  };

  // 🟤 Product click handler
  const handleProductClick = async (pid) => {
    if (!pid || pid === currentProductId) {
      console.log("⚠️ Same or invalid product clicked — ignoring");
      return;
    }

    const isValid = await validateProductExists(pid);
    if (!isValid) {
      console.warn(
        `🚫 Product ${pid} not found in DB — removing from recent list.`
      );
      const storedRecent = JSON.parse(
        localStorage.getItem("recentlyViewed") || "[]"
      );
      const cleaned = storedRecent.filter((p) => p.product_id !== pid);
      localStorage.setItem("recentlyViewed", JSON.stringify(cleaned));
      setRecentlyViewed(cleaned);
      return;
    }

    console.log("➡️ Navigating to valid product:", pid);
    router.push(`/products/${pid}`);
  };

  if (loading) return null;

  return (
    <motion.div
      {...props}
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Recently Viewed */}
      {recentlyViewed.length > 0 && (
        <div
          className="relative p-6 rounded-3xl border transition-all duration-500"
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
          {/* Lighter color tint overlay */}
          <div
            style={{
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: `linear-gradient(135deg, ${hexColor}05 0%, ${hexColor}0a 100%)`,
              pointerEvents: "none",
              zIndex: 0,
            }}
          />

          {/* Color tint in bottom-right corner */}
          <div
            style={{
              content: '""',
              position: "absolute",
              bottom: "-10%",
              right: "-10%",
              width: "45%",
              height: "45%",
              background: `radial-gradient(circle at bottom right, ${hexColor}35 0%, transparent 75%)`,
              pointerEvents: "none",
              zIndex: 0,
              filter: "blur(12px)",
            }}
          />

          <div className="relative z-10">
            <h3
              className={`text-lg font-semibold mb-4 ${
                isDarkMode ? "text-gray-100" : "text-gray-900"
              }`}
            >
              Recently Viewed
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {recentlyViewed.map((item, i) => (
                <motion.div
                  key={`recent-${item.product_id}-${i}`}
                  className={`flex gap-3 cursor-pointer p-3 rounded-xl transition-all ${
                    isDarkMode ? "hover:bg-gray-800/50" : "hover:bg-gray-100/50"
                  }`}
                  whileHover={{ scale: 1.03 }}
                  onClick={() => handleProductClick(item.product_id)}
                >
                  <div className="relative w-24 h-24 flex-shrink-0">
                    <Image
                      src={item.imgUrl || "/placeholder.jpg"}
                      alt={item.name}
                      fill
                      className="object-contain rounded-lg"
                      unoptimized
                    />
                  </div>
                  <div className="flex flex-col justify-center">
                    <p
                      className={`font-medium line-clamp-2 text-sm ${
                        isDarkMode ? "text-gray-100" : "text-gray-900"
                      }`}
                    >
                      {item.name}
                    </p>
                    <p
                      className={`text-sm font-semibold mt-1 ${
                        isDarkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      ${item.price}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Similar Products */}
      {similarProducts.length > 0 && (
        <div
          className="relative p-6 rounded-3xl border transition-all duration-500"
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
          {/* Lighter color tint overlay */}
          <div
            style={{
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: `linear-gradient(135deg, ${hexColor}05 0%, ${hexColor}0a 100%)`,
              pointerEvents: "none",
              zIndex: 0,
            }}
          />

          {/* Color tint in bottom-right corner */}
          <div
            style={{
              content: '""',
              position: "absolute",
              bottom: "-10%",
              right: "-10%",
              width: "45%",
              height: "45%",
              background: `radial-gradient(circle at bottom right, ${hexColor}35 0%, transparent 75%)`,
              pointerEvents: "none",
              zIndex: 0,
              filter: "blur(12px)",
            }}
          />

          <div className="relative z-10">
            <h3
              className={`text-lg font-semibold mb-4 ${
                isDarkMode ? "text-gray-100" : "text-gray-900"
              }`}
            >
              Similar Products
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {similarProducts.map((prod, index) => (
                <motion.div
                  key={`similar-${prod.product_id}-${index}`}
                  className={`flex gap-3 cursor-pointer p-3 rounded-xl transition-all ${
                    isDarkMode ? "hover:bg-gray-800/50" : "hover:bg-gray-100/50"
                  }`}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => handleProductClick(prod.product_id)}
                >
                  <div className="relative w-24 h-24 flex-shrink-0">
                    <Image
                      src={prod.imgUrl || "/placeholder.jpg"}
                      alt={prod.name}
                      fill
                      className="object-contain rounded-lg"
                      unoptimized
                    />
                  </div>
                  <div className="flex flex-col justify-center">
                    <h4
                      className={`font-medium line-clamp-2 text-sm ${
                        isDarkMode ? "text-gray-100" : "text-gray-900"
                      }`}
                    >
                      {prod.name}
                    </h4>
                    <p
                      className={`text-sm font-semibold mt-1 ${
                        isDarkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      ${prod.price}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
