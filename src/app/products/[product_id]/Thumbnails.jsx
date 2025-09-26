import Image from "next/image";

export function Thumbnails({
  images,
  selectedImage,
  setSelectedImage,
  product,
}) {
  return (
    <div className="flex flex-col gap-2">
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
