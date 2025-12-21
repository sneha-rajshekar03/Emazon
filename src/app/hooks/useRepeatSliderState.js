import { useState, useEffect, useCallback } from "react";

/**
 * Custom hook to manage repeat order slider state with persistent storage
 *
 * This hook maintains a LOCAL MUTABLE copy of suggestions, separate from props.
 * Why? Because we need immediate UI updates when users interact (dismiss/remind/auto-repeat)
 * without waiting for parent re-renders or API calls.
 *
 * CRITICAL: Suggestions are shown ONLY IF:
 * - Reorder window is active (handled by API)
 * - Product is NOT already in cart (filtered by API via cartProductIds)
 * - Product is NOT dismissed/reminded/auto-repeat (filtered by this hook)
 */
export function useRepeatSliderState(initialSuggestions = []) {
  const [visibleSuggestions, setVisibleSuggestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [storageReady, setStorageReady] = useState(false);

  // Filter suggestions based on persistent storage rules
  const filterSuggestions = useCallback(async (suggestions) => {
    if (!window.storage) {
      console.warn(
        "[useRepeatSliderState] Storage not available, showing all suggestions"
      );
      return suggestions;
    }

    const now = Date.now();
    const filtered = [];

    for (const suggestion of suggestions) {
      const productId = suggestion.product_id;

      try {
        // Check if dismissed (hidden until next reorder cycle)
        const hiddenKey = `repeat_hidden_${productId}`;
        let isHidden = false;
        try {
          const hiddenResult = await window.storage.get(hiddenKey);
          isHidden = hiddenResult?.value === "true";
        } catch (e) {
          // Key doesn't exist, not hidden
          isHidden = false;
        }

        // Check if "remind me tomorrow" is active
        const remindKey = `repeat_remind_${productId}`;
        let isReminded = false;
        try {
          const remindResult = await window.storage.get(remindKey);
          if (remindResult?.value) {
            const remindTime = parseInt(remindResult.value);
            isReminded = now < remindTime;
          }
        } catch (e) {
          // Key doesn't exist, not reminded
          isReminded = false;
        }

        // Check if auto-repeat is enabled (should never show in slider)
        const autoRepeatKey = `repeat_auto_${productId}`;
        let isAutoRepeat = false;
        try {
          const autoResult = await window.storage.get(autoRepeatKey);
          isAutoRepeat = autoResult?.value === "true";
        } catch (e) {
          // Key doesn't exist, not auto-repeat
          isAutoRepeat = false;
        }

        // Only show if not hidden, not reminded, and not auto-repeat
        if (!isHidden && !isReminded && !isAutoRepeat) {
          filtered.push(suggestion);
        } else {
          console.log(`[useRepeatSliderState] Filtering out ${productId}:`, {
            isHidden,
            isReminded,
            isAutoRepeat,
          });
        }
      } catch (error) {
        console.error(
          `[useRepeatSliderState] Error checking storage for ${productId}:`,
          error
        );
        // On error, include the suggestion (fail open)
        filtered.push(suggestion);
      }
    }

    return filtered;
  }, []);

  // Initialize storage check
  useEffect(() => {
    if (window.storage) {
      setStorageReady(true);
    }
  }, []);

  // Initialize and filter suggestions when props change
  useEffect(() => {
    const initializeSuggestions = async () => {
      console.log(
        "[useRepeatSliderState] Raw suggestions:",
        initialSuggestions?.length || 0
      );

      if (initialSuggestions && initialSuggestions.length > 0) {
        const filtered = await filterSuggestions(initialSuggestions);
        console.log("[useRepeatSliderState] Filtered to:", filtered.length);
        setVisibleSuggestions(filtered);

        // Reset index if current is out of bounds
        if (currentIndex >= filtered.length) {
          setCurrentIndex(0);
        }
      } else {
        setVisibleSuggestions([]);
      }
    };

    if (storageReady || !window.storage) {
      initializeSuggestions();
    }
  }, [initialSuggestions, filterSuggestions, currentIndex, storageReady]);

  // Dismiss: hide until next reorder cycle
  const dismissSuggestion = useCallback(
    async (productId) => {
      console.log("[useRepeatSliderState] Dismissing:", productId);

      try {
        // Persist dismissal
        if (window.storage) {
          await window.storage.set(`repeat_hidden_${productId}`, "true");
          console.log("[useRepeatSliderState] Dismissal persisted");
        }

        // Remove from visible list immediately
        setVisibleSuggestions((prev) => {
          const filtered = prev.filter((s) => s.product_id !== productId);

          // Adjust index if needed
          if (currentIndex >= filtered.length && filtered.length > 0) {
            setCurrentIndex(Math.max(0, filtered.length - 1));
          }

          return filtered;
        });
      } catch (error) {
        console.error("[useRepeatSliderState] Error dismissing:", error);
      }
    },
    [currentIndex]
  );

  // Remind tomorrow: hide until tomorrow at same time
  const remindTomorrow = useCallback(
    async (productId) => {
      console.log("[useRepeatSliderState] Setting reminder for:", productId);

      try {
        // Calculate tomorrow at same time
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Persist reminder timestamp
        if (window.storage) {
          await window.storage.set(
            `repeat_remind_${productId}`,
            tomorrow.getTime().toString()
          );
          console.log("[useRepeatSliderState] Reminder persisted");
        }

        // Remove from visible list immediately
        setVisibleSuggestions((prev) => {
          const filtered = prev.filter((s) => s.product_id !== productId);

          // Adjust index if needed
          if (currentIndex >= filtered.length && filtered.length > 0) {
            setCurrentIndex(Math.max(0, filtered.length - 1));
          }

          return filtered;
        });
      } catch (error) {
        console.error("[useRepeatSliderState] Error setting reminder:", error);
      }
    },
    [currentIndex]
  );

  // Enable auto-repeat: product will auto-add to cart, never show slider
  const enableAutoRepeat = useCallback(
    async (productId) => {
      console.log(
        "[useRepeatSliderState] Enabling auto-repeat for:",
        productId
      );

      try {
        // Persist auto-repeat preference
        if (window.storage) {
          await window.storage.set(`repeat_auto_${productId}`, "true");
          console.log("[useRepeatSliderState] Auto-repeat persisted");
        }

        // Remove from visible list immediately
        setVisibleSuggestions((prev) => {
          const filtered = prev.filter((s) => s.product_id !== productId);

          // Adjust index if needed
          if (currentIndex >= filtered.length && filtered.length > 0) {
            setCurrentIndex(Math.max(0, filtered.length - 1));
          }

          return filtered;
        });
      } catch (error) {
        console.error(
          "[useRepeatSliderState] Error enabling auto-repeat:",
          error
        );
      }
    },
    [currentIndex]
  );

  // After adding to cart, remove from suggestions (stale prevention)
  const removeSuggestion = useCallback(
    (productId) => {
      console.log(
        "[useRepeatSliderState] Removing suggestion after add:",
        productId
      );

      setVisibleSuggestions((prev) => {
        const filtered = prev.filter((s) => s.product_id !== productId);

        // Adjust index if needed
        if (currentIndex >= filtered.length && filtered.length > 0) {
          setCurrentIndex(Math.max(0, filtered.length - 1));
        }

        return filtered;
      });
    },
    [currentIndex]
  );

  // Clear dismissals for a product (useful when reorder window resets)
  const clearDismissal = useCallback(async (productId) => {
    try {
      if (window.storage) {
        await window.storage.delete(`repeat_hidden_${productId}`);
        await window.storage.delete(`repeat_remind_${productId}`);
        console.log(
          "[useRepeatSliderState] Cleared dismissals for:",
          productId
        );
      }
    } catch (error) {
      console.error("[useRepeatSliderState] Error clearing dismissals:", error);
    }
  }, []);

  return {
    visibleSuggestions,
    currentIndex,
    setCurrentIndex,
    dismissSuggestion,
    remindTomorrow,
    enableAutoRepeat,
    removeSuggestion,
    clearDismissal,
  };
}
