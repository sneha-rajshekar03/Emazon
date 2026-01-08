// app/page.jsx
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
});

const Footer = dynamic(() => import("./components/Nav/Footer"), {
  ssr: false,
});

const getUserIdFromSession = (session) =>
  session?.users?.id ||
  session?.users?._id ||
  session?.user?.id ||
  session?.user?._id;

const parsePets = (data) => {
  if (data.petType && data.petType !== "" && data.petType !== null) {
    const petType = String(data.petType).toLowerCase();
    if (petType !== "no" && petType !== "none") {
      return [petType];
    }
  }
  if (data.pets && data.pets !== "" && data.pets !== null) {
    if (Array.isArray(data.pets)) {
      return data.pets
        .filter((pet) => pet && pet !== "")
        .map((pet) => String(pet).toLowerCase())
        .filter((pet) => pet !== "yes" && pet !== "no" && pet !== "none");
    }
    const pet = String(data.pets).toLowerCase();
    if (pet !== "yes" && pet !== "no" && pet !== "none" && pet !== "") {
      return [pet];
    }
  }
  return [];
};

const DEFAULT_PROFILE = {
  gender: "female",
  age: 25,
  occupation: "professional",
  pets: [],
};

// ✅ Page-level weak signal tracking (fires ONCE per category)
async function recordCategoryView(userId, category) {
  if (!userId || userId === "guest_user" || !category) {
    return;
  }

  try {
    console.log("🟦 [PAGE] Recording weak signal:", category);

    await fetch("/api/product-interaction", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        product_id: "__CATEGORY_VIEW__",
        title: `Category View: ${category}`,
        category: category,
        price: null,
        stars: null,
        seller_name: null,
        weak_signal: true, // ✅ WEAK SIGNAL
      }),
    });
  } catch (err) {
    console.error("❌ [PAGE] Weak signal failed:", err);
  }
}

export default function Home() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const urlCategory = searchParams.get("category");

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userColor, setUserColor] = useState("#3b82f6");
  const [colorLoaded, setColorLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [category, setCategory] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  const userId = useMemo(() => getUserIdFromSession(session), [session]);

  // ✅ Refs for guarding weak signals
  const categoryViewRecordedRef = useRef(new Set()); // Track recorded categories
  const isRecordingRef = useRef(false); // Prevent concurrent calls

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "admin") {
      router.push("/admin");
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status === "loading") return;

    async function fetchUserData() {
      try {
        const profileUrl = userId
          ? `/api/profile?userId=${userId}`
          : "/api/profile";

        const profileRes = await fetch(profileUrl, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
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
          };

          console.log("✅ [Home] Profile loaded:", profile);
          setUserProfile(profile);
        } else {
          setUserProfile(DEFAULT_PROFILE);
        }

        const colorRes = await fetch("/api/userColor");
        if (colorRes.ok) {
          const body = await colorRes.json();
          const colorFromApi =
            typeof body === "string"
              ? body
              : body?.color || body?.value || body?.themeColor?.value || null;
          setUserColor(colorFromApi || "#3b82f6");
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
  }, [urlCategory]);

  useEffect(() => {
    if (!category || !userProfile || !colorLoaded) {
      return;
    }

    // ✅ Record weak signal ONCE per category (with guards)
    const recordWeakSignal = async () => {
      if (
        !userId ||
        userId === "guest_user" ||
        categoryViewRecordedRef.current.has(category) ||
        isRecordingRef.current
      ) {
        return;
      }

      isRecordingRef.current = true;

      try {
        await recordCategoryView(userId, category);
        categoryViewRecordedRef.current.add(category);
        console.log("✅ [HOME] Weak signal recorded for:", category);
      } catch (err) {
        console.error("❌ [HOME] Weak signal error:", err);
      } finally {
        isRecordingRef.current = false;
      }
    };

    recordWeakSignal();

    async function fetchProducts() {
      try {
        setLoading(true);
        setError(null);
        setProducts([]);

        // Around line 215 in your fetchProducts function:

        const requestPayload = {
          user_id: userId || "guest_user",
          query: null,
          preferred_category: category || "All_Beauty", // ✅ FIX: Pass the category
          seed_item_idx: null,
          top_k: 20,
          user_profile: {
            gender: userProfile.gender || "female",
            age: userProfile.age || 25,
            occupation: userProfile.occupation || "professional",
            pets: userProfile.pets || [],
          },
          alphas: [0.15, 0.35, 0.1, 0.4],
          is_homepage: true, // ✅ This will now work correctly
        };
        const res = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestPayload),
        });

        if (!res.ok) {
          throw new Error(`Failed to fetch products: ${res.status}`);
        }

        const data = await res.json();

        if (!data.products || data.products.length === 0) {
          console.warn("⚠️ ML returned no products");
          router.push(`/search?category=${category}`);
          return;
        }

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
        console.error("❌ [Home] Error:", err);
        setError("Failed to load recommendations");
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [category, userId, userProfile, colorLoaded, router]);

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

  if (
    status === "loading" ||
    (status === "authenticated" && session?.user?.role === "admin")
  ) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2
          className="w-12 h-12 animate-spin"
          style={{ color: userColor }}
        />
      </div>
    );
  }

  return (
    <main className="p-6">
      <HeaderSlider color={userColor} />

      {loading && (
        <div className="flex flex-col justify-center items-center py-20">
          <Loader2
            className="w-12 h-12 animate-spin"
            style={{ color: userColor }}
          />
          <p className="mt-6 font-medium" style={{ color: userColor }}>
            Loading personalized recommendations...
          </p>
        </div>
      )}

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
          </div>
        </div>
      )}

      {productCards && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {productCards}
        </div>
      )}

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
