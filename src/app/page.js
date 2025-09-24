"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import ProductCard from "./components/products/ProductCard";
import HeroBanner from "./components/HeroBanner/HeroBanner";
import productsData from "./api/products/products.json";

export default function Home() {
  const searchParams = useSearchParams();
  const urlCategory = searchParams.get("category");
  const [products, setProducts] = useState([]);
  const [hero, setHero] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userColor, setUserColor] = useState("#ffffff");
  const [error, setError] = useState(null);
  const [category, setCategory] = useState(null); // start empty
  useEffect(() => {
    async function initCategory() {
      try {
        const res = await fetch("/api/lastSearch");
        if (!res.ok) {
          throw new Error(`Failed to fetch last search: ${res.status}`);
        }

        const data = await res.json();
        if (data?.category) {
          setCategory(data.category); // from DB
        } else if (urlCategory) {
          setCategory(urlCategory); // from URL
        } else {
          setCategory("Appliances"); // fallback
        }
      } catch (err) {
        console.error("Error fetching last search:", err);
        setCategory("Appliances");
      }
    }
    initCategory();
  }, [urlCategory]);
  // Filter products whenever category changes
  useEffect(() => {
    if (!category) return;

    setLoading(true);
    setError(null);

    if (category) {
      // 🔹 Find the matching category
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
      // 🔹 Default = show Appliances only
      const appliancesCategory = productsData.find(
        (c) => c.category_name.toLowerCase() === "appliances"
      );

      if (appliancesCategory) {
        const list = appliancesCategory.products.map((p) => ({
          ...p,
          id: p.id || Math.random().toString(36).substring(2, 9),
        }));
        setProducts(list);
      } else {
        setProducts([]);
        setError("Appliances category not found");
      }
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
  console.log(products);
  return (
    <main className="p-6">
      {/* Hero banner */}
      {hero && <HeroBanner hero={hero} />}

      {/* Product Grid */}
      {loading ? (
        <p>Loading products...</p>
      ) : error ? (
        <p className="text-red-500 font-semibold"></p>
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
