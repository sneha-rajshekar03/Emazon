"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import ProductCard from "./components/productCard/ProductCard";
import HeaderSlider from "./components/Nav/HeaderSlider";
import Head from "next/head";
import Banner from "./components/Nav/Banner";
import NewsLetter from "./components/Nav/NewsLetter";
import Footer from "./components/Nav/Footer";
import FeaturedProduct from "./components/Nav/FeaturedProducts";

export default function Home() {
  const searchParams = useSearchParams();
  const urlCategory = searchParams.get("category");
  const [products, setProducts] = useState([]);
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

    async function fetchProducts() {
      try {
        const res = await fetch(
          `/api/products?category=${encodeURIComponent(category)}`
        );
        const data = await res.json();

        if (data.products?.length > 0) {
          setProducts(
            data.products.map((p) => ({
              ...p,
              id: p.product_id || Math.random().toString(36).substring(2, 9),
            }))
          );
        } else {
          setProducts([]);
          setError("Product not found");
        }
      } catch (err) {
        console.error("Error fetching products:", err);
        setError("Server error");
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [category]);

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
      <HeaderSlider color={userColor} />

      {/* Product Grid */}
      {loading ? (
        <p>Loading products...</p>
      ) : error ? (
        <p className="text-red-500 font-semibold"></p>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {products.slice(0, 12).map((product, index) => (
            <ProductCard
              key={product.product_id}
              product={product}
              color={userColor}
              priority={index < 2}
            />
          ))}
        </div>
      ) : (
        <></>
      )}
      <NewsLetter />
      <Footer />
    </main>
  );
}
