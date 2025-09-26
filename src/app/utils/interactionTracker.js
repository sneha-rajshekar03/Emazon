// interactionTracker.js

let interactionScores = {};
let hoverStartTimes = {}; // store hover start times

/**
 * Track user interactions (clicks + hovers).
 * @param {string} elementId - The element identifier
 * @param {"click"|"hover-start"|"hover-end"} type - Interaction type
 */
export function trackInteraction(elementId, type) {
  if (!elementId) return;

  console.log("trackInteraction CALLED with:", elementId, type);

  // Ensure the element has an initial score
  if (!interactionScores[elementId]) {
    interactionScores[elementId] = 0;
  }

  if (type === "click") {
    // Clicks carry more weight
    interactionScores[elementId] += 5;
  } else if (type === "hover-start") {
    // Record when hover started
    hoverStartTimes[elementId] = Date.now();
  } else if (type === "hover-end") {
    if (hoverStartTimes[elementId]) {
      const hoverDuration = (Date.now() - hoverStartTimes[elementId]) / 1000; // in seconds
      console.log(`[HOVER] ${elementId} duration:`, hoverDuration);

      // Weight based on duration
      interactionScores[elementId] += hoverDuration >= 5 ? 3 : 1;

      // Clean up
      delete hoverStartTimes[elementId];
    }
  }

  console.log(`[TRACKED] ${type} on ${elementId}`, interactionScores);
}

/**
 * Get all interaction scores.
 */
export function getInteractionScores() {
  return { ...interactionScores }; // return a copy to avoid mutation
}

/**
 * Get sorted interactions (highest priority first).
 */
export function getPrioritizedInteractions() {
  const sorted = Object.entries(interactionScores)
    .map(([element, score]) => ({ element, score }))
    .sort((a, b) => b.score - a.score);

  console.log("Prioritized interactions:", sorted);
  return sorted;
}

/**
 * Reset all interactions (start fresh).
 */
export function resetInteractions() {
  interactionScores = {};
  hoverStartTimes = {};
  console.log("🔄 Interactions reset");
}
// 🔹 Fetch preferences from DB and initialize scores
export async function fetchPreferences(userId) {
  try {
    const res = await fetch(`/api/preferences?userId=${userId}`);
    if (!res.ok) throw new Error("Failed to fetch preferences");

    const data = await res.json();

    // Replace local scores with DB scores
    data.preferences.forEach((p) => {
      interactionScores[p.section] = p.score;
    });

    console.log("✅ Loaded preferences from DB:", interactionScores);
  } catch (err) {
    console.error("❌ Error fetching preferences:", err);
  }
}
