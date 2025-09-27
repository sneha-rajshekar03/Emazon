"use client";

import Image from "next/image";

export function Thumbnails({
  images,
  selectedImage,
  setSelectedImage,
  product,
  isVerticalLayout = false, // Add this prop
}) {
  return (
    <div className={`flex gap-2 ${isVerticalLayout ? "flex-row" : "flex-col"}`}>
      {images.map((img, idx) => (
        <button
          key={idx}
          onClick={() => setSelectedImage(idx)}
          className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
            selectedImage === idx ? "border-blue-500" : "border-transparent"
          }`}
        >
          <Image
            src={img}
            alt={`${product.title} thumbnail ${idx + 1}`}
            width={64}
            height={64}
            className="w-full h-full object-cover"
            unoptimized
          />
        </button>
      ))}
    </div>
  );
}
