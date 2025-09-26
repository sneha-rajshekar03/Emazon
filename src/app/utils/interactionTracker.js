let interactionScores = {};
const hoverStartTimes = {}; // to store when hover started

export function trackInteraction(elementId, type) {
  console.log("trackInteraction CALLED with:", elementId, type); // 👈 debug

  if (!interactionScores[elementId]) {
    interactionScores[elementId] = 0;
  }

  if (type === "click") {
    interactionScores[elementId] += 5;
  } else if (type === "hover-start") {
    // store start time
    hoverStartTimes[elementId] = Date.now();
  } else if (type === "hover-end") {
    if (hoverStartTimes[elementId]) {
      const hoverDuration = (Date.now() - hoverStartTimes[elementId]) / 1000; // seconds
      console.log(`[HOVER] ${elementId} duration:`, hoverDuration);

      if (hoverDuration >= 5) {
        interactionScores[elementId] += 3; // reward long hover
      } else {
        interactionScores[elementId] += 1; // short hover
      }

      delete hoverStartTimes[elementId]; // clean up
    }
  }

  console.log(`[TRACKED] ${type} on ${elementId}`, interactionScores);
}

export function getInteractionScores() {
  return interactionScores;
}

// 🔹 Prioritize by score
export function getPrioritizedInteractions() {
  const sorted = Object.entries(interactionScores)
    .map(([element, score]) => ({ element, score }))
    .sort((a, b) => b.score - a.score);

  console.log("Prioritized interactions:", sorted);
  return sorted;
}
