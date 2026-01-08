// app/components/RecommendationsList.js
"use client";

import { useState, useEffect } from "react";

export default function RecommendationsList({ query = null, category = null }) {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchRecommendations() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch("/api/recommend", {
          method: "POST",
          cache: "no-store",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query,
            category,
            top_k: 10,
          }),
        });

        if (!res.ok) {
          throw new Error("Failed to fetch recommendations");
        }

        const data = await res.json();

        if (data.success) {
          setRecommendations(data.recommendations);
        } else {
          throw new Error(data.error || "Unknown error");
        }
      } catch (err) {
        console.error("Recommendation fetch error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchRecommendations();
  }, [query, category]);

  if (loading) {
    return <div className="text-center py-8">Loading recommendations...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">Error: {error}</div>;
  }

  if (recommendations.length === 0) {
    return <div className="text-center py-8">No recommendations available</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {recommendations.map((product) => (
        <div key={product._id} className="border rounded-lg p-4 shadow-sm">
          {product.image && (
            <img
              src={product.image}
              alt={product.title}
              className="w-full h-48 object-cover rounded mb-4"
            />
          )}
          <h3 className="font-semibold text-lg mb-2">{product.title}</h3>
          <p className="text-gray-600 text-sm mb-2 line-clamp-2">
            {product.description}
          </p>
          <div className="flex justify-between items-center">
            <span className="text-lg font-bold">${product.price}</span>
            {product.final_score && (
              <span className="text-xs text-gray-500">
                Score: {product.final_score.toFixed(2)}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
