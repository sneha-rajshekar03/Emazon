"use client";
import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { assets } from "../../../../assets/assets";
import { useColor } from "@/app/context/ColorContext";

const HeaderSlider = () => {
  const router = useRouter();
  const { hexColor, isDarkMode } = useColor();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);

  // 🔹 Text content for banners
  const categoryContent = useMemo(
    () => ({
      All_Beauty: {
        title: "Unleash Your Natural Beauty",
        subtitle: "Premium beauty products for every skin type",
      },
      Appliances: {
        title: "Smart Home Appliances",
        subtitle: "Innovative solutions for modern living",
      },
      Arts_Crafts_and_Sewing: {
        title: "Craft Your Creativity",
        subtitle: "Supplies for endless artistic possibilities",
      },
      Automotive: {
        title: "Drive with Confidence",
        subtitle: "Top-quality auto parts and accessories",
      },
      Baby_Products: {
        title: "Nurture with Care",
        subtitle: "Safe, trusted essentials for your little one",
      },
      Beauty_and_Personal_Care: {
        title: "Enhance Your Beauty Routine",
        subtitle: "Premium skincare and beauty essentials",
      },
      Books: {
        title: "Expand Your Knowledge",
        subtitle: "Discover bestsellers and hidden literary gems",
      },
      Electronics: {
        title: "Discover Latest Tech Innovations",
        subtitle: "Cutting-edge electronics for the modern lifestyle",
      },
      Gift_Cards: {
        title: "The Perfect Gift Every Time",
        subtitle: "Give the gift of choice",
      },
      Grocery_and_Gourmet_Food: {
        title: "Savor Premium Flavors",
        subtitle: "Gourmet ingredients for culinary excellence",
      },
      Home_and_Kitchen: {
        title: "Transform Your Living Space",
        subtitle: "Smart solutions for a comfortable home",
      },
      Sports_and_Outdoors: {
        title: "Gear Up for Adventure",
        subtitle: "Premium equipment for your active lifestyle",
      },
      Video_Games: {
        title: "Level Up Your Gaming Experience",
        subtitle: "Immersive games, controllers & more",
      },
    }),
    []
  );

  // 🔹 Default fallback if no searches
  const defaultCategories = useMemo(
    () => [
      "Electronics",
      "Home_and_Kitchen",
      "Books",
      "Beauty_and_Personal_Care",
      "Video_Games",
      "Sports_and_Outdoors",
    ],
    []
  );

  // 🔹 Load cache or fetch new personalized data
  useEffect(() => {
    const cached = localStorage.getItem("sliderCategories");
    const cachedTime = localStorage.getItem("sliderCategoriesTime");
    const now = Date.now();
    const cacheAge = cachedTime ? now - parseInt(cachedTime) : Infinity;

    if (!cached || cacheAge > 3 * 60 * 1000) {
      fetchSearchHistory();
    } else {
      setCategories(JSON.parse(cached));
      setLoading(false);
    }
  }, []);

  // 🔹 Fetch personalized categories based on user’s search history
  const fetchSearchHistory = async () => {
    try {
      const res = await fetch("/api/search?history=true");
      const data = await res.json();

      if (Array.isArray(data) && data.length > 0) {
        // ✅ Step 1: Clean + Group by category
        const categoryCount = {};
        data.forEach((entry) => {
          const cat = entry.category;
          if (
            cat &&
            cat !== "Mixed" &&
            cat !== "Unknown" &&
            cat !== "No Results"
          ) {
            categoryCount[cat] = (categoryCount[cat] || 0) + 1;
          }
        });

        // ✅ Step 2: Sort by frequency (and recency if available)
        const sortedCategories = Object.entries(categoryCount)
          .sort((a, b) => b[1] - a[1])
          .map(([cat]) => cat);

        // ✅ Step 3: Pick top 3 (personalized)
        const personalized = sortedCategories.slice(0, 3);

        // ✅ Step 4: Fill missing with defaults
        const remaining = defaultCategories.filter(
          (d) => !personalized.includes(d)
        );
        const selected = [
          ...personalized,
          ...remaining.slice(0, 3 - personalized.length),
        ];

        setCategories(selected);
        localStorage.setItem("sliderCategories", JSON.stringify(selected));
        localStorage.setItem("sliderCategoriesTime", Date.now().toString());
      } else {
        useFallbackCategories();
      }
    } catch (err) {
      console.error("Error fetching personalized history:", err);
      useFallbackCategories();
    } finally {
      setLoading(false);
    }
  };

  const useFallbackCategories = () => {
    const shuffled = [...defaultCategories].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 3);
    setCategories(selected);
    localStorage.setItem("sliderCategories", JSON.stringify(selected));
    localStorage.setItem("sliderCategoriesTime", Date.now().toString());
  };

  // 🔹 Auto-rotate slides
  useEffect(() => {
    if (categories.length === 0) return;
    const timer = setInterval(
      () => setCurrentSlide((prev) => (prev + 1) % categories.length),
      4000
    );
    return () => clearInterval(timer);
  }, [categories.length]);

  // ✅ Match correct image dynamically (.png / .jpg)
  const getCategoryImage = (category) => {
    const variants = [
      `${category}_image`,
      `${category}.png`,
      `${category}.jpg`,
      `${category}.jpeg`,
    ];
    for (const v of variants) {
      if (assets[v]) return assets[v];
    }

    // fallback banner images
    const fallbackKeys = [
      "header_macbook_image",
      "header_headphone_image",
      "header_playstation_image",
    ];
    for (const f of fallbackKeys) if (assets[f]) return assets[f];
    return null;
  };

  // 🟢 When "Shop Now" clicked → redirect to personalized search
  const handleShopNow = () => {
    const currentCategory = categories[currentSlide];
    if (!currentCategory) return;
    const queryToSearch = currentCategory.replace(/_/g, " ");
    router.push(`/search?q=${encodeURIComponent(queryToSearch)}`);
  };

  // 🔹 Loading placeholder
  if (loading) {
    return (
      <div
        className="flex items-center justify-center h-64 rounded-xl my-6"
        style={{
          background: isDarkMode
            ? `linear-gradient(160deg, rgba(35,35,35,0.85), rgba(30,30,30,0.7), ${hexColor}15)`
            : `linear-gradient(160deg, rgba(255,255,255,0.9), rgba(250,250,250,0.7), ${hexColor}10)`,
        }}
      >
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-8 h-8 border-4 rounded-full animate-spin"
            style={{
              borderColor: `${hexColor} ${hexColor} ${hexColor} transparent`,
            }}
          />
          <p
            className={`text-sm ${
              isDarkMode ? "text-gray-400" : "text-gray-600"
            }`}
          >
            Personalizing your homepage...
          </p>
        </div>
      </div>
    );
  }

  // 🔹 Render main banner
  return (
    <div className="overflow-hidden relative w-full select-none my-6">
      <div
        className="flex transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {categories.map((category, index) => {
          const image = getCategoryImage(category);
          const content = categoryContent[category] || {
            title: `Explore ${category.replace(/_/g, " ")}`,
            subtitle: `Shop the latest in ${category
              .replace(/_/g, " ")
              .toLowerCase()}`,
          };

          return (
            <div
              key={index}
              className="flex flex-col-reverse md:flex-row items-center justify-between py-14 md:px-20 px-6 min-w-full"
              style={{
                background: isDarkMode
                  ? `linear-gradient(160deg, rgba(35,35,35,0.85), rgba(30,30,30,0.7), ${hexColor}15)`
                  : `linear-gradient(160deg, rgba(255,255,255,0.9), rgba(250,250,250,0.7), ${hexColor}10)`,
              }}
            >
              {/* Text Section */}
              <div className="flex flex-col justify-center md:pl-8 text-center md:text-left max-w-lg">
                <h1
                  className={`text-[2rem] sm:text-[3rem] font-semibold leading-tight ${
                    isDarkMode ? "text-gray-100" : "text-gray-900"
                  }`}
                >
                  {content.title}
                </h1>
                <p
                  className={`text-lg sm:text-xl mt-2 ${
                    isDarkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  {content.subtitle}
                </p>
                <div className="flex items-center mt-6 gap-4 justify-center md:justify-start">
                  <button
                    onClick={handleShopNow}
                    className="px-8 py-2.5 rounded-full text-white font-medium shadow-md hover:scale-[1.03]"
                    style={{
                      background: `linear-gradient(145deg, ${hexColor}, ${hexColor}cc)`,
                      boxShadow: `0 5px 15px ${hexColor}40`,
                    }}
                  >
                    Shop Now
                  </button>
                </div>
              </div>

              {/* Image Section */}
              <div className="flex justify-center items-center flex-1">
                <div className="relative w-[300px] sm:w-[360px] md:w-[420px] aspect-square">
                  {image ? (
                    <Image
                      src={image}
                      alt={category}
                      fill
                      priority={index === 0} // 🔹 ensures LCP image is downloaded first
                      sizes="(max-width: 768px) 90vw,
         (max-width: 1200px) 50vw,
         33vw"
                      className="object-contain z-10 relative"
                      quality={70} // 🔹 compresses by ~40 %
                      placeholder="blur"
                      blurDataURL="/blur-placeholder.png" // tiny placeholder (you can generate one)
                      unoptimized={false}
                    />
                  ) : (
                    <div className="flex items-center justify-center w-full h-full">
                      <p
                        className={`text-sm ${
                          isDarkMode ? "text-gray-500" : "text-gray-400"
                        }`}
                      >
                        No image available
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 🔹 Slide Dots */}
      <div className="flex items-center justify-center gap-3 mt-6 mb-4">
        {categories.map((_, index) => (
          <div
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`h-2.5 w-2.5 rounded-full cursor-pointer transition-all ${
              currentSlide === index ? "scale-110" : "opacity-60"
            }`}
            style={{
              backgroundColor:
                currentSlide === index
                  ? hexColor
                  : isDarkMode
                  ? "rgba(150,150,150,0.5)"
                  : "rgba(180,180,180,0.5)",
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
