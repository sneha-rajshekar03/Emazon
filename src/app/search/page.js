"use client";
import React, { useState, useEffect, useMemo, useCallback } from "react"; // Added useMemo, useCallback
import { Loader2 } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import ProductCard from "@/app/components/productCard/ProductCard";
import { AlertCircle } from "lucide-react";

// Helper functions and constants moved outside the component to prevent re-creation
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

export default function ProductSearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session } = useSession();
  const urlCategory = searchParams.get("category");
  const searchQuery = searchParams.get("q");

  // State initialization (minimal changes needed here)
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userColor, setUserColor] = useState("#ffffff");
  const [error, setError] = useState(null);
  const [displayText, setDisplayText] = useState("");
  const [userProfile, setUserProfile] = useState(null); // userId state removed

  // 1. Use useMemo for stable userId: Prevents unnecessary state updates and ensures stable dependency.
  const userId = useMemo(() => getUserIdFromSession(session), [session]);

  // 2. Consolidated User Data Fetching: Combines all user-related API calls (profile/color).
  useEffect(() => {
    if (session === undefined) {
      return;
    }

    // Function defined inside useEffect or use useCallback if needed elsewhere
    async function fetchUserData() {
      // setUserId(userIdFromSession); -> Removed, using memoized userId

      try {
        // Parallel fetching of Profile and Color
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

        // Process Profile Data
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
          setUserProfile(profile);
        } else {
          setUserProfile(DEFAULT_PROFILE);
        }

        // Process User Color
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
        setUserProfile(DEFAULT_PROFILE);
        setUserColor("#ffffff");
      }
    }

    fetchUserData();
  }, [session, userId]); // Dependency on userId (from useMemo)

  // 3. Main effect to fetch ML-powered search results
  useEffect(() => {
    // Wait until we have user profile - this is the critical dependency
    if (!userProfile) {
      return;
    }

    const abortController = new AbortController(); // Use AbortController for cleanup

    async function handleSearch() {
      // 3A. Initial state reset
      setLoading(true);
      setError(null);
      setProducts([]);

      let queryToUse = null;
      let displayQuery = null;

      try {
        // 3B. Determine Search Query
        if (searchQuery) {
          queryToUse = searchQuery;
          displayQuery = searchQuery;
        } else if (urlCategory) {
          queryToUse = urlCategory;
          displayQuery = urlCategory;
        } else {
          // Priority 3: Last search from database - executed if no URL query/category
          const lastSearchRes = await fetch("/api/lastSearch", {
            signal: abortController.signal,
          });

          if (lastSearchRes.ok) {
            const data = await lastSearchRes.json();
            queryToUse = data?.category || "Appliances";
            displayQuery = queryToUse;
          } else {
            queryToUse = "Appliances";
            displayQuery = "Appliances";
          }
        }

        // 3C. Set initial display text before the slow ML call
        const initialDisplayText = searchQuery
          ? `Search results for "${searchQuery}"`
          : `${displayQuery} Products`;
        setDisplayText(initialDisplayText);

        // 3D. Build & Call ML model endpoint
        const requestPayload = {
          user_id: userId || "guest_user",
          query: queryToUse,
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
          signal: abortController.signal, // Pass signal to ML fetch
        });

        if (!res.ok) {
          throw new Error(`Failed to fetch products: ${res.status}`);
        }

        const data = await res.json();

        if (data.success && data.products?.length > 0) {
          // **Performance Improvement: Optimized Deduplication (Single Pass Map)**
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

          setProducts(Array.from(uniqueProductsMap.values()));

          // Update display text post-fetch
          if (searchQuery && data.personalized) {
            setDisplayText(`Personalized results for "${searchQuery}" ✨`);
          } else {
            // Fallback/standard update
            setDisplayText(initialDisplayText);
          }
        } else {
          setProducts([]);
          const errorMsg =
            data.message ||
            `No products found${queryToUse ? ` for "${queryToUse}"` : ""}`;
          setError(errorMsg);
        }
      } catch (err) {
        if (err.name === "AbortError") {
          console.log("Fetch aborted");
          return; // Skip error state on intentional abort
        }
        setError("Failed to load products. Please try again.");
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }

    handleSearch();

    // Cleanup function: abort ongoing fetch if dependencies change/component unmounts
    return () => {
      abortController.abort();
    };
  }, [urlCategory, searchQuery, userId, userProfile]); // Dependencies are clean

  // 4. Use useMemo to prevent redundant ProductCard rendering
  const productCards = useMemo(() => {
    if (loading || error || products.length === 0) {
      return null;
    }

    return products.map((product, index) => (
      <ProductCard
        key={product.uniqueKey || `${product.product_id}_${index}`}
        product={product}
        color={userColor}
        // Increased priority for first 4 product images
        priority={index < 4}
      />
    ));
  }, [products, loading, error, userColor]);

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

      {/* Loading State - unchanged */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mb-4" />
          <p className="text-gray-600">Loading personalized results...</p>
        </div>
      )}

      {/* Error State - unchanged */}
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
      {productCards && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {productCards}
        </div>
      )}

      {/* Empty State - unchanged */}
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
