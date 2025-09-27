"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import {
  getInteractionScores,
  resetInteractions,
} from "@app/utils/interactionTracker";

export function usePreferences() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [preferences, setPreferences] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const lastPathRef = useRef(null);

  // Normalize element names to lowercase for consistency
  const normalizeElement = (element) => element.trim().toLowerCase();

  const saveInteractions = useCallback(() => {
    const scores = getInteractionScores();
    console.log("Saving interactions:", scores);

    if (Object.keys(scores).length === 0) {
      console.log("No interactions to save");
      return;
    }

    // Get current preferences from appropriate storage
    let currentPrefs = [];
    if (session?.user?.id) {
      // Logged-in user - use localStorage
      const stored = localStorage.getItem("preferences");
      currentPrefs = stored ? JSON.parse(stored) : [];
    } else {
      // Guest user - use sessionStorage
      const stored = sessionStorage.getItem("guestPreferences");
      currentPrefs = stored ? JSON.parse(stored) : [];
    }

    const updated = [...currentPrefs];
    const scoreArray = Object.entries(scores).map(([element, score]) => ({
      element: normalizeElement(element),
      score: Math.round(score * 100) / 100, // Round to 2 decimal places
    }));

    // Update or add preferences (consolidated by normalized element name)
    scoreArray.forEach(({ element, score }) => {
      const idx = updated.findIndex(
        (p) => normalizeElement(p.element) === element
      );
      if (idx >= 0) {
        updated[idx].score += score; // Accumulate scores
        updated[idx].element = element; // Ensure consistent casing
      } else {
        updated.push({ element, score });
      }
    });

    // Sort by score descending
    const sorted = updated.sort((a, b) => (b.score || 0) - (a.score || 0));

    // Save to appropriate storage
    if (session?.user?.id) {
      localStorage.setItem("preferences", JSON.stringify(sorted));
      console.log("Logged-in user - saved to localStorage");
    } else {
      sessionStorage.setItem("guestPreferences", JSON.stringify(sorted));
      console.log("Guest user - saved to sessionStorage");
    }

    // Update state
    setPreferences(sorted);
    console.log("Preferences updated:", sorted);
  }, [session?.user?.id]);

  // DB operations (only for logged-in users)
  const fetchPreferencesFromDB = useCallback(async (userId) => {
    try {
      console.log("Fetching preferences from database for user:", userId);
      const response = await fetch(`/api/preferences?userId=${userId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.log("No preferences found in DB for user");
          return [];
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const dbData = await response.json();
      console.log("DB Response:", dbData);

      // Handle both new and legacy API formats
      const dbPrefs =
        dbData.success !== undefined
          ? dbData.preferences || []
          : dbData.preferences || [];

      // Sort and normalize
      const sorted = dbPrefs
        .map((pref) => ({
          ...pref,
          element: normalizeElement(pref.element),
        }))
        .sort((a, b) => (b.score || 0) - (a.score || 0));

      console.log(`Loaded ${sorted.length} preferences from DB`);
      return sorted;
    } catch (error) {
      console.error("Failed to fetch DB preferences:", error);
      throw error;
    }
  }, []);

  const savePreferencesToDB = useCallback(async () => {
    if (!session?.user?.id) {
      console.log("No user session for DB save");
      return false;
    }

    // Get preferences from localStorage (current session data)
    const stored = localStorage.getItem("preferences");
    const prefsToSave = stored ? JSON.parse(stored) : [];

    if (prefsToSave.length === 0) {
      console.log("No preferences to save to DB");
      return true;
    }

    try {
      console.log("Saving to database:", prefsToSave);
      const response = await fetch("/api/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          userId: session.user.id,
          interactions: prefsToSave, // API expects "interactions"
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log("Successfully saved to DB:", result);
      return true;
    } catch (err) {
      console.error("DB save failed:", err);
      setError("Failed to save preferences to database");
      return false;
    }
  }, [session?.user?.id]);

  // Load preferences on session change
  useEffect(() => {
    if (status === "loading") {
      console.log("Waiting for session...");
      return;
    }

    const loadPreferences = async () => {
      console.log("Loading preferences...");
      setIsLoading(true);
      setError(null);

      try {
        if (session?.user?.id) {
          // LOGGED-IN USER FLOW
          console.log("Logged-in user detected");

          // First, check if we already have data in localStorage for this session
          const storedPrefs = localStorage.getItem("preferences");
          const storedUserId = localStorage.getItem("preferencesUserId");

          if (storedPrefs && storedUserId === session.user.id) {
            // Use existing localStorage data (already fetched from DB in this session)
            const localPrefs = JSON.parse(storedPrefs);
            setPreferences(localPrefs);
            console.log(
              `Using existing localStorage data (${localPrefs.length} preferences) - no DB fetch needed`
            );
          } else {
            // Fresh sign-in or different user - fetch from DB once
            console.log("Fresh sign-in detected - fetching from DB");
            try {
              const dbPrefs = await fetchPreferencesFromDB(session.user.id);

              // Store in localStorage with user ID for session use
              localStorage.setItem("preferences", JSON.stringify(dbPrefs));
              localStorage.setItem("preferencesUserId", session.user.id);
              console.log(
                "Fetched from DB and synced to localStorage for session"
              );

              setPreferences(dbPrefs);
              console.log(
                `Loaded ${dbPrefs.length} preferences from DB for new session`
              );
            } catch (dbError) {
              console.error("DB fetch failed:", dbError);
              setError("Failed to load preferences from database");
              // Clear localStorage on error
              localStorage.removeItem("preferences");
              localStorage.removeItem("preferencesUserId");
              setPreferences([]);
            }
          }
        } else {
          // GUEST USER FLOW
          console.log("Guest user - loading from sessionStorage");
          const guestStored = sessionStorage.getItem("guestPreferences");
          const guestPrefs = guestStored ? JSON.parse(guestStored) : [];
          setPreferences(guestPrefs);
          console.log(`Loaded ${guestPrefs.length} preferences for guest user`);

          // Clear any leftover localStorage from previous sessions
          localStorage.removeItem("preferences");
          localStorage.removeItem("preferencesUserId");
        }
      } catch (error) {
        console.error("Error loading preferences:", error);
        setError("Failed to load preferences");
        setPreferences([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadPreferences();
  }, [session?.user?.id, status, fetchPreferencesFromDB]);

  // Handle route changes
  useEffect(() => {
    const prevPath = lastPathRef.current;
    const currPath = pathname;

    console.log("Route change:", prevPath, "→", currPath);

    if (prevPath) {
      // Leaving product page - save interactions
      if (
        prevPath.startsWith("/products/") &&
        !currPath.startsWith("/products/")
      ) {
        console.log("Leaving product page - saving interactions");
        saveInteractions();
      }
      // Switching between products - save and reset
      else if (
        prevPath.startsWith("/products/") &&
        currPath.startsWith("/products/") &&
        prevPath !== currPath
      ) {
        console.log("Switching products - save and reset");
        saveInteractions();
        resetInteractions();
      }
    }

    // Entering product page - reset interactions
    if (
      currPath.startsWith("/products/") &&
      (!prevPath || !prevPath.startsWith("/products/"))
    ) {
      console.log("Entered product page - resetting interactions");
      resetInteractions();
    }

    lastPathRef.current = currPath;
  }, [pathname, saveInteractions]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const currentPath = lastPathRef.current;
      if (currentPath && currentPath.startsWith("/products/")) {
        console.log("Component cleanup - saving interactions");
        const scores = getInteractionScores();

        if (Object.keys(scores).length > 0) {
          // Quick save without state updates
          if (session?.user?.id) {
            const stored = localStorage.getItem("preferences");
            const current = stored ? JSON.parse(stored) : [];
            const updated = [...current];

            Object.entries(scores).forEach(([element, score]) => {
              const normalizedElement = normalizeElement(element);
              const idx = updated.findIndex(
                (p) => normalizeElement(p.element) === normalizedElement
              );
              if (idx >= 0) {
                updated[idx].score += score;
              } else {
                updated.push({ element: normalizedElement, score });
              }
            });

            const sorted = updated.sort(
              (a, b) => (b.score || 0) - (a.score || 0)
            );
            localStorage.setItem("preferences", JSON.stringify(sorted));
          } else {
            const stored = sessionStorage.getItem("guestPreferences");
            const current = stored ? JSON.parse(stored) : [];
            const updated = [...current];

            Object.entries(scores).forEach(([element, score]) => {
              const normalizedElement = normalizeElement(element);
              const idx = updated.findIndex(
                (p) => normalizeElement(p.element) === normalizedElement
              );
              if (idx >= 0) {
                updated[idx].score += score;
              } else {
                updated.push({ element: normalizedElement, score });
              }
            });

            const sorted = updated.sort(
              (a, b) => (b.score || 0) - (a.score || 0)
            );
            sessionStorage.setItem("guestPreferences", JSON.stringify(sorted));
          }
        }
      }
    };
  }, [session?.user?.id]);

  // Enhanced signOut with proper save and cleanup
  const signOutWithSave = useCallback(async () => {
    console.log("Starting sign out with save...");

    try {
      if (session?.user?.id) {
        // 1. Save any pending interactions
        const scores = getInteractionScores();
        if (Object.keys(scores).length > 0) {
          saveInteractions();
          // Small delay to ensure localStorage is updated
          await new Promise((resolve) => setTimeout(resolve, 100));
        }

        // 2. Save current localStorage to DB
        const saved = await savePreferencesToDB();
        if (saved) {
          console.log("Preferences saved successfully to DB");
        } else {
          console.log("DB save failed, but proceeding with sign out");
        }

        // 3. Clear localStorage and user ID after successful save
        localStorage.removeItem("preferences");
        localStorage.removeItem("preferencesUserId");
        console.log("Cleared localStorage on logout");
      }

      // 4. Clear any guest session storage too
      sessionStorage.removeItem("guestPreferences");

      // 5. Reset interactions
      resetInteractions();

      console.log("Signing out...");
      await signOut();
    } catch (error) {
      console.error("Error during sign out save:", error);
      // Still proceed with sign out even if save fails
      // But clean up localStorage anyway
      localStorage.removeItem("preferences");
      localStorage.removeItem("preferencesUserId");
      await signOut();
    }
  }, [saveInteractions, savePreferencesToDB, session?.user?.id]);

  // Utility function to get ordered elements for dynamic layout
  const getOrderedElements = useCallback(
    (defaultElements = []) => {
      if (!session?.user?.id || preferences.length === 0) {
        // Guest users or no preferences - return default order
        return defaultElements;
      }

      // Create preference score map (case-insensitive)
      const scoreMap = new Map();
      preferences.forEach((pref) => {
        const key = normalizeElement(pref.element);
        scoreMap.set(key, pref.score || 0);
      });

      // Sort elements by preference scores
      const ordered = [...defaultElements].sort((a, b) => {
        const scoreA = scoreMap.get(normalizeElement(a)) || 0;
        const scoreB = scoreMap.get(normalizeElement(b)) || 0;
        return scoreB - scoreA; // Highest score first
      });

      console.log("Element ordering:", {
        default: defaultElements,
        ordered: ordered,
        scores: Object.fromEntries(scoreMap),
      });

      return ordered;
    },
    [preferences, session?.user?.id]
  );

  return {
    preferences,
    setPreferences,
    isLoading,
    error,
    savePreferencesToDB,
    signOutWithSave,
    getOrderedElements,
    // Utility properties
    isLoggedIn: !!session?.user?.id,
    hasPreferences: preferences.length > 0,
  };
}
