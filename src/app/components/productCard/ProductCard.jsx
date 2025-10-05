"use client";
import Image from "next/image";
import Link from "next/link";
import { useColor } from "@app/context/ColorContext";

export default function ProductCard({ product }) {
  const { hexColor, isDarkMode } = useColor();

  return (
    <Link href={`/products/${product.id}`} passHref>
      <div
        className="relative rounded-3xl p-6 border transition-all duration-500 cursor-pointer
       hover:-translate-y-[4px] flex flex-col justify-between min-h-[420px]"
        style={{
          background: isDarkMode
            ? "rgba(45, 45, 45, 0.6)"
            : "rgba(255, 255, 255, 0.6)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: isDarkMode
            ? "1px solid rgba(255, 255, 255, 0.1)"
            : "1px solid rgba(255, 255, 255, 0.6)",
          borderRadius: "28px",
          boxShadow: isDarkMode
            ? `0 4px 20px rgba(0, 0, 0, 0.3), inset 0 0 10px rgba(255, 255, 255, 0.05)`
            : `0 4px 20px rgba(0, 0, 0, 0.05), inset 0 0 10px rgba(255, 255, 255, 0.3)`,
          position: "relative",
          overflow: "hidden",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = isDarkMode
            ? `0 15px 30px rgba(0, 0, 0, 0.5)`
            : `0 15px 30px rgba(0, 0, 0, 0.08)`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = isDarkMode
            ? `0 4px 20px rgba(0, 0, 0, 0.3), inset 0 0 10px rgba(255, 255, 255, 0.05)`
            : `0 4px 20px rgba(0, 0, 0, 0.05), inset 0 0 10px rgba(255, 255, 255, 0.3)`;
        }}
      >
        {/* Color tint in bottom-right corner */}
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
          <h2
            className={`font-semibold text-lg tracking-tight line-clamp-2 ${
              isDarkMode ? "text-gray-100" : "text-gray-800"
            }`}
          >
            {product.title}
          </h2>
          <p
            className={`text-[1.1rem] font-medium ${
              isDarkMode ? "text-gray-200" : "text-gray-900"
            }`}
          >
            ${product.price}
          </p>
          <p
            className={`text-sm ${
              isDarkMode ? "text-gray-500" : "text-gray-400"
            }`}
          >
            Free delivery · Apple-certified
          </p>
        </div>
      </div>
    </Link>
  );
}
