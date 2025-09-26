"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { getInteractionScores } from "@app/utils/interactionTracker";
import { resetInteractions } from "@app/utils/interactionTracker";

export function usePreferences() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [preferences, setPreferences] = useState([]);
  const lastPathRef = useRef();

  function saveInteractions() {
    const scores = getInteractionScores();
    console.log("💾 Saving interactions:", scores);

    const updated = [...preferences];
    const scoreArray = Object.entries(scores).map(([element, score]) => ({
      element,
      score,
    }));

    scoreArray.forEach(({ element, score }) => {
      const idx = updated.findIndex((p) => p.element === element);
      if (idx >= 0) {
        updated[idx].score = score;
      } else {
        updated.push({ element, score });
      }
    });

    const sorted = updated.sort((a, b) => (b.score || 0) - (a.score || 0));
    localStorage.setItem("preferences", JSON.stringify(sorted));
    setPreferences(sorted);
    console.log("✅ Preferences updated:", sorted);
  }

  // Load preferences from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("preferences");
    if (stored) {
      const parsed = JSON.parse(stored);
      console.log("📂 Loaded preferences:", parsed.length, "items");
      setPreferences(parsed);
    }
  }, []);

  // Handle route changes
  useEffect(() => {
    const prevPath = lastPathRef.current;
    const currPath = pathname;

    console.log("🛤️ Route:", prevPath, "→", currPath);

    // Only process if we have a previous path (not initial load)
    if (prevPath) {
      // Case 1: leaving product page completely
      if (
        prevPath.startsWith("/products/") &&
        !currPath.startsWith("/products/")
      ) {
        console.log("📤 Leaving product page → saving");
        saveInteractions();
      }
      // Case 2: switching between product pages
      else if (
        prevPath.startsWith("/products/") &&
        currPath.startsWith("/products/") &&
        prevPath !== currPath
      ) {
        console.log("🔄 Switching products → save & reset");
        saveInteractions();
        resetInteractions();
      }
    }

    // Case 3: entering product page (first time or from non-product page)
    if (
      currPath.startsWith("/products/") &&
      (!prevPath || !prevPath.startsWith("/products/"))
    ) {
      console.log("🆕 Entered product page → reset");
      resetInteractions();
    }

    lastPathRef.current = currPath;

    // Cleanup function - save interactions when component unmounts
    return () => {
      const currentPath = lastPathRef.current;
      if (currentPath && currentPath.startsWith("/products/")) {
        console.log(
          "🧹 Component cleanup - saving interactions before unmount"
        );
        const scores = getInteractionScores();
        if (Object.keys(scores).length > 0) {
          console.log("💾 Cleanup save:", scores);

          // Get current preferences from localStorage (most up-to-date)
          const stored = localStorage.getItem("preferences");
          const currentPrefs = stored ? JSON.parse(stored) : [];

          const updated = [...currentPrefs];
          const scoreArray = Object.entries(scores).map(([element, score]) => ({
            element,
            score,
          }));

          scoreArray.forEach(({ element, score }) => {
            const idx = updated.findIndex((p) => p.element === element);
            if (idx >= 0) {
              updated[idx].score = score;
            } else {
              updated.push({ element, score });
            }
          });

          const sorted = updated.sort(
            (a, b) => (b.score || 0) - (a.score || 0)
          );
          localStorage.setItem("preferences", JSON.stringify(sorted));
          console.log("✅ Cleanup save completed:", sorted);
        }
      }
    };
  }, [pathname]);

  const savePreferencesToDB = useCallback(async () => {
    if (!session?.user?.id) {
      console.log("🚫 No user session for DB save");
      return;
    }

    const stored = localStorage.getItem("preferences");
    if (!stored) {
      console.log("🚫 No preferences to save to DB");
      return;
    }

    console.log("☁️ Starting DB sync...");
    try {
      const response = await fetch("/api/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: session.user.id,
          interactions: JSON.parse(stored),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      console.log("✅ Successfully synced to DB");
      return true;
    } catch (err) {
      console.error("❌ DB sync failed:", err);
      return false;
    }
  }, [session?.user?.id]);

  const signOutWithSave = useCallback(async () => {
    console.log("🚪 Starting sign out with save...");

    try {
      // Wait for DB save to complete
      const saved = await savePreferencesToDB();

      if (saved) {
        console.log(
          "✅ Preferences saved successfully, proceeding with sign out"
        );
      } else {
        console.log("⚠️ DB save failed, but proceeding with sign out anyway");
      }
    } catch (error) {
      console.error("❌ Error during save:", error);
      console.log("⚠️ Proceeding with sign out despite error");
    }

    console.log("👋 Calling signOut()");
    signOut();
  }, [savePreferencesToDB]);

  return {
    preferences,
    setPreferences,
    savePreferencesToDB,
    signOutWithSave,
  };
}
