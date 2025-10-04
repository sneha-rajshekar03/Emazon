"use client";
import React, { useState, useEffect } from "react";
import { assets } from "../../../../assets/assets";
import Image from "next/image";
import { useColor } from "@app/context/ColorContext";

const HeaderSlider = () => {
  const { hexColor } = useColor();

  const sliderData = [
    {
      id: 1,
      title: "Introducing the Future.",
      subtitle: "Elegance. Precision. Performance.",
      buttonText1: "Shop Now",
      buttonText2: "Learn More",
      imgSrc: assets.iphone, // example product image
    },
    {
      id: 2,
      title: "AirPods Pro.",
      subtitle: "Sound that feels alive.",
      buttonText1: "Buy",
      buttonText2: "Discover",
      imgSrc: assets.airpods,
    },
    {
      id: 3,
      title: "MacBook Air M3.",
      subtitle: "Power. Redefined.",
      buttonText1: "Order Now",
      buttonText2: "Explore",
      imgSrc: assets.macbook,
    },
  ];

  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % sliderData.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [sliderData.length]);

  const handleSlideChange = (index) => {
    setCurrentSlide(index);
  };

  return (
    <div className="overflow-hidden relative w-full select-none">
      {/* Slides */}
      <div
        className="flex transition-transform duration-700 ease-in-out"
        style={{
          transform: `translateX(-${currentSlide * 100}%)`,
        }}
      >
        {sliderData.map((slide) => (
          <div
            key={slide.id}
            className="flex flex-col-reverse md:flex-row items-center justify-between py-14 md:px-20 px-6 min-w-full"
            style={{
              background: `linear-gradient(
                160deg,
                rgba(255, 255, 255, 0.85) 0%,
                rgba(255, 255, 255, 0.7) 50%,
                ${hexColor}10 100%
              )`,
              backdropFilter: "blur(20px) saturate(160%)",
              WebkitBackdropFilter: "blur(20px) saturate(160%)",
              borderTop: "1px solid rgba(255,255,255,0.6)",
              borderBottom: "1px solid rgba(255,255,255,0.4)",
            }}
          >
            {/* Text Section */}
            <div className="flex flex-col justify-center md:pl-8 mt-8 md:mt-0 text-center md:text-left max-w-lg">
              <h1 className="text-[2rem] sm:text-[3rem] font-semibold tracking-tight text-gray-900 leading-tight">
                {slide.title}
              </h1>
              <p className="text-gray-600 text-lg sm:text-xl mt-2">
                {slide.subtitle}
              </p>

              <div className="flex items-center mt-6 gap-4 justify-center md:justify-start">
                <button
                  className="px-8 py-2.5 rounded-full text-white font-medium shadow-md transition-all hover:scale-[1.03]"
                  style={{
                    background: `linear-gradient(145deg, ${hexColor}, ${hexColor}cc)`,
                    boxShadow: `0 5px 15px ${hexColor}40`,
                  }}
                >
                  {slide.buttonText1}
                </button>

                <button className="group flex items-center gap-1.5 px-5 py-2.5 font-medium text-gray-800 hover:text-black transition-all">
                  {slide.buttonText2}
                  <Image
                    className="group-hover:translate-x-1 transition-transform"
                    src={assets.arrow_icon}
                    alt="arrow_icon"
                    width={16}
                    height={16}
                  />
                </button>
              </div>
            </div>

            {/* Image Section */}
            <div className="flex justify-center items-center flex-1">
              <div className="relative w-[280px] sm:w-[360px] md:w-[420px] aspect-square">
                <div
                  className="absolute inset-0 rounded-3xl"
                  style={{
                    background: `radial-gradient(circle at bottom right, ${hexColor}30 0%, transparent 70%)`,
                    filter: "blur(40px)",
                  }}
                />
                {slide.imgSrc ? (
                  <Image
                    src={slide.imgSrc}
                    alt={slide.title}
                    fill
                    className="object-contain z-10 relative"
                    unoptimized
                  />
                ) : (
                  <Image
                    src="data:image/gif;base64,R0lGODlhAQABAAAAACw="
                    alt="placeholder"
                    width={300}
                    height={300}
                    className="z-10"
                  />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Dots */}
      <div className="flex items-center justify-center gap-3 mt-6 mb-4">
        {sliderData.map((_, index) => (
          <div
            key={index}
            onClick={() => handleSlideChange(index)}
            className={`h-2.5 w-2.5 rounded-full cursor-pointer transition-all ${
              currentSlide === index ? "scale-110" : "opacity-60"
            }`}
            style={{
              backgroundColor:
                currentSlide === index ? hexColor : "rgba(180, 180, 180, 0.5)",
              boxShadow:
                currentSlide === index
                  ? `0 0 10px ${hexColor}70`
                  : "0 0 4px rgba(0,0,0,0.05)",
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default HeaderSlider;
