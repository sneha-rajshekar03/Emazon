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
export default function AmazonProductPage() {
  const { product_id } = useParams();
  const [product, setProduct] = useState(null);
  const { data: session } = useSession(); // null if guest
  const [preferences, setPreferences] = useState([]);
  const defaultOrder = [
    "ProductHeader",
    "BuyBox",
    "ProductDescription",
    "ProductReviews",
    "Random",
  ];
  const [error, setError] = useState(null);
  const pathname = usePathname();

  // 🖼️ Gallery state lives here
  const [selectedImage, setSelectedImage] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  useEffect(() => {
    if (pathname.startsWith("/products/")) {
      // 🔄 Reset interactions when landing on a new product
      resetInteractions();
      console.log("✅ Reset interactions for new product page:", pathname);
    }

    // 📝 When leaving product page, save scores
    return () => {
      if (pathname.startsWith("/products/")) {
        const scores = getInteractionScores();
        console.log("💾 Saving interactions before leaving:", scores);

        // send to API
        fetch("/api/preferences", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: "demo-user", // replace with real userId from session
            interactions: Object.entries(scores).map(([element, score]) => ({
              element,
              score,
            })),
          }),
        });
      }
    };
  }, [pathname]);

  useEffect(() => {
    function handleUnload() {
      const sorted = getPrioritizedInteractions();
      console.log("Leaving page →", sorted);
    }

    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, []);

  useEffect(() => {
    // fires whenever route changes (e.g., going back to /home)
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
    const handleSave = async () => {
      if (pathname.startsWith("/product")) {
        const sorted = getPrioritizedInteractions();
        console.log("Leaving product page →", sorted);

        if (session?.user?.id) {
          // ✅ Logged-in → save in DB
          try {
            console.log("Sending to API:", {
              userId: session.user.id,
              interactions: sorted,
            });

            const response = await fetch("/api/interactions", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId: session.user.id,
                interactions: sorted,
              }),
            });

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(
                `HTTP ${response.status}: ${
                  errorData.error || response.statusText
                }`
              );
            }

            const data = await response.json();
            console.log("✅ DB save response:", data);

            // Update preferences state with returned data
            if (data.preferences) {
              setPreferences(data.preferences);
            }
          } catch (err) {
            console.error("❌ Save error:", err);
          }
        } else {
          // 🟡 Guest → store only for session
          try {
            sessionStorage.setItem("guestInteractions", JSON.stringify(sorted));
            console.log("🟡 Guest interactions saved locally:", sorted);
          } catch (err) {
            console.error("❌ SessionStorage error:", err);
          }
        }
      }
    };

    // 🔹 Run when leaving page (dependency change)
    return () => {
      handleSave();
    };
  }, [pathname, session]);

  useEffect(() => {
    if (!session?.user?.id) {
      try {
        sessionStorage.removeItem("guestInteractions");
      } catch (err) {
        console.error("❌ SessionStorage removal error:", err);
      }
    }
  }, [session]);

  useEffect(() => {
    async function fetchPreferences() {
      if (!session?.user?.id) {
        console.log("No session, skipping preferences fetch");
        return;
      }

      try {
        const res = await fetch(`/api/preferences?userId=${session.user.id}`);

        if (!res.ok) {
          throw new Error(`Failed to fetch preferences: ${res.status}`);
        }

        const data = await res.json();
        console.log("Fetched preferences:", data);

        if (data?.preferences) {
          // Handle both score and count fields for backward compatibility
          const sorted = [...data.preferences].sort(
            (a, b) => (b.score || b.count || 0) - (a.score || a.count || 0)
          );
          setPreferences(sorted);
        }
      } catch (err) {
        console.error("❌ Error fetching preferences:", err);
      }
    }
    fetchPreferences();
  }, [session?.user?.id]); // Only fetch when user is logged in

  useEffect(() => {
    async function fetchProduct() {
      try {
        setError(null); // Reset error state
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
        console.error("❌ Error fetching product:", err);
        setError(err.message);
      }
    }

    if (product_id) {
      fetchProduct();
    }
  }, [product_id]);

  if (error) return <p className="p-8 text-lg text-red-500">Error: {error}</p>;
  if (!product) return <p className="p-8">Loading...</p>;

  // Build an array of images (handle case where imgUrl might be null/undefined)
  const images = product.imgUrl
    ? [product.imgUrl, product.imgUrl, product.imgUrl]
    : ["/placeholder-image.jpg"]; // fallback image

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto p-4 bg-white grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Sticky Images */}
        <div className="md:col-span-5">
          <div className="sticky top-4 flex gap-4 items-start">
            {/* Vertical thumbnails */}
            <Thumbnails
              images={images}
              selectedImage={selectedImage}
              setSelectedImage={setSelectedImage}
              product={product}
            />

            {/* Main image */}
            <MainImage
              product={product}
              images={images}
              selectedImage={selectedImage}
              isZoomed={isZoomed}
              onZoomToggle={() => setIsZoomed(!isZoomed)}
            />
          </div>
        </div>

        {/* RIGHT COLUMN: Scrollable Content */}
        <div className="md:col-span-7 space-y-8">
          <ProductHeader product={product} />
          <BuyBox
            product={product}
            id="BuyBox"
            onClick={() => trackInteraction("BuyBox", "click")}
            onMouseEnter={() => trackInteraction("BuyBox", "hover-start")}
            onMouseLeave={() => trackInteraction("BuyBox", "hover-end")}
          />
          <ProductDescription
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
          <ProductReviews
            product={product}
            id="ProductReviews"
            onClick={() => trackInteraction("ProductReviews", "click")}
            onMouseEnter={() =>
              trackInteraction("ProductReviews", "hover-start")
            }
            onMouseLeave={() => trackInteraction("ProductReviews", "hover-end")}
          />
          <Random
            product={product}
            id="Random"
            onClick={() => trackInteraction("Random", "click")}
            onMouseEnter={() => trackInteraction("Random", "hover-start")}
            onMouseLeave={() => trackInteraction("Random", "hover-end")}
          />
        </div>
      </div>
    </div>
  );
}
