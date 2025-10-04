"use client";

import { Star, Heart, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

export function ProductHeader({ product, ...props }) {
  const discount = product.originalPrice
    ? Math.round(
        ((product.originalPrice - product.price) / product.originalPrice) * 100
      )
    : 0;

  return (
    <motion.div
      {...props}
      className="space-y-5"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {/* Brand + Actions */}
      <div className="flex items-center justify-between">
        <span className="text-sm tracking-wider uppercase text-gray-500/90">
          {product.brand || "Brand"}
        </span>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full hover:bg-gray-100 transition"
          >
            <Heart className="h-4 w-4 text-gray-600 hover:text-red-500 transition" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full hover:bg-gray-100 transition"
          >
            <Share2 className="h-4 w-4 text-gray-600 hover:text-gray-900 transition" />
          </Button>
        </div>
      </div>

      {/* Product Name */}
      <h1 className="text-2xl font-semibold text-gray-900 leading-snug tracking-tight">
        {product.title || "Premium Wireless Headphones"}
      </h1>

      {/* Subtitle */}
      {product.title && (
        <p className="text-gray-500 text-base tracking-wide">{product.title}</p>
      )}

      {/* Rating */}
      <div className="flex items-center gap-3">
        <div className="flex items-center">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`h-4 w-4 ${
                i < Math.floor(product.rating)
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-300"
              }`}
            />
          ))}
        </div>
        <span className="text-sm text-gray-700 font-medium">
          {product.rating?.toFixed(1) || "4.8"}
        </span>
        <span className="text-sm text-gray-400">
          ({product.reviewCount || 256} reviews)
        </span>
      </div>

      {/* Price */}
      <div className="flex items-end gap-3">
        <span className="text-4xl font-semibold text-gray-900">
          ${product.price?.toFixed(2) || "249.99"}
        </span>
        {product.originalPrice && (
          <>
            <span className="text-lg text-gray-400 line-through">
              ${product.originalPrice.toFixed(2)}
            </span>
            <Badge
              variant="secondary"
              className="bg-red-100 text-red-600 text-xs font-semibold px-2 py-1 rounded-full"
            >
              {discount}% OFF
            </Badge>
          </>
        )}
      </div>

      {/* Stock */}
      <div className="flex items-center gap-2 mt-2">
        <div
          className={`h-2.5 w-2.5 rounded-full ${
            product.inStock ? "bg-green-500" : "bg-red-500"
          }`}
        />
        <span
          className={`text-sm font-medium ${
            product.inStock ? "text-green-600" : "text-red-600"
          }`}
        >
          {product.inStock ? "In Stock" : "Out of Stock"}
        </span>
      </div>
    </motion.div>
  );
}
