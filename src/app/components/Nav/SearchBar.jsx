"use client";
import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export const SearchBar = () => {
  const { data: session } = useSession();
  const [query, setQuery] = useState("");
  const [error, setError] = useState(null);
  const router = useRouter();

  const handleSearch = async (e) => {
    e.preventDefault();

    if (!session) {
      setError("You must be logged in to search.");
      clearAfterTimeout();
      return;
    }

    if (!query.trim()) return;

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
        credentials: "include",
      });

      let data = null;
      try {
        data = await res.json();
      } catch (err) {
        console.warn("Response was not valid JSON");
      }

      // ❌ If no match found or no valid JSON
      if (!res.ok || !data?.valid) {
        setError("Product not found");

        // Instead of clearing immediately, wait until the dropdown fades out
        setTimeout(() => {
          setQuery("");
        }, 2000);

        clearAfterTimeout();
        return;
      }

      // ✅ Match found -> reload homepage with category
      setError(null);
      setQuery(""); // clear search bar after valid search too
      router.push(`/?category=${encodeURIComponent(query)}`);
    } catch (err) {
      console.error(err);
      setError("Failed to search");
      setQuery(""); // clear search bar
      clearAfterTimeout();
    }
  };

  const clearAfterTimeout = () => {
    setTimeout(() => {
      setError(null);
    }, 1000); // show error for 3s
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto mt-1">
      <form onSubmit={handleSearch} className="flex w-full">
        <input
          type="text"
          placeholder="Search Amazon"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 p-3 rounded-l-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-yellow-400"
        />
        <button
          type="submit"
          className="bg-amber-500 px-4 py-3 rounded-r-md hover:bg-amber-600 active:bg-yellow-600 transition-colors"
        >
          🔍
        </button>
      </form>

      {/* Only show dropdown if not found */}
      {error && (
        <div className="absolute left-0 right-0 mt-1 bg-white text-black text-sm p-2 rounded-md shadow-lg z-10">
          {error}
        </div>
      )}
    </div>
  );
};
