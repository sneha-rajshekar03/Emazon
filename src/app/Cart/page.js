"use client";
import { useCart } from "@app/context/CartContent";
import { useColor } from "@app/context/ColorContext";
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
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function CartPage() {
  const {
    cart,
    updateQuantity,
    removeFromCart,
    getCartTotal,
    checkout,
    isLoading,
  } = useCart();
  const { data: session } = useSession();
  const router = useRouter();
  const { hexColor, isDarkMode } = useColor();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState({
    type: "",
    message: "",
    orderId: "",
    amount: 0,
  });
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState("");
  const [countdown, setCountdown] = useState(5);

  const subtotal = getCartTotal();
  const tax = subtotal * 0.1;
  const shipping = subtotal > 100 ? 0 : subtotal > 0 ? 10 : 0;
  const total = subtotal + tax + shipping;

  useEffect(() => {
    if (showModal && modalContent.type === "success") {
      setCountdown(5);
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setShowModal(false);
            return 5;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [showModal, modalContent.type]);

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

    if (cart.length === 0) {
      setModalContent({
        type: "error",
        message: "Your cart is empty",
        orderId: "",
        amount: 0,
      });
      setShowModal(true);
      return;
    }

    setShowPaymentModal(true);
  };
  // Detect device type
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
    setIsCheckingOut(true);

    try {
      // Just pass the payment method as a string
      const result = await checkout(selectedPayment);

      setModalContent({
        type: "success",
        message: "Order placed successfully!",
        orderId: result.purchase_id,
        amount: result.total_amount,
      });
      setShowModal(true);
      setSelectedPayment("");
    } catch (error) {
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

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center pt-20"
        style={{ background: isDarkMode ? "#000000" : undefined }}
      >
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent mx-auto mb-4"
            style={{ borderColor: `${hexColor}30`, borderTopColor: hexColor }}
          />
          <p
            className={`font-medium ${
              isDarkMode ? "text-gray-300" : "text-gray-600"
            }`}
          >
            Loading your cart...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen py-8 pt-20"
      style={{ background: isDarkMode ? "#000000" : undefined }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold mb-6 transition-colors hover:opacity-80"
          style={{ color: hexColor }}
        >
          <ArrowLeft className="w-5 h-5" />
          Continue Shopping
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
          {/* Cart Items */}
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
                <div className="flex flex-row justify-center gap-4">
                  <Link
                    href="/"
                    className="inline-block text-white px-6 py-3 rounded-lg transition-all hover:scale-105 hover:shadow-lg active:scale-95 font-semibold"
                    style={{
                      background: hexColor,
                    }}
                  >
                    Browse Products
                  </Link>
                  <Link
                    href="/purchase-history"
                    className="inline-block px-6 py-3 rounded-lg transition-colors font-semibold"
                    style={{
                      background: `linear-gradient(135deg, ${hexColor}20 0%, ${hexColor}30 100%)`,
                      color: hexColor,
                    }}
                  >
                    Purchase History
                  </Link>
                </div>
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
                        <Image
                          src={item.imgUrl}
                          alt={item.title}
                          fill
                          className="object-cover rounded-xl"
                        />
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
                          ${item.price.toFixed(2)} each
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div
              className="rounded-2xl p-6 sticky top-24"
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

              {!session?.user?.id && (
                <div
                  className="mb-4 p-3 rounded-lg"
                  style={{
                    background: isDarkMode
                      ? "rgba(113, 63, 18, 0.3)"
                      : "rgba(254, 240, 138, 0.2)",
                    border: isDarkMode
                      ? "1px solid rgba(180, 83, 9, 0.4)"
                      : "1px solid rgba(252, 211, 77, 0.3)",
                  }}
                >
                  <p
                    className={`text-sm ${
                      isDarkMode ? "text-amber-400" : "text-amber-800"
                    }`}
                  >
                    Please log in to checkout
                  </p>
                </div>
              )}

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
                {isCheckingOut ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Processing...
                  </span>
                ) : (
                  "Proceed to Checkout"
                )}
              </button>

              <Link
                href="/"
                className="block w-full text-center font-semibold py-3 rounded-xl transition-colors"
                style={{
                  color: hexColor,
                  background: `${hexColor}10`,
                }}
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
      {/* Payment Method Modal */}
      {showPaymentModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
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
            <p
              className={`mb-6 ${
                isDarkMode ? "text-gray-400" : "text-gray-600"
              }`}
            >
              Choose how you would like to pay
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
          </div>
        </div>
      )}
      {/* Success/Error Modal */}
      {showModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{
            backgroundColor: isDarkMode
              ? "rgba(0, 0, 0, 0.7)"
              : `${hexColor}40`,
            backdropFilter: "blur(12px) saturate(150%)",
            WebkitBackdropFilter: "blur(12px) saturate(150%)",
          }}
        >
          <div
            className="rounded-2xl shadow-2xl max-w-md w-full p-8 relative"
            style={{
              background: isDarkMode
                ? "rgba(31, 41, 55, 0.98)"
                : "rgba(255, 255, 255, 0.98)",
              backdropFilter: "blur(20px) saturate(180%)",
              WebkitBackdropFilter: "blur(20px) saturate(180%)",
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
                    This message will close in {countdown} second
                    {countdown !== 1 ? "s" : ""}
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
    </div>
  );
}
