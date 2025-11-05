"use client";

import { Card } from "@/components/ui/card";
import Image from "next/image";
import { motion } from "framer-motion";
import { useColor } from "@app/context/ColorContext";
import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";

export function Random({ product, productId, userId, ...props }) {
  const { isDarkMode } = useColor();
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
              .slice(-2); // ✅ Only last 2
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
            .slice(-2); // ✅ Only last 2
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
        <Card className="p-6 rounded-3xl">
          <h3 className="text-lg font-semibold mb-4">Recently Viewed</h3>
          <div className="grid grid-cols-2 gap-4">
            {recentlyViewed.map((item, i) => (
              <motion.div
                key={`recent-${item.product_id}-${i}`}
                className="flex gap-3 cursor-pointer"
                whileHover={{ scale: 1.03 }}
                onClick={() => handleProductClick(item.product_id)}
              >
                <Image
                  src={item.imgUrl || "/placeholder.jpg"}
                  alt={item.name}
                  width={100}
                  height={100}
                  unoptimized
                />
                <div>
                  <p className="font-medium line-clamp-2">{item.name}</p>
                  <p className="text-gray-500">${item.price}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      )}

      {/* Similar Products */}
      {similarProducts.length > 0 && (
        <Card className="p-6 rounded-3xl">
          <h3 className="text-lg font-semibold mb-4">Similar Products</h3>
          <div className="grid grid-cols-2 gap-4">
            {similarProducts.map((prod, index) => (
              <motion.div
                key={`similar-${prod.product_id}-${index}`}
                className="flex gap-3 cursor-pointer"
                whileHover={{ scale: 1.02 }}
                onClick={() => handleProductClick(prod.product_id)}
              >
                <Image
                  src={prod.imgUrl || "/placeholder.jpg"}
                  alt={prod.name}
                  width={100}
                  height={100}
                  unoptimized
                />
                <div>
                  <h4 className="font-medium line-clamp-2">{prod.name}</h4>
                  <p className="text-gray-500">${prod.price}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      )}
    </motion.div>
  );
}
