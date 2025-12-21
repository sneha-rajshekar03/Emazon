"use client";
import { useState, useEffect } from "react";
import { useCart } from "@/app/context/CartContent";
import { useColor } from "@/app/context/ColorContext";
import { useSession } from "next-auth/react";
import {
  ShoppingCart,
  Check,
  Zap,
  X,
  CheckCircle,
  CreditCard,
  Smartphone,
  Banknote,
  Sparkles,
  AlertCircle,
  AlertTriangle,
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";

export function BuyBox({ product, ...props }) {
  const { addToCart } = useCart();
  const { hexColor, isDarkMode } = useColor();
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [quantity, setQuantity] = useState(1);
  const [mostFrequentQuantity, setMostFrequentQuantity] = useState(null);
  const [userChangedQuantity, setUserChangedQuantity] = useState(false);
  const [added, setAdded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [predictedPayment, setPredictedPayment] = useState(null);
  const [predictionConfidence, setPredictionConfidence] = useState(0);
  const [loadingPrediction, setLoadingPrediction] = useState(false);
  const [predictionError, setPredictionError] = useState(null);

  const [modalContent, setModalContent] = useState({
    type: "",
    message: "",
    orderId: "",
    amount: 0,
  });

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

  // ✅ FIXED: Use product_id instead of _id
  useEffect(() => {
    console.log("[BuyBox] useEffect triggered");
    console.log("[BuyBox] Session user ID:", session?.user?.id);
    console.log("[BuyBox] Product ID:", product?.product_id);

    if (!session?.user?.id || !product?.product_id) {
      console.log("[BuyBox] Missing session or product_id, skipping fetch");
      return;
    }

    const fetchMostFrequentQuantity = async () => {
      try {
        // ✅ USE product_id, NOT _id
        const productId = product.product_id;

        console.log("[BuyBox] Using product_id:", productId);

        const url = `/api/purchase-history?userId=${session.user.id}&productId=${productId}`;
        console.log("[BuyBox] Fetching from URL:", url);

        const res = await fetch(url);
        console.log("[BuyBox] Response status:", res.status);

        const data = await res.json();
        console.log("[BuyBox] Response data:", data);

        if (data.mostFrequentQuantity && data.mostFrequentQuantity > 0) {
          console.log(
            "[BuyBox] Setting quantity to:",
            data.mostFrequentQuantity
          );
          setQuantity(data.mostFrequentQuantity);
          setMostFrequentQuantity(data.mostFrequentQuantity);
          console.log("[BuyBox] State updated successfully");
        } else {
          console.log(
            "[BuyBox] No valid mostFrequentQuantity found, using default quantity = 1"
          );
        }
      } catch (error) {
        console.error("[BuyBox] Error fetching most frequent quantity:", error);
        console.error("[BuyBox] Error details:", error.message, error.stack);
      }
    };

    fetchMostFrequentQuantity();
  }, [session?.user?.id, product?.product_id]); // ✅ Updated dependency

  const handleAddToCart = () => {
    if (!session) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }
    addToCart(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleBuyNow = async (e) => {
    if (!session) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }
    await fetchPaymentPrediction();
    setShowPaymentModal(true);
  };

  const fetchPaymentPrediction = async () => {
    const userId = session?.user?.id;

    if (!userId) {
      console.error("[BuyBox] No user ID available");
      setPredictedPayment("upi");
      setSelectedPayment("upi");
      setPredictionConfidence(0.4);
      return;
    }

    const totalAmount = product.price * quantity;

    setLoadingPrediction(true);
    setPredictionError(null);

    try {
      console.log("[BuyBox] Fetching user profile for:", userId);
      const profileResponse = await fetch(`/api/user-profile/${userId}`);

      if (!profileResponse.ok) {
        throw new Error("Failed to fetch user profile");
      }

      const userProfile = await profileResponse.json();
      console.log("[BuyBox] User profile fetched:", userProfile);

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
        product_price: parseFloat(totalAmount.toFixed(2)),
        is_weekend: isWeekend,
        hour_of_day: hourOfDay,
        past_transactions: userProfile.past_transactions || 0,
        past_upi_ratio: userProfile.past_upi_ratio || 0,
        past_card_ratio: userProfile.past_card_ratio || 0,
        past_cod_ratio: userProfile.past_cod_ratio || 0,
        average_order_value: userProfile.average_order_value || totalAmount,
        last_payment_method: userProfile.last_payment_method || "upi",
        days_since_last_purchase: userProfile.days_since_last_purchase || 30,
      };

      console.log("[BuyBox] Sending prediction payload:", predictionPayload);

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
      console.log("[BuyBox] Prediction result:", prediction);

      setPredictedPayment(prediction.predicted_method || "upi");
      setPredictionConfidence(prediction.confidence || 0.5);
      setSelectedPayment(prediction.predicted_method || "upi");
    } catch (err) {
      console.error("[BuyBox] Payment prediction error:", err);
      setPredictionError(err.message);
      setPredictedPayment("upi");
      setSelectedPayment("upi");
      setPredictionConfidence(0.4);
    } finally {
      setLoadingPrediction(false);
    }
  };

  const processCheckout = async () => {
    if (!selectedPayment) {
      setModalContent({
        type: "error",
        message: "Please select a payment method",
        orderId: "",
        amount: 0,
      });
      setShowModal(true);
      return;
    }

    setShowPaymentModal(false);
    setIsProcessing(true);

    try {
      const transactionId = `TXN${Date.now()}`;
      // ✅ FIXED: Use product_id directly
      const productId = product.product_id;
      const totalAmount = product.price * quantity;
      const deviceType = getDeviceType();

      console.log("[BuyBox] Processing checkout with:");
      console.log("  - product_id:", productId);
      console.log("  - device_type:", deviceType);

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transaction_id: transactionId,
          payment_method: selectedPayment,
          device_type: deviceType,
          items: [
            {
              product_id: productId, // ✅ Now using correct product_id
              quantity: quantity,
              unit_price: product.price,
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Checkout failed");
      }

      const result = await response.json();
      console.log("[BuyBox] Checkout successful:", result);

      setModalContent({
        type: "success",
        message: "Order placed successfully!",
        orderId: result.purchase_id || result.transaction_id,
        amount: result.total_amount || totalAmount,
      });
      setShowModal(true);

      setTimeout(() => {
        setShowModal(false);
        router.push("/purchase-history");
      }, 3000);
    } catch (error) {
      console.error("[BuyBox] Checkout error:", error);
      setModalContent({
        type: "error",
        message: `Checkout failed: ${error.message}`,
        orderId: "",
        amount: 0,
      });
      setShowModal(true);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <div
        data-buybox
        {...props}
        className="relative p-6 rounded-3xl border transition-all duration-500"
        style={{
          background: isDarkMode
            ? "rgba(45, 45, 45, 0.6)"
            : "rgba(255, 255, 255, 0.6)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: isDarkMode
            ? "1.5px solid rgba(255, 255, 255, 0.25)"
            : "1.5px solid rgba(0, 0, 0, 0.15)",
          borderRadius: "28px",
          boxShadow: isDarkMode
            ? `0 4px 20px rgba(0, 0, 0, 0.3)`
            : `0 4px 20px rgba(0, 0, 0, 0.05)`,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            bottom: "-10%",
            right: "-10%",
            width: "40%",
            height: "40%",
            background: `radial-gradient(circle at bottom right, ${hexColor}44 0%, transparent 70%)`,
            filter: "blur(20px)",
            pointerEvents: "none",
          }}
        />

        <div className="relative z-10">
          <div className="mb-6">
            <span
              className="text-4xl font-bold"
              style={{
                color: hexColor,
                textShadow: `0 0 12px ${hexColor}33`,
              }}
            >
              ${product.price?.toFixed(2)}
            </span>
          </div>

          <label
            className="block text-sm font-semibold mb-3"
            style={{ color: isDarkMode ? `${hexColor}cc` : hexColor }}
          >
            Quantity
          </label>
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={() => {
                setQuantity(Math.max(1, quantity - 1));
                setUserChangedQuantity(true);
              }}
              className="w-11 h-11 rounded-xl text-white font-semibold text-xl"
              style={{
                background: `linear-gradient(135deg, ${hexColor} 0%, ${hexColor}dd 100%)`,
              }}
            >
              -
            </button>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => {
                setQuantity(Math.max(1, parseInt(e.target.value) || 1));
                setUserChangedQuantity(true);
              }}
              className={`w-20 text-center text-lg font-semibold border-2 rounded-xl py-2.5 ${
                isDarkMode
                  ? "text-gray-100 bg-gray-800/50"
                  : "text-gray-900 bg-white"
              }`}
              style={{ borderColor: `${hexColor}30` }}
            />
            <button
              onClick={() => {
                setQuantity(quantity + 1);
                setUserChangedQuantity(true);
              }}
              className="w-11 h-11 rounded-xl text-white font-semibold text-xl"
              style={{
                background: `linear-gradient(135deg, ${hexColor} 0%, ${hexColor}dd 100%)`,
              }}
            >
              +
            </button>
          </div>

          {!userChangedQuantity &&
            mostFrequentQuantity &&
            mostFrequentQuantity > 1 && (
              <div
                className="mb-4 p-3 rounded-xl flex items-start gap-2.5 animate-in fade-in slide-in-from-top-2 duration-300"
                style={{
                  background: isDarkMode ? `${hexColor}15` : `${hexColor}08`,
                  border: isDarkMode
                    ? `1px solid ${hexColor}30`
                    : `1px solid ${hexColor}20`,
                }}
              >
                <Sparkles
                  className="w-4 h-4 flex-shrink-0 mt-0.5"
                  style={{ color: hexColor }}
                />
                <p
                  className={`text-sm ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  <span className="font-semibold">Smart suggestion:</span> You
                  usually order {mostFrequentQuantity} of this item.
                </p>
              </div>
            )}

          {quantity > 1 && (
            <div
              className="mb-6 p-3 rounded-xl flex items-start gap-2.5 animate-in fade-in slide-in-from-top-2 duration-300"
              style={{
                background: isDarkMode
                  ? "rgba(251, 191, 36, 0.12)"
                  : "rgba(251, 191, 36, 0.08)",
                border: isDarkMode
                  ? "1px solid rgba(251, 191, 36, 0.25)"
                  : "1px solid rgba(251, 191, 36, 0.2)",
              }}
            >
              <AlertTriangle
                className="w-5 h-5 flex-shrink-0 mt-0.5"
                style={{ color: "#f59e0b" }}
              />
              <div>
                <p
                  className={`text-sm font-semibold mb-1 ${
                    isDarkMode ? "text-yellow-400" : "text-yellow-700"
                  }`}
                >
                  Multiple Items Selected
                </p>
                <p
                  className={`text-xs ${
                    isDarkMode ? "text-yellow-200/80" : "text-yellow-800/80"
                  }`}
                >
                  You're ordering {quantity} units. Total: $
                  {(product.price * quantity).toFixed(2)}
                </p>
              </div>
            </div>
          )}

          <button
            onClick={handleAddToCart}
            disabled={isProcessing}
            className="w-full py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2"
            style={{
              background: added
                ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
                : `linear-gradient(135deg, ${hexColor} 0%, ${hexColor}f0 100%)`,
              color: "white",
              boxShadow: added
                ? "0 4px 15px rgba(16, 185, 129, 0.3)"
                : `0 4px 15px ${hexColor}30`,
            }}
          >
            {added ? (
              <>
                <Check className="w-5 h-5" />
                Added to Cart!
              </>
            ) : (
              <>
                <ShoppingCart className="w-5 h-5" />
                {!session ? "Login to Add to Cart" : "Add to Cart"}
              </>
            )}
          </button>

          <button
            onClick={handleBuyNow}
            disabled={isProcessing}
            className="w-full mt-3 py-3.5 rounded-xl font-semibold text-white flex items-center justify-center gap-2"
            style={{
              background: `linear-gradient(135deg, ${hexColor}ee 0%, ${hexColor}99 100%)`,
              boxShadow: `0 4px 20px ${hexColor}44`,
              border: isDarkMode
                ? `1px solid rgba(255,255,255,0.15)`
                : `1px solid rgba(0,0,0,0.1)`,
            }}
          >
            <Zap className="w-5 h-5" />
            {session ? "Buy Now" : "Login to Buy Now"}
          </button>
        </div>
      </div>

      {showPaymentModal && (
        <div
          className="fixed inset-0 flex items-start justify-center z-50 p-4 pt-16 overflow-y-auto"
          style={{
            backgroundColor: isDarkMode
              ? "rgba(0, 0, 0, 0.7)"
              : `${hexColor}40`,
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
          <div
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
          </div>
        </div>
      )}
    </>
  );
}
