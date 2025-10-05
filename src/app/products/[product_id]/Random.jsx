"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Star } from "lucide-react";
import Image from "next/image";
import { motion } from "framer-motion";
import { useColor } from "@app/context/ColorContext";

const relatedProducts = [
  {
    id: 1,
    name: "Premium Wireless Earbuds",
    price: 199.99,
    originalPrice: 249.99,
    rating: 4.8,
  },
  {
    id: 2,
    name: "Studio Monitor Headphones",
    price: 299.99,
    rating: 4.9,
  },
  {
    id: 3,
    name: "Gaming Headset Pro",
    price: 159.99,
    originalPrice: 199.99,
    rating: 4.7,
  },
];

export function Random({ product, ...props }) {
  const { isDarkMode } = useColor();

  return (
    <motion.div
      {...props}
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Recently Viewed */}
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
          {["Bluetooth Speaker", "Laptop Stand"].map((name, i) => (
            <motion.div
              key={i}
              className="flex gap-3"
              whileHover={{ scale: 1.03 }}
            >
              <div
                className={`w-16 h-16 rounded-lg overflow-hidden ${
                  isDarkMode ? "bg-gray-800" : "bg-gray-100"
                }`}
              >
                <Image
                  src={product.imgUrl}
                  alt={product.title}
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
                  {name}
                </p>
                <p
                  className={`text-sm ${
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  {i === 0 ? "$89.99" : "$45.99"}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </Card>

      {/* Related Products */}
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
          You Might Also Like
        </h3>
        <div className="space-y-4">
          {relatedProducts.map((product, index) => (
            <motion.div
              key={product.id}
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
              ></div>
              <div className="flex-1 space-y-2">
                <h4
                  className={`font-medium text-sm ${
                    isDarkMode ? "text-gray-100" : "text-gray-900"
                  }`}
                >
                  {product.name}
                </h4>
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-orange-400 text-orange-400" />
                  <span
                    className={`text-xs ${
                      isDarkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    {product.rating}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`font-semibold ${
                      isDarkMode ? "text-gray-100" : "text-gray-900"
                    }`}
                  >
                    ${product.price}
                  </span>
                  {product.originalPrice && (
                    <span
                      className={`text-sm line-through ${
                        isDarkMode ? "text-gray-500" : "text-gray-400"
                      }`}
                    >
                      ${product.originalPrice}
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
    </motion.div>
  );
}
