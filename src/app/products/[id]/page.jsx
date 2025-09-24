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
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchProduct() {
      try {
        const res = await fetch("/api/products");
        if (!res.ok) throw new Error("Failed to fetch products");

        const data = await res.json();
        const allProducts = data.flatMap((cat) => cat.products);
        const found = allProducts.find((p) => p.id === id);

        if (!found) throw new Error("Product not found");
        setProduct(found);
      } catch (err) {
        setError(err.message);
      }
    }
    fetchProduct();
  }, [id]);

  if (error) return <p className="p-8 text-lg text-red-500">{error}</p>;
  if (!product) return <p className="p-8">Loading...</p>;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto p-4 bg-white grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Sticky Images */}
        <div className="md:col-span-5">
          <div className="sticky top-4 flex gap-4 items-start">
            {/* Vertical thumbnails */}
            <div className="flex flex-col gap-3.5"></div>
            <Thumbnails product={product} />
            {/* Main image */}
            <MainImage product={product} />
          </div>
        </div>

        {/* RIGHT COLUMN: Scrollable Content */}
        <div className="md:col-span-7 space-y-8">
          <ProductHeader product={product} />
          <BuyBox product={product} />
          <ProductDescription product={product} />
          <ProductReviews product={product} />
          <Random />
        </div>
      </div>
    </div>
  );
}
