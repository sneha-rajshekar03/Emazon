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
    const handleSave = () => {
      if (pathname.startsWith("/product")) {
        const sorted = getPrioritizedInteractions();
        console.log("Leaving product page →", sorted);

        if (session?.user?.id) {
          // ✅ Logged-in → save in DB
          fetch("/api/interactions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: session.user.id,
              interactions: sorted,
            }),
          })
            .then((res) => res.json())
            .then((data) => console.log("✅ DB save response:", data))
            .catch((err) => console.error("❌ Save error:", err));
        } else {
          // 🟡 Guest → store only for session
          sessionStorage.setItem("guestInteractions", JSON.stringify(sorted));
          console.log("🟡 Guest interactions saved locally:", sorted);
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
      sessionStorage.removeItem("guestInteractions");
    }
  }, [session]);
  useEffect(() => {
    async function fetchPreferences() {
      try {
        const res = await fetch("/api/preferences", { method: "GET" });
        const data = await res.json();

        if (data?.preferences) {
          // sort preferences by score (high → low)
          const sorted = [...data.preferences].sort(
            (a, b) => b.score - a.score
          );
          setPreferences(sorted);
        }
      } catch (err) {
        console.error("❌ Error fetching preferences:", err);
      }
    }
    fetchPreferences();
  }, []);

  useEffect(() => {
    async function fetchProduct() {
      try {
        const res = await fetch(`/api/products/${product_id}`);
        console.log("page prodcut", res);
        if (!res.ok) throw new Error("Failed to fetch products");

        const data = await res.json();
        console.log("Page DATA", data);

        setProduct(data);
      } catch (err) {
        setError(err.message);
      }
    }
    fetchProduct();
  }, [product_id]);

  if (error) return <p className="p-8 text-lg text-red-500">{error}</p>;
  if (!product) return <p className="p-8">Loading...</p>;

  // Build an array of images (for now duplicates if only one exists)
  const images = [product.imgUrl, product.imgUrl, product.imgUrl];

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
          <ProductHeader
            product={product}
            id="ProductHeader"
            onClick={() => trackInteraction("ProductHeader", "click")}
            onMouseEnter={() =>
              trackInteraction("ProductHeader", "hover-start")
            }
            onMouseLeave={() => trackInteraction("ProductHeader", "hover-end")}
          />
          <BuyBox
            product={product}
            id="BuyBox"
            onClick={() => trackInteraction("BuyBox", "click")}
            onMouseEnter={() => trackInteraction("BuyBox", "hover-start")}
            onMouseLeave={() => trackInteraction("Buybox", "hover-end")}
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
