"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function PurchaseHistoryPage() {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const { data: session, status } = useSession();
  const router = useRouter();

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

  // Helper function to format payment method display
  const formatPaymentMethod = (method) => {
    const paymentMethods = {
      upi: "UPI",
      card: "Card",
      cod: "Cash on Delivery",
    };
    return paymentMethods[method] || "Not Specified";
  };

  // Helper function to get payment method badge color
  const getPaymentMethodColor = (method) => {
    const colors = {
      upi: "bg-purple-100 text-purple-800",
      card: "bg-blue-100 text-blue-800",
      cod: "bg-green-100 text-green-800",
    };
    return colors[method] || "bg-gray-100 text-gray-800";
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl">Loading purchase history...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Purchase History</h1>

      {purchases.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-xl text-gray-500 mb-4">No purchase history yet</p>
          <button
            onClick={() => router.push("/")}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Start Shopping
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {purchases.map((purchase) => (
            <div key={purchase._id} className="border rounded-lg p-6 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-lg">
                    Order #{purchase._id.slice(-8)}
                  </h3>
                  <p className="text-gray-600">
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
                  {/* Payment Method Badge - Only show if payment method exists */}
                  {purchase.payment_method && (
                    <div className="mt-2">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getPaymentMethodColor(
                          purchase.payment_method
                        )}`}
                      >
                        {formatPaymentMethod(purchase.payment_method)}
                      </span>
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Total Amount</p>
                  <p className="text-2xl font-bold text-blue-600">
                    ${purchase.total_amount.toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold">Items:</h4>
                {purchase.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-4 p-3 bg-gray-50 rounded"
                  >
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.title || item.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{item.title || item.name}</p>
                      <p className="text-sm text-gray-600">
                        ${item.price.toFixed(2)} × {item.quantity}
                      </p>
                    </div>
                    <p className="font-semibold">
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
