"use client";
import { useState } from "react";
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

export function BuyBox({ product, ...props }) {
  const { addToCart, checkout } = useCart();
  const { hexColor } = useColor();
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState("");
  const [showModal, setShowModal] = useState(false);
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

    // Get the buy box position
    const buyBoxElement = e.currentTarget.closest("[data-buybox]");
    if (buyBoxElement) {
      const rect = buyBoxElement.getBoundingClientRect();
      setBuyBoxPosition({
        top: rect.top + window.scrollY - 20,
        left: rect.left + window.scrollX,
      });
    }

    // Add product to cart temporarily
    addToCart(product, quantity);

    // Small delay to ensure cart is updated
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Show payment modal
    setShowPaymentModal(true);
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
      const result = await checkout(selectedPayment);
      setModalContent({
        type: "success",
        message: "Order placed successfully!",
        orderId: result.purchase_id,
        amount: result.total_amount,
      });
      setShowModal(true);
      setSelectedPayment("");

      // Redirect to home or purchase history after 3 seconds
      setTimeout(() => {
        router.push("/purchase-history");
      }, 3000);
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
        className="rounded-2xl shadow-xl p-6 transition-all hover:shadow-2xl"
        style={{
          background: `linear-gradient(145deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.5) 100%)`,
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          border: `1px solid ${hexColor}20`,
          boxShadow: `0 8px 30px rgba(0,0,0,0.1), inset 0 0 20px ${hexColor}10`,
        }}
        {...props}
      >
        <div className="mb-6">
          <span className="text-4xl font-bold text-gray-900">
            ${product.price?.toFixed(2)}
          </span>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
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
              className="w-20 text-center text-lg font-semibold border-2 rounded-xl py-2.5 focus:outline-none transition-all text-gray-900"
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
          <p className="text-xs text-gray-500 text-center mt-4">
            Buy Now will take you directly to checkout
          </p>
        )}
      </div>

      {/* Payment Method Modal */}
      {showPaymentModal && (
        <div
          className="fixed inset-0 flex p-4"
          style={{
            zIndex: 9999,
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            backgroundColor: `${hexColor}40`,
          }}
        >
          <div
            className="rounded-2xl shadow-2xl max-w-md w-full p-6 relative"
            style={{
              background: "rgba(255, 255, 255, 0.98)",
              backdropFilter: "blur(20px) saturate(180%)",
              WebkitBackdropFilter: "blur(20px) saturate(180%)",
              position: "absolute",
              top: `${buyBoxPosition.top}px`,
              left: "50%",
              transform: "translateX(-50%)",
            }}
          >
            <button
              onClick={() => {
                setShowPaymentModal(false);
                setSelectedPayment("");
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Select Payment Method
            </h3>
            <p className="text-gray-600 mb-6">Choose how you'd like to pay</p>

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
                            selectedPayment === method.id ? "white" : hexColor,
                        }}
                      >
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">
                          {method.name}
                        </div>
                        <div className="text-sm text-gray-500">
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
          </div>
        </div>
      )}

      {/* Success/Error Modal */}
      {showModal && (
        <div
          className="fixed inset-0 flex p-4"
          style={{
            zIndex: 9999,
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            backgroundColor: `${hexColor}40`,
          }}
        >
          <div
            className="rounded-2xl shadow-2xl max-w-md w-full p-8 relative"
            style={{
              background: "rgba(255, 255, 255, 0.98)",
              backdropFilter: "blur(20px) saturate(180%)",
              WebkitBackdropFilter: "blur(20px) saturate(180%)",
              position: "absolute",
              top: `${buyBoxPosition.top}px`,
              left: "50%",
              transform: "translateX(-50%)",
            }}
          >
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
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
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {modalContent.message}
                  </h3>
                  <div
                    className="rounded-lg p-4 mb-4"
                    style={{ background: `${hexColor}08` }}
                  >
                    <p className="text-sm text-gray-600 mb-1">Order ID</p>
                    <p className="text-lg font-mono font-semibold text-gray-900">
                      {modalContent.orderId}
                    </p>
                    <p className="text-sm text-gray-600 mt-3 mb-1">
                      Total Amount
                    </p>
                    <p
                      className="text-2xl font-bold"
                      style={{ color: hexColor }}
                    >
                      ${modalContent.amount.toFixed(2)}
                    </p>
                  </div>
                  <p className="text-sm text-gray-500">
                    Redirecting to purchase history...
                  </p>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <X className="w-10 h-10 text-red-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    Oops!
                  </h3>
                  <p className="text-gray-600 mb-6">{modalContent.message}</p>
                  <button
                    onClick={() => setShowModal(false)}
                    className="w-full bg-gray-900 text-white py-3 rounded-xl font-semibold hover:bg-gray-800 transition-colors"
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
