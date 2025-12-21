import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

export function useRepeatSuggestions(cartItems = []) {
  const { data: session } = useSession();
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSuggestions = async () => {
      console.log("\n=== FETCHING REPEAT SUGGESTIONS (HOOK) ===");

      if (!session?.user?.id) {
        console.log("[Hook] No session, skipping fetch");
        setSuggestions([]);
        setLoading(false);
        return;
      }

      console.log("[Hook] User ID:", session.user.id);
      console.log("[Hook] Cart items:", cartItems.length);

      setLoading(true);
      setError(null);

      try {
        // Get product IDs currently in cart
        const cartProductIds = cartItems.map((item) => item.product_id);
        console.log("[Hook] Cart product IDs:", cartProductIds);

        const url = `/api/repeat-suggestions?cartProductIds=${encodeURIComponent(
          JSON.stringify(cartProductIds)
        )}`;
        console.log("[Hook] Fetching:", url);

        const response = await fetch(url);

        if (!response.ok) {
          const errorText = await response.text();
          console.error("[Hook] ❌ API error:", response.status, errorText);
          throw new Error(`Failed to fetch suggestions: ${response.status}`);
        }

        const data = await response.json();
        console.log("[Hook] ✓ API Response:", data);
        console.log(
          "[Hook] ✓ Received",
          data.suggestions?.length || 0,
          "suggestions"
        );

        if (data.suggestions && data.suggestions.length > 0) {
          console.log(
            "[Hook] Suggestion details:",
            data.suggestions.map((s) => ({
              id: s.product_id,
              title: s.title,
              lastPurchased: s.lastPurchasedDays,
              interval: s.avgReorderInterval,
            }))
          );
        }

        setSuggestions(data.suggestions || []);
      } catch (err) {
        console.error("[Hook] ❌ Error fetching repeat suggestions:", err);
        setError(err.message);
        setSuggestions([]); // Clear suggestions on error
      } finally {
        setLoading(false);
        console.log("=== FETCH COMPLETE (HOOK) ===\n");
      }
    };

    fetchSuggestions();
  }, [session?.user?.id, cartItems.length]); // Re-fetch when user or cart changes

  const dismissSuggestion = async (suggestion) => {
    console.log("\n=== DISMISSING SUGGESTION (HOOK) ===");
    console.log("[Hook] Product ID:", suggestion.product_id);

    try {
      // Optimistically remove from UI
      setSuggestions((prev) =>
        prev.filter((s) => s.product_id !== suggestion.product_id)
      );
      console.log("[Hook] Optimistically removed from UI");

      // Call API to record dismissal
      console.log("[Hook] Calling dismiss API...");
      const response = await fetch("/api/dismiss-suggestion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: suggestion.product_id,
          expected_next_date: suggestion.expectedNextDate,
          avg_reorder_interval: suggestion.avgReorderInterval,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          "[Hook] ❌ Dismiss API error:",
          response.status,
          errorText
        );
        throw new Error("Failed to dismiss suggestion");
      }

      const result = await response.json();
      console.log("[Hook] ✓ Dismiss successful:", result);
      console.log("=== DISMISS COMPLETE (HOOK) ===\n");
    } catch (err) {
      console.error("[Hook] ❌ Error dismissing suggestion:", err);
      // Re-fetch suggestions on error to restore state
      console.log("[Hook] Re-fetching suggestions after error...");
      try {
        const response = await fetch(
          `/api/repeat-suggestions?cartProductIds=${encodeURIComponent(
            JSON.stringify(cartItems.map((item) => item.product_id))
          )}`
        );
        if (response.ok) {
          const data = await response.json();
          setSuggestions(data.suggestions || []);
          console.log("[Hook] ✓ Re-fetch complete");
        }
      } catch (refetchError) {
        console.error("[Hook] ❌ Re-fetch failed:", refetchError);
      }
    }
  };

  return {
    suggestions,
    loading,
    error,
    dismissSuggestion,
  };
}
