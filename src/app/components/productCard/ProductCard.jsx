"use client";
import Image from "next/image";
import Link from "next/link";

export default function ProductCard({ product, color }) {
  return (
    <Link href={`/products/${product.id}`} passHref>
      <div
        className="rounded-2xl shadow-md p-5 transition-transform duration-300 hover:shadow-xl hover:-translate-y-1 border border-gray-100 cursor-pointer"
        style={{
          background: `linear-gradient(
    rgba(255, 255, 255, 0.9), 
    rgba(255, 255, 255, 0.9)
  ), ${color || "#ffffff"}`,
        }}
      >
        {/* Image Section */}
        <div className="relative w-40 h-40">
          <Image
            src={product.imgUrl}
            alt={product.title}
            fill
            className="object-contain"
            unoptimized
          />
        </div>

        {/* Text Section */}
        <div className="mt-4 space-y-2">
          <h2 className="font-semibold text-lg line-clamp-2 text-gray-800">
            {product.title}
          </h2>
          <p className="text-xl font-bold text-gray-900">${product.price}</p>
          <p className="text-sm text-gray-500">Eligible for FREE Delivery</p>
        </div>
      </div>
    </Link>
  );
}
