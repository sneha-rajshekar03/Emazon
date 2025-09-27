"use client";
import Image from "next/image";
import Link from "next/link";

export default function ProductCard({ product, color }) {
  return (
    <Link href={`/products/${product.id}`} passHref>
      <div
        className="rounded-2xl shadow-sm hover:shadow-lg p-5 transition-transform duration-300 hover:-translate-y-1 border border-gray-100 cursor-pointer bg-white"
        style={{
          background: `linear-gradient(
  135deg,
  rgba(255, 255, 255, 0.02),
  rgba(255, 255, 255, 0.08),
  ${color || "rgba(240, 245, 255, 0.03)"}
)`,
        }}
      >
        {/* Image Section */}
        <div className="relative w-full h-44 flex justify-center">
          <Image
            src={product.imgUrl}
            alt={product.title}
            fill
            className="object-contain p-3"
            unoptimized
          />
        </div>

        {/* Text Section */}
        <div className="mt-3 space-y-1 text-center">
          <h2 className="font-medium text-base line-clamp-2 text-gray-700">
            {product.title}
          </h2>
          <p className="text-lg font-semibold text-gray-900">
            ${product.price}
          </p>
          <p className="text-xs text-gray-400">Eligible for FREE Delivery</p>
        </div>
      </div>
    </Link>
  );
}
