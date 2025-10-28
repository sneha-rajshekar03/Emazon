"use client";
import { useEffect, useState, useMemo } from "react"; // Added useMemo
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import ProductCard from "./components/productCard/ProductCard";
import HeaderSlider from "./components/Nav/HeaderSlider";
import Banner from "./components/Nav/Banner";
import NewsLetter from "./components/Nav/NewsLetter";
import Footer from "./components/Nav/Footer";
import { Loader2, AlertCircle } from "lucide-react";

// Helper for parsing session user ID - memoized value is better
const getUserIdFromSession = (session) =>
  session?.users?.id ||
  session?.users?._id ||
  session?.user?.id ||
  session?.user?._id;

// Helper function to parse pets data - moved outside to prevent re-creation on every render
const parsePets = (data) => {
  // Check if pets field exists and has value
  if (data.pets && data.pets !== "" && data.pets !== null) {
    if (Array.isArray(data.pets)) {
      return data.pets.filter((pet) => pet && pet !== "");
    }
    return [data.pets];
  }

  // Fallback to petType if pets is empty
  if (data.petType && data.petType !== "" && data.petType !== null) {
    return [data.petType];
  }

  // Return empty array if no pet data
  return [];
};

// Default profile object - moved outside to prevent re-creation on every render
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
  const { data: session } = useSession();
  const urlCategory = searchParams.get("category");
  const urlQuery = searchParams.get("query");

  // State initialization is fine
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userColor, setUserColor] = useState("#ffffff");
  const [error, setError] = useState(null);
  const [category, setCategory] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  // 1. Use useMemo to extract and memoize userId.
  // This ensures the dependency array in the second useEffect is stable (if userId changes, it's a real change).
  const userId = useMemo(() => getUserIdFromSession(session), [session]);

  // 2. Combine all data fetching (User Data, Color, Profile) into a single useEffect
  // that runs only once when the session object loads. This reduces API calls and avoids
  // unnecessary state updates (setting userId, which can trigger a chain reaction).
  useEffect(() => {
    // Only fetch if session is loaded AND we haven't already set the profile based on the session.
    // The previous check was 'if (session !== undefined)'. This is similar but we ensure 'userId' is available
    // or we are running for a guest user flow.
    if (session === undefined) {
      return;
    }

    async function fetchUserData() {
      // **A. Initialize userId from session** - Now done via useMemo
      // const userIdFromSession = getUserIdFromSession(session);
      // setUserId(userIdFromSession); // Removed state update for userId; use the useMemo'd value

      try {
        // **B. Fetch profile from MongoDB profile collection**
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

          // Parse and set user profile
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
          setUserProfile(profile);
        } else {
          // Set default profile on API failure
          setUserProfile(DEFAULT_PROFILE);
        }

        // **C. Fetch user color**
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
        setUserProfile(DEFAULT_PROFILE);
        setUserColor("#ffffff");
      }
    }

    fetchUserData();
  }, [session, userId]); // Keep userId in dependency array to refetch if it changes

  // 3. Keep the category initialization separate for clarity, but it's logically sound.
  useEffect(() => {
    async function initCategory() {
      try {
        // Priority 1: Category from URL
        if (urlCategory) {
          setCategory(urlCategory);
          return;
        }

        // Priority 2: Query from URL (already good as it's a fall-through)
        if (urlQuery) {
          setCategory(urlQuery);
          return;
        }

        // Priority 3: Last search from database
        const res = await fetch("/api/lastSearch");

        if (res.ok) {
          const data = await res.json();
          setCategory(data?.category || "Appliances"); // Simplified logic
        } else {
          setCategory("Appliances");
        }
      } catch (err) {
        console.error("Error fetching last search:", err);
        setCategory("Appliances");
      }
    }
    initCategory();
  }, [urlCategory, urlQuery]); // Dependencies are primitive strings, so this is efficient

  // 4. Fetch ML-powered recommendations
  // This useEffect will now only trigger once 'category' AND 'userProfile' are set.
  // The logic for fetching and processing products is largely fine, but minor efficiency tweaks are made.
  useEffect(() => {
    // Wait until we have both category and user profile
    if (!category || !userProfile) {
      return;
    }

    setLoading(true);
    setError(null);
    setProducts([]); // Clear previous products immediately

    async function fetchProducts() {
      try {
        const requestPayload = {
          user_id: userId || "guest_user", // Use memoized userId
          query: category,
          seed_item_idx: null,
          top_k: 20,
          user_profile: {
            // Use logical OR with defaults, though userProfile should be guaranteed by 'if' check
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
          // **Performance Improvement: Optimized Product Processing**
          // Combined deduplication and processing into a single loop for efficiency.
          const uniqueProductsMap = new Map();
          data.products.forEach((p, idx) => {
            const id = p.product_id || p._id || p.id;
            if (id && !uniqueProductsMap.has(id)) {
              uniqueProductsMap.set(id, {
                ...p,
                // Ensure all ID fields are set for consistency
                id: id,
                product_id: id,
                uniqueKey: `${id}_${idx}`,
              });
            }
          });

          setProducts(Array.from(uniqueProductsMap.values()));
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
  }, [category, userId, userProfile]); // userId is now from useMemo

  // 5. Memoize the rendered products for the grid
  // This prevents the mapping logic from running on every render if `products` hasn't changed.
  const productCards = useMemo(() => {
    if (loading || error || products.length === 0) {
      return null;
    }

    return products.slice(0, 12).map((product, index) => (
      <ProductCard
        key={product.uniqueKey || `${product.product_id}_${index}`}
        product={product}
        color={userColor}
        // index < 2 is a stable check, no change needed
        priority={index < 2}
      />
    ));
  }, [products, loading, error, userColor]); // Recalculates only if these dependencies change

  return (
    <main className="p-6">
      {/* Hero banner */}
      <HeaderSlider color={userColor} />
      {/* Loading State */}
      {loading && (
        <div className="flex flex-col justify-center items-center py-20">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mb-4" />
          <p className="text-gray-600">
            Loading personalized recommendations...
          </p>
        </div>
      )}
      {/* Error State */}
      {error && !loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-red-800 mb-2">
              Unable to Load Products
            </h2>
            <p className="text-red-600">{error}</p>
            <p className="text-sm text-gray-600 mt-4">
              Try refreshing or searching for something else
            </p>
          </div>
        </div>
      )}
      {/* Product Grid */}
      {/* Conditional rendering is simplified by using the memoized productCards */}
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
      {/* Ensure Banner is included if it was previously outside Footer/NewsLetter */}
      <NewsLetter />
      <Footer />
    </main>
  );
}
