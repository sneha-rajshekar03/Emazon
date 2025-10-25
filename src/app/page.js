"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import ProductCard from "./components/productCard/ProductCard";
import HeaderSlider from "./components/Nav/HeaderSlider";
import Banner from "./components/Nav/Banner";
import NewsLetter from "./components/Nav/NewsLetter";
import Footer from "./components/Nav/Footer";

export default function Home() {
  const searchParams = useSearchParams();
  const urlCategory = searchParams.get("category");
  const urlQuery = searchParams.get("query");

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userColor, setUserColor] = useState("#ffffff");
  const [error, setError] = useState(null);
  const [category, setCategory] = useState(null);
  const [userId, setUserId] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  // Fetch user data (ID, profile, color)
  useEffect(() => {
    async function fetchUserData() {
      try {
        // Fetch user profile
        const userRes = await fetch("/api/user");

        if (userRes.ok) {
          const userData = await userRes.json();

          // Set user ID
          const extractedUserId = userData.user_id || userData.id || null;
          setUserId(extractedUserId);

          // Set user profile with proper structure
          if (userData.profile) {
            const profile = {
              gender: userData.profile.gender || "female",
              age: userData.profile.age || 25,
              occupation: userData.profile.occupation || "professional",
              pets: userData.profile.pets || [],
            };
            setUserProfile(profile);
          } else {
            // Default profile if not available
            const defaultProfile = {
              gender: "female",
              age: 25,
              occupation: "professional",
              pets: [],
            };
            setUserProfile(defaultProfile);
          }
        } else {
          setUserId(null);
          setUserProfile({
            gender: "female",
            age: 25,
            occupation: "professional",
            pets: [],
          });
        }

        // Fetch user color
        const colorRes = await fetch("/api/userColor");

        if (colorRes.ok) {
          const body = await colorRes.json();
          const colorFromApi =
            typeof body === "string"
              ? body
              : body?.color ||
                body?.value ||
                body?.themeColor?.value ||
                body?.themeColor ||
                null;
          setUserColor(colorFromApi || "#ffffff");
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
        // Set defaults on error
        const fallbackProfile = {
          gender: "female",
          age: 25,
          occupation: "professional",
          pets: [],
        };
        setUserProfile(fallbackProfile);
        setUserColor("#ffffff");
      }
    }
    fetchUserData();
  }, []);

  // Initialize category from last search or URL
  useEffect(() => {
    async function initCategory() {
      try {
        const res = await fetch("/api/lastSearch");

        if (!res.ok) {
          throw new Error(`Failed to fetch last search: ${res.status}`);
        }

        const data = await res.json();

        if (data?.category) {
          setCategory(data.category);
        } else if (urlCategory) {
          setCategory(urlCategory);
        } else {
          setCategory("Appliances");
        }
      } catch (err) {
        console.error("Error fetching last search:", err);
        const fallbackCategory = urlCategory || "Appliances";
        setCategory(fallbackCategory);
      }
    }
    initCategory();
  }, [urlCategory]);

  // Fetch ML-powered recommendations
  useEffect(() => {
    // Wait until we have both category and user profile
    if (!category || !userProfile) {
      return;
    }

    setLoading(true);
    setError(null);

    async function fetchProducts() {
      try {
        const requestPayload = {
          user_id: userId || "guest_user",
          query: urlQuery || category,
          seed_item_idx: null,
          top_k: 20,
          user_profile: {
            gender: userProfile.gender || "female",
            age: userProfile.age || 25,
            occupation: userProfile.occupation || "professional",
            pets: userProfile.pets || [],
          },
          alphas: [0.25, 0.25, 0.2, 0.3],
        };

        // Use the POST endpoint that calls ML model
        const res = await fetch("/api/products", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestPayload),
        });

        if (!res.ok) {
          throw new Error(`Failed to fetch products: ${res.status}`);
        }

        const data = await res.json();

        if (data.success && data.products?.length > 0) {
          // Deduplicate products by product_id
          const seen = new Set();
          const uniqueProducts = data.products.filter((p) => {
            const id = p.product_id || p._id || p.id;
            if (seen.has(id)) {
              return false;
            }
            seen.add(id);
            return true;
          });

          const processedProducts = uniqueProducts.map((p, idx) => ({
            ...p,
            // Ensure all ID fields are set for consistency
            id: p.product_id || p._id || p.id || `product-${idx}`,
            product_id: p.product_id || p._id || p.id || `product-${idx}`,
          }));

          setProducts(processedProducts);
        } else {
          setProducts([]);
          setError(data.message || "No products found");
        }
      } catch (err) {
        console.error("Error in fetchProducts:", err);
        setError("Failed to load recommendations");
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [category, urlQuery, userId, userProfile]);

  return (
    <main className="p-6">
      {/* Hero banner */}
      <HeaderSlider color={userColor} />

      {/* Product Grid */}
      {loading ? (
        <div className="flex flex-col justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-gray-600">
            Loading personalized recommendations...
          </p>
        </div>
      ) : error ? (
        <div className="text-center py-10">
          <p className="text-red-500 font-semibold">{error}</p>
          <p className="text-gray-500 text-sm mt-2">
            Try refreshing or searching for something else
          </p>
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.slice(0, 12).map((product, index) => {
            const uniqueKey =
              product.product_id ||
              product._id ||
              product.id ||
              `fallback-${index}`;
            return (
              <ProductCard
                key={`product-${uniqueKey}-${index}`}
                product={product}
                color={userColor}
                priority={index < 2}
              />
            );
          })}
        </div>
      ) : (
        <div className="text-center py-10">
          <p className="text-gray-500">No products available</p>
        </div>
      )}

      <NewsLetter />
      <Footer />
    </main>
  );
}
