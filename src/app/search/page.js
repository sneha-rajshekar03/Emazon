"use client";
import React, { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import ProductCard from "@app/components/productCard/ProductCard";
import { AlertCircle } from "lucide-react";

export default function ProductSearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const urlCategory = searchParams.get("category");
  const searchQuery = searchParams.get("q");

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userColor, setUserColor] = useState("#ffffff");
  const [error, setError] = useState(null);
  const [searchType, setSearchType] = useState(null);
  const [displayText, setDisplayText] = useState("");

  // Fetch user color
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

  // 🔹 Helper function to remove duplicates and add unique keys
  const removeDuplicatesAndAddKeys = (productsArray) => {
    const seen = new Set();
    const uniqueProducts = [];

    productsArray.forEach((product, index) => {
      const productId = product.product_id || product._id || product.id;

      // Check if we've seen this product ID
      if (!seen.has(productId)) {
        seen.add(productId);
        uniqueProducts.push({
          ...product,
          id: productId,
          // Add a unique key combining product_id and index as fallback
          uniqueKey: `${productId}_${index}`,
        });
      }
    });

    return uniqueProducts;
  };

  // Main effect to handle all search scenarios
  useEffect(() => {
    async function handleSearch() {
      setLoading(true);
      setError(null);
      setProducts([]);

      try {
        // Priority 1: Search query from URL
        if (searchQuery) {
          setSearchType("query");
          setDisplayText(`Search results for "${searchQuery}"`);

          const res = await fetch("/api/search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query: searchQuery }),
          });

          const data = await res.json();

          if (data.valid && data.products?.length > 0) {
            // Remove duplicates and add unique keys
            const uniqueProducts = removeDuplicatesAndAddKeys(
              data.products.slice(0, 20)
            );
            setProducts(uniqueProducts);

            if (data.type === "category") {
              setDisplayText(`${data.category} Products`);
            } else if (data.type === "hybrid") {
              setDisplayText(`Personalized results for "${searchQuery}" ✨`);
            }

            // Show source info in console for debugging
            console.log("Search source:", data.source || "unknown");
            if (data.user_preferences) {
              console.log("User preferences active:", data.user_preferences);
            }
          } else {
            setError(`No products found for "${searchQuery}"`);
          }
        }
        // Priority 2: Category from URL
        else if (urlCategory) {
          setSearchType("category");
          setDisplayText(`${urlCategory} Products`);

          const res = await fetch(
            `/api/products?category=${encodeURIComponent(urlCategory)}`
          );
          const data = await res.json();

          if (data.products?.length > 0) {
            // Remove duplicates and add unique keys
            const uniqueProducts = removeDuplicatesAndAddKeys(
              data.products.slice(0, 20)
            );
            setProducts(uniqueProducts);
          } else {
            setError(`No products found in category "${urlCategory}"`);
          }
        }
        // Priority 3: Last search from database
        else {
          setSearchType("lastSearch");

          const res = await fetch("/api/lastSearch");
          if (!res.ok) {
            throw new Error(`Failed to fetch last search: ${res.status}`);
          }

          const data = await res.json();
          const categoryToFetch = data?.category || "Appliances";
          setDisplayText(`${categoryToFetch} Products`);

          const productsRes = await fetch(
            `/api/products?category=${encodeURIComponent(categoryToFetch)}`
          );
          const productsData = await productsRes.json();

          if (productsData.products?.length > 0) {
            // Remove duplicates and add unique keys
            const uniqueProducts = removeDuplicatesAndAddKeys(
              productsData.products.slice(0, 20)
            );
            setProducts(uniqueProducts);
          } else {
            setProducts([]);
            setError("No products found");
          }
        }
      } catch (err) {
        console.error("Error in search:", err);
        setError("Failed to load products. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    handleSearch();
  }, [urlCategory, searchQuery]);

  return (
    <main className="p-6">
      {/* Search Header */}
      {displayText && !loading && (
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">{displayText}</h1>
          {products.length > 0 && (
            <p className="text-sm text-gray-600 mt-1">
              Showing {products.length}{" "}
              {products.length === 1 ? "result" : "results"}
            </p>
          )}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mb-4" />
          <p className="text-gray-600">Loading products...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-red-800 mb-2">
              No Results Found
            </h2>
            <p className="text-red-600">{error}</p>
            <p className="text-sm text-gray-600 mt-4">
              Try searching for something else or browse our categories.
            </p>
          </div>
        </div>
      )}

      {/* Product Grid */}
      {!loading && !error && products.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product, index) => (
            <ProductCard
              key={
                product.uniqueKey ||
                `${product.product_id || product.id}_${index}`
              }
              product={product}
              color={userColor}
              priority={index < 4}
            />
          ))}
        </div>
      )}

      {/* Empty State (no error, no loading, no products) */}
      {!loading && !error && products.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="text-center">
            <p className="text-gray-500 text-lg">No products to display</p>
            <p className="text-gray-400 text-sm mt-2">
              Try searching for something
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
