// app/search/page.jsx
"use client";
import React, { useState, useEffect, useMemo, useRef } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import ProductCard from "@/app/components/productCard/ProductCard";

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

// ✅ Page-level weak signal tracking
async function recordCategoryView(userId, category) {
  if (!userId || userId === "guest_user" || !category) {
    return;
  }

  try {
    console.log("🟦 [SEARCH] Recording weak signal:", category);

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
        weak_signal: true,
      }),
    });
  } catch (err) {
    console.error("❌ [SEARCH] Weak signal failed:", err);
  }
}

export default function ProductSearchPage() {
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const urlCategory = searchParams.get("category");
  const searchQuery = searchParams.get("q");

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userColor, setUserColor] = useState("#ffffff");
  const [error, setError] = useState(null);
  const [displayText, setDisplayText] = useState("");
  const [userProfile, setUserProfile] = useState(null);

  const userId = useMemo(() => getUserIdFromSession(session), [session]);

  const isCategoryView = useMemo(() => {
    return Boolean(urlCategory && !searchQuery);
  }, [urlCategory, searchQuery]);

  // ✅ Refs for guarding weak signals
  const categoryViewRecordedRef = useRef(new Set());
  const isRecordingRef = useRef(false);

  console.log("🔍 [Search] Detection:", {
    urlCategory,
    searchQuery,
    isCategoryView,
  });

  useEffect(() => {
    if (session === undefined) {
      return;
    }

    async function fetchUserData() {
      try {
        const profileUrl = userId
          ? `/api/profile?userId=${userId}`
          : "/api/profile";

        const [profileRes, colorRes] = await Promise.all([
          fetch(profileUrl, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          }),
          fetch("/api/userColor"),
        ]);

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

          console.log("✅ [Search] Profile loaded:", profile);
          setUserProfile(profile);
        } else {
          setUserProfile(DEFAULT_PROFILE);
        }

        if (colorRes.ok) {
          const body = await colorRes.json();
          const colorFromApi =
            typeof body === "string"
              ? body
              : body?.color || body?.value || body?.themeColor?.value || null;
          setUserColor(colorFromApi || "#ffffff");
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
        setUserProfile(DEFAULT_PROFILE);
        setUserColor("#ffffff");
      }
    }

    fetchUserData();
  }, [session, userId]);

  useEffect(() => {
    if (!userProfile) {
      return;
    }

    const abortController = new AbortController();

    async function handleSearch() {
      setLoading(true);
      setError(null);
      setProducts([]);

      let queryToUse = null;
      let displayQuery = null;
      let categoryToUse = null;

      try {
        if (searchQuery) {
          queryToUse = searchQuery;
          displayQuery = searchQuery;
          categoryToUse = null;
          console.log("🔎 [Search] Text search mode:", searchQuery);
        } else if (urlCategory) {
          queryToUse = null;
          displayQuery = urlCategory.replace(/_/g, " ");
          categoryToUse = urlCategory;
          console.log("📁 [Search] Category browse mode:", urlCategory);

          // ✅ Record weak signal ONCE per category
          if (
            userId &&
            userId !== "guest_user" &&
            !categoryViewRecordedRef.current.has(urlCategory) &&
            !isRecordingRef.current
          ) {
            isRecordingRef.current = true;
            try {
              await recordCategoryView(userId, urlCategory);
              categoryViewRecordedRef.current.add(urlCategory);
              console.log("✅ [SEARCH] Weak signal recorded:", urlCategory);
            } catch (err) {
              console.error("❌ [SEARCH] Weak signal error:", err);
            } finally {
              isRecordingRef.current = false;
            }
          }
        } else {
          const lastSearchRes = await fetch("/api/lastSearch", {
            signal: abortController.signal,
          });

          if (lastSearchRes.ok) {
            const data = await lastSearchRes.json();
            queryToUse = null;
            categoryToUse = data?.category || "Appliances";
            displayQuery = categoryToUse.replace(/_/g, " ");
          } else {
            queryToUse = null;
            categoryToUse = "Appliances";
            displayQuery = "Appliances";
          }
        }

        const initialDisplayText = searchQuery
          ? `Search results for "${searchQuery}"`
          : `${displayQuery} Products`;
        setDisplayText(initialDisplayText);

        const requestPayload = {
          user_id: userId || "guest_user",
          query: queryToUse,
          preferred_category: categoryToUse,
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
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestPayload),
          signal: abortController.signal,
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

          console.log("✅ [Search] Products loaded:", uniqueProductsMap.size);
          setProducts(Array.from(uniqueProductsMap.values()));

          if (searchQuery && data.personalized) {
            setDisplayText(`Personalized results for "${searchQuery}" ✨`);
          } else {
            setDisplayText(initialDisplayText);
          }
        } else {
          setProducts([]);
          const errorMsg =
            data.message ||
            `No products found${
              queryToUse || categoryToUse
                ? ` for "${queryToUse || categoryToUse}"`
                : ""
            }`;
          setError(errorMsg);
        }
      } catch (err) {
        if (err.name === "AbortError") {
          console.log("Fetch aborted");
          return;
        }
        console.error("❌ [Search] Error:", err);
        setError("Failed to load products. Please try again.");
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }

    handleSearch();

    return () => {
      abortController.abort();
    };
  }, [urlCategory, searchQuery, userId, userProfile]);

  const productCards = useMemo(() => {
    if (loading || error || products.length === 0) {
      return null;
    }

    return products.map((product, index) => (
      <ProductCard
        key={product.uniqueKey || `${product.product_id}_${index}`}
        product={product}
        color={userColor}
        priority={index < 4}
      />
    ));
  }, [products, loading, error, userColor]);

  return (
    <main className="p-6">
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

      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mb-4" />
          <p className="text-gray-600">Loading personalized results...</p>
        </div>
      )}

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

      {productCards && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {productCards}
        </div>
      )}

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
