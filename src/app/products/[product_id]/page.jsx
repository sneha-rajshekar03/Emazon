"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ProductHeader } from "./ProductHeader";
import { BuyBox } from "./BuyBox";
import { ProductDescription } from "./ProductDescription";
import { ProductReviews } from "./ProductReviews";
import { MainImage } from "./MainImage";
import { Thumbnails } from "./Thumbnails";
import { Random } from "./Random";

export default function AmazonProductPage() {
  const { product_id } = useParams();
  const [product, setProduct] = useState(null);
  const [error, setError] = useState(null);

  // 🖼️ Gallery state lives here
  const [selectedImage, setSelectedImage] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

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
          <ProductHeader product={product} />
          <BuyBox product={product} />
          <ProductDescription product={product} />
          <ProductReviews product={product} />
          <Random product={product} />
        </div>
      </div>
    </div>
  );
}
