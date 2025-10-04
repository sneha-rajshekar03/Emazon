"use client";
import Image from "next/image";
import Link from "next/link";
import { useColor } from "@app/context/ColorContext";
export default function ProductCard({ product }) {
  const { hexColor } = useColor();

  return (
    <Link href={`/products/${product.id}`} passHref>
      <div
        className="relative rounded-3xl p-6 border transition-all duration-500 cursor-pointer
       hover:-translate-y-[4px] hover:shadow-[0_15px_30px_rgba(0,0,0,0.08)] 
       bg-white/60 backdrop-blur-xl 
       flex flex-col justify-between min-h-[420px]"
        style={{
          border: "1px solid rgba(255, 255, 255, 0.6)",
          borderRadius: "28px",
          boxShadow: `
      0 4px 20px rgba(0, 0, 0, 0.05),
      inset 0 0 10px rgba(255, 255, 255, 0.3)
    `,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Stronger bottom-right tint, pushed closer to the corner */}
        <div
          style={{
            content: '""',
            position: "absolute",
            bottom: "-10%",
            right: "-10%",
            width: "45%",
            height: "45%",
            background: `radial-gradient(circle at bottom right, ${hexColor}55 0%, transparent 75%)`,
            pointerEvents: "none",
            zIndex: 0,
            filter: "blur(12px)",
          }}
        />

        {/* Product Image */}
        <div className="relative w-full h-48 flex justify-center items-center z-10">
          <Image
            src={product.imgUrl}
            alt={product.title}
            fill
            className="object-contain p-4 scale-95 transition-transform duration-500 hover:scale-100"
            unoptimized
          />
        </div>

        {/* Product Info */}
        <div className="mt-4 text-center space-y-2 z-10">
          <h2 className="font-semibold text-lg tracking-tight text-gray-800 line-clamp-2">
            {product.title}
          </h2>
          <p className="text-[1.1rem] font-medium text-gray-900">
            ${product.price}
          </p>
          <p className="text-sm text-gray-400">
            Free delivery · Apple-certified
          </p>
        </div>
      </div>
    </Link>
  );
}
