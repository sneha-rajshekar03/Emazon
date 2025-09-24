"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import ProductCard from "./components/products/ProductCard";
import HeroBanner from "./components/HeroBanner/HeroBanner";
import productsData from "./api/products/products.json";

export default function Home() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState([]);
  const [hero, setHero] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userColor, setUserColor] = useState("#ffffff");
  const [error, setError] = useState(null);

  // ✅ read category from URL (don’t fallback to Appliances blindly)
  const category = searchParams.get("category");

  // Filter products whenever category changes
  useEffect(() => {
    setLoading(true);
    setError(null);

    if (category) {
      const matchedCategory = productsData.find((c) =>
        c.category_name.toLowerCase().includes(category.toLowerCase())
      );

      if (matchedCategory) {
        const list = matchedCategory.products.map((p) => ({
          ...p,
          id: p.id || Math.random().toString(36).substring(2, 9),
        }));
        setProducts(list);
      } else {
        setProducts([]);
        setError("Product not found");
      }
    } else {
      // default = show all
      const list = productsData.flatMap((c) =>
        c.products.map((p) => ({
          ...p,
          id: p.id || Math.random().toString(36).substring(2, 9),
        }))
      );
      setProducts(list);
    }

    setLoading(false);
  }, [category]);

  // Fetch hero banner
  useEffect(() => {
    async function fetchHero() {
      try {
        const res = await fetch("/api/hero");
        const data = await res.json();
        setHero(data.hero ?? data);
      } catch (err) {
        console.error("Error fetching hero:", err);
      }
    }
    fetchHero();
  }, []);

  // Fetch logged-in user including color
  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/userColor");
        const data = await res.json();
        setUserColor(data.user?.color || "#ffffff");
      } catch (err) {
        console.error("Error fetching user color:", err);
      }
    }
    fetchUser();
  }, []);

  return (
    <main className="p-6">
      {/* Hero banner */}
      {hero && <HeroBanner hero={hero} />}

      {/* Product Grid */}
      {loading ? (
        <p>Loading products...</p>
      ) : error ? (
        <p className="text-red-500 font-semibold">{error}</p>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {products.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              color={userColor}
              priority={index < 2}
            />
          ))}
        </div>
      ) : (
        <></>
      )}
    </main>
  );
}
