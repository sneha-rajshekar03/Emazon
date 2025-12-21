"use client";
import { Card } from "@/components/ui/card";
import { useState, useEffect } from "react";
import {
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowLeft,
  X,
  CheckCircle,
  CreditCard,
  Smartphone,
  Banknote,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { useColor } from "../context/ColorContext";
import { useCart } from "@/app/context/CartContent";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// Repeat suggestions imports
import { useRepeatSuggestions } from "@/app/hooks/useRepeatSuggestions";
import RepeatOrderSlider from "@/app/components/RepeatOrderSlider";

export default function CartPage() {
  const {
    cart,
    updateQuantity,
    removeFromCart,
    getCartTotal,
    checkout,
    isLoading,
    addToCart,
  } = useCart();
  const { data: session } = useSession();
  const router = useRouter();
  const { hexColor, isDarkMode } = useColor();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [modalContent, setModalContent] = useState({
    type: "",
    message: "",
    orderId: "",
    amount: 0,
  });
  const [selectedPayment, setSelectedPayment] = useState("");
  const [predictedPayment, setPredictedPayment] = useState(null);
  const [predictionConfidence, setPredictionConfidence] = useState(0);
  const [loadingPrediction, setLoadingPrediction] = useState(false);
  const [predictionError, setPredictionError] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Fetch repeat suggestions (API layer)
  const {
    suggestions: rawSuggestions,
    loading: suggestionsLoading,
    dismissSuggestion: apiDismiss,
  } = useRepeatSuggestions(cart);

  const subtotal = getCartTotal();
  const tax = subtotal * 0.1;
  const shipping = subtotal > 100 ? 0 : subtotal > 0 ? 10 : 0;
  const total = subtotal + tax + shipping;

  // DEBUG: Log cart items with image info
  useEffect(() => {
    console.log("=== CART ITEMS DEBUG ===");
    cart.forEach((item, idx) => {
      console.log(`Item ${idx + 1}:`, {
        product_id: item.product_id,
        title: item.title,
        imgUrl: item.imgUrl,
        hasImage: !!item.imgUrl,
      });
    });
    console.log("========================");
  }, [cart]);

  const getDeviceType = () => {
    const ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua))
      return "Tablet";
    if (
      /Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(
        ua
      )
    ) {
      return "Mobile";
    }
    return "Desktop";
  };

  const fetchPaymentPrediction = async () => {
    const userId = session?.user?.id;

    if (!userId) {
      console.error("No user ID available");
      setPredictedPayment("upi");
      setSelectedPayment("upi");
      setPredictionConfidence(0.4);
      return;
    }

    if (total === 0) return;

    setLoadingPrediction(true);
    setPredictionError(null);

    try {
      const profileResponse = await fetch(`/api/user-profile/${userId}`);

      if (!profileResponse.ok) {
        throw new Error("Failed to fetch user profile");
      }

      const userProfile = await profileResponse.json();

      const now = new Date();
      const isWeekend = now.getDay() === 0 || now.getDay() === 6 ? 1 : 0;
      const hourOfDay = now.getHours();
      const deviceType = getDeviceType();

      const predictionPayload = {
        user_id: userProfile.user_id,
        age: userProfile.age,
        gender: userProfile.gender,
        occupation: userProfile.occupation,
        region: userProfile.region,
        device_type: deviceType,
        product_price: parseFloat(total.toFixed(2)),
        is_weekend: isWeekend,
        hour_of_day: hourOfDay,
        past_transactions: userProfile.past_transactions || 0,
        past_upi_ratio: userProfile.past_upi_ratio || 0,
        past_card_ratio: userProfile.past_card_ratio || 0,
        past_cod_ratio: userProfile.past_cod_ratio || 0,
        average_order_value: userProfile.average_order_value || total,
        last_payment_method: userProfile.last_payment_method || "upi",
        days_since_last_purchase: userProfile.days_since_last_purchase || 30,
      };

      const predictionResponse = await fetch("/api/predict-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(predictionPayload),
      });

      if (!predictionResponse.ok) {
        const errorData = await predictionResponse.json();
        throw new Error(errorData.error || "Prediction failed");
      }

      const prediction = await predictionResponse.json();

      setPredictedPayment(prediction.predicted_method);
      setPredictionConfidence(prediction.confidence);
      setSelectedPayment(prediction.predicted_method);
    } catch (error) {
      console.error("Payment prediction error:", error);
      setPredictionError(error.message);
      setPredictedPayment("upi");
      setSelectedPayment("upi");
      setPredictionConfidence(0.4);
    } finally {
      setLoadingPrediction(false);
    }
  };

  const handleCheckout = async () => {
    if (!session?.user?.id) {
      setModalContent({
        type: "error",
        message: "Please log in to checkout",
        orderId: "",
        amount: 0,
      });
      setShowModal(true);
      setTimeout(() => router.push("/login"), 2000);
      return;
    }

    if (cart.length === 0) return;
    await fetchPaymentPrediction();
    setShowPaymentModal(true);
  };

  const processCheckout = async () => {
    if (!selectedPayment) return;

    setShowPaymentModal(false);
    setIsCheckingOut(true);

    const finalTotal = total;

    try {
      const result = await checkout(selectedPayment);

      setModalContent({
        type: "success",
        message: "Order placed successfully!",
        orderId: result.purchase_id,
        amount: finalTotal,
      });
      setShowModal(true);

      setTimeout(() => {
        setShowModal(false);
        setSelectedPayment("");
        setPredictedPayment(null);
        setModalContent({
          type: "",
          message: "",
          orderId: "",
          amount: 0,
        });
        router.push("/purchase-history");
      }, 3000);
    } catch (error) {
      console.error("Checkout error:", error);
      setModalContent({
        type: "error",
        message: `Checkout failed: ${error.message}`,
        orderId: "",
        amount: 0,
      });
      setShowModal(true);
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleAddSuggestionToCart = async (productObject) => {
    console.log("[CartPage] Adding suggestion to cart:", productObject);

    try {
      if (
        !productObject.product_id ||
        !productObject.title ||
        productObject.price === undefined
      ) {
        console.error("[CartPage] Invalid product object:", productObject);
        throw new Error("Invalid product data");
      }

      await addToCart(productObject, 1);
      console.log("[CartPage] ✓ Added to cart successfully");
    } catch (error) {
      console.error("[CartPage] ❌ Error adding to cart:", error);
      throw error;
    }
  };

  const paymentMethods = [
    {
      id: "upi",
      name: "UPI",
      icon: Smartphone,
      description: "Pay using UPI apps",
    },
    {
      id: "card",
      name: "Credit/Debit Card",
      icon: CreditCard,
      description: "Visa, Mastercard, Amex",
    },
    {
      id: "cod",
      name: "Cash on Delivery",
      icon: Banknote,
      description: "Pay when you receive",
    },
  ];

  return (
    <div
      className="min-h-screen py-8"
      style={{ background: isDarkMode ? "#000000" : "#f8fafc" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link href="/">
          <button
            className="flex items-center gap-2 font-semibold mb-6 transition-colors hover:opacity-80"
            style={{ color: hexColor }}
          >
            <ArrowLeft className="w-5 h-5" />
            Continue Shopping
          </button>
        </Link>

        <div className="mb-8">
          <h1
            className={`text-3xl font-bold flex items-center gap-3 ${
              isDarkMode ? "text-gray-100" : "text-gray-900"
            }`}
          >
            <ShoppingBag className="w-8 h-8" style={{ color: hexColor }} />
            Shopping Cart
          </h1>
          <p
            className={`mt-2 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
          >
            {cart.length} items in your cart
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {cart.length === 0 ? (
              <div
                className="rounded-2xl p-12 text-center"
                style={{
                  background: isDarkMode
                    ? `linear-gradient(145deg, rgba(31,41,55,0.6) 0%, rgba(31,41,55,0.4) 50%, ${hexColor}15 100%)`
                    : `linear-gradient(145deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.4) 50%, ${hexColor}15 100%)`,
                  backdropFilter: "blur(15px) saturate(150%)",
                  WebkitBackdropFilter: "blur(15px) saturate(150%)",
                  border: isDarkMode
                    ? `1px solid ${hexColor}30`
                    : `1px solid ${hexColor}20`,
                  boxShadow: isDarkMode
                    ? `0 8px 30px rgba(0,0,0,0.5), inset 0 0 20px ${hexColor}10`
                    : `0 8px 30px rgba(0,0,0,0.08), inset 0 0 20px ${hexColor}10`,
                }}
              >
                <ShoppingBag
                  className="w-16 h-16 mx-auto mb-4 opacity-50"
                  style={{ color: hexColor }}
                />
                <h3
                  className={`text-xl font-semibold mb-2 ${
                    isDarkMode ? "text-gray-100" : "text-gray-900"
                  }`}
                >
                  Your cart is empty
                </h3>
                <p
                  className={`mb-6 ${
                    isDarkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  Start shopping to add items!
                </p>
                <Link href="/">
                  <button
                    className="inline-block px-6 py-3 rounded-lg transition-all hover:scale-105 hover:shadow-lg active:scale-95 font-semibold"
                    style={{
                      background: hexColor,
                      color: session ? "white" : "black", // 👈 guest = black text
                    }}
                  >
                    Browse Products
                  </button>
                </Link>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.product_id}
                  className="rounded-2xl p-4 sm:p-6 transition-all hover:shadow-lg"
                  style={{
                    background: isDarkMode
                      ? `linear-gradient(145deg, rgba(31,41,55,0.6) 0%, rgba(31,41,55,0.4) 50%, ${hexColor}10 100%)`
                      : `linear-gradient(145deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.4) 50%, ${hexColor}10 100%)`,
                    backdropFilter: "blur(15px) saturate(150%)",
                    WebkitBackdropFilter: "blur(15px) saturate(150%)",
                    border: isDarkMode
                      ? `1px solid ${hexColor}30`
                      : `1px solid ${hexColor}20`,
                    boxShadow: isDarkMode
                      ? `0 4px 20px rgba(0,0,0,0.4), inset 0 0 15px ${hexColor}08`
                      : `0 4px 20px rgba(0,0,0,0.06), inset 0 0 15px ${hexColor}08`,
                  }}
                >
                  <div className="flex gap-4">
                    <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex-shrink-0">
                      {item.imgUrl ? (
                        <>
                          <img
                            src={item.imgUrl}
                            alt={item.title}
                            className="w-full h-full object-cover rounded-xl"
                            onLoad={(e) => {
                              console.log("✅ Image loaded for:", item.title);
                              e.target.style.display = "block";
                              const placeholder = e.target.nextElementSibling;
                              if (placeholder)
                                placeholder.style.display = "none";
                            }}
                            onError={(e) => {
                              console.error("❌ Image failed:", item.imgUrl);
                              e.target.style.display = "none";
                              const placeholder = e.target.nextElementSibling;
                              if (placeholder)
                                placeholder.style.display = "flex";
                            }}
                          />
                          <div
                            className={`absolute inset-0 w-full h-full rounded-xl flex items-center justify-center ${
                              isDarkMode ? "bg-gray-800" : "bg-gray-200"
                            }`}
                            style={{ display: "none" }}
                          >
                            <ShoppingBag
                              className={`w-8 h-8 ${
                                isDarkMode ? "text-gray-600" : "text-gray-400"
                              }`}
                            />
                          </div>
                        </>
                      ) : (
                        <div
                          className={`w-full h-full rounded-xl flex items-center justify-center ${
                            isDarkMode ? "bg-gray-800" : "bg-gray-200"
                          }`}
                        >
                          <ShoppingBag
                            className={`w-8 h-8 ${
                              isDarkMode ? "text-gray-600" : "text-gray-400"
                            }`}
                          />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3
                            className={`text-lg font-semibold ${
                              isDarkMode ? "text-gray-100" : "text-gray-900"
                            }`}
                          >
                            {item.title}
                          </h3>
                          {item.category && (
                            <span
                              className={`text-sm ${
                                isDarkMode ? "text-gray-400" : "text-gray-500"
                              }`}
                            >
                              {item.category}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => removeFromCart(item.product_id)}
                          className={`p-2 rounded-lg transition-colors ml-2 ${
                            isDarkMode
                              ? "text-red-400 hover:text-red-300 hover:bg-red-900/30"
                              : "text-red-500 hover:text-red-700 hover:bg-red-50"
                          }`}
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>

                      <p
                        className={`text-2xl font-bold mb-4 ${
                          isDarkMode ? "text-gray-100" : "text-gray-900"
                        }`}
                      >
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() =>
                              updateQuantity(item.product_id, item.quantity - 1)
                            }
                            className="w-9 h-9 rounded-lg flex items-center justify-center font-semibold text-white hover:opacity-90 transition-all"
                            style={{ background: hexColor }}
                          >
                            <Minus className="w-4 h-4 text-white" />
                          </button>
                          <span
                            className={`w-12 text-center font-semibold text-lg ${
                              isDarkMode ? "text-gray-100" : "text-gray-900"
                            }`}
                          >
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(item.product_id, item.quantity + 1)
                            }
                            className="w-9 h-9 rounded-lg flex items-center justify-center font-semibold text-white hover:opacity-90 transition-all"
                            style={{ background: hexColor }}
                          >
                            <Plus className="w-4 h-4 text-white" />
                          </button>
                        </div>
                        <span
                          className={`text-sm ${
                            isDarkMode ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          ${(item.price ?? item.unit_price ?? 0).toFixed(2)}{" "}
                          each
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="lg:col-span-1">
            <div
              className="rounded-2xl p-6 sticky top-8"
              style={{
                background: isDarkMode
                  ? `linear-gradient(145deg, rgba(31,41,55,0.7) 0%, rgba(31,41,55,0.5) 100%)`
                  : `linear-gradient(145deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.5) 100%)`,
                backdropFilter: "blur(20px) saturate(180%)",
                WebkitBackdropFilter: "blur(20px) saturate(180%)",
                border: isDarkMode
                  ? `1px solid ${hexColor}30`
                  : `1px solid ${hexColor}20`,
                boxShadow: isDarkMode
                  ? `0 8px 30px rgba(0,0,0,0.5), inset 0 0 20px ${hexColor}10`
                  : `0 8px 30px rgba(0,0,0,0.1), inset 0 0 20px ${hexColor}10`,
              }}
            >
              <h2
                className={`text-xl font-bold mb-6 ${
                  isDarkMode ? "text-gray-100" : "text-gray-900"
                }`}
              >
                Order Summary
              </h2>

              <div className="space-y-3 mb-6">
                <div
                  className={`flex justify-between ${
                    isDarkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  <span>Subtotal</span>
                  <span className="font-semibold">${subtotal.toFixed(2)}</span>
                </div>
                <div
                  className={`flex justify-between ${
                    isDarkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  <span>Tax (10%)</span>
                  <span className="font-semibold">${tax.toFixed(2)}</span>
                </div>
                <div
                  className={`flex justify-between ${
                    isDarkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  <span>Shipping</span>
                  <span className="font-semibold">
                    {shipping === 0 ? "FREE" : `$${shipping.toFixed(2)}`}
                  </span>
                </div>
                {subtotal > 0 && subtotal < 100 && (
                  <p
                    className="text-sm p-3 rounded-lg"
                    style={{
                      background: `${hexColor}10`,
                      color: hexColor,
                    }}
                  >
                    Add ${(100 - subtotal).toFixed(2)} more for free shipping!
                  </p>
                )}
                <div
                  className="border-t pt-3 mt-3"
                  style={{ borderColor: `${hexColor}20` }}
                >
                  <div
                    className={`flex justify-between text-lg font-bold ${
                      isDarkMode ? "text-gray-100" : "text-gray-900"
                    }`}
                  >
                    <span>Total</span>
                    <span style={{ color: hexColor }}>${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={cart.length === 0 || isCheckingOut}
                className={`w-full py-4 rounded-xl font-semibold flex items-center justify-center transition-all mb-3 ${
                  cart.length === 0 || isCheckingOut
                    ? isDarkMode
                      ? "bg-gray-800 text-gray-600 cursor-not-allowed"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "text-white hover:opacity-90"
                }`}
                style={
                  cart.length === 0 || isCheckingOut
                    ? {}
                    : { background: hexColor }
                }
              >
                {isCheckingOut ? "Processing..." : "Proceed to Checkout"}
              </button>

              <Link href="/">
                <button
                  className="block w-full text-center font-semibold py-3 rounded-xl transition-colors"
                  style={{
                    color: hexColor,
                    background: `${hexColor}10`,
                  }}
                >
                  Continue Shopping
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {!suggestionsLoading && rawSuggestions && rawSuggestions.length > 0 && (
        <RepeatOrderSlider
          suggestions={rawSuggestions}
          onAddToCart={handleAddSuggestionToCart}
          onDismiss={apiDismiss}
        />
      )}

      {showPaymentModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{
            backgroundColor: isDarkMode
              ? "rgba(0, 0, 0, 0.7)"
              : "rgba(59, 130, 246, 0.25)",
            backdropFilter: "blur(12px) saturate(150%)",
            WebkitBackdropFilter: "blur(12px) saturate(150%)",
          }}
        >
          <div
            className="rounded-2xl shadow-2xl max-w-md w-full p-6 relative"
            style={{
              background: isDarkMode
                ? "rgba(31, 41, 55, 0.98)"
                : "rgba(255, 255, 255, 0.98)",
              backdropFilter: "blur(20px) saturate(180%)",
              WebkitBackdropFilter: "blur(20px) saturate(180%)",
            }}
          >
            <button
              onClick={() => setShowPaymentModal(false)}
              className={`absolute top-4 right-4 transition-colors ${
                isDarkMode
                  ? "text-gray-500 hover:text-gray-300"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <X className="w-6 h-6" />
            </button>

            <h3
              className={`text-2xl font-bold mb-2 ${
                isDarkMode ? "text-gray-100" : "text-gray-900"
              }`}
            >
              Select Payment Method
            </h3>

            {loadingPrediction ? (
              <div className="py-8 text-center">
                <div
                  className="animate-spin rounded-full h-10 w-10 border-4 border-t-transparent mx-auto mb-3"
                  style={{
                    borderColor: `${hexColor}30`,
                    borderTopColor: hexColor,
                  }}
                />
                <p
                  className={`text-sm ${
                    isDarkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  Analyzing your preferences...
                </p>
              </div>
            ) : (
              <>
                {predictionError && (
                  <div
                    className="mb-4 p-3 rounded-lg flex items-center gap-2"
                    style={{
                      background: "rgba(251, 191, 36, 0.1)",
                      border: "1px solid rgba(251, 191, 36, 0.3)",
                    }}
                  >
                    <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                    <p className="text-sm text-yellow-800">
                      Using default prediction (API unavailable)
                    </p>
                  </div>
                )}

                {predictedPayment && (
                  <div
                    className="mb-4 p-3 rounded-lg flex items-center gap-2"
                    style={{
                      background: `${hexColor}15`,
                      border: `1px solid ${hexColor}30`,
                    }}
                  >
                    <Sparkles
                      className="w-4 h-4 flex-shrink-0"
                      style={{ color: hexColor }}
                    />
                    <p
                      className={`text-sm ${
                        isDarkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      <span className="font-semibold">AI Recommended:</span>{" "}
                      {predictedPayment.toUpperCase()} (
                      {(predictionConfidence * 100).toFixed(0)}% confidence)
                    </p>
                  </div>
                )}

                <p
                  className={`mb-6 ${
                    isDarkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  {predictedPayment
                    ? "We've pre-selected your preferred method"
                    : "Choose how you would like to pay"}
                </p>

                <div className="space-y-3 mb-6">
                  {paymentMethods.map((method) => {
                    const Icon = method.icon;
                    const isRecommended = predictedPayment === method.id;
                    return (
                      <button
                        key={method.id}
                        onClick={() => setSelectedPayment(method.id)}
                        className="w-full p-4 rounded-xl border-2 transition-all text-left relative"
                        style={{
                          borderColor:
                            selectedPayment === method.id
                              ? hexColor
                              : `${hexColor}20`,
                          background:
                            selectedPayment === method.id
                              ? `${hexColor}10`
                              : "transparent",
                        }}
                      >
                        {isRecommended && (
                          <div
                            className="absolute -top-2 -right-2 px-2 py-1 rounded-full text-xs font-semibold text-white flex items-center gap-1"
                            style={{ background: hexColor }}
                          >
                            <Sparkles className="w-3 h-3" />
                            AI Pick
                          </div>
                        )}
                        <div className="flex items-center gap-3">
                          <div
                            className="p-2 rounded-lg"
                            style={{
                              background:
                                selectedPayment === method.id
                                  ? hexColor
                                  : `${hexColor}15`,
                              color:
                                selectedPayment === method.id
                                  ? "white"
                                  : hexColor,
                            }}
                          >
                            <Icon className="w-6 h-6" />
                          </div>
                          <div className="flex-1">
                            <div
                              className={`font-semibold ${
                                isDarkMode ? "text-gray-100" : "text-gray-900"
                              }`}
                            >
                              {method.name}
                            </div>
                            <div
                              className={`text-sm ${
                                isDarkMode ? "text-gray-400" : "text-gray-500"
                              }`}
                            >
                              {method.description}
                            </div>
                          </div>
                          {selectedPayment === method.id && (
                            <CheckCircle
                              className="w-6 h-6"
                              style={{ color: hexColor }}
                            />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={processCheckout}
                  disabled={!selectedPayment}
                  className={`w-full py-4 rounded-xl font-semibold flex items-center justify-center transition-all ${
                    !selectedPayment
                      ? isDarkMode
                        ? "bg-gray-800 text-gray-600 cursor-not-allowed"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "text-white hover:opacity-90"
                  }`}
                  style={!selectedPayment ? {} : { background: hexColor }}
                >
                  Confirm Payment
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {showModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            backgroundColor: isDarkMode
              ? "rgba(0, 0, 0, 0.7)"
              : `${hexColor}40`,
          }}
        >
          <Card
            className={`rounded-3xl max-w-md w-full p-8 relative backdrop-blur-xl border transition-all duration-500 ${
              isDarkMode
                ? "bg-gray-900/70 shadow-[0_8px_30px_rgba(0,0,0,0.3)] border-gray-800/50"
                : "bg-white/70 shadow-[0_8px_30px_rgba(0,0,0,0.05)] border-gray-100/50"
            }`}
          >
            <button
              onClick={() => setShowModal(false)}
              className={`absolute top-4 right-4 transition-colors ${
                isDarkMode
                  ? "text-gray-500 hover:text-gray-300"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <X className="w-6 h-6" />
            </button>

            <div className="text-center">
              {modalContent.type === "success" ? (
                <>
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                    style={{ background: `${hexColor}15` }}
                  >
                    <CheckCircle
                      className="w-10 h-10"
                      style={{ color: hexColor }}
                    />
                  </div>
                  <h3
                    className={`text-2xl font-bold mb-2 ${
                      isDarkMode ? "text-gray-100" : "text-gray-900"
                    }`}
                  >
                    {modalContent.message}
                  </h3>
                  <div
                    className="rounded-lg p-4 mb-4"
                    style={{ background: `${hexColor}08` }}
                  >
                    <p
                      className={`text-sm mb-1 ${
                        isDarkMode ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      Order ID
                    </p>
                    <p
                      className={`text-lg font-mono font-semibold ${
                        isDarkMode ? "text-gray-100" : "text-gray-900"
                      }`}
                    >
                      {modalContent.orderId}
                    </p>
                    <p
                      className={`text-sm mt-3 mb-1 ${
                        isDarkMode ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      Total Amount
                    </p>
                    <p
                      className="text-2xl font-bold"
                      style={{ color: hexColor }}
                    >
                      ${modalContent.amount.toFixed(2)}
                    </p>
                  </div>
                  <p
                    className={`text-sm ${
                      isDarkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    Redirecting to purchase history...
                  </p>
                </>
              ) : (
                <>
                  <div
                    className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                      isDarkMode ? "bg-red-900/30" : "bg-red-100"
                    }`}
                  >
                    <X
                      className={`w-10 h-10 ${
                        isDarkMode ? "text-red-400" : "text-red-600"
                      }`}
                    />
                  </div>
                  <h3
                    className={`text-2xl font-bold mb-2 ${
                      isDarkMode ? "text-gray-100" : "text-gray-900"
                    }`}
                  >
                    Oops!
                  </h3>
                  <p
                    className={`mb-6 ${
                      isDarkMode ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {modalContent.message}
                  </p>
                  <button
                    onClick={() => setShowModal(false)}
                    className={`w-full py-3 rounded-xl font-semibold transition-colors ${
                      isDarkMode
                        ? "bg-gray-700 text-white hover:bg-gray-600"
                        : "bg-gray-900 text-white hover:bg-gray-800"
                    }`}
                  >
                    Close
                  </button>
                </>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
