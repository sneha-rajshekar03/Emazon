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
import {
  trackInteraction,
  getPrioritizedInteractions,
} from "@/app/utils/interactionTracker";
import { usePreferences } from "@/app/hooks/usePreferences";
import { useColor } from "@/app/context/ColorContext";

const REORDERABLE_ELEMENTS = [
  "BuyBox",
  "ProductDescription",
  "ProductReviews",
  "Random",
];
const IMAGE_LAYOUT_ELEMENTS = [
  "BuyBox",
  "ProductDescription",
  "ProductReviews",
  "Random",
];
const IMAGE_LAYOUT_THRESHOLD = 15;

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
  const [selectedImage, setSelectedImage] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [elementOrder, setElementOrder] = useState(REORDERABLE_ELEMENTS);
  const [imageLayoutVertical, setImageLayoutVertical] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    async function fetchProductAndSimilar() {
      if (!product_id) return;

      try {
        setError(null);
        const res = await fetch(`/api/products/${product_id}`);
        if (isCancelled) return;
        if (!res.ok)
          throw new Error(`Failed to fetch product: ${res.statusText}`);

        const data = await res.json();
        setProduct(data);

        const similarRes = await fetch(
          `/api/products/${product_id}/similar?limit=10`
        );
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
        }
      } catch (err) {
        if (!isCancelled) setError(err.message);
      }
    }

    fetchProductAndSimilar();
    return () => {
      isCancelled = true;
      localStorage.removeItem("similarProducts");
    };
  }, [product_id]);

  useEffect(() => {
    if (!session?.user?.id) sessionStorage.removeItem("guestPreferences");
  }, [session?.user?.id]);

  const calculateElementOrder = useCallback(() => {
    if (!preferences?.length) return REORDERABLE_ELEMENTS;
    const prefMap = new Map(
      preferences.map((p) => [p.element.toLowerCase(), p.score || 0])
    );
    return [...REORDERABLE_ELEMENTS].sort(
      (a, b) =>
        (prefMap.get(b.toLowerCase()) || 0) -
        (prefMap.get(a.toLowerCase()) || 0)
    );
  }, [preferences]);

  const calculateImageLayoutPreference = useCallback(() => {
    if (!preferences?.length) return false;
    const prefMap = new Map(
      preferences.map((p) => [p.element.toLowerCase(), p.score || 0])
    );
    const mainImageScore = prefMap.get("mainimage") || 0;
    const highestNonImage = Math.max(
      ...IMAGE_LAYOUT_ELEMENTS.map((e) => prefMap.get(e.toLowerCase()) || 0)
    );
    return (
      mainImageScore > highestNonImage &&
      mainImageScore >= IMAGE_LAYOUT_THRESHOLD
    );
  }, [preferences]);

  useEffect(() => {
    if (!isLoading) {
      setElementOrder(calculateElementOrder());
      setImageLayoutVertical(calculateImageLayoutPreference());
    }
  }, [
    pathname,
    isLoading,
    calculateElementOrder,
    calculateImageLayoutPreference,
  ]);

  const handleUnload = useCallback(() => {
    console.log("Leaving page →", getPrioritizedInteractions());
  }, []);

  useEffect(() => {
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, [handleUnload]);

  const handleScroll = useCallback(() => {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 50)
      console.log("User reached bottom →", getPrioritizedInteractions());
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const images = useMemo(() => {
    return product?.imgUrl
      ? [product.imgUrl, product.imgUrl, product.imgUrl]
      : ["/placeholder-image.jpg"];
  }, [product?.imgUrl]);

  const componentMap = useComponentMap(product, product_id);

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
      className="min-h-screen transition-colors duration-700"
      style={{
        background: isDarkMode
          ? "radial-gradient(circle at top, rgba(10,10,10,1) 0%, rgba(0,0,0,1) 100%)"
          : "#ffffff",
      }}
    >
      <div
        className={`max-w-7xl mx-auto p-4 gap-6 transition-all duration-500 rounded-3xl ${
          imageLayoutVertical
            ? "flex flex-col"
            : "grid grid-cols-1 md:grid-cols-12"
        }`}
        style={{
          background: isDarkMode ? "rgba(20, 20, 20, 0.85)" : "#ffffff",
          border: isDarkMode
            ? "1px solid rgba(75, 85, 99, 0.85)"
            : "1px solid #e5e7eb",
          boxShadow: isDarkMode
            ? "0 8px 32px rgba(0, 0, 0, 0.7)"
            : "0 1px 3px rgba(0, 0, 0, 0.08)",
        }}
      >
        <div
          className={`${
            imageLayoutVertical ? "w-full mb-6" : "md:col-span-5"
          } transition-all duration-500`}
        >
          <div
            className={`${
              imageLayoutVertical
                ? "flex flex-col gap-4 items-center"
                : "sticky top-20 flex flex-row gap-4 items-start"
            }`}
          >
            <div
              className={imageLayoutVertical ? "w-full" : "flex-1"}
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
            {!imageLayoutVertical && (
              <div className="mt-20">
                <Thumbnails
                  images={images}
                  selectedImage={selectedImage}
                  setSelectedImage={setSelectedImage}
                  product={product}
                  onClick={() => trackInteraction("Thumbnails", "click")}
                />
              </div>
            )}
          </div>
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

        <div
          className={`${
            imageLayoutVertical ? "w-full" : "md:col-span-7"
          } space-y-8`}
        >
          {componentMap.ProductHeader}
          {elementOrder.map((name) => componentMap[name])}
        </div>
      </div>

      {/* Debug & Preferences */}
      <div
        className="max-w-7xl mx-auto p-4 mt-6 rounded-3xl"
        style={{
          background: isDarkMode ? "rgba(15, 15, 15, 0.9)" : "#ffffff",
          border: isDarkMode
            ? "1px solid rgba(75, 85, 99, 0.3)"
            : "1px solid #e5e7eb",
          boxShadow: isDarkMode
            ? "0 8px 32px rgba(0, 0, 0, 0.3)"
            : "0 1px 3px rgba(0, 0, 0, 0.08)",
        }}
      >
        <h2
          className={`text-lg font-bold mb-2 ${
            isDarkMode ? "text-gray-100" : "text-gray-900"
          }`}
        >
          Your Preferences{" "}
          {!session?.user?.id && (
            <span className={isDarkMode ? "text-gray-400" : "text-gray-500"}>
              (Guest - resets on reload)
            </span>
          )}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {/* Layout Order */}
          <div
            className="p-4 rounded-2xl"
            style={{
              background: isDarkMode ? "rgba(55, 65, 81, 0.5)" : "#ffffff",
              border: isDarkMode
                ? "1px solid rgba(75, 85, 99, 0.4)"
                : "1px solid #e5e7eb",
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
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>

          {/* Live Scores */}
          <div
            className="p-4 rounded-2xl"
            style={{
              background: isDarkMode ? "rgba(55, 65, 81, 0.5)" : "#ffffff",
              border: isDarkMode
                ? "1px solid rgba(75, 85, 99, 0.4)"
                : "1px solid #e5e7eb",
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
          </div>
        </div>
      </div>
    </div>
  );
}
