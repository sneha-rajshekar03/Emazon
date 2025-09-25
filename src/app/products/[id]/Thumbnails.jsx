import { useState } from "react";
import Image from "next/image";
export function Thumbnails({ product }) {
  const [selectedImage, setSelectedImage] = useState(0);

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={() => {}}
        className="relative w-16 h-16 rounded-lg overflow-hidden border-2 transition-all"
      >
        <Image
          src={product.image_url}
          alt={product.name}
          className="w-full h-full object-cover"
          width={200}
          height={200}
          unoptimized
        />
        {/* Selection overlay */}
      </button>
      <button
        onClick={() => {}}
        className="relative w-16 h-16 rounded-lg overflow-hidden border-2 transition-all"
      >
        <Image
          src={product.image_url}
          alt={product.name}
          className="w-full h-full object-cover"
          width={200}
          height={200}
          unoptimized
        />
        {/* Selection overlay */}
      </button>
      <button
        onClick={() => {}}
        className="relative w-16 h-16 rounded-lg overflow-hidden border-2 transition-all"
      >
        <Image
          src={product.image_url}
          alt={product.name}
          className="w-full h-full object-cover"
          width={200}
          height={200}
          unoptimized
        />
        {/* Selection overlay */}
      </button>
    </div>
  );
}
