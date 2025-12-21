// lib/reorderPatternAnalyzer.js
// Core algorithm for analyzing user reorder patterns

/**
 * Normalize a date to start of day (00:00:00)
 */
function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Analyzes purchase history to detect reorder patterns
 */
export function analyzeReorderPatterns(purchases) {
  console.log(
    "[ReorderAnalyzer] Starting analysis with",
    purchases.length,
    "purchases"
  );

  const productPurchases = new Map();

  purchases.forEach((purchase) => {
    purchase.items.forEach((item) => {
      if (!productPurchases.has(item.product_id)) {
        productPurchases.set(item.product_id, []);
      }
      productPurchases
        .get(item.product_id)
        .push(new Date(purchase.transaction_date));
    });
  });

  console.log(
    "[ReorderAnalyzer] Grouped into",
    productPurchases.size,
    "unique products"
  );

  const patterns = [];

  productPurchases.forEach((dates, productId) => {
    if (dates.length < 2) return;

    dates.sort((a, b) => a - b);

    const intervals = [];
    for (let i = 1; i < dates.length; i++) {
      const daysBetween = Math.round((dates[i] - dates[i - 1]) / 86400000);
      intervals.push(daysBetween);
    }

    const median = calculateMedian(intervals);
    const filteredIntervals = intervals.filter((i) => i <= median * 2);

    if (!filteredIntervals.length) return;

    const avgInterval =
      filteredIntervals.reduce((a, b) => a + b, 0) / filteredIntervals.length;

    const lastPurchase = dates[dates.length - 1];

    const expectedNextDate = startOfDay(
      new Date(lastPurchase.getTime() + avgInterval * 86400000)
    );

    const confidence = calculateConfidence(filteredIntervals);

    patterns.push({
      product_id: productId,
      lastPurchaseDate: lastPurchase,
      avgReorderInterval: Math.round(avgInterval),
      expectedNextDate,
      purchaseCount: dates.length,
      confidence,
      intervals: filteredIntervals,
    });
  });

  return patterns;
}

/**
 * Find eligible reminders (FIXED)
 */
export function getEligibleReminders(
  patterns,
  cartProductIds = [],
  currentDate = new Date(),
  reminderWindow = 3
) {
  const today = startOfDay(currentDate);

  return patterns.filter((pattern) => {
    if (pattern.purchaseCount < 2) return false;
    if (pattern.confidence < 0.5) return false;
    if (cartProductIds.includes(pattern.product_id)) return false;

    const expected = startOfDay(pattern.expectedNextDate);

    const diffDays = Math.round((expected - today) / 86400000);

    console.log("[ReorderAnalyzer] Date check:", {
      product: pattern.product_id,
      today: today.toDateString(),
      expected: expected.toDateString(),
      diffDays,
    });

    return Math.abs(diffDays) <= reminderWindow;
  });
}

/**
 * Priority sorting
 */
export function prioritizePatterns(patterns) {
  const today = startOfDay(new Date());

  return patterns
    .map((pattern) => {
      const overdueDays = Math.max(
        0,
        Math.round((today - pattern.expectedNextDate) / 86400000)
      );

      return {
        ...pattern,
        priority: pattern.confidence * (1 + overdueDays * 0.1),
      };
    })
    .sort((a, b) => b.priority - a.priority);
}

/* ---------- helpers ---------- */

function calculateMedian(arr) {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function calculateConfidence(intervals) {
  if (intervals.length < 2) return 0.5;

  const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;

  const variance =
    intervals.reduce((s, v) => s + (v - mean) ** 2, 0) / intervals.length;

  const cv = Math.sqrt(variance) / mean;

  return Math.max(0, Math.min(1, 1 - cv));
}
