"use client";
import { useEffect, useState, useMemo, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import ProductCard from "./components/productCard/ProductCard";
import { Loader2, AlertCircle } from "lucide-react";
import dynamic from "next/dynamic";

const HeaderSlider = dynamic(() => import("./components/Nav/HeaderSlider"), {
  ssr: false,
  loading: () => <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />,
});

const NewsLetter = dynamic(() => import("./components/Nav/NewsLetter"), {
  ssr: false,
  loading: () => <div style={{ height: 120 }} />,
});

const Footer = dynamic(() => import("./components/Nav/Footer"), {
  ssr: false,
  loading: () => <div style={{ height: 120 }} />,
});

const getUserIdFromSession = (session) =>
  session?.users?.id ||
  session?.users?._id ||
  session?.user?.id ||
  session?.user?._id;

const parsePets = (data) => {
  if (data.pets && data.pets !== "" && data.pets !== null) {
    if (Array.isArray(data.pets)) {
      return data.pets.filter((pet) => pet && pet !== "");
    }
    return [data.pets];
  }

  if (data.petType && data.petType !== "" && data.petType !== null) {
    return [data.petType];
  }

  return [];
};

const DEFAULT_PROFILE = {
  gender: "female",
  age: 25,
  occupation: "professional",
  pets: [],
  hobbies: [],
  region: "Urban",
  location: "",
};

export default function Home() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const urlCategory = searchParams.get("category");
  const urlQuery = searchParams.get("query");

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userColor, setUserColor] = useState("#3b82f6");
  const [colorLoaded, setColorLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [category, setCategory] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  const userId = useMemo(() => getUserIdFromSession(session), [session]);

  // Track previous session state to detect logout
  const prevSessionRef = useRef(null);
  const isLoggingOutRef = useRef(false);
  const hasInitializedRef = useRef(false);

  // 🔹 Fixed logout detection logic
  useEffect(() => {
    // Skip during loading
    if (status === "loading") {
      return;
    }

    const currentUserId = getUserIdFromSession(session);
    const prevUserId = prevSessionRef.current;

    // Initialize on first render
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      prevSessionRef.current = currentUserId;
      return;
    }

    // Detect logout: had user ID, now don't
    if (prevUserId && !currentUserId && !isLoggingOutRef.current) {
      console.log("🚨 [Home] Logout detected");
      isLoggingOutRef.current = true;

      // Clear user-specific cache
      if (prevUserId) {
        localStorage.removeItem(`sliderCategories_${prevUserId}`);
        localStorage.removeItem(`sliderCategoriesTime_${prevUserId}`);
      }

      // Reload to guest state
      window.location.href = "/";
      return;
    }

    // Detect login: didn't have user ID, now do
    if (!prevUserId && currentUserId && !isLoggingOutRef.current) {
      console.log("🎉 [Home] Login detected");

      // Clear guest cache
      localStorage.removeItem("sliderCategories_guest");
      localStorage.removeItem("sliderCategoriesTime_guest");

      // Reset state to fetch new user data
      setUserProfile(null);
      setColorLoaded(false);
    }

    // Update reference
    prevSessionRef.current = currentUserId;
  }, [session, status]);

  useEffect(() => {
    if (status === "loading") {
      return;
    }

    async function fetchUserData() {
      try {
        console.log("📊 [Home] Fetching user data...", {
          userId,
          hasSession: !!session,
        });

        const profileUrl = userId
          ? `/api/profile?userId=${userId}`
          : "/api/profile";

        const profileRes = await fetch(profileUrl, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (profileRes.ok) {
          const profileResponse = await profileRes.json();
          const profileData = profileResponse.data || profileResponse;

          const parsedPets = parsePets(profileData);
          const profile = {
            gender: (profileData.gender || "female").toLowerCase(),
            age: parseInt(profileData.age) || 25,
            occupation: (
              profileData.occupation || "professional"
            ).toLowerCase(),
            pets: parsedPets,
            hobbies: Array.isArray(profileData.hobbies)
              ? profileData.hobbies
              : [],
            region: profileData.region || "Urban",
            location: profileData.location || "",
          };
          console.log("✅ [Home] Profile loaded:", profile);
          setUserProfile(profile);
        } else {
          console.log("⚠️ [Home] No profile found, using default");
          setUserProfile(DEFAULT_PROFILE);
        }

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
          const finalColor = colorFromApi || "#3b82f6";
          console.log("🎨 [Home] Color loaded:", finalColor);
          setUserColor(finalColor);
        } else {
          setUserColor("#3b82f6");
        }
        setColorLoaded(true);
      } catch (err) {
        console.error("❌ [Home] Error fetching user data:", err);
        setUserProfile(DEFAULT_PROFILE);
        setUserColor("#3b82f6");
        setColorLoaded(true);
      }
    }

    fetchUserData();
  }, [session, userId, status]);

  useEffect(() => {
    async function initCategory() {
      try {
        if (urlCategory) {
          setCategory(urlCategory);
          return;
        }

        if (urlQuery) {
          setCategory(urlQuery);
          return;
        }

        const res = await fetch("/api/lastSearch");

        if (res.ok) {
          const data = await res.json();
          setCategory(data?.category || "Appliances");
        } else {
          setCategory("Appliances");
        }
      } catch (err) {
        console.error("Error fetching last search:", err);
        setCategory("Appliances");
      }
    }
    initCategory();
  }, [urlCategory, urlQuery]);

  useEffect(() => {
    if (!category || !userProfile || !colorLoaded) {
      return;
    }

    setLoading(true);
    setError(null);
    setProducts([]);

    async function fetchProducts() {
      try {
        console.log("🛍️ [Home] Fetching products for category:", category);

        const requestPayload = {
          user_id: userId || "guest_user",
          query: category,
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
          const uniqueProductsMap = new Map();
          data.products.forEach((p, idx) => {
            const id = p.product_id || p._id || p.id;
            if (id && !uniqueProductsMap.has(id)) {
              uniqueProductsMap.set(id, {
                ...p,
                id: id,
                product_id: id,
                uniqueKey: `${id}_${idx}`,
              });
            }
          });

          console.log("✅ [Home] Products loaded:", uniqueProductsMap.size);
          setProducts(Array.from(uniqueProductsMap.values()));
        } else {
          setProducts([]);
          setError(data.message || "No products found");
        }
      } catch (err) {
        console.error("❌ [Home] Error in fetchProducts:", err);
        setError("Failed to load recommendations");
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [category, userId, userProfile, colorLoaded]);

  const productCards = useMemo(() => {
    if (loading || error || products.length === 0) {
      return null;
    }

    return products
      .slice(0, 12)
      .map((product, index) => (
        <ProductCard
          key={product.uniqueKey || `${product.product_id}_${index}`}
          product={product}
          color={userColor}
          priority={index < 2}
        />
      ));
  }, [products, loading, error, userColor]);

  return (
    <main className="p-6">
      <HeaderSlider color={userColor} />

      {/* Themed Loading State */}
      {loading && (
        <div className="flex flex-col justify-center items-center py-20">
          <div className="relative">
            {/* Outer glow ring */}
            <div
              className="absolute inset-0 rounded-full animate-pulse"
              style={{
                background: `radial-gradient(circle, ${userColor}30 0%, transparent 70%)`,
                filter: "blur(20px)",
                transform: "scale(1.5)",
              }}
            />
            {/* Main spinner */}
            <Loader2
              className="w-12 h-12 animate-spin relative z-10"
              style={{ color: userColor }}
            />
          </div>
          <p className="mt-6 font-medium" style={{ color: userColor }}>
            Loading personalized recommendations...
          </p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <div
            className="border rounded-lg p-6 max-w-md text-center"
            style={{
              backgroundColor: `${userColor}10`,
              borderColor: `${userColor}30`,
            }}
          >
            <AlertCircle
              className="w-12 h-12 mx-auto mb-4"
              style={{ color: userColor }}
            />
            <h2
              className="text-lg font-semibold mb-2"
              style={{ color: userColor }}
            >
              Unable to Load Products
            </h2>
            <p className="text-gray-600">{error}</p>
            <p className="text-sm text-gray-500 mt-4">
              Try refreshing or searching for something else
            </p>
          </div>
        </div>
      )}

      {/* Product Grid */}
      {productCards && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {productCards}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && products.length === 0 && (
        <div className="text-center py-10">
          <p className="text-gray-500">No products available</p>
        </div>
      )}

      <NewsLetter />
      <Footer />
    </main>
  );
}
