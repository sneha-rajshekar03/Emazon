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
    <div className="relative">
      {/* Main Image */}
      <div
        className={`relative bg-gray-50 rounded-xl overflow-hidden transition-all duration-300 ${
          isZoomed ? "cursor-zoom-out" : "cursor-zoom-in"
        }`}
        onClick={onZoomToggle}
      >
        <Image
          src={images[selectedImage]}
          alt={product.title}
          width={500}
          height={500}
          className={`w-full h-auto object-cover transition-transform duration-300 ${
            isZoomed ? "scale-150" : "scale-100"
          }`}
          priority
          unoptimized
          style={{ aspectRatio: "1" }}
        />

        {/* Zoom indicator */}
        <div className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-lg opacity-0 hover:opacity-100 transition-opacity">
          <ZoomIn className="h-4 w-4" />
        </div>
      </div>

      {/* Image counter */}
      <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
        {selectedImage + 1} / {images.length}
      </div>
    </div>
  );
}
