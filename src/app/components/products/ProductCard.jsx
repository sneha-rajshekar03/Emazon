"use client";
import Image from "next/image";
import Link from "next/link";

export default function ProductCard({ product }) {
  return (
    <Link href={`/products/${product.id}`} passHref>
      <div className="rounded-2xl shadow-md p-5 transition-transform duration-300 hover:shadow-xl hover:-translate-y-1 bg-white border border-gray-100 cursor-pointer">
        {/* Image Section */}
        <div className="flex justify-center items-center h-48 bg-gray-50 rounded-xl">
          <Image
            src={product.image_url}
            alt={product.name}
            width={180}
            height={180}
            className="object-contain"
            unoptimized
          />
        </div>

        {/* Text Section */}
        <div className="mt-4 space-y-2">
          <h2 className="font-semibold text-lg line-clamp-2 text-gray-800">
            {product.name}
          </h2>
          <p className="text-xl font-bold text-gray-900">₹{product.price}</p>
          <p className="text-sm text-gray-500">Eligible for FREE Delivery</p>
        </div>
      </div>
    </Link>
  );
}
