"use client";
import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { assets } from "../../../../assets/assets";
import { useColor } from "@/app/context/ColorContext";

const HeaderSlider = () => {
  const router = useRouter();
  const { hexColor, isDarkMode } = useColor();
  const { data: session, status } = useSession();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const prevUserIdRef = React.useRef(null);

  // Get user ID from session
  const userId = useMemo(() => {
    return (
      session?.users?.id ||
      session?.users?._id ||
      session?.user?.id ||
      session?.user?._id ||
      null
    );
  }, [session]);

  // 🔹 Detect session changes (login/logout)
  useEffect(() => {
    if (status === "loading") return;

    const prevUserId = prevUserIdRef.current;

    // Logout detected: clear user's cache
    if (prevUserId && !userId) {
      console.log(
        "🚪 [HeaderSlider] Logout detected, clearing cache for user:",
        prevUserId
      );
      localStorage.removeItem(`sliderCategories_${prevUserId}`);
      localStorage.removeItem(`sliderCategoriesTime_${prevUserId}`);
      setCategories([]);
      setLoading(true);
    }

    // Login detected: clear guest cache
    if (!prevUserId && userId) {
      console.log("🔑 [HeaderSlider] Login detected, clearing guest cache");
      localStorage.removeItem("sliderCategories_guest");
      localStorage.removeItem("sliderCategoriesTime_guest");
      setCategories([]);
      setLoading(true);
    }

    prevUserIdRef.current = userId;
  }, [userId, status]);

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
      Software: {
        title: "Power Your Digital Life",
        subtitle: "Essential software for productivity and creativity",
      },
      Handmade_Products: {
        title: "Discover Unique Handcrafted Treasures",
        subtitle: "One-of-a-kind artisan creations",
      },
      Amazon_Fashion: {
        title: "Style That Defines You",
        subtitle: "Latest trends and timeless classics",
      },
      Musical_Instruments: {
        title: "Make Music Come Alive",
        subtitle: "Instruments for every skill level",
      },
      CDs_and_Vinyl: {
        title: "Experience Pure Sound",
        subtitle: "Timeless music in classic formats",
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

  // 🔹 Fetch personalized categories based on user's search history
  const fetchSearchHistory = async () => {
    console.log("🔍 [HeaderSlider] Fetching search history...", {
      userId,
      hasSession: !!session,
    });
    try {
      // Build URL with userId parameter if available
      const url = userId
        ? `/api/search?history=true&userId=${userId}`
        : `/api/search?history=true`;

      console.log("🌐 [HeaderSlider] API URL:", url);
      const res = await fetch(url);
      const data = await res.json();
      console.log("📦 [HeaderSlider] Raw search history data:", data);

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
        console.log("📊 [HeaderSlider] Category counts:", categoryCount);

        // ✅ Step 2: Sort by frequency (and recency if available)
        const sortedCategories = Object.entries(categoryCount)
          .sort((a, b) => b[1] - a[1])
          .map(([cat]) => cat);
        console.log(
          "🔢 [HeaderSlider] Sorted categories by frequency:",
          sortedCategories
        );

        // ✅ Step 3: Pick top 3 (personalized)
        const personalized = sortedCategories.slice(0, 3);
        console.log(
          "⭐ [HeaderSlider] Top 3 personalized categories:",
          personalized
        );

        // ✅ Step 4: Fill missing with defaults
        const remaining = defaultCategories.filter(
          (d) => !personalized.includes(d)
        );
        const selected = [
          ...personalized,
          ...remaining.slice(0, 3 - personalized.length),
        ];
        console.log("✅ [HeaderSlider] Final selected categories:", selected);

        // Store with user-specific cache key
        const cacheKey = userId
          ? `sliderCategories_${userId}`
          : "sliderCategories_guest";
        const cacheTimeKey = userId
          ? `sliderCategoriesTime_${userId}`
          : "sliderCategoriesTime_guest";

        setCategories(selected);
        localStorage.setItem(cacheKey, JSON.stringify(selected));
        localStorage.setItem(cacheTimeKey, Date.now().toString());
      } else {
        console.log(
          "⚠️ [HeaderSlider] No valid search history, using fallback"
        );
        useFallbackCategories();
      }
    } catch (err) {
      console.error(
        "❌ [HeaderSlider] Error fetching personalized history:",
        err
      );
      useFallbackCategories();
    } finally {
      setLoading(false);
    }
  };

  const useFallbackCategories = () => {
    console.log("🎲 [HeaderSlider] Using fallback categories");
    const shuffled = [...defaultCategories].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 3);
    console.log("🔀 [HeaderSlider] Shuffled fallback categories:", selected);

    // Store with user-specific cache key
    const cacheKey = userId
      ? `sliderCategories_${userId}`
      : "sliderCategories_guest";
    const cacheTimeKey = userId
      ? `sliderCategoriesTime_${userId}`
      : "sliderCategoriesTime_guest";

    setCategories(selected);
    localStorage.setItem(cacheKey, JSON.stringify(selected));
    localStorage.setItem(cacheTimeKey, Date.now().toString());
  };

  // 🔹 Load cache or fetch new personalized data
  useEffect(() => {
    const loadCategories = () => {
      // Use user-specific cache keys
      const cacheKey = userId
        ? `sliderCategories_${userId}`
        : "sliderCategories_guest";
      const cacheTimeKey = userId
        ? `sliderCategoriesTime_${userId}`
        : "sliderCategoriesTime_guest";

      const cached = localStorage.getItem(cacheKey);
      const cachedTime = localStorage.getItem(cacheTimeKey);
      const now = Date.now();
      const cacheAge = cachedTime ? now - parseInt(cachedTime) : Infinity;

      console.log("💾 [HeaderSlider] Cache check:", {
        cacheKey,
        hasCached: !!cached,
        cacheAge: Math.floor(cacheAge / 1000) + "s",
        userId,
      });

      // ✅ Reduced cache time to 30 seconds for faster updates
      if (!cached || cacheAge > 30 * 1000) {
        fetchSearchHistory();
      } else {
        setCategories(JSON.parse(cached));
        setLoading(false);
      }
    };

    loadCategories();

    // 🔹 Listen for search updates from other components
    const handleSearchUpdate = () => {
      console.log("Search history updated, refreshing slider...");
      fetchSearchHistory();
    };

    // 🔹 Refresh on window focus (when user returns to tab)
    const handleFocus = () => {
      const cacheTimeKey = userId
        ? `sliderCategoriesTime_${userId}`
        : "sliderCategoriesTime_guest";
      const cachedTime = localStorage.getItem(cacheTimeKey);
      const cacheAge = cachedTime
        ? Date.now() - parseInt(cachedTime)
        : Infinity;
      if (cacheAge > 30 * 1000) {
        console.log("Tab refocused, checking for updates...");
        fetchSearchHistory();
      }
    };

    window.addEventListener("searchHistoryUpdated", handleSearchUpdate);
    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("searchHistoryUpdated", handleSearchUpdate);
      window.removeEventListener("focus", handleFocus);
    };
  }, [userId, session]); // Add userId and session as dependencies

  // 🔹 Auto-rotate slides
  useEffect(() => {
    if (categories.length === 0) return;
    console.log(
      "🎠 [HeaderSlider] Starting auto-rotation with categories:",
      categories
    );
    const timer = setInterval(
      () =>
        setCurrentSlide((prev) => {
          const next = (prev + 1) % categories.length;
          console.log(
            `🔄 [HeaderSlider] Slide changed: ${prev} → ${next} (${categories[next]})`
          );
          return next;
        }),
      4000
    );
    return () => {
      console.log("⏸️ [HeaderSlider] Stopping auto-rotation");
      clearInterval(timer);
    };
  }, [categories]);

  // ✅ Match correct image dynamically (.png / .jpg)
  const getCategoryImage = (category) => {
    console.log("🖼️ [HeaderSlider] Looking for image for category:", category);
    const variants = [
      `${category}_image`,
      `${category}.png`,
      `${category}.jpg`,
      `${category}.jpeg`,
    ];
    for (const v of variants) {
      if (assets[v]) {
        console.log(`✅ [HeaderSlider] Found image variant: ${v}`);
        return assets[v];
      }
    }

    // fallback banner images
    const fallbackKeys = [
      "header_macbook_image",
      "header_headphone_image",
      "header_playstation_image",
    ];
    for (const f of fallbackKeys) {
      if (assets[f]) {
        console.log(`⚠️ [HeaderSlider] Using fallback image: ${f}`);
        return assets[f];
      }
    }
    console.log("❌ [HeaderSlider] No image found for:", category);
    return null;
  };

  // 🟢 When "Shop Now" clicked → redirect to personalized search
  const handleShopNow = () => {
    const currentCategory = categories[currentSlide];
    console.log(
      "🛒 [HeaderSlider] Shop Now clicked for category:",
      currentCategory
    );
    if (!currentCategory) return;
    const queryToSearch = currentCategory.replace(/_/g, " ");
    console.log(
      "🔍 [HeaderSlider] Redirecting to search with query:",
      queryToSearch
    );
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
                      priority={index === 0}
                      sizes="(max-width: 768px) 90vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-contain z-10 relative"
                      quality={70}
                      placeholder="blur"
                      blurDataURL="/blur-placeholder.png"
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
