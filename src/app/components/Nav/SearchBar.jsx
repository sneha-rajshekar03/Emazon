"use client";
import React, { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Clock, X } from "lucide-react";

export const SearchBar = () => {
  const { data: session } = useSession();
  const [query, setQuery] = useState("");
  const [error, setError] = useState(null);
  const [recentSearches, setRecentSearches] = useState([]);
  const [showRecent, setShowRecent] = useState(false);
  const router = useRouter();
  const searchRef = useRef(null);

  // Fetch recent searches
  useEffect(() => {
    if (session?.user) {
      fetchRecentSearches();
    }
  }, [session]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowRecent(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchRecentSearches = async () => {
    try {
      const res = await fetch("/api/recentSearches");
      if (res.ok) {
        const data = await res.json();
        setRecentSearches(data.searches || []);
      }
    } catch (err) {
      console.error("Error fetching recent searches:", err);
    }
  };

  const handleSearch = async (searchQuery) => {
    const queryToSearch = searchQuery || query;

    if (!queryToSearch.trim()) return;

    // Check if we're on the search page
    const isSearchPage = window.location.pathname === "/search";

    try {
      // If on search page, always navigate (let the page handle "not found")
      if (isSearchPage) {
        router.push(`/search?q=${encodeURIComponent(queryToSearch)}`);
        setQuery("");
        setShowRecent(false);
        return;
      }

      // If on home page, validate before navigating
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: queryToSearch }),
      });

      const data = await res.json();

      if (data.valid) {
        // Navigate based on search result type
        if (data.type === "category") {
          router.push(`/search?category=${encodeURIComponent(data.category)}`);
        } else {
          router.push(`/search?q=${encodeURIComponent(queryToSearch)}`);
        }

        setQuery("");
        setShowRecent(false);

        // Refresh recent searches
        if (session?.user) {
          fetchRecentSearches();
        }
      } else {
        // Only show error on home page
        setError("No products found");
        setQuery(""); // Clear the search input
        clearAfterTimeout();
      }
    } catch (err) {
      console.error("Search error:", err);
      setError("Search failed. Please try again.");
      clearAfterTimeout();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSearch();
  };

  const handleRecentClick = (search) => {
    setQuery(search.query);
    handleSearch(search.query);
  };

  const handleDeleteRecent = async (searchId, e) => {
    e.stopPropagation();

    try {
      const res = await fetch(`/api/recentSearches?id=${searchId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setRecentSearches((prev) => prev.filter((s) => s._id !== searchId));
      }
    } catch (err) {
      console.error("Error deleting search:", err);
    }
  };

  const clearAfterTimeout = () => {
    setTimeout(() => {
      setError(null);
    }, 3000);
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto mt-1" ref={searchRef}>
      <form onSubmit={handleSubmit} className="flex w-full">
        <input
          type="text"
          placeholder="Search Amazon"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setShowRecent(true)}
          className="flex-1 p-3 rounded-l-md border focus:outline-none focus:ring-2 transition"
        />

        <button
          type="submit"
          className="px-4 py-3 rounded-r-md font-medium transition shadow-sm hover:brightness-95 active:brightness-90"
        >
          🔍
        </button>
      </form>

      {/* Recent Searches Dropdown */}
      {showRecent && recentSearches.length > 0 && !error && (
        <div className="absolute left-0 right-0 mt-1 bg-white border rounded-md shadow-lg z-20 max-h-80 overflow-y-auto">
          <div className="p-2 border-b bg-gray-50">
            <span className="text-sm font-semibold text-gray-700">
              Recent Searches
            </span>
          </div>
          {recentSearches.slice(0, 10).map((search) => (
            <div
              key={search._id}
              onClick={() => handleRecentClick(search)}
              className="flex items-center justify-between p-3 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
            >
              <div className="flex items-center gap-3 flex-1">
                <Clock className="w-4 h-4 text-gray-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">
                    {search.query}
                  </p>
                  {search.category && (
                    <p className="text-xs text-gray-500">
                      in {search.category}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={(e) => handleDeleteRecent(search._id, e)}
                className="p-1 hover:bg-gray-200 rounded transition"
                aria-label="Remove search"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="absolute left-0 right-0 mt-1 bg-red-50 text-red-600 text-sm p-2 rounded-md shadow-lg z-30 border border-red-200">
          {error}
        </div>
      )}
    </div>
  );
};
