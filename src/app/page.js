"use client";

import { useEffect, useState } from "react";
import ProductCard from "./components/products/ProductCard";
import HeroBanner from "./components/HeroBanner/HeroBanner";
import productsData from "./api/products/products.json";

export default function Home() {
  const [products, setProducts] = useState([]);
  const [hero, setHero] = useState(null);
  const [loading, setLoading] = useState(false);

  // Set the internal category here
  const category = "Appliances"; // Change this to whatever category you want

  useEffect(() => {
    setLoading(true);

    // Filter products based on internal category
    const filteredProducts = category
      ? productsData.find((c) => c.category_name === category)?.products || []
      : productsData.flatMap((c) => c.products);

    // Ensure each product has a unique ID
    const list = filteredProducts.map((p) => ({
      ...p,
      id: p.id || Math.random().toString(36).substring(2, 9),
    }));

    setProducts(list);
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

  return (
    <main className="p-6">
      {/* Hero banner */}
      {hero && <HeroBanner hero={hero} />}

      {/* Product Grid */}
      {loading ? (
        <p>Loading products...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {products.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              priority={index < 2}
            />
          ))}
        </div>
      )}
    </main>
  );
}
