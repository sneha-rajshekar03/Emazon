"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ProductHeader } from "./ProductHeader";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { BuyBox } from "./BuyBox";
import { ProductDescription } from "./ProductDescription";
import { ProductReviews } from "./ProductReviews";
import { MainImage } from "./MainImage";
import { Thumbnails } from "./Thumbnails";
import { Random } from "./Random";
import { trackInteraction } from "@app/utils/interactionTracker";
import { getPrioritizedInteractions } from "@app/utils/interactionTracker";
import { resetInteractions } from "@app/utils/interactionTracker";
import { getInteractionScores } from "@app/utils/interactionTracker";
import { usePreferences } from "@app/hooks/usePreferences";
import ProfilePopupSystem from "@app/profile/page";
import { useColor } from "@app/context/ColorContext";

export default function AmazonProductPage() {
  const { product_id } = useParams();
  const [product, setProduct] = useState(null);
  const { data: session } = useSession();
  const pathname = usePathname();
  const { themeColor } = useColor();
  // Elements that can be reordered (excluding ProductHeader)
  const reorderableElements = [
    "BuyBox",
    "ProductDescription",
    "ProductReviews",
    "Random",
  ];

  const [error, setError] = useState(null);
  const { preferences, isLoading } = usePreferences();

  // Gallery state
  const [selectedImage, setSelectedImage] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  // CACHED ELEMENT ORDER - only updates on route changes or initial load
  const [elementOrder, setElementOrder] = useState(reorderableElements);

  // Track image layout preference
  const [imageLayoutVertical, setImageLayoutVertical] = useState(false);

  // Clear any stored guest preferences on page reload (fresh start for guests)
  useEffect(() => {
    if (!session?.user?.id) {
      console.log(
        "Guest user detected on page load - clearing any existing session data"
      );
      try {
        sessionStorage.removeItem("guestPreferences");
      } catch (err) {
        console.error("Storage clear error:", err);
      }
    }
  }, []); // Empty dependency array - runs only on mount (page reload)

  // FIXED: Get element order based on preferences with case-insensitive matching
  const calculateElementOrder = () => {
    if (!preferences || preferences.length === 0) {
      console.log("Using default order - no preferences");
      return reorderableElements;
    }

    console.log("Calculating element order with preferences:", preferences);
    console.log("Reorderable elements:", reorderableElements);

    // Create a case-insensitive preference map
    const prefMap = new Map();
    preferences.forEach((pref) => {
      const normalizedKey = pref.element.toLowerCase();
      prefMap.set(normalizedKey, pref.score || 0);
      console.log(
        `Mapped: "${pref.element}" → "${normalizedKey}" = ${pref.score}`
      );
    });

    console.log("Preference map:", Object.fromEntries(prefMap));

    // Sort elements by their preference scores (highest first)
    const orderedElements = [...reorderableElements].sort((a, b) => {
      const scoreA = prefMap.get(a.toLowerCase()) || 0;
      const scoreB = prefMap.get(b.toLowerCase()) || 0;

      console.log(`Comparing: ${a}(${scoreA}) vs ${b}(${scoreB})`);
      const result = scoreB - scoreA;
      console.log(
        `   → ${result > 0 ? b + " wins" : result < 0 ? a + " wins" : "tie"}`
      );
      return result;
    });

    console.log("Final calculated element order:", orderedElements);

    // Debug: Show the final scoring
    orderedElements.forEach((element, index) => {
      const score = prefMap.get(element.toLowerCase()) || 0;
      console.log(`   ${index + 1}. ${element} (score: ${score})`);
    });

    return orderedElements;
  };

  // Calculate if image interactions are dominant
  const calculateImageLayoutPreference = () => {
    if (!preferences || preferences.length === 0) {
      return false; // Default to horizontal layout
    }

    // Find MainImage preference only (not thumbnails)
    const mainImagePref = preferences.find(
      (pref) => pref.element.toLowerCase() === "mainimage"
    );

    // Find non-image preferences (the reorderable elements)
    const nonImagePrefs = preferences.filter((pref) =>
      reorderableElements.some(
        (el) => el.toLowerCase() === pref.element.toLowerCase()
      )
    );

    if (!mainImagePref || (mainImagePref.score || 0) === 0) {
      return false; // No main image interactions yet
    }

    // Get main image score
    const mainImageScore = mainImagePref.score || 0;

    // Find the highest scoring non-image element
    const highestNonImageScore =
      nonImagePrefs.length > 0
        ? Math.max(...nonImagePrefs.map((pref) => pref.score || 0))
        : 0;

    // Debug logging
    console.log("Image layout calculation:", {
      mainImagePref,
      mainImageScore,
      nonImagePrefs,
      highestNonImageScore,
      threshold: Math.max(highestNonImageScore, 15), // Either beat highest or reach minimum
    });

    // Switch to vertical layout if main image score is highest among all elements
    // OR if it reaches a minimum threshold
    const shouldSwitchToVertical =
      mainImageScore > highestNonImageScore && mainImageScore >= 15;

    console.log("Should switch to vertical layout:", shouldSwitchToVertical);

    return shouldSwitchToVertical;
  };

  // Update element order ONLY on pathname changes or initial preferences load
  useEffect(() => {
    if (!isLoading) {
      const newOrder = calculateElementOrder();
      setElementOrder(newOrder);

      // Also recalculate image layout on route changes
      const shouldBeVertical = calculateImageLayoutPreference();
      if (shouldBeVertical !== imageLayoutVertical) {
        setImageLayoutVertical(shouldBeVertical);
      }

      console.log("Layout updated for route change:", {
        pathname,
        newOrder,
        preferencesCount: preferences.length,
        imageLayoutVertical: shouldBeVertical,
        timestamp: new Date().toLocaleTimeString(),
      });
    }
  }, [pathname, isLoading]); // Only depend on pathname and loading state

  // Real-time image layout updates based on preferences
  useEffect(() => {
    if (!isLoading && preferences.length > 0) {
      const shouldBeVertical = calculateImageLayoutPreference();
      if (shouldBeVertical !== imageLayoutVertical) {
        console.log(
          `Changing image layout from ${imageLayoutVertical} to ${shouldBeVertical}`
        );
        setImageLayoutVertical(shouldBeVertical);
      }
    }
  }, [preferences]); // Depend on preferences to update in real-time

  // Log preference updates but DON'T change layout order (only image layout can change)
  useEffect(() => {
    if (preferences.length > 0) {
      console.log(
        "Preferences updated while on product page (element layout stays stable):",
        {
          preferencesCount: preferences.length,
          currentLayout: elementOrder,
          currentImageLayout: imageLayoutVertical ? "Vertical" : "Horizontal",
          latestPreferences: preferences.slice(0, 3), // Show first 3
          willChangeOnNextPageVisit: true,
        }
      );
    }
  }, [preferences]);

  // Component mapping with image interaction tracking
  const componentMap = {
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
        onMouseLeave={() => trackInteraction("ProductDescription", "hover-end")}
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
        id="Random"
        onClick={() => trackInteraction("Random", "click")}
        onMouseEnter={() => trackInteraction("Random", "hover-start")}
        onMouseLeave={() => trackInteraction("Random", "hover-end")}
      />
    ),
  };

  useEffect(() => {
    function handleUnload() {
      const sorted = getPrioritizedInteractions();
      console.log("Leaving page →", sorted);
    }

    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, []);

  useEffect(() => {
    return () => {
      const sorted = getPrioritizedInteractions();
      console.log(`Navigated away from ${pathname} →`, sorted);
    };
  }, [pathname]);

  useEffect(() => {
    function handleScroll() {
      const bottom =
        window.innerHeight + window.scrollY >= document.body.offsetHeight - 50;
      if (bottom) {
        const sorted = getPrioritizedInteractions();
        console.log("User reached bottom →", sorted);
      }
    }

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    async function fetchProduct() {
      try {
        setError(null);
        const res = await fetch(`/api/products/${product_id}`);
        console.log("page product", res);

        if (!res.ok) {
          throw new Error(
            `Failed to fetch product: ${res.status} ${res.statusText}`
          );
        }

        const data = await res.json();
        console.log("Page DATA", data);
        setProduct(data);
      } catch (err) {
        console.error("Error fetching product:", err);
        setError(err.message);
      }
    }

    if (product_id) {
      fetchProduct();
    }
  }, [product_id]);

  if (error) return <p className="p-8 text-lg text-red-500">Error: {error}</p>;
  if (!product) return <p className="p-8">Loading...</p>;

  const images = product.imgUrl
    ? [product.imgUrl, product.imgUrl, product.imgUrl]
    : ["/placeholder-image.jpg"];

  return (
    <div className="min-h-screen" style={{ background: themeColor }}>
      {/* Dynamic Layout Container with glassmorphism */}
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
          background: "rgba(255, 255, 255, 0.7)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          border: "1px solid rgba(255, 255, 255, 0.3)",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
        }}
      >
        {/* Image Section - Dynamic positioning */}
        <div
          className={`
          transition-all duration-500
          ${imageLayoutVertical ? "w-full mb-6" : "md:col-span-5"}
        `}
        >
          {/* Layout Change Indicator with glassmorphism */}
          {imageLayoutVertical && (
            <div
              className="mt-10 mb-4 p-3 rounded-2xl" // Added mt-20 for spacing below sticky navbar
              style={{
                background: "rgba(219, 234, 254, 0.5)",
                backdropFilter: "blur(10px) saturate(150%)",
                WebkitBackdropFilter: "blur(10px) saturate(150%)",
                border: "1px solid rgba(191, 219, 254, 0.4)",
              }}
            >
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-blue-600" // Also fixed the icon sizing (was h-3 mt-20)
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" />
                </svg>
                <span className="text-sm font-medium text-blue-900">
                  Image-Focused Layout Active
                </span>
              </div>
              <p className="text-xs text-blue-700 mt-1">
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
      ? "flex flex-col gap-4 items-center" // Column layout when image-focused
      : "sticky top-4 flex flex-row gap-4 items-start" // Default: row with thumbnails on left
  }
`}
          >
            {/* Default layout: Thumbnails on LEFT side in vertical column */}

            {/* Image-focused layout: Thumbnails UNDER main image horizontally */}
            {imageLayoutVertical && (
              <div className="w-full">
                <Thumbnails
                  images={images}
                  selectedImage={selectedImage}
                  setSelectedImage={setSelectedImage}
                  product={product}
                  isVerticalLayout={true}
                />
              </div>
            )}

            {/* Main Image with interaction tracking */}
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

            {/* Image-focused layout: Thumbnails UNDER main image horizontally */}
            {imageLayoutVertical && (
              <div className="w-full">
                <Thumbnails
                  images={images}
                  selectedImage={selectedImage}
                  setSelectedImage={setSelectedImage}
                  product={product}
                />
              </div>
            )}
          </div>
        </div>

        {/* Content Section */}
        <div
          className={`
          space-y-8 transition-all duration-500
          ${imageLayoutVertical ? "w-full" : "md:col-span-7"}
        `}
        >
          {/* ProductHeader always stays at the top */}
          {componentMap.ProductHeader}

          {/* Other elements ordered by cached preferences */}
          {elementOrder.map((elementName) => componentMap[elementName])}
        </div>
      </div>

      {/* Debug section with glassmorphism */}
      <div
        className="max-w-7xl mx-auto p-4 mt-6 rounded-3xl"
        style={{
          background: "rgba(255, 255, 255, 0.6)",
          backdropFilter: "blur(15px) saturate(150%)",
          WebkitBackdropFilter: "blur(15px) saturate(150%)",
          border: "1px solid rgba(255, 255, 255, 0.3)",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.08)",
        }}
      >
        <h2 className="text-lg font-bold mb-2">
          Your Preferences{" "}
          {!session?.user?.id && (
            <span className="text-sm text-gray-500">
              (Guest - resets on page reload)
            </span>
          )}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            className="p-4 rounded-2xl"
            style={{
              background: "rgba(255, 255, 255, 0.5)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              border: "1px solid rgba(255, 255, 255, 0.4)",
            }}
          >
            <h3 className="font-semibold mb-2">Current Layout Order:</h3>
            <ol className="list-decimal pl-5">
              <li className="flex justify-between">
                <span>ProductHeader</span>
                <span className="text-gray-600">Fixed at top</span>
              </li>
              {elementOrder.map((element, idx) => {
                const pref = preferences.find(
                  (p) => p.element.toLowerCase() === element.toLowerCase()
                );
                const score = pref?.score || 0;

                return (
                  <li key={idx + 1} className="flex justify-between">
                    <span>{element}</span>
                    <span className="text-gray-600">
                      Score: {score}
                      {idx === 0 && score > 0 && (
                        <span className="text-green-600 ml-1">(Highest)</span>
                      )}
                    </span>
                  </li>
                );
              })}
            </ol>
            <p className="text-xs text-gray-500 mt-2">
              * Layout updates when you visit a new product page
            </p>
          </div>
          <div
            className="p-4 rounded-2xl"
            style={{
              background: "rgba(255, 255, 255, 0.5)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              border: "1px solid rgba(255, 255, 255, 0.4)",
            }}
          >
            <h3 className="font-semibold mb-2">Live Preference Scores:</h3>
            <ul className="list-disc pl-5">
              {preferences.length > 0 ? (
                preferences
                  .sort((a, b) => (b.score || 0) - (a.score || 0))
                  .map((pref, idx) => (
                    <li key={idx} className="flex justify-between">
                      <span>{pref.element}</span>
                      <span className="text-gray-600">{pref.score || 0}</span>
                    </li>
                  ))
              ) : (
                <li className="text-gray-500">
                  {session?.user?.id
                    ? "No preferences yet. Interact with elements to build your preferences!"
                    : "No preferences yet. Interact with elements to customize this session!"}
                </li>
              )}
            </ul>
            <p className="text-xs text-gray-500 mt-2">
              * Scores update in real-time as you interact
            </p>
          </div>
        </div>

        {/* Enhanced Debug section with glassmorphism */}
        <div
          className="mt-4 p-3 rounded-2xl"
          style={{
            background: "rgba(254, 252, 232, 0.6)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            border: "1px solid rgba(252, 211, 77, 0.3)",
          }}
        >
          <h4 className="font-bold text-sm">Debug Info:</h4>
          <div className="text-xs mt-1">
            <strong>Current Layout:</strong>{" "}
            {imageLayoutVertical
              ? "Vertical (Image-focused)"
              : "Horizontal (Default)"}
          </div>
          <div className="text-xs mt-1">
            <strong>Current Element Order:</strong> {elementOrder.join(" → ")}
          </div>

          {/* Image interaction scores */}
          <div className="text-xs mt-1">
            <strong>Main Image Interaction Score:</strong>
            {(() => {
              const mainImagePref = preferences.find(
                (pref) => pref.element.toLowerCase() === "mainimage"
              );
              const mainImageScore = mainImagePref?.score || 0;

              const nonImagePrefs = preferences.filter((pref) =>
                reorderableElements.some(
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
                    {mainImageScore >= 15
                      ? " (above minimum)"
                      : " (below minimum 15)"}
                  </div>
                  <div>
                    Threshold for vertical layout: Beat highest other element
                    AND reach 15+ score
                  </div>
                </div>
              );
            })()}
          </div>

          <div className="text-xs mt-1">
            <strong>Live Preferences:</strong>
            <pre
              className="mt-1 p-2 rounded text-xs overflow-x-auto"
              style={{
                background: "rgba(243, 244, 246, 0.8)",
                backdropFilter: "blur(5px)",
                WebkitBackdropFilter: "blur(5px)",
              }}
            >
              {JSON.stringify(preferences.slice(0, 6), null, 2)}
            </pre>
          </div>
          <div className="text-xs mt-2">
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
              background: "rgba(219, 234, 254, 0.5)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              border: "1px solid rgba(191, 219, 254, 0.4)",
            }}
          >
            <p className="text-sm text-blue-700">
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
