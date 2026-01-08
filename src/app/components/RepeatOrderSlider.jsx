import { useState, useEffect } from "react";
import {
  X,
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Sparkles,
  Plus,
  Minus,
} from "lucide-react";
import { useRepeatSliderState } from "@/app/hooks/useRepeatSliderState";
import { useColor } from "@/app/context/ColorContext";

export default function RepeatOrderSlider({
  suggestions,
  onAddToCart,
  onDismiss,
}) {
  const { hexColor, isDarkMode } = useColor();
  const [adding, setAdding] = useState(null);
  const [timeLeft, setTimeLeft] = useState(5);
  const [quantities, setQuantities] = useState({});

  const {
    visibleSuggestions,
    currentIndex,
    setCurrentIndex,
    dismissSuggestion,
  } = useRepeatSliderState(suggestions);

  // Initialize quantities when suggestions change
  useEffect(() => {
    if (visibleSuggestions && visibleSuggestions.length > 0) {
      const initialQuantities = {};
      visibleSuggestions.forEach((suggestion) => {
        initialQuantities[suggestion.product_id] =
          suggestion.suggestedQuantity || 1;
      });
      setQuantities(initialQuantities);
    }
  }, [visibleSuggestions]);

  useEffect(() => {
    console.log("\n=== REPEAT ORDER SLIDER STATE ===");
    console.log("[Slider] Props suggestions:", suggestions?.length || 0);
    console.log(
      "[Slider] Visible suggestions:",
      visibleSuggestions?.length || 0
    );
    console.log("[Slider] Current index:", currentIndex);
    console.log("[Slider] Quantities:", quantities);
    console.log("================================\n");
  }, [suggestions, visibleSuggestions, currentIndex, quantities]);

  useEffect(() => {
    if (!visibleSuggestions || visibleSuggestions.length === 0 || adding)
      return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          const currentSuggestion = visibleSuggestions[currentIndex];
          if (currentSuggestion) {
            handleDismiss(currentSuggestion.product_id);
          }
          return 5;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [visibleSuggestions, currentIndex, adding]);

  useEffect(() => {
    setTimeLeft(5);
  }, [currentIndex]);

  const updateQuantity = (productId, delta) => {
    setQuantities((prev) => ({
      ...prev,
      [productId]: Math.max(1, (prev[productId] || 1) + delta),
    }));
    setTimeLeft(5); // Reset timer when user interacts
  };

  const handleAddToCart = async (productId) => {
    console.log("[Slider] Adding to cart:", productId);
    setAdding(productId);
    try {
      const suggestion = visibleSuggestions.find(
        (s) => s.product_id === productId
      );

      if (!suggestion) {
        throw new Error("Suggestion not found");
      }

      const quantity =
        quantities[productId] || suggestion.suggestedQuantity || 1;

      // ✅ Include quantity in product data
      const productForCart = {
        product_id: suggestion.product_id,
        title: suggestion.title,
        category: suggestion.category,
        price: suggestion.price,
        image: suggestion.image,
        imgUrl: suggestion.image,
        quantity: quantity, // ✅ Add the selected/suggested quantity
      };

      console.log("[Slider] Product formatted for cart:", productForCart);

      await onAddToCart(productForCart);
      console.log("[Slider] ✓ Added to cart successfully");

      dismissSuggestion(productId);

      if (onDismiss) {
        try {
          await onDismiss(suggestion);
          console.log("[Slider] ✓ Parent notified of dismissal");
        } catch (error) {
          console.error("[Slider] ❌ Parent dismiss callback failed:", error);
        }
      }

      setTimeLeft(5);
    } catch (error) {
      console.error("[Slider] ❌ Failed to add to cart:", error);
    } finally {
      setAdding(null);
    }
  };

  const handleDismiss = async (productId) => {
    console.log("[Slider] Dismissing suggestion:", productId);

    const suggestion = visibleSuggestions.find(
      (s) => s.product_id === productId
    );

    dismissSuggestion(productId);

    if (onDismiss && suggestion) {
      try {
        await onDismiss(suggestion);
        console.log("[Slider] ✓ Parent notified of dismissal");
      } catch (error) {
        console.error("[Slider] ❌ Parent dismiss callback failed:", error);
      }
    }

    setTimeLeft(5);
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % visibleSuggestions.length);
    setTimeLeft(5);
  };

  const prevSlide = () => {
    setCurrentIndex(
      (prev) =>
        (prev - 1 + visibleSuggestions.length) % visibleSuggestions.length
    );
    setTimeLeft(5);
  };

  if (!visibleSuggestions || visibleSuggestions.length === 0) {
    console.log("[Slider] Not rendering - no visible suggestions");
    return null;
  }

  const currentSuggestion = visibleSuggestions[currentIndex];
  const currentQuantity =
    quantities[currentSuggestion.product_id] ||
    currentSuggestion.suggestedQuantity ||
    1;

  return (
    <div
      className="fixed top-20 right-4 z-[60] max-w-[360px]"
      style={{ animation: "slideInFromRight 0.5s ease-out" }}
    >
      <style jsx>{`
        @keyframes slideInFromRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>

      <div
        className={`rounded-2xl shadow-2xl border p-5 ${
          isDarkMode
            ? "bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700"
            : "bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div
              className="rounded-lg p-1.5 shadow-lg"
              style={{
                background: isDarkMode
                  ? `linear-gradient(135deg, ${hexColor} 0%, ${hexColor}dd 100%)`
                  : `linear-gradient(135deg, ${hexColor} 0%, ${hexColor}cc 100%)`,
              }}
            >
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <span
                className={`text-sm font-bold block ${
                  isDarkMode ? "text-gray-100" : "text-gray-900"
                }`}
              >
                Time to Reorder?
              </span>
              <span
                className={`text-xs ${
                  isDarkMode ? "text-gray-400" : "text-gray-500"
                }`}
              >
                Auto-dismiss in {timeLeft}s
              </span>
            </div>
          </div>
          <button
            onClick={() => handleDismiss(currentSuggestion.product_id)}
            className={`transition-colors p-1 rounded-lg ${
              isDarkMode
                ? "text-gray-400 hover:text-gray-200 hover:bg-gray-700"
                : "text-gray-400 hover:text-gray-600 hover:bg-white/50"
            }`}
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div
          className={`rounded-xl p-4 shadow-md border ${
            isDarkMode
              ? "bg-gray-800/50 border-gray-700"
              : "bg-white border-gray-100"
          }`}
        >
          <div className="flex gap-3 mb-3">
            {/* Product Image */}
            <div
              className={`w-20 h-20 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${
                isDarkMode
                  ? "bg-gradient-to-br from-gray-700 to-gray-800"
                  : "bg-gradient-to-br from-blue-100 to-indigo-100"
              }`}
            >
              {currentSuggestion.image ? (
                <img
                  src={currentSuggestion.image}
                  alt={currentSuggestion.title}
                  className="w-full h-full object-cover rounded-xl"
                />
              ) : (
                <ShoppingBag
                  className="w-7 h-7"
                  style={{ color: isDarkMode ? hexColor : undefined }}
                />
              )}
            </div>

            {/* Product Info */}
            <div className="flex-1 min-w-0">
              <h4
                className={`font-bold text-sm line-clamp-2 mb-1 ${
                  isDarkMode ? "text-gray-100" : "text-gray-900"
                }`}
              >
                {currentSuggestion.title}
              </h4>
              <p
                className={`text-xs mb-1.5 ${
                  isDarkMode ? "text-gray-400" : "text-gray-500"
                }`}
              >
                {currentSuggestion.category}
              </p>
              <p className="text-xl font-bold" style={{ color: hexColor }}>
                ${currentSuggestion.price.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Quantity Selector */}
          <div
            className={`rounded-lg p-3 mb-3 border ${
              isDarkMode
                ? "bg-gray-700/50 border-gray-600"
                : "bg-gradient-to-br from-purple-50 to-pink-50 border-purple-100"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p
                  className={`text-xs font-semibold mb-0.5 ${
                    isDarkMode ? "text-gray-200" : "text-gray-700"
                  }`}
                >
                  Quantity
                </p>
                <p
                  className={`text-xs ${
                    isDarkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  You usually order {currentSuggestion.suggestedQuantity}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    updateQuantity(currentSuggestion.product_id, -1)
                  }
                  disabled={currentQuantity <= 1}
                  className={`p-1.5 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                    isDarkMode
                      ? "bg-gray-600 hover:bg-gray-500 text-white"
                      : "bg-white hover:bg-gray-50 text-gray-700 border border-gray-200"
                  }`}
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span
                  className={`text-lg font-bold min-w-[2rem] text-center ${
                    isDarkMode ? "text-gray-100" : "text-gray-900"
                  }`}
                >
                  {currentQuantity}
                </span>
                <button
                  onClick={() =>
                    updateQuantity(currentSuggestion.product_id, 1)
                  }
                  className={`p-1.5 rounded-lg transition-all ${
                    isDarkMode
                      ? "bg-gray-600 hover:bg-gray-500 text-white"
                      : "bg-white hover:bg-gray-50 text-gray-700 border border-gray-200"
                  }`}
                  aria-label="Increase quantity"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Reorder Info */}
          <div
            className={`rounded-lg p-3 mb-3 border ${
              isDarkMode
                ? "bg-gray-700/50 border-gray-600"
                : "bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100"
            }`}
          >
            <div className="flex items-start gap-2">
              <TrendingUp
                className="w-4 h-4 mt-0.5 flex-shrink-0"
                style={{ color: hexColor }}
              />
              <div>
                <p
                  className={`text-xs font-semibold mb-1 ${
                    isDarkMode ? "text-gray-200" : "text-gray-700"
                  }`}
                >
                  You usually reorder this around now
                </p>
                <p
                  className={`text-xs ${
                    isDarkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  Last purchased {currentSuggestion.lastPurchasedDays} days ago
                  {currentSuggestion.avgReorderInterval && (
                    <span className="block mt-0.5">
                      Typical interval: every{" "}
                      {currentSuggestion.avgReorderInterval} days
                    </span>
                  )}
                </p>
                {currentSuggestion.confidence && (
                  <div className="mt-2 flex items-center gap-2">
                    <div
                      className={`flex-1 h-1.5 rounded-full overflow-hidden ${
                        isDarkMode ? "bg-gray-600" : "bg-gray-200"
                      }`}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${currentSuggestion.confidence * 100}%`,
                          background: `linear-gradient(90deg, ${hexColor} 0%, ${hexColor}dd 100%)`,
                        }}
                      />
                    </div>
                    <span
                      className={`text-xs font-medium ${
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      {Math.round(currentSuggestion.confidence * 100)}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => handleAddToCart(currentSuggestion.product_id)}
              disabled={adding === currentSuggestion.product_id}
              className="flex-1 text-white px-4 py-3 rounded-lg font-bold text-sm transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background:
                  adding === currentSuggestion.product_id
                    ? isDarkMode
                      ? "#444"
                      : "#ccc"
                    : `linear-gradient(135deg, ${hexColor} 0%, ${hexColor}dd 100%)`,
              }}
            >
              {adding === currentSuggestion.product_id ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Adding...
                </span>
              ) : (
                <span>
                  Add {currentQuantity > 1 ? `${currentQuantity} ` : ""}to Cart
                </span>
              )}
            </button>
            <button
              onClick={() => handleDismiss(currentSuggestion.product_id)}
              className={`px-4 py-3 rounded-lg font-semibold text-sm transition-all border ${
                isDarkMode
                  ? "text-gray-300 hover:bg-gray-700 border-gray-600 hover:border-gray-500"
                  : "text-gray-600 hover:bg-gray-100 border-gray-200 hover:border-gray-300"
              }`}
            >
              Not now
            </button>
          </div>

          {/* Total Price Display */}
          {currentQuantity > 1 && (
            <div className="mt-3 text-center">
              <p
                className={`text-xs ${
                  isDarkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Total:{" "}
                <span className="font-bold" style={{ color: hexColor }}>
                  ${(currentSuggestion.price * currentQuantity).toFixed(2)}
                </span>
              </p>
            </div>
          )}
        </div>

        {/* Navigation */}
        {visibleSuggestions.length > 1 && (
          <div className="flex items-center justify-between mt-4 px-1">
            <button
              onClick={prevSlide}
              className={`p-1.5 rounded-full transition-colors disabled:opacity-30 ${
                isDarkMode ? "hover:bg-gray-700" : "hover:bg-white/50"
              }`}
              disabled={visibleSuggestions.length <= 1}
              aria-label="Previous suggestion"
            >
              <ChevronLeft
                className={
                  isDarkMode ? "w-5 h-5 text-gray-300" : "w-5 h-5 text-gray-600"
                }
              />
            </button>

            <div className="flex gap-1.5">
              {visibleSuggestions.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-2 rounded-full transition-all ${
                    idx === currentIndex
                      ? "w-8"
                      : `w-2 ${
                          isDarkMode
                            ? "bg-gray-600 hover:bg-gray-500"
                            : "bg-gray-300 hover:bg-gray-400"
                        }`
                  }`}
                  style={idx === currentIndex ? { background: hexColor } : {}}
                  aria-label={`Go to suggestion ${idx + 1}`}
                />
              ))}
            </div>

            <button
              onClick={nextSlide}
              className={`p-1.5 rounded-full transition-colors disabled:opacity-30 ${
                isDarkMode ? "hover:bg-gray-700" : "hover:bg-white/50"
              }`}
              disabled={visibleSuggestions.length <= 1}
              aria-label="Next suggestion"
            >
              <ChevronRight
                className={
                  isDarkMode ? "w-5 h-5 text-gray-300" : "w-5 h-5 text-gray-600"
                }
              />
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="mt-3 text-center">
          <p
            className={`text-xs ${
              isDarkMode ? "text-gray-400" : "text-gray-500"
            }`}
          >
            {visibleSuggestions.length > 1 ? (
              <span>
                {currentIndex + 1} of {visibleSuggestions.length} suggestions
              </span>
            ) : (
              <span>Powered by your purchase history</span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
