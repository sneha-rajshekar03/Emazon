"use client";

import { useEffect, useState } from "react";
import ProductCard from "./components/products/ProductCard";
import HeroBanner from "./components/HeroBanner/HeroBanner";

export default function Home() {
  const [products, setProducts] = useState([]);
  const [hero, setHero] = useState(null);

  useEffect(() => {
    // Fetch product list
    async function fetchProducts() {
      try {
        const res = await fetch("/api/products");
        const data = await res.json();
        // Ensure products have unique keys (asin)
        setProducts(
          data.products.map((p) => ({
            ...p,
            id: p.asin || p.id || Math.random().toString(36).substr(2, 9),
          }))
        );
      } catch (err) {
        console.error("Error fetching products:", err);
      }
    }

    // Fetch hero banner
    async function fetchHero() {
      try {
        const res = await fetch("/api/hero");
        const data = await res.json();
        setHero(data.hero);
      } catch (err) {
        console.error("Error fetching hero:", err);
      }
    }

    fetchProducts();
    fetchHero();
  }, []);

  return (
    <main className="p-6">
      {/* Hero Banner */}
      {hero && <HeroBanner hero={hero} />}

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-8">
        {products.slice(0, 9).map((product, index) => (
          <ProductCard
            key={product.id}
            product={product}
            priority={index < 2}
          />
        ))}
      </div>
    </main>
  );
}
