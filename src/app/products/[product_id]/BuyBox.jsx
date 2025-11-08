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

  useEffect(() => {
    if (!session?.user?.id || !product?.product_id) return;
    const fetchMostFrequentQuantity = async () => {
      try {
        const res = await fetch(
          `/api/purchase-history?userId=${session.user.id}&productId=${product.product_id}`
        );
        const data = await res.json();
        if (data.mostFrequentQuantity && data.mostFrequentQuantity > 0) {
          setQuantity(data.mostFrequentQuantity);
          setMostFrequentQuantity(data.mostFrequentQuantity);
        }
      } catch (error) {
        console.error("[BuyBox] Error fetching most frequent quantity:", error);
      }
    };
    fetchMostFrequentQuantity();
  }, [session?.user?.id, product?.product_id]);

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
    if (!session?.user?.id) {
      setPredictedPayment("upi");
      setSelectedPayment("upi");
      setPredictionConfidence(0.5);
      return;
    }
    setLoadingPrediction(true);
    try {
      const res = await fetch(`/api/user-profile/${session.user.id}`);
      if (!res.ok) throw new Error("Failed to fetch user profile");
      const userProfile = await res.json();
      const now = new Date();
      const payload = {
        user_id: userProfile.user_id,
        product_price: parseFloat(product.price?.toFixed(2)),
        hour_of_day: now.getHours(),
      };
      const predictionRes = await fetch("/api/predict-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const prediction = await predictionRes.json();
      setPredictedPayment(prediction.predicted_method || "upi");
      setPredictionConfidence(prediction.confidence || 0.5);
      setSelectedPayment(prediction.predicted_method || "upi");
    } catch (err) {
      console.error("[BuyBox] Payment prediction error:", err);
      setPredictedPayment("upi");
      setSelectedPayment("upi");
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
      const productId =
        product._id || product.id || product.productId || product.product_id;
      const totalAmount = product.price * quantity;
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transaction_id: transactionId,
          payment_method: selectedPayment,
          items: [
            {
              product_id: productId,
              quantity: quantity,
              unit_price: product.price,
            },
          ],
        }),
      });

      if (!response.ok) throw new Error("Checkout failed");
      const result = await response.json();
      setModalContent({
        type: "success",
        message: "Order placed successfully!",
        orderId: result.purchase_id || result.transaction_id,
        amount: result.total_amount,
      });
      setShowModal(true);
    } catch (error) {
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
        {/* Corner glow tint */}
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
          {/* Price */}
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

          {/* Quantity */}
          <label
            className="block text-sm font-semibold mb-3"
            style={{ color: isDarkMode ? `${hexColor}cc` : hexColor }}
          >
            Quantity
          </label>
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
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
              onChange={(e) =>
                setQuantity(Math.max(1, parseInt(e.target.value) || 1))
              }
              className={`w-20 text-center text-lg font-semibold border-2 rounded-xl py-2.5 ${
                isDarkMode
                  ? "text-gray-100 bg-gray-800/50"
                  : "text-gray-900 bg-white"
              }`}
              style={{ borderColor: `${hexColor}30` }}
            />
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="w-11 h-11 rounded-xl text-white font-semibold text-xl"
              style={{
                background: `linear-gradient(135deg, ${hexColor} 0%, ${hexColor}dd 100%)`,
              }}
            >
              +
            </button>
          </div>

          {/* Buttons */}
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
    </>
  );
}
