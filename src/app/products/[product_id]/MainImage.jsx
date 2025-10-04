"use client";

import { ZoomIn } from "lucide-react";
import Image from "next/image";

export function MainImage({
  product,
  images,
  selectedImage,
  isZoomed,
  onZoomToggle,
}) {
  return (
    <div className="relative group mt-20">
      {" "}
      {/* Added margin-top */}
      {/* Main Image Container */}
      <div
        className={`relative rounded-2xl overflow-hidden shadow-sm  border border-gray-200 bg-gradient-to-br from-gray-100 to-white transition-all duration-500 ease-out ${
          isZoomed ? "cursor-zoom-out scale-[1.02]" : "cursor-zoom-in"
        }`}
        onClick={onZoomToggle}
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

        {/* Zoom Icon (Apple-like hover) */}
        {!isZoomed && (
          <div className="absolute top-4 right-4 bg-white/70 backdrop-blur-md text-gray-800 p-2 rounded-full opacity-0 group-hover:opacity-100 shadow-md transition-all duration-300">
            <ZoomIn className="h-4 w-4" />
          </div>
        )}
      </div>
      {/* Image Counter */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-sm text-gray-800 px-3 py-1 rounded-full text-sm font-medium shadow-sm">
        {selectedImage + 1} / {images.length}
      </div>
    </div>
  );
}
