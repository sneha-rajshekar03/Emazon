"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useColor } from "@app/context/ColorContext";
import { ShoppingBag, Package, CreditCard } from "lucide-react";

export default function PurchaseHistoryPage() {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const { data: session, status } = useSession();
  const router = useRouter();
  const { hexColor, isDarkMode } = useColor();

  useEffect(() => {
    console.log("📜 [PURCHASE PAGE] Status:", status);
    if (status === "authenticated") {
      fetchPurchases();
    } else if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status]);

  const fetchPurchases = async () => {
    console.log("📜 [PURCHASE PAGE] Fetching purchases...");
    try {
      const res = await fetch("/api/purchase-history");
      console.log("📜 [PURCHASE PAGE] Response status:", res.status);

      if (res.ok) {
        const data = await res.json();
        console.log("📜 [PURCHASE PAGE] Data received:", data);
        console.log(
          "📜 [PURCHASE PAGE] Number of purchases:",
          data.purchases?.length
        );
        console.log(
          "📜 [PURCHASE PAGE] Purchases:",
          JSON.stringify(data.purchases, null, 2)
        );
        setPurchases(data.purchases);
      } else {
        const errorData = await res.json();
        console.error("❌ [PURCHASE PAGE] Error response:", errorData);
      }
    } catch (error) {
      console.error("❌ [PURCHASE PAGE] Error fetching purchases:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div
        className="flex justify-center items-center min-h-screen"
        style={{ background: isDarkMode ? "#000000" : undefined }}
      >
        <div
          className="flex flex-col items-center gap-3"
          style={{ color: hexColor }}
        >
          <div
            className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: `${hexColor}30`, borderTopColor: hexColor }}
          />
          <p
            className={`text-lg font-medium ${
              isDarkMode ? "text-gray-300" : "text-gray-700"
            }`}
          >
            Loading purchase history...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{ background: isDarkMode ? "#000000" : undefined }}
    >
      <div className="max-w-6xl mx-auto p-8 pt-20">
        {/* Header */}
        <div className="mb-8">
          <h1
            className={`text-4xl font-bold mb-2 ${
              isDarkMode ? "text-gray-100" : "text-gray-800"
            }`}
          >
            Purchase History
          </h1>
          <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
            View all your past orders and transactions
          </p>
        </div>

        {purchases.length === 0 ? (
          <div
            className="text-center py-16 rounded-2xl"
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
              strokeWidth={1.5}
            />
            <p
              className={`text-xl mb-6 ${
                isDarkMode ? "text-gray-400" : "text-gray-600"
              }`}
            >
              No purchase history yet
            </p>
            <button
              onClick={() => router.push("/")}
              className="px-6 py-3 rounded-lg text-white font-medium transition-all hover:opacity-90 active:scale-95"
              style={{
                background: `linear-gradient(135deg, ${hexColor} 0%, ${hexColor}dd 100%)`,
              }}
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {purchases.map((purchase) => (
              <div
                key={purchase.transaction_id || purchase._id}
                className="rounded-2xl p-6 transition-all hover:shadow-lg"
                style={{
                  background: isDarkMode
                    ? `linear-gradient(145deg, rgba(31,41,55,0.6) 0%, rgba(31,41,55,0.4) 50%, ${hexColor}12 100%)`
                    : `linear-gradient(145deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.4) 50%, ${hexColor}12 100%)`,
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
                <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Package
                        className="w-5 h-5"
                        style={{ color: hexColor }}
                        strokeWidth={2}
                      />
                      <h3
                        className={`font-semibold text-lg ${
                          isDarkMode ? "text-gray-100" : "text-gray-800"
                        }`}
                      >
                        Transaction #
                        {purchase.transaction_id || purchase._id.slice(-8)}
                      </h3>
                    </div>
                    <p
                      className={`text-sm mb-2 ${
                        isDarkMode ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      {new Date(purchase.transaction_date).toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {purchase.payment_method && (
                        <div
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
                          style={{
                            background: `${hexColor}15`,
                            color: hexColor,
                          }}
                        >
                          <CreditCard className="w-3.5 h-3.5" strokeWidth={2} />
                          {purchase.payment_method}
                        </div>
                      )}
                      {purchase.device_type && (
                        <div
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
                          style={{
                            background: isDarkMode
                              ? "rgba(75, 85, 99, 0.5)"
                              : "rgba(156, 163, 175, 0.2)",
                            color: isDarkMode ? "#d1d5db" : "#4b5563",
                          }}
                        >
                          {purchase.device_type}
                        </div>
                      )}
                      {purchase.status && (
                        <div
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
                          style={{
                            background:
                              purchase.status === "completed"
                                ? "#10b98120"
                                : `${hexColor}15`,
                            color:
                              purchase.status === "completed"
                                ? "#10b981"
                                : hexColor,
                          }}
                        >
                          {purchase.status.charAt(0).toUpperCase() +
                            purchase.status.slice(1)}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-left md:text-right">
                    <p
                      className={`text-sm mb-1 ${
                        isDarkMode ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      Total Amount
                    </p>
                    <p
                      className="text-3xl font-bold"
                      style={{ color: hexColor }}
                    >
                      ${purchase.total_amount.toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4
                    className={`font-semibold mb-3 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Items ({purchase.items.length}):
                  </h4>
                  {purchase.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-4 p-4 rounded-xl transition-colors"
                      style={{
                        background: isDarkMode
                          ? "rgba(55, 65, 81, 0.5)"
                          : "rgba(255, 255, 255, 0.5)",
                        border: `1px solid ${hexColor}10`,
                      }}
                    >
                      <div className="flex-1">
                        <p
                          className={`font-medium mb-1 ${
                            isDarkMode ? "text-gray-100" : "text-gray-800"
                          }`}
                        >
                          Product ID: {item.product_id}
                        </p>
                        <p
                          className={`text-sm ${
                            isDarkMode ? "text-gray-400" : "text-gray-600"
                          }`}
                        >
                          ${item.unit_price.toFixed(2)} × {item.quantity}
                        </p>
                      </div>
                      <p
                        className={`font-semibold text-lg ${
                          isDarkMode ? "text-gray-100" : "text-gray-800"
                        }`}
                      >
                        ${(item.unit_price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
