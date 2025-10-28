"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Star } from "lucide-react";
import Image from "next/image";
import { motion } from "framer-motion";
import { useColor } from "@app/context/ColorContext";
import { useState, useEffect } from "react";

export function Random({ product, productId, userId, ...props }) {
  const { isDarkMode } = useColor();
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Use productId prop if available, otherwise try to extract from product
  const currentProductId = productId || product?.product_id;

  // Load user's recently viewed from database
  useEffect(() => {
    const loadRecentlyViewed = async () => {
      console.log("Random component mounted with productId:", currentProductId);

      if (userId) {
        // Load from database for logged-in users
        try {
          const response = await fetch(
            `/api/user/recently-viewed?userId=${userId}`
          );
          if (response.ok) {
            const data = await response.json();
            const filtered = data
              .filter((item) => item.id !== currentProductId)
              .slice(-2);
            setRecentlyViewed(filtered);
            console.log("Loaded recently viewed from DB:", filtered.length);
          }
        } catch (error) {
          console.error("Error loading recently viewed:", error);
        }
      } else {
        // Fallback to localStorage for guests
        const storedRecent = localStorage.getItem("recentlyViewed");
        const recent = storedRecent ? JSON.parse(storedRecent) : [];
        const filtered = recent
          .filter((item) => item.id !== currentProductId)
          .slice(-2);
        setRecentlyViewed(filtered);
      }

      // Get similar products from localStorage (or you can also load from DB)
      const storedSimilar = localStorage.getItem("similarProducts");
      const similar = storedSimilar ? JSON.parse(storedSimilar) : [];
      setSimilarProducts(similar);

      setLoading(false);
    };

    loadRecentlyViewed();
  }, [currentProductId, userId]);

  // Add current product to recently viewed
  useEffect(() => {
    if (currentProductId && product?.title && product?.price) {
      console.log("Adding to recently viewed:", currentProductId);

      const viewedItem = {
        id: currentProductId,
        name: product.title,
        price: product.price,
        imgUrl: product.imgUrl,
        viewedAt: new Date().toISOString(),
      };

      if (userId) {
        // Save to database for logged-in users
        fetch("/api/user/recently-viewed", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            productId: currentProductId,
            productData: viewedItem,
          }),
        }).catch((error) => console.error("Error saving to DB:", error));
      } else {
        // Save to localStorage for guests
        const storedRecent = localStorage.getItem("recentlyViewed");
        const recent = storedRecent ? JSON.parse(storedRecent) : [];
        const filtered = recent.filter((item) => item.id !== currentProductId);
        const newRecent = [...filtered, viewedItem];
        localStorage.setItem(
          "recentlyViewed",
          JSON.stringify(newRecent.slice(-10))
        );
      }
    }
  }, [
    currentProductId,
    product?.title,
    product?.price,
    product?.imgUrl,
    userId,
  ]);

  if (loading) {
    return null;
  }

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
        <Card
          className={`
            p-6 rounded-3xl 
            backdrop-blur-xl 
            border 
            transition-all duration-500
            ${
              isDarkMode
                ? "bg-gray-900/70 shadow-[0_8px_30px_rgba(0,0,0,0.3)] border-gray-800/50 hover:shadow-[0_12px_40px_rgba(0,0,0,0.5)]"
                : "bg-white/70 shadow-[0_8px_30px_rgba(0,0,0,0.05)] border-gray-100/50 hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)]"
            }
          `}
        >
          <h3
            className={`mb-4 font-semibold ${
              isDarkMode ? "text-gray-100" : "text-gray-900"
            }`}
          >
            Recently Viewed
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {recentlyViewed.map((item, i) => (
              <motion.div
                key={i}
                className="flex gap-3 cursor-pointer"
                whileHover={{ scale: 1.03 }}
              >
                <div
                  className={`w-16 h-16 rounded-lg overflow-hidden ${
                    isDarkMode ? "bg-gray-800" : "bg-gray-100"
                  }`}
                >
                  <Image
                    src={item.imgUrl || "/placeholder.jpg"}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    width={200}
                    height={200}
                    unoptimized
                  />
                </div>
                <div className="flex-1">
                  <p
                    className={`text-sm font-medium ${
                      isDarkMode ? "text-gray-100" : "text-gray-900"
                    }`}
                  >
                    {item.name}
                  </p>
                  <p
                    className={`text-sm ${
                      isDarkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    ${item.price}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      )}

      {/* Similar Products */}
      {similarProducts.length > 0 && (
        <Card
          className={`
            p-6 rounded-3xl 
            backdrop-blur-xl 
            border 
            transition-all duration-500
            ${
              isDarkMode
                ? "bg-gray-900/70 shadow-[0_8px_30px_rgba(0,0,0,0.3)] border-gray-800/50 hover:shadow-[0_12px_40px_rgba(0,0,0,0.5)]"
                : "bg-white/70 shadow-[0_8px_30px_rgba(0,0,0,0.05)] border-gray-100/50 hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)]"
            }
          `}
        >
          <h3
            className={`mb-4 font-semibold ${
              isDarkMode ? "text-gray-100" : "text-gray-900"
            }`}
          >
            Similar Products
          </h3>
          <div className="space-y-4">
            {similarProducts.map((prod, index) => (
              <motion.div
                key={prod.id}
                className={`flex gap-4 p-4 border rounded-lg transition-shadow ${
                  isDarkMode
                    ? "border-gray-700/70 hover:shadow-md hover:bg-gray-800/50"
                    : "border-gray-200 hover:shadow-md hover:bg-gray-50/50"
                }`}
                whileHover={{ scale: 1.02 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <div
                  className={`w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 ${
                    isDarkMode ? "bg-gray-800" : "bg-gray-100"
                  }`}
                >
                  {prod.imgUrl && (
                    <Image
                      src={prod.imgUrl}
                      alt={prod.name}
                      className="w-full h-full object-cover"
                      width={200}
                      height={200}
                      unoptimized
                    />
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <h4
                    className={`font-medium text-sm ${
                      isDarkMode ? "text-gray-100" : "text-gray-900"
                    }`}
                  >
                    {prod.name}
                  </h4>
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-orange-400 text-orange-400" />
                    <span
                      className={`text-xs ${
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      {prod.rating}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-semibold ${
                        isDarkMode ? "text-gray-100" : "text-gray-900"
                      }`}
                    >
                      ${prod.price}
                    </span>
                    {prod.originalPrice && (
                      <span
                        className={`text-sm line-through ${
                          isDarkMode ? "text-gray-500" : "text-gray-400"
                        }`}
                      >
                        ${prod.originalPrice}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-8 w-8 ${
                      isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
                    }`}
                  >
                    <Heart
                      className={`h-4 w-4 ${
                        isDarkMode ? "text-gray-400" : "text-gray-600"
                      }`}
                    />
                  </Button>
                  <Button
                    size="sm"
                    className={`text-xs px-3 ${
                      isDarkMode
                        ? "bg-white text-black hover:bg-gray-200"
                        : "bg-black text-white hover:bg-gray-800"
                    }`}
                  >
                    Add
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      )}
    </motion.div>
  );
}
