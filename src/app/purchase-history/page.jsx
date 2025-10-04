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
  const { hexColor } = useColor();

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

  const formatPaymentMethod = (method) => {
    const paymentMethods = {
      upi: "UPI",
      card: "Card",
      cod: "Cash on Delivery",
    };
    return paymentMethods[method] || "Not Specified";
  };

  const getPaymentIcon = (method) => {
    return <CreditCard className="w-3.5 h-3.5" strokeWidth={2} />;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div
          className="flex flex-col items-center gap-3"
          style={{ color: hexColor }}
        >
          <div
            className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: `${hexColor}30`, borderTopColor: hexColor }}
          />
          <p className="text-lg font-medium text-gray-700">
            Loading purchase history...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-8 pt-20">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          Purchase History
        </h1>
        <p className="text-gray-600">
          View all your past orders and transactions
        </p>
      </div>

      {purchases.length === 0 ? (
        <div
          className="text-center py-16 rounded-2xl"
          style={{
            background: `linear-gradient(145deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.4) 50%, ${hexColor}15 100%)`,
            backdropFilter: "blur(15px) saturate(150%)",
            WebkitBackdropFilter: "blur(15px) saturate(150%)",
            border: `1px solid ${hexColor}20`,
            boxShadow: `0 8px 30px rgba(0,0,0,0.08), inset 0 0 20px ${hexColor}10`,
          }}
        >
          <ShoppingBag
            className="w-16 h-16 mx-auto mb-4 opacity-50"
            style={{ color: hexColor }}
            strokeWidth={1.5}
          />
          <p className="text-xl text-gray-600 mb-6">No purchase history yet</p>
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
              key={purchase._id}
              className="rounded-2xl p-6 transition-all hover:shadow-lg"
              style={{
                background: `linear-gradient(145deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.4) 50%, ${hexColor}12 100%)`,
                backdropFilter: "blur(15px) saturate(150%)",
                WebkitBackdropFilter: "blur(15px) saturate(150%)",
                border: `1px solid ${hexColor}20`,
                boxShadow: `0 4px 20px rgba(0,0,0,0.06), inset 0 0 15px ${hexColor}08`,
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
                    <h3 className="font-semibold text-lg text-gray-800">
                      Order #{purchase._id.slice(-8)}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    {new Date(purchase.purchase_date).toLocaleDateString(
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
                  {purchase.payment_method && (
                    <div
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
                      style={{
                        background: `${hexColor}15`,
                        color: hexColor,
                      }}
                    >
                      {getPaymentIcon(purchase.payment_method)}
                      {formatPaymentMethod(purchase.payment_method)}
                    </div>
                  )}
                </div>
                <div className="text-left md:text-right">
                  <p className="text-sm text-gray-600 mb-1">Total Amount</p>
                  <p className="text-3xl font-bold" style={{ color: hexColor }}>
                    ${purchase.total_amount.toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-gray-700 mb-3">Items:</h4>
                {purchase.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-4 p-4 rounded-xl transition-colors"
                    style={{
                      background: "rgba(255, 255, 255, 0.5)",
                      border: `1px solid ${hexColor}10`,
                    }}
                  >
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.title || item.name}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-gray-800 mb-1">
                        {item.title || item.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        ${item.price.toFixed(2)} × {item.quantity}
                      </p>
                    </div>
                    <p className="font-semibold text-gray-800 text-lg">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
