import React from "react";
import { useState } from "react";
import Image from "next/image";
export const Thumbnails = ({ product }) => {
  const [mainImage, setMainImage] = useState(product.image_url);

  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <button
          key={i}
          onClick={() => setMainImage(product.image_url)}
          className={`border p-1 rounded hover:border-amazonOrange ${
            mainImage === product.image_url ? "border-amazonOrange" : ""
          }`}
        >
          <Image
            src={product.image_url}
            alt={`Thumbnail ${i + 1}`}
            width={60}
            height={60}
            className="object-contain"
            unoptimized
          />
        </button>
      ))}
    </div>
  );
};
