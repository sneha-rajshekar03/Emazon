"use client";
import { useState, useEffect } from "react";
import { useCart } from "@app/context/CartContent";
import { useColor } from "@app/context/ColorContext";
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
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { Card } from "@/components/ui/card";

export function BuyBox({ product, ...props }) {
  const { addToCart } = useCart();
  const { hexColor, isDarkMode } = useColor();
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [quantity, setQuantity] = useState(1);
  const [mostFrequentQuantity, setMostFrequentQuantity] = useState(null);
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
  const [buyBoxPosition, setBuyBoxPosition] = useState({ top: 0, left: 0 });

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

  // ✅ FIXED: Fetch most frequent quantity on mount
  useEffect(() => {
    if (!session?.user?.id || !product?.product_id) {
      console.log("[BuyBox] Missing session or product_id:", {
        userId: session?.user?.id,
        product_id: product?.product_id,
        _id: product?._id,
      });
      return;
    }

    const fetchMostFrequentQuantity = async () => {
      const userId = session.user.id;
      const productId = product.product_id;
      const url = `/api/purchase-history?userId=${userId}&productId=${productId}`;

      console.log("[BuyBox] Fetching most frequent quantity...");
      console.log("[BuyBox] Fetch URL:", url);

      try {
        const res = await fetch(url);
        const data = await res.json();

        console.log("[BuyBox] API Response:", data);

        // ✅ FIXED: Check for mostFrequentQuantity field
        if (data.mostFrequentQuantity && data.mostFrequentQuantity > 0) {
          setQuantity(data.mostFrequentQuantity);
          setMostFrequentQuantity(data.mostFrequentQuantity);
          console.log(
            `[BuyBox] Quantity set to most frequent:`,
            data.mostFrequentQuantity
          );
        } else {
          console.log("[BuyBox] No previous quantity found, keeping default 1");
        }
      } catch (error) {
        console.error("[BuyBox] Error fetching most frequent quantity:", error);
      }
    };

    fetchMostFrequentQuantity();
  }, [session?.user?.id, product?.product_id]);

  const fetchPaymentPrediction = async () => {
    if (!session?.user?.id) {
      console.log("[BuyBox] No session, using default payment method");
      setPredictedPayment("upi");
      setSelectedPayment("upi");
      setPredictionConfidence(0.5);
      return;
    }

    setLoadingPrediction(true);
    setPredictionError(null);

    try {
      console.log("[BuyBox] Fetching user profile...");
      const profileRes = await fetch(`/api/user-profile/${session.user.id}`);

      if (!profileRes.ok) {
        console.warn("[BuyBox] User profile fetch failed, using fallback");
        throw new Error("Failed to fetch user profile");
      }

      const userProfile = await profileRes.json();
      console.log("[BuyBox] User profile received:", userProfile);

      const now = new Date();
      const hourOfDay = now.getHours();
      const isWeekend = now.getDay() === 0 || now.getDay() === 6 ? 1 : 0;
      const deviceType = /Mobi|Android/i.test(navigator.userAgent)
        ? "Mobile"
        : "Desktop";

      const payload = {
        user_id: userProfile.user_id,
        age: userProfile.age,
        gender: userProfile.gender,
        occupation: userProfile.occupation,
        region: userProfile.region,
        device_type: deviceType,
        product_price: parseFloat(product.price?.toFixed(2)),
        is_weekend: isWeekend,
        hour_of_day: hourOfDay,
        past_transactions: userProfile.past_transactions || 0,
        past_upi_ratio: userProfile.past_upi_ratio || 0,
        past_card_ratio: userProfile.past_card_ratio || 0,
        past_cod_ratio: userProfile.past_cod_ratio || 0,
        average_order_value: userProfile.average_order_value || product.price,
        last_payment_method: userProfile.last_payment_method || "upi",
        days_since_last_purchase: userProfile.days_since_last_purchase || 30,
      };

      console.log("[BuyBox] Prediction payload:", payload);

      const predictionRes = await fetch("/api/predict-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!predictionRes.ok) {
        const errorData = await predictionRes.json();
        console.warn("[BuyBox] Prediction API failed:", errorData);
        throw new Error(errorData.error || "Prediction failed");
      }

      const prediction = await predictionRes.json();
      console.log("[BuyBox] Prediction result:", prediction);

      setPredictedPayment(prediction.predicted_method);
      setPredictionConfidence(prediction.confidence);
      setSelectedPayment(prediction.predicted_method);
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

  const handleAddToCart = () => {
    if (!session) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    console.log("[BuyBox] Adding to cart:", {
      productId: product._id,
      productName: product.name,
      quantity,
      price: product.price,
    });

    addToCart(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleBuyNow = async (e) => {
    if (!session) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    console.log("[BuyBox] Buy Now clicked - will checkout ONLY this product");
    console.log("[BuyBox] Product:", {
      id: product._id,
      name: product.name,
      price: product.price,
      quantity,
    });

    const buyBoxElement = e.currentTarget.closest("[data-buybox]");
    if (buyBoxElement) {
      const rect = buyBoxElement.getBoundingClientRect();
      setBuyBoxPosition({
        top: rect.top + window.scrollY - 20,
        left: rect.left + window.scrollX,
      });
    }

    await fetchPaymentPrediction();
    setShowPaymentModal(true);
  };

  const processCheckout = async () => {
    if (!selectedPayment) {
      console.log("[BuyBox] No payment method selected");
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
      console.log("[BuyBox] Starting checkout for single product");
      console.log("[BuyBox] Payment method:", selectedPayment);

      const transactionId = `TXN${Date.now()}${Math.random()
        .toString(36)
        .substr(2, 9)
        .toUpperCase()}`;

      const deviceType = /Mobi|Android/i.test(navigator.userAgent)
        ? "Mobile"
        : "Desktop";

      const productId =
        product._id || product.id || product.productId || product.product_id;

      if (!productId) {
        console.error("[BuyBox] Product object:", product);
        throw new Error("Product ID not found");
      }

      console.log("[BuyBox] Product ID extracted:", productId);

      const items = [
        {
          product_id: productId,
          quantity: quantity,
          unit_price: product.price,
        },
      ];

      const totalAmount = product.price * quantity;

      console.log("[BuyBox] Checkout payload:", {
        transaction_id: transactionId,
        payment_method: selectedPayment,
        device_type: deviceType,
        items: items,
        total_amount: totalAmount,
      });

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transaction_id: transactionId,
          payment_method: selectedPayment,
          device_type: deviceType,
          items: items,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("[BuyBox] Checkout failed:", errorData);
        throw new Error(
          errorData.details || errorData.error || "Checkout failed"
        );
      }

      const result = await response.json();
      console.log("[BuyBox] Checkout successful:", result);

      setModalContent({
        type: "success",
        message: "Order placed successfully!",
        orderId: result.purchase_id || result.transaction_id || result._id,
        amount: result.total_amount,
      });
      setShowModal(true);
      setSelectedPayment("");

      setTimeout(() => {
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
      <Card
        data-buybox
        {...props}
        className={`
          p-6 rounded-3xl 
          backdrop-blur-xl 
          border 
          transition-all duration-500
          ${
            isDarkMode
              ? "bg-gray-900/70 shadow-[0_8px_30px_rgba(0,0,0,0.3)] border-gray-800/50 hover:shadow-[0_12px_40px_rgba(0,0,0,0.5)]"
              : "bg-white/70 shadow-[0_8px_30px_rgba(0,0,0,0.05)] border-gray-100/50 hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)]"
          }
        `}
      >
        <div className="mb-6">
          <span
            className={`text-4xl font-bold ${
              isDarkMode ? "text-gray-100" : "text-gray-900"
            }`}
          >
            ${product.price?.toFixed(2)}
          </span>
        </div>

        {/* Smart Quantity Message */}
        {mostFrequentQuantity && mostFrequentQuantity > 1 && (
          <div
            className="mb-4 p-3 rounded-xl flex items-start gap-2 animate-fadeIn"
            style={{
              background: `${hexColor}10`,
              border: `1px solid ${hexColor}30`,
            }}
          >
            <Zap
              className="w-5 h-5 flex-shrink-0 mt-0.5"
              style={{ color: hexColor }}
            />
            <div>
              <p
                className={`text-sm font-semibold ${
                  isDarkMode ? "text-gray-200" : "text-gray-800"
                }`}
              >
                Heads up!
              </p>
              <p
                className={`text-sm ${
                  isDarkMode ? "text-gray-300" : "text-gray-700"
                }`}
              >
                You usually order{" "}
                <span className="font-bold">{mostFrequentQuantity}</span> of
                this item.
              </p>
            </div>
          </div>
        )}

        <div className="mb-6">
          <label
            className={`block text-sm font-semibold mb-3 ${
              isDarkMode ? "text-gray-300" : "text-gray-700"
            }`}
          >
            Quantity
          </label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-11 h-11 rounded-xl flex items-center justify-center transition-all hover:opacity-90 active:scale-95 text-white font-semibold text-xl"
              style={{
                background: `linear-gradient(135deg, ${hexColor} 0%, ${hexColor}f0 100%)`,
              }}
            >
              -
            </button>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) =>
                setQuantity(Math.max(1, parseInt(e.target.value) || 1))
              }
              className={`w-20 text-center text-lg font-semibold border-2 rounded-xl py-2.5 focus:outline-none transition-all ${
                isDarkMode
                  ? "text-gray-100 bg-gray-800/50"
                  : "text-gray-900 bg-white"
              }`}
              style={{
                borderColor: `${hexColor}30`,
              }}
              onFocus={(e) => {
                e.target.style.borderColor = hexColor;
                e.target.style.boxShadow = `0 0 0 3px ${hexColor}20`;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = `${hexColor}30`;
                e.target.style.boxShadow = "none";
              }}
            />
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="w-11 h-11 rounded-xl flex items-center justify-center transition-all hover:opacity-90 active:scale-95 text-white font-semibold text-xl"
              style={{
                background: `linear-gradient(135deg, ${hexColor} 0%, ${hexColor}f0 100%)`,
              }}
            >
              +
            </button>
          </div>
        </div>

        <button
          onClick={handleAddToCart}
          disabled={isProcessing}
          className={`w-full py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
            added ? "" : "hover:opacity-90"
          }`}
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
          className="w-full mt-3 py-3.5 rounded-xl font-semibold text-white transition-all hover:opacity-90 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
            boxShadow: "0 4px 15px rgba(249, 115, 22, 0.3)",
          }}
        >
          {isProcessing ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Processing...
            </>
          ) : (
            <>
              <Zap className="w-5 h-5" />
              {!session ? "Login to Buy Now" : "Buy Now"}
            </>
          )}
        </button>

        {session && (
          <p
            className={`text-xs text-center mt-4 ${
              isDarkMode ? "text-gray-400" : "text-gray-500"
            }`}
          >
            Buy Now will checkout only this product
          </p>
        )}
      </Card>

      {/* Payment Method Modal */}
      {showPaymentModal && (
        <div
          className="fixed inset-0 p-4 flex items-center justify-center"
          style={{
            zIndex: 9999,
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            backgroundColor: isDarkMode
              ? "rgba(0, 0, 0, 0.7)"
              : `${hexColor}40`,
          }}
        >
          <Card
            className={`
              rounded-3xl max-w-md w-full p-6 relative
              backdrop-blur-xl 
              border 
              transition-all duration-500
              ${
                isDarkMode
                  ? "bg-gray-900/70 shadow-[0_8px_30px_rgba(0,0,0,0.3)] border-gray-800/50"
                  : "bg-white/70 shadow-[0_8px_30px_rgba(0,0,0,0.05)] border-gray-100/50"
              }
            `}
          >
            <button
              onClick={() => {
                setShowPaymentModal(false);
                setSelectedPayment("");
              }}
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
            <p
              className={`mb-6 ${
                isDarkMode ? "text-gray-400" : "text-gray-600"
              }`}
            >
              Choose how you'd like to pay
            </p>

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
                      background: "rgba(251,191,36,0.1)",
                      border: "1px solid rgba(251,191,36,0.3)",
                    }}
                  >
                    <X className="w-4 h-4 text-yellow-600" />
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
                    <Zap className="w-4 h-4" style={{ color: hexColor }} />
                    <p
                      className={`text-sm ${
                        isDarkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      AI Recommended: {predictedPayment.toUpperCase()} (
                      {(predictionConfidence * 100).toFixed(0)}% confidence)
                    </p>
                  </div>
                )}

                <div className="space-y-3 mb-6">
                  {paymentMethods.map((method) => {
                    const Icon = method.icon;
                    return (
                      <button
                        key={method.id}
                        onClick={() => setSelectedPayment(method.id)}
                        className="w-full p-4 rounded-xl border-2 transition-all text-left"
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
                  className="w-full text-white py-4 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
                  style={{
                    background: `linear-gradient(135deg, ${hexColor} 0%, ${hexColor}f5 100%)`,
                    boxShadow: `0 4px 15px ${hexColor}30`,
                  }}
                >
                  Confirm Payment
                </button>
              </>
            )}
          </Card>
        </div>
      )}

      {/* Success/Error Modal */}
      {showModal && (
        <div
          className="fixed inset-0 p-4 flex items-center justify-center"
          style={{
            zIndex: 9999,
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            backgroundColor: isDarkMode
              ? "rgba(0, 0, 0, 0.7)"
              : `${hexColor}40`,
          }}
        >
          <Card
            className={`
              rounded-3xl max-w-md w-full p-8 relative
              backdrop-blur-xl 
              border 
              transition-all duration-500
              ${
                isDarkMode
                  ? "bg-gray-900/70 shadow-[0_8px_30px_rgba(0,0,0,0.3)] border-gray-800/50"
                  : "bg-white/70 shadow-[0_8px_30px_rgba(0,0,0,0.05)] border-gray-100/50"
              }
            `}
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
    </>
  );
}
