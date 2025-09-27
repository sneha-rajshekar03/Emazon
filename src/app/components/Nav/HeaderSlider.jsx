import React, { useState, useEffect } from "react";
import { assets } from "../../../../assets/assets";
import Image from "next/image";

const HeaderSlider = ({ color }) => {
  const sliderData = [
    {
      id: 1,
      title: "COMING SOON!!",
      buttonText1: "Buy now",
      buttonText2: "Find more",
      imgSrc: null,
    },
    {
      id: 2,
      title: "HEROBANNER",
      buttonText1: "Shop Now",
      buttonText2: "Explore Deals",
      imgSrc: null,
    },
    {
      id: 3,
      title: "COMING SOON!!",
      offer: "Exclusive Deal 40% Off",
      buttonText1: "Order Now",
      buttonText2: "Learn More",
      imgSrc: null,
    },
  ];

  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % sliderData.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [sliderData.length]);

  const handleSlideChange = (index) => {
    setCurrentSlide(index);
  };

  return (
    <div className="overflow-hidden relative w-full">
      <div
        className="flex transition-transform duration-700 ease-in-out"
        style={{
          transform: `translateX(-${currentSlide * 100}%)`,
        }}
      >
        {sliderData.map((slide, index) => (
          <div
            key={slide.id}
            className="flex flex-col-reverse md:flex-row items-center justify-between py-8 md:px-14 px-5 mt-6 rounded-xl min-w-full mb-4"
            style={{
              background: `linear-gradient(
                to bottom right,
                rgba(255, 255, 255, 0.9),
                rgba(255, 255, 255, 0.85),
                ${color || "rgba(240, 245, 255, 0.2)"}
              )`,
            }}
          >
            <div className="md:pl-8 mt-10 md:mt-0">
              <p className="md:text-base text-orange-400 pb-1">{slide.offer}</p>
              <h1 className="max-w-lg md:text-[40px] md:leading-[48px] text-2xl font-semibold text-gray-800">
                {slide.title}
              </h1>
              <div className="flex items-center mt-4 md:mt-6">
                <button
                  className="md:px-10 px-7 md:py-2.5 py-2 rounded-full text-black font-medium shadow"
                  style={{ background: color || gray }}
                >
                  {slide.buttonText1}
                </button>
                <button className="group flex items-center gap-2 px-6 py-2.5 font-medium text-gray-700">
                  {slide.buttonText2}
                  <Image
                    className="group-hover:translate-x-1 transition"
                    src={assets.arrow_icon}
                    alt="arrow_icon"
                  />
                </button>
              </div>
            </div>
            <div className="flex items-center flex-1 justify-center">
              <Image
                className="md:w-72 w-48"
                src={slide.imgSrc}
                alt={`Slide ${index + 1}`}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Dots */}
      <div className="flex items-center justify-center gap-2 mt-8">
        {sliderData.map((_, index) => (
          <div
            key={index}
            onClick={() => handleSlideChange(index)}
            className={`h-2 w-2 rounded-full cursor-pointer transition mb-4`}
            style={{
              background:
                currentSlide === index
                  ? color || "rgba(240, 245, 255, 0.5)"
                  : "rgba(255, 255, 255, 0.6)",
              border: `1px solid ${color || "rgba(240, 245, 255, 0.3)"}`,
            }}
          ></div>
        ))}
      </div>
    </div>
  );
};

export default HeaderSlider;
