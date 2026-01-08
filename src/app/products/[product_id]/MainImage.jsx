"use client";

import { ZoomIn } from "lucide-react";
import Image from "next/image";
import { useColor } from "@/app/context/ColorContext";

export function MainImage({
  product,
  images,
  selectedImage,
  isZoomed,
  onZoomToggle,
  isVerticalLayout = false,
}) {
  const { isDarkMode } = useColor();

  return (
    <div
      className={`relative group mt-20 ${
        isVerticalLayout ? "max-w-sm mx-auto" : ""
      }`}
    >
      {/* Lamp Glow Overlay */}
      <div
        className={`absolute -top-32 left-1/2 -translate-x-1/2 rounded-full blur-[120px] opacity-40 pointer-events-none transition-all duration-700 ${
          isVerticalLayout ? "w-[200px] h-[200px]" : "w-[300px] h-[300px]"
        }`}
        style={{
          background: isDarkMode
            ? "radial-gradient(circle, rgba(255,255,200,0.25) 0%, transparent 70%)"
            : "radial-gradient(circle, rgba(255,255,230,0.55) 0%, transparent 70%)",
          mixBlendMode: isDarkMode ? "screen" : "overlay",
          zIndex: 1,
        }}
      />

      {/* Main Image Container */}
      <div
        className={`relative rounded-2xl overflow-hidden shadow-lg transition-all duration-500 ease-out ${
          isZoomed ? "cursor-zoom-out scale-[1.02]" : "cursor-zoom-in"
        }`}
        onClick={onZoomToggle}
        style={{
          border: isDarkMode
            ? "1px solid rgba(255,255,255,0.1)"
            : "1px solid rgb(229, 231, 235)",
          background: isDarkMode
            ? "radial-gradient(circle at top, rgba(60,60,60,0.8) 0%, rgb(25,25,25) 80%)"
            : "radial-gradient(circle at top, rgba(255,255,255,0.9) 0%, rgb(240,240,240) 90%)",
          boxShadow: isDarkMode
            ? "0 20px 50px rgba(0,0,0,0.6), 0 -20px 30px rgba(255,255,255,0.08) inset"
            : "0 15px 40px rgba(0,0,0,0.15), 0 -10px 30px rgba(255,255,255,0.6) inset",
        }}
      >
        {/* Gentle glow gradient from top to center */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: isDarkMode
              ? "linear-gradient(to bottom, rgba(255,255,200,0.15), transparent 60%)"
              : "linear-gradient(to bottom, rgba(255,255,220,0.35), transparent 70%)",
            zIndex: 1,
          }}
        />

        <Image
          src={images[selectedImage]}
          alt={product.title}
          width={isVerticalLayout ? 500 : 800}
          height={isVerticalLayout ? 500 : 800}
          priority
          unoptimized
          style={{
            aspectRatio: "1/1",
            objectFit: "contain",
          }}
          className={`w-full h-auto transform transition-transform duration-500 ease-in-out ${
            isZoomed ? "scale-150" : "scale-100"
          }`}
        />

        {/* Zoom Icon */}
        {!isZoomed && (
          <div
            className="absolute top-4 right-4 backdrop-blur-md p-2 rounded-full opacity-0 group-hover:opacity-100 shadow-md transition-all duration-300"
            style={{
              background: isDarkMode
                ? "rgba(60, 60, 60, 0.7)"
                : "rgba(255, 255, 255, 0.7)",
              color: isDarkMode ? "rgb(229, 231, 235)" : "rgb(31, 41, 55)",
            }}
          >
            <ZoomIn className="h-4 w-4" />
          </div>
        )}
      </div>

      {/* Subtle reflection on surface below product */}
      <div
        className={`absolute left-1/2 bottom-[-80px] -translate-x-1/2 rounded-full opacity-25 blur-[40px] pointer-events-none ${
          isVerticalLayout ? "w-[50%] h-[60px]" : "w-[60%] h-[80px]"
        }`}
        style={{
          background: isDarkMode
            ? "radial-gradient(ellipse at center, rgba(255,255,255,0.05) 0%, transparent 80%)"
            : "radial-gradient(ellipse at center, rgba(0,0,0,0.1) 0%, transparent 80%)",
        }}
      />

      {/* Image Counter */}
      <div
        className="absolute bottom-4 left-1/2 -translate-x-1/2 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium shadow-sm"
        style={{
          background: isDarkMode
            ? "rgba(60, 60, 60, 0.8)"
            : "rgba(255, 255, 255, 0.8)",
          color: isDarkMode ? "rgb(229, 231, 235)" : "rgb(31, 41, 55)",
        }}
      >
        {selectedImage + 1} / {images.length}
      </div>
    </div>
  );
}
