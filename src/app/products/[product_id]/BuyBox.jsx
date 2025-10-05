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
import { Card } from "@/components/ui/card";

export function BuyBox({ product, ...props }) {
  const { addToCart, checkout } = useCart();
  const { hexColor, isDarkMode } = useColor();
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

    const buyBoxElement = e.currentTarget.closest("[data-buybox]");
    if (buyBoxElement) {
      const rect = buyBoxElement.getBoundingClientRect();
      setBuyBoxPosition({
        top: rect.top + window.scrollY - 20,
        left: rect.left + window.scrollX,
      });
    }

    addToCart(product, quantity);
    await new Promise((resolve) => setTimeout(resolve, 100));
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
            Buy Now will take you directly to checkout
          </p>
        )}
      </Card>

      {/* Payment Method Modal */}
      {showPaymentModal && (
        <div
          className="fixed inset-0 flex p-4"
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
            style={{
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
          </Card>
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
            style={{
              position: "absolute",
              top: `${buyBoxPosition.top}px`,
              left: "50%",
              transform: "translateX(-50%)",
            }}
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
