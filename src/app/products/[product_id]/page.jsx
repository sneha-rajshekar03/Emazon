"use client";
import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { ProductHeader } from "./ProductHeader";
import { BuyBox } from "./BuyBox";
import { ProductDescription } from "./ProductDescription";
import { ProductReviews } from "./ProductReviews";
import { MainImage } from "./MainImage";
import { Thumbnails } from "./Thumbnails";
import { Random } from "./Random";
import { trackInteraction } from "@app/utils/interactionTracker";
import { getPrioritizedInteractions } from "@app/utils/interactionTracker";
import { usePreferences } from "@app/hooks/usePreferences";
import { useColor } from "@app/context/ColorContext";

// Define the reorderable elements outside the component to prevent recreation on re-render
const REORDERABLE_ELEMENTS = [
  "BuyBox",
  "ProductDescription",
  "ProductReviews",
  "Random",
];

// Elements to consider for image layout preference (includes BuyBox)
const IMAGE_LAYOUT_ELEMENTS = [
  "BuyBox",
  "ProductDescription",
  "ProductReviews",
  "Random",
];

// Define a minimum score for an element to be considered 'preferred' enough to influence layout
const IMAGE_LAYOUT_THRESHOLD = 15;

// Memoize the initial component map to avoid recreating the onClick/onMouseEnter functions
const useComponentMap = (product, product_id) =>
  useMemo(() => {
    if (!product) return {};

    return {
      ProductHeader: <ProductHeader key="ProductHeader" product={product} />,
      BuyBox: (
        <BuyBox
          key="BuyBox"
          product={product}
          id="BuyBox"
          onClick={() => trackInteraction("BuyBox", "click")}
          onMouseEnter={() => trackInteraction("BuyBox", "hover-start")}
          onMouseLeave={() => trackInteraction("BuyBox", "hover-end")}
        />
      ),
      ProductDescription: (
        <ProductDescription
          key="ProductDescription"
          product={product}
          id="ProductDescription"
          onClick={() => trackInteraction("ProductDescription", "click")}
          onMouseEnter={() =>
            trackInteraction("ProductDescription", "hover-start")
          }
          onMouseLeave={() =>
            trackInteraction("ProductDescription", "hover-end")
          }
        />
      ),
      ProductReviews: (
        <ProductReviews
          key="ProductReviews"
          product={product}
          id="ProductReviews"
          onClick={() => trackInteraction("ProductReviews", "click")}
          onMouseEnter={() => trackInteraction("ProductReviews", "hover-start")}
          onMouseLeave={() => trackInteraction("ProductReviews", "hover-end")}
        />
      ),
      Random: (
        <Random
          key="Random"
          product={product}
          productId={product_id}
          id="Random"
          onClick={() => trackInteraction("Random", "click")}
          onMouseEnter={() => trackInteraction("Random", "hover-start")}
          onMouseLeave={() => trackInteraction("Random", "hover-end")}
        />
      ),
    };
  }, [product, product_id]);

export default function AmazonProductPage() {
  const { product_id } = useParams();
  const [product, setProduct] = useState(null);
  const { data: session } = useSession();
  const pathname = usePathname();
  const { themeColor, isDarkMode } = useColor();

  const [error, setError] = useState(null);
  const { preferences, isLoading } = usePreferences();

  // Gallery state
  const [selectedImage, setSelectedImage] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  // CACHED ELEMENT ORDER - only updates on route changes or initial preferences load
  const [elementOrder, setElementOrder] = useState(REORDERABLE_ELEMENTS);

  // Track image layout preference
  const [imageLayoutVertical, setImageLayoutVertical] = useState(false);

  // Fetch product and similar products
  useEffect(() => {
    let isCancelled = false;

    async function fetchProductAndSimilar() {
      if (!product_id) return;

      try {
        setError(null);
        console.log("🔵 Fetching product:", product_id);
        const res = await fetch(`/api/products/${product_id}`);

        if (isCancelled) return;

        if (!res.ok) {
          throw new Error(
            `Failed to fetch product: ${res.status} ${res.statusText}`
          );
        }

        const data = await res.json();
        console.log("✅ Product fetched:", data);
        setProduct(data);

        console.log("🟡 Fetching similar products for:", product_id);

        const similarRes = await fetch(
          `/api/products/${product_id}/similar?limit=10`
        );

        if (isCancelled) return;

        if (similarRes.ok) {
          const similarData = await similarRes.json();
          const formatted = (similarData.products || [])
            .slice(0, 3)
            .map((prod) => ({
              id: prod.product_id,
              name: prod.title,
              price: prod.price,
              originalPrice: prod.listPrice,
              rating: prod.stars,
              imgUrl: prod.imgUrl,
            }));

          localStorage.setItem("similarProducts", JSON.stringify(formatted));
          console.log(
            "✅ Stored in localStorage (similarProducts):",
            formatted
          );
        } else {
          console.error("❌ Similar products API failed:", similarRes.status);
        }
      } catch (err) {
        if (!isCancelled) {
          console.error("❌ Error fetching product:", err);
          setError(err.message);
        }
      }
    }

    fetchProductAndSimilar();

    return () => {
      isCancelled = true;
      localStorage.removeItem("similarProducts");
    };
  }, [product_id]);

  // Clear guest preferences on initial mount
  useEffect(() => {
    if (!session?.user?.id) {
      console.log(
        "Guest user detected on mount - ensuring session storage is clean"
      );
      try {
        sessionStorage.removeItem("guestPreferences");
      } catch (err) {
        console.error("Storage clear error:", err);
      }
    }
  }, [session?.user?.id]);

  // Calculate element order
  const calculateElementOrder = useCallback(() => {
    if (!preferences || preferences.length === 0) {
      console.log("Using default order - no preferences");
      return REORDERABLE_ELEMENTS;
    }

    const prefMap = new Map(
      preferences.map((pref) => [pref.element.toLowerCase(), pref.score || 0])
    );

    const orderedElements = [...REORDERABLE_ELEMENTS].sort((a, b) => {
      const scoreA = prefMap.get(a.toLowerCase()) || 0;
      const scoreB = prefMap.get(b.toLowerCase()) || 0;
      return scoreB - scoreA;
    });

    console.log("Final calculated element order:", orderedElements);
    return orderedElements;
  }, [preferences]);

  // Calculate image layout preference
  const calculateImageLayoutPreference = useCallback(() => {
    if (!preferences || preferences.length === 0) {
      return false;
    }

    const prefMap = new Map(
      preferences.map((pref) => [pref.element.toLowerCase(), pref.score || 0])
    );

    const mainImageScore = prefMap.get("mainimage") || 0;

    let highestNonImageScore = 0;
    for (const element of IMAGE_LAYOUT_ELEMENTS) {
      const score = prefMap.get(element.toLowerCase()) || 0;
      if (score > highestNonImageScore) {
        highestNonImageScore = score;
      }
    }

    const shouldSwitchToVertical =
      mainImageScore > highestNonImageScore &&
      mainImageScore >= IMAGE_LAYOUT_THRESHOLD;

    return shouldSwitchToVertical;
  }, [preferences]);

  // Update component order on route change or initial load
  useEffect(() => {
    if (!isLoading) {
      const newOrder = calculateElementOrder();
      setElementOrder(newOrder);

      const shouldBeVertical = calculateImageLayoutPreference();
      setImageLayoutVertical(shouldBeVertical);

      console.log("Layout updated on Route/Initial Load:", {
        newOrder,
        imageLayoutVertical: shouldBeVertical,
      });
    }
  }, [
    pathname,
    isLoading,
    calculateElementOrder,
    calculateImageLayoutPreference,
  ]);

  // Real-time image layout updates
  useEffect(() => {
    if (!isLoading && preferences.length > 0) {
      const shouldBeVertical = calculateImageLayoutPreference();
      if (shouldBeVertical !== imageLayoutVertical) {
        console.log(
          `Real-time image layout change: ${imageLayoutVertical} to ${shouldBeVertical}`
        );
        setImageLayoutVertical(shouldBeVertical);
      }
    }
  }, [
    preferences,
    isLoading,
    imageLayoutVertical,
    calculateImageLayoutPreference,
  ]);

  // Cleanup/Logging effects
  const handleUnload = useCallback(() => {
    const sorted = getPrioritizedInteractions();
    console.log("Leaving page →", sorted);
  }, []);

  useEffect(() => {
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, [handleUnload]);

  useEffect(() => {
    return () => {
      const sorted = getPrioritizedInteractions();
      console.log(`Moved away from ${pathname} →`, sorted);
    };
  }, [pathname]);

  const handleScroll = useCallback(() => {
    const bottom =
      window.innerHeight + window.scrollY >= document.body.offsetHeight - 50;
    if (bottom) {
      const sorted = getPrioritizedInteractions();
      console.log("User reached bottom →", sorted);
    }
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  // Memoize images
  const images = useMemo(() => {
    return product?.imgUrl
      ? [product.imgUrl, product.imgUrl, product.imgUrl]
      : ["/placeholder-image.jpg"];
  }, [product?.imgUrl]);

  // Component map
  const componentMap = useComponentMap(product, product_id);

  // Early exit rendering
  if (error)
    return (
      <p
        className={`p-8 text-lg ${
          isDarkMode ? "text-red-400" : "text-red-500"
        }`}
      >
        Error: {error}
      </p>
    );
  if (!product)
    return (
      <p className={`p-8 ${isDarkMode ? "text-gray-300" : "text-gray-900"}`}>
        Loading...
      </p>
    );

  return (
    <div
      className="min-h-screen transition-colors duration-500"
      style={{ background: isDarkMode ? "#000000" : themeColor }}
    >
      {/* Dynamic Layout Container */}
      <div
        className={`
         max-w-7xl mx-auto p-4 gap-6 transition-all duration-500 rounded-3xl
         ${
           imageLayoutVertical
             ? "flex flex-col"
             : "grid grid-cols-1 md:grid-cols-12"
         }
      `}
        style={{
          background: isDarkMode
            ? "rgba(31, 41, 55, 0.7)"
            : "rgba(255, 255, 255, 0.7)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          border: isDarkMode
            ? "1px solid rgba(75, 85, 99, 0.3)"
            : "1px solid rgba(255, 255, 255, 0.3)",
          boxShadow: isDarkMode
            ? "0 8px 32px rgba(0, 0, 0, 0.3)"
            : "0 8px 32px rgba(0, 0, 0, 0.1)",
        }}
      >
        {/* Image Section */}
        <div
          className={`
          transition-all duration-500
          ${imageLayoutVertical ? "w-full mb-6" : "md:col-span-5"}
        `}
        >
          {/* Layout Change Indicator */}
          {imageLayoutVertical && (
            <div
              className="mt-10 mb-4 p-3 rounded-2xl"
              style={{
                background: isDarkMode
                  ? "rgba(30, 58, 138, 0.5)"
                  : "rgba(219, 234, 254, 0.5)",
                backdropFilter: "blur(10px) saturate(150%)",
                WebkitBackdropFilter: "blur(10px) saturate(150%)",
                border: isDarkMode
                  ? "1px solid rgba(59, 130, 246, 0.4)"
                  : "1px solid rgba(191, 219, 254, 0.4)",
              }}
            >
              <div className="flex items-center gap-2">
                <svg
                  className={`w-5 h-5 ${
                    isDarkMode ? "text-blue-400" : "text-blue-600"
                  }`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" />
                </svg>
                <span
                  className={`text-sm font-medium ${
                    isDarkMode ? "text-blue-300" : "text-blue-900"
                  }`}
                >
                  Image-Focused Layout Active
                </span>
              </div>
              <p
                className={`text-xs mt-1 ${
                  isDarkMode ? "text-blue-400" : "text-blue-700"
                }`}
              >
                Layout changed to image-focused mode: main image moved to
                full-width with thumbnails below
              </p>
            </div>
          )}
          <div
            className={`
              transition-all duration-500
              ${
                imageLayoutVertical
                  ? "flex flex-col gap-4 items-center"
                  : "sticky top-4 flex flex-row gap-4 items-start"
              }
          `}
          >
            {/* Main Image */}
            <div
              className={imageLayoutVertical ? "w-100" : "flex-1"}
              onClick={() => trackInteraction("MainImage", "click")}
              onMouseEnter={() => trackInteraction("MainImage", "hover-start")}
              onMouseLeave={() => trackInteraction("MainImage", "hover-end")}
            >
              <MainImage
                product={product}
                images={images}
                selectedImage={selectedImage}
                isZoomed={isZoomed}
                onZoomToggle={() => {
                  setIsZoomed(!isZoomed);
                  trackInteraction("MainImage", "zoom");
                }}
              />
            </div>

            {/* Thumbnails in horizontal layout (side) */}
            {!imageLayoutVertical && (
              <Thumbnails
                images={images}
                selectedImage={selectedImage}
                setSelectedImage={setSelectedImage}
                product={product}
                onClick={() => trackInteraction("Thumbnails", "click")}
              />
            )}
          </div>
          {/* Thumbnails below the main image in vertical layout */}
          {imageLayoutVertical && (
            <div className="w-full mt-4">
              <Thumbnails
                images={images}
                selectedImage={selectedImage}
                setSelectedImage={setSelectedImage}
                product={product}
                isVerticalLayout={true}
                onClick={() => trackInteraction("Thumbnails", "click")}
              />
            </div>
          )}
        </div>

        {/* Content Section */}
        <div
          className={`
            space-y-8 transition-all duration-500
            ${imageLayoutVertical ? "w-full" : "md:col-span-7"}
          `}
        >
          {componentMap.ProductHeader}
          {elementOrder.map((elementName) => componentMap[elementName])}
        </div>
      </div>

      {/* Debug section */}
      <div
        className="max-w-7xl mx-auto p-4 mt-6 rounded-3xl"
        style={{
          background: isDarkMode
            ? "rgba(31, 41, 55, 0.6)"
            : "rgba(255, 255, 255, 0.6)",
          backdropFilter: "blur(15px) saturate(150%)",
          WebkitBackdropFilter: "blur(15px) saturate(150%)",
          border: isDarkMode
            ? "1px solid rgba(75, 85, 99, 0.3)"
            : "1px solid rgba(255, 255, 255, 0.3)",
          boxShadow: isDarkMode
            ? "0 8px 32px rgba(0, 0, 0, 0.3)"
            : "0 8px 32px rgba(0, 0, 0, 0.08)",
        }}
      >
        <h2
          className={`text-lg font-bold mb-2 ${
            isDarkMode ? "text-gray-100" : "text-gray-900"
          }`}
        >
          Your Preferences{" "}
          {!session?.user?.id && (
            <span
              className={`text-sm ${
                isDarkMode ? "text-gray-400" : "text-gray-500"
              }`}
            >
              (Guest - resets on page reload)
            </span>
          )}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            className="p-4 rounded-2xl"
            style={{
              background: isDarkMode
                ? "rgba(55, 65, 81, 0.5)"
                : "rgba(255, 255, 255, 0.5)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              border: isDarkMode
                ? "1px solid rgba(75, 85, 99, 0.4)"
                : "1px solid rgba(255, 255, 255, 0.4)",
            }}
          >
            <h3
              className={`font-semibold mb-2 ${
                isDarkMode ? "text-gray-100" : "text-gray-900"
              }`}
            >
              Current Layout Order:
            </h3>
            <ol className="list-decimal pl-5">
              <li className="flex justify-between">
                <span
                  className={isDarkMode ? "text-gray-300" : "text-gray-900"}
                >
                  ProductHeader
                </span>
                <span
                  className={isDarkMode ? "text-gray-500" : "text-gray-600"}
                >
                  Fixed at top
                </span>
              </li>
              {elementOrder.map((element, idx) => {
                const pref = preferences.find(
                  (p) => p.element.toLowerCase() === element.toLowerCase()
                );
                const score = pref?.score || 0;

                return (
                  <li key={idx + 1} className="flex justify-between">
                    <span
                      className={isDarkMode ? "text-gray-300" : "text-gray-900"}
                    >
                      {element}
                    </span>
                    <span
                      className={isDarkMode ? "text-gray-500" : "text-gray-600"}
                    >
                      Score: {score}
                      {idx === 0 && score > 0 && (
                        <span
                          className={`ml-1 ${
                            isDarkMode ? "text-green-400" : "text-green-600"
                          }`}
                        >
                          (Highest)
                        </span>
                      )}
                    </span>
                  </li>
                );
              })}
            </ol>
            <p
              className={`text-xs mt-2 ${
                isDarkMode ? "text-gray-400" : "text-gray-500"
              }`}
            >
              * Layout updates when you visit a new product page
            </p>
          </div>
          <div
            className="p-4 rounded-2xl"
            style={{
              background: isDarkMode
                ? "rgba(55, 65, 81, 0.5)"
                : "rgba(255, 255, 255, 0.5)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              border: isDarkMode
                ? "1px solid rgba(75, 85, 99, 0.4)"
                : "1px solid rgba(255, 255, 255, 0.4)",
            }}
          >
            <h3
              className={`font-semibold mb-2 ${
                isDarkMode ? "text-gray-100" : "text-gray-900"
              }`}
            >
              Live Preference Scores:
            </h3>
            <ul className="list-disc pl-5">
              {preferences.length > 0 ? (
                preferences
                  .sort((a, b) => (b.score || 0) - (a.score || 0))
                  .map((pref, idx) => (
                    <li key={idx} className="flex justify-between">
                      <span
                        className={
                          isDarkMode ? "text-gray-300" : "text-gray-900"
                        }
                      >
                        {pref.element}
                      </span>
                      <span
                        className={
                          isDarkMode ? "text-gray-500" : "text-gray-600"
                        }
                      >
                        {pref.score || 0}
                      </span>
                    </li>
                  ))
              ) : (
                <li className={isDarkMode ? "text-gray-400" : "text-gray-500"}>
                  {session?.user?.id
                    ? "No preferences yet. Interact with elements to build your preferences!"
                    : "No preferences yet. Interact with elements to customize this session!"}
                </li>
              )}
            </ul>
            <p
              className={`text-xs mt-2 ${
                isDarkMode ? "text-gray-400" : "text-gray-500"
              }`}
            >
              * Scores update in real-time as you interact
            </p>
          </div>
        </div>

        {/* Enhanced Debug section */}
        <div
          className="mt-4 p-3 rounded-2xl"
          style={{
            background: isDarkMode
              ? "rgba(113, 63, 18, 0.6)"
              : "rgba(254, 252, 232, 0.6)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            border: isDarkMode
              ? "1px solid rgba(180, 83, 9, 0.3)"
              : "1px solid rgba(252, 211, 77, 0.3)",
          }}
        >
          <h4
            className={`font-bold text-sm ${
              isDarkMode ? "text-yellow-400" : "text-yellow-900"
            }`}
          >
            Debug Info:
          </h4>
          <div
            className={`text-xs mt-1 ${
              isDarkMode ? "text-yellow-300" : "text-yellow-800"
            }`}
          >
            <strong>Current Layout:</strong>{" "}
            {imageLayoutVertical
              ? "Vertical (Image-focused)"
              : "Horizontal (Default)"}
          </div>
          <div
            className={`text-xs mt-1 ${
              isDarkMode ? "text-yellow-300" : "text-yellow-800"
            }`}
          >
            <strong>Current Element Order:</strong> {elementOrder.join(" → ")}
          </div>

          <div
            className={`text-xs mt-1 ${
              isDarkMode ? "text-yellow-300" : "text-yellow-800"
            }`}
          >
            <strong>Main Image Interaction Score:</strong>
            {(() => {
              const mainImagePref = preferences.find(
                (pref) => pref.element.toLowerCase() === "mainimage"
              );
              const mainImageScore = mainImagePref?.score || 0;

              const nonImagePrefs = preferences.filter((pref) =>
                IMAGE_LAYOUT_ELEMENTS.some(
                  (el) => el.toLowerCase() === pref.element.toLowerCase()
                )
              );
              const highestNonImageScore =
                nonImagePrefs.length > 0
                  ? Math.max(...nonImagePrefs.map((pref) => pref.score || 0))
                  : 0;

              return (
                <div className="ml-2">
                  <div>MainImage: {mainImageScore}</div>
                  <div>Highest other element: {highestNonImageScore}</div>
                  <div className="font-bold">
                    MainImage is{" "}
                    {mainImageScore > highestNonImageScore
                      ? "WINNING"
                      : "not winning"}
                    {mainImageScore >= IMAGE_LAYOUT_THRESHOLD
                      ? " (above minimum)"
                      : ` (below minimum ${IMAGE_LAYOUT_THRESHOLD})`}
                  </div>
                  <div>
                    Threshold for vertical layout: Beat highest other element
                    (BuyBox, ProductDescription, ProductReviews, Random) AND
                    reach {IMAGE_LAYOUT_THRESHOLD}+ score
                  </div>
                </div>
              );
            })()}
          </div>

          <div
            className={`text-xs mt-1 ${
              isDarkMode ? "text-yellow-300" : "text-yellow-800"
            }`}
          >
            <strong>Live Preferences:</strong>
            <pre
              className="mt-1 p-2 rounded text-xs overflow-x-auto"
              style={{
                background: isDarkMode
                  ? "rgba(55, 65, 81, 0.8)"
                  : "rgba(243, 244, 246, 0.8)",
                backdropFilter: "blur(5px)",
                WebkitBackdropFilter: "blur(5px)",
              }}
            >
              {JSON.stringify(preferences.slice(0, 6), null, 2)}
            </pre>
          </div>
          <div
            className={`text-xs mt-2 ${
              isDarkMode ? "text-yellow-300" : "text-yellow-800"
            }`}
          >
            <strong>Next Page Would Show Order:</strong>
            <div className="ml-2">
              {preferences.length > 0
                ? preferences
                    .sort((a, b) => (b.score || 0) - (a.score || 0))
                    .map((pref) => `${pref.element}(${pref.score})`)
                    .join(" → ")
                : "Default order (no preferences yet)"}
            </div>
          </div>
        </div>

        {!session?.user?.id && preferences.length > 0 && (
          <div
            className="mt-4 p-3 rounded-2xl"
            style={{
              background: isDarkMode
                ? "rgba(30, 58, 138, 0.5)"
                : "rgba(219, 234, 254, 0.5)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              border: isDarkMode
                ? "1px solid rgba(59, 130, 246, 0.4)"
                : "1px solid rgba(191, 219, 254, 0.4)",
            }}
          >
            <p
              className={`text-sm ${
                isDarkMode ? "text-blue-300" : "text-blue-700"
              }`}
            >
              Guest Mode: Your preferences are being customized for this
              session! Sign in to save your preferences permanently across page
              reloads.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
