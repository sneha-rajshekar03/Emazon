"use client";
import { useEffect } from "react";
import { useColor } from "@app/context/ColorContext";

export default function HeroBanner({ hero }) {
  const { hexColor } = useColor();

  // ✅ Debug: log color and hero data when component mounts or updates
  useEffect(() => {
    console.log("🎨 [HeroBanner] Current theme hexColor →", hexColor);
    console.log("🖼️ [HeroBanner] Hero data →", hero);
  }, [hexColor, hero]);

  return (
    <section
      className="relative w-full h-64 sm:h-96 rounded-2xl overflow-hidden mb-6 flex items-center justify-center"
      style={{
        backgroundImage: `url(${hero.image})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        boxShadow: `0 20px 40px rgba(0,0,0,0.08), 0 0 60px ${hexColor}20`,
      }}
    >
      {/* ✅ Debug overlay log */}
      {console.log("🌈 [HeroBanner] Rendering with color:", hexColor)}

      {/* Themed gradient overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, ${hexColor}25 0%, rgba(255,255,255,0.1) 40%, rgba(0,0,0,0.4) 100%)`,
          backdropFilter: "blur(12px) saturate(150%)",
          WebkitBackdropFilter: "blur(12px) saturate(150%)",
        }}
      />

      {/* Themed glass card text container */}
      <div
        className="relative z-10 text-center px-8 py-6 rounded-2xl max-w-3xl mx-4"
        style={{
          background: `linear-gradient(145deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.1) 50%, ${hexColor}15 100%)`,
          backdropFilter: "blur(25px) saturate(180%)",
          WebkitBackdropFilter: "blur(25px) saturate(180%)",
          border: "1px solid rgba(255,255,255,0.3)",
          boxShadow: `
            inset 0 1px 2px rgba(255,255,255,0.3),
            inset 0 0 20px ${hexColor}10,
            0 10px 30px rgba(0,0,0,0.15)
          `,
        }}
      >
        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight drop-shadow-lg text-white">
          {hero.title}
        </h1>
        <p className="mt-3 text-lg sm:text-xl text-white/95 drop-shadow-md font-medium">
          {hero.subtitle}
        </p>
      </div>
    </section>
  );
}
