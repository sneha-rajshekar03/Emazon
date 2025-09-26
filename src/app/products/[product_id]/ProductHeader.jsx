"use client";

import { Star, Heart, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function ProductHeader({ product, ...props }) {
  const discount = product.originalPrice
    ? Math.round(
        ((product.originalPrice - product.price) / product.originalPrice) * 100
      )
    : 0;

  return (
    <div {...props} className="space-y-4">
      {/* Brand */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground uppercase tracking-wide">
          {product.brand || "BRAND"}
        </span>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Heart className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Product Name */}
      <h1 className="text-3xl font-bold">{product.name}</h1>

      {/* Product Title / Subtitle */}
      {product.title && (
        <p className="text-muted-foreground text-base">{product.title}</p>
      )}

      {/* Rating and Reviews */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`h-4 w-4 ${
                i < Math.floor(product.rating)
                  ? "fill-orange-400 text-orange-400"
                  : "text-gray-300"
              }`}
            />
          ))}
          <span className="text-sm ml-1">{product.rating}</span>
        </div>
        <span className="text-sm text-muted-foreground">reviews</span>
      </div>

      {/* Price */}
      <div className="flex items-center gap-3">
        <span className="text-3xl font-semibold">
          ${product.price.toFixed(2)}
        </span>
        {product.originalPrice && (
          <>
            <span className="text-lg text-muted-foreground line-through">
              ${product.originalPrice.toFixed(2)}
            </span>
            <Badge variant="destructive" className="text-xs">
              {discount}% OFF
            </Badge>
          </>
        )}
      </div>

      {/* Stock Status */}
      <div className="flex items-center gap-2">
        <div
          className={`h-2 w-2 rounded-full ${
            product.inStock ? "bg-green-500" : "bg-red-500"
          }`}
        />
        <span
          className={`text-sm ${
            product.inStock ? "text-green-600" : "text-red-600"
          }`}
        >
          {product.inStock ? "In Stock" : "Out of Stock"}
        </span>
      </div>
    </div>
  );
}
