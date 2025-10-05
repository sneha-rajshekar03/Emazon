"use client";

import { ZoomIn } from "lucide-react";
import Image from "next/image";
import { useColor } from "@app/context/ColorContext";

export function MainImage({
  product,
  images,
  selectedImage,
  isZoomed,
  onZoomToggle,
}) {
  const { isDarkMode } = useColor();

  return (
    <div className="relative group mt-20">
      {/* Main Image Container */}
      <div
        className={`relative rounded-2xl overflow-hidden shadow-sm transition-all duration-500 ease-out ${
          isZoomed ? "cursor-zoom-out scale-[1.02]" : "cursor-zoom-in"
        }`}
        onClick={onZoomToggle}
        style={{
          border: isDarkMode
            ? "1px solid rgba(255,255,255,0.1)"
            : "1px solid rgb(229, 231, 235)",
          background: isDarkMode
            ? "linear-gradient(to bottom right, rgb(40, 40, 40), rgb(30, 30, 30))"
            : "linear-gradient(to bottom right, rgb(243, 244, 246), rgb(255, 255, 255))",
        }}
      >
        <Image
          src={images[selectedImage]}
          alt={product.title}
          width={800}
          height={800}
          priority
          unoptimized
          style={{ aspectRatio: "1/1" }}
          className={`w-full h-auto object-contain transform transition-transform duration-500 ease-in-out ${
            isZoomed ? "scale-150" : "scale-100"
          }`}
        />

        {/* Zoom Icon */}
        {!isZoomed && (
          <div
            className="absolute top-4 right-4 backdrop-blur-md p-2 rounded-full opacity-0 group-hover:opacity-100 shadow-md transition-all duration-300"
            style={{
              background: isDarkMode
                ? "rgba(60, 60, 60, 0.7)"
                : "rgba(255, 255, 255, 0.7)",
              color: isDarkMode ? "rgb(229, 231, 235)" : "rgb(31, 41, 55)",
            }}
          >
            <ZoomIn className="h-4 w-4" />
          </div>
        )}
      </div>

      {/* Image Counter */}
      <div
        className="absolute bottom-4 left-1/2 -translate-x-1/2 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium shadow-sm"
        style={{
          background: isDarkMode
            ? "rgba(60, 60, 60, 0.8)"
            : "rgba(255, 255, 255, 0.8)",
          color: isDarkMode ? "rgb(229, 231, 235)" : "rgb(31, 41, 55)",
        }}
      >
        {selectedImage + 1} / {images.length}
      </div>
    </div>
  );
}
