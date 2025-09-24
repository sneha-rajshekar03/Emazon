import React from "react";
import { useState } from "react";
import Image from "next/image";
export const MainImage = ({ product }) => {
  const [mainImage, setMainImage] = useState(product.image_url);

  return (
    <div className="flex-1 flex items-start justify-center">
      <div className="border p-4 bg-white rounded-lg shadow-sm">
        <Image
          src={mainImage}
          alt={product.name}
          width={500}
          height={500}
          className="object-contain"
          priority
          unoptimized
        />
      </div>
    </div>
  );
};
