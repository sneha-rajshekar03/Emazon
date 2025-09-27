// src/app/utils/preferenceCleanup.js

/**
 * Cleans up duplicate preferences by consolidating case variations
 * and keeping the highest score for each unique element
 */
export const cleanupDuplicatePreferences = (preferences) => {
  console.log("🧹 Cleaning up duplicate preferences");
  console.log("📋 Input preferences:", preferences);

  if (!preferences || preferences.length === 0) {
    return [];
  }

  // Group preferences by normalized element name
  const grouped = {};

  preferences.forEach((pref) => {
    const normalizedElement = pref.element.toLowerCase().trim();

    if (!grouped[normalizedElement]) {
      grouped[normalizedElement] = [];
    }

    grouped[normalizedElement].push(pref);
  });

  console.log("📊 Grouped by element:", Object.keys(grouped));

  // For each group, keep the one with highest score
  const cleaned = [];

  Object.entries(grouped).forEach(([elementName, prefs]) => {
    console.log(`🔍 Processing ${elementName}: ${prefs.length} duplicates`);

    if (prefs.length > 1) {
      console.log(`   Scores: ${prefs.map((p) => p.score).join(", ")}`);
    }

    // Sort by score descending and take the first (highest)
    const bestPref = prefs.sort((a, b) => (b.score || 0) - (a.score || 0))[0];

    // Normalize the element name to lowercase
    cleaned.push({
      element: elementName, // Use normalized lowercase name
      score: bestPref.score || 0,
    });

    console.log(
      `✅ Kept: ${elementName} = ${bestPref.score} (from ${prefs.length} ${
        prefs.length > 1 ? "duplicates" : "item"
      })`
    );
  });

  // Sort final result by score
  const sorted = cleaned.sort((a, b) => (b.score || 0) - (a.score || 0));

  console.log("🎯 Cleaned preferences:", sorted);
  console.log(
    `📊 Reduced from ${preferences.length} to ${sorted.length} preferences`
  );

  return sorted;
};

/**
 * API function to clean preferences for a specific user
 */
export const cleanupUserPreferences = async (userId) => {
  try {
    console.log(`🔧 Starting cleanup for user: ${userId}`);

    // Fetch current preferences
    const response = await fetch(`/api/preferences?userId=${userId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch preferences: ${response.status}`);
    }

    const data = await response.json();
    const currentPrefs = data.preferences || [];

    console.log(`📋 Current preferences count: ${currentPrefs.length}`);

    // Clean the preferences
    const cleaned = cleanupDuplicatePreferences(currentPrefs);

    if (cleaned.length === currentPrefs.length) {
      console.log("✅ No cleanup needed - no duplicates found");
      return { success: true, message: "No duplicates found", cleaned };
    }

    // Save cleaned preferences
    const saveResponse = await fetch("/api/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId,
        interactions: cleaned,
      }),
    });

    if (!saveResponse.ok) {
      throw new Error(
        `Failed to save cleaned preferences: ${saveResponse.status}`
      );
    }

    const result = await saveResponse.json();
    console.log("✅ Cleanup completed successfully");

    return {
      success: true,
      message: `Cleaned up ${currentPrefs.length} → ${cleaned.length} preferences`,
      original: currentPrefs,
      cleaned: result.preferences || cleaned,
    };
  } catch (error) {
    console.error("❌ Cleanup failed:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * React hook for preference cleanup with UI feedback
 */
export const usePreferenceCleanup = () => {
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [cleanupResult, setCleanupResult] = useState(null);

  const cleanup = async (userId) => {
    setIsCleaningUp(true);
    setCleanupResult(null);

    try {
      const result = await cleanupUserPreferences(userId);
      setCleanupResult(result);
      return result;
    } catch (error) {
      const errorResult = {
        success: false,
        error: error.message,
      };
      setCleanupResult(errorResult);
      return errorResult;
    } finally {
      setIsCleaningUp(false);
    }
  };

  return {
    cleanup,
    isCleaningUp,
    cleanupResult,
    clearResult: () => setCleanupResult(null),
  };
};
