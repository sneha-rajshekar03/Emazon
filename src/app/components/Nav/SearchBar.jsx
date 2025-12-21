"use client";
import React, { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Clock, X, Search } from "lucide-react";
import { useColor } from "@/app/context/ColorContext";

export const SearchBar = () => {
  const { data: session } = useSession();
  const [query, setQuery] = useState("");
  const [error, setError] = useState(null);
  const [recentSearches, setRecentSearches] = useState([]);
  const [showRecent, setShowRecent] = useState(false);
  const router = useRouter();
  const searchRef = useRef(null);
  const { hexColor, isDarkMode } = useColor();

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
        console.log("Raw searches from API:", data.searches);

        // Ensure we get only the 4 most recent searches, sorted by most recent first
        const sortedSearches = (data.searches || [])
          .sort((a, b) => {
            const dateA = new Date(
              a.searchedAt || a.createdAt || a.timestamp || 0
            );
            const dateB = new Date(
              b.searchedAt || b.createdAt || b.timestamp || 0
            );
            console.log(
              `Comparing: ${a.query} (${dateA}) vs ${b.query} (${dateB})`
            );
            console.log(`Result: ${dateB - dateA}`);
            return dateB - dateA; // Most recent first
          })
          .slice(0, 4);

        console.log("Sorted searches:", sortedSearches);
        setRecentSearches(sortedSearches);
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

        // Refresh recent searches after navigation
        if (session?.user) {
          setTimeout(() => fetchRecentSearches(), 500);
        }
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

        // Refresh recent searches after navigation
        if (session?.user) {
          setTimeout(() => fetchRecentSearches(), 500);
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
    <div className="relative w-full mx-auto mt-1" ref={searchRef}>
      <form onSubmit={handleSubmit} className="flex w-full gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search emzon"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setShowRecent(true)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm transition-all outline-none"
            style={{
              background: isDarkMode
                ? "rgba(45, 45, 45, 0.9)"
                : "rgba(255, 255, 255, 0.9)",
              color: isDarkMode ? "#e5e5e5" : "#1a1a1a",
              border: `1px solid ${
                showRecent
                  ? hexColor
                  : isDarkMode
                  ? "rgba(255,255,255,0.1)"
                  : "rgba(0,0,0,0.1)"
              }`,
              boxShadow: showRecent
                ? `0 0 0 3px ${hexColor}15`
                : isDarkMode
                ? "0 1px 2px rgba(0,0,0,0.3)"
                : "0 1px 2px rgba(0,0,0,0.05)",
            }}
          />
          <Search
            className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
              isDarkMode ? "text-gray-500" : "text-gray-400"
            }`}
            strokeWidth={2}
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2.5 rounded-lg transition-all hover:opacity-90 active:scale-95 flex-shrink-0"
          style={{
            background: `linear-gradient(135deg, ${hexColor} 0%, ${hexColor}dd 100%)`,
          }}
        >
          <Search
            className={`w-4 h-4 ${session?.user ? "text-white" : "text-black"}`}
            strokeWidth={2.5}
          />
        </button>
      </form>

      {/* Recent Searches Dropdown */}
      {showRecent && recentSearches.length > 0 && !error && (
        <div
          className="absolute left-0 right-0 mt-2 rounded-xl shadow-lg z-20 overflow-hidden"
          style={{
            background: isDarkMode
              ? "rgba(45, 45, 45, 0.98)"
              : "rgba(255, 255, 255, 0.98)",
            backdropFilter: "blur(20px) saturate(180%)",
            WebkitBackdropFilter: "blur(20px) saturate(180%)",
            border: `1px solid ${hexColor}20`,
            boxShadow: isDarkMode
              ? `0 8px 30px rgba(0, 0, 0, 0.5), 0 0 0 0.5px ${hexColor}15`
              : `0 8px 30px rgba(0, 0, 0, 0.12), 0 0 0 0.5px ${hexColor}15`,
          }}
        >
          <div
            className="px-4 py-2.5 border-b"
            style={{
              borderColor: `${hexColor}10`,
            }}
          >
            <span
              className={`text-xs font-medium ${
                isDarkMode ? "text-gray-400" : "text-gray-500"
              }`}
            >
              Recent Searches
            </span>
          </div>
          <div className="overflow-y-auto">
            {recentSearches.map((search, index) => (
              <div
                key={search._id}
                onClick={() => handleRecentClick(search)}
                className="flex items-center justify-between px-4 py-3 cursor-pointer transition-colors"
                style={{
                  borderBottom:
                    index !== recentSearches.length - 1
                      ? `1px solid ${hexColor}08`
                      : "none",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = `${hexColor}05`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <div className="flex items-center gap-3 flex-1">
                  <Clock
                    className={`w-4 h-4 ${
                      isDarkMode ? "text-gray-500" : "text-gray-400"
                    }`}
                    strokeWidth={2}
                  />
                  <div className="flex-1">
                    <p
                      className={`text-sm font-medium ${
                        isDarkMode ? "text-gray-100" : "text-gray-800"
                      }`}
                    >
                      {search.query}
                    </p>
                    {search.category && (
                      <p
                        className={`text-xs ${
                          isDarkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        in {search.category}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={(e) => handleDeleteRecent(search._id, e)}
                  className={`p-1.5 rounded-md transition-colors ${
                    isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-200"
                  }`}
                  aria-label="Remove search"
                >
                  <X
                    className={`w-3.5 h-3.5 ${
                      isDarkMode ? "text-gray-500" : "text-gray-400"
                    }`}
                    strokeWidth={2}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div
          className="absolute left-0 right-0 mt-2 text-sm p-3 rounded-lg shadow-lg z-30"
          style={{
            background: isDarkMode
              ? "rgba(127, 29, 29, 0.95)"
              : "rgba(254, 226, 226, 0.95)",
            color: isDarkMode ? "#fca5a5" : "#991b1b",
            border: isDarkMode
              ? "1px solid rgba(185, 28, 28, 0.5)"
              : "1px solid rgba(254, 202, 202, 0.5)",
            backdropFilter: "blur(10px)",
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
};
