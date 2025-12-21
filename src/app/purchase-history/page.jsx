"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useColor } from "@/app/context/ColorContext";
import { ShoppingBag, Package, CreditCard, Loader2 } from "lucide-react";

export default function PurchaseHistoryPage() {
  const [purchases, setPurchases] = useState([]);
  const [productMap, setProductMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { data: session, status } = useSession();
  const router = useRouter();
  const { hexColor, isDarkMode } = useColor();

  useEffect(() => {
    if (status === "authenticated") {
      fetchPurchases();
    } else if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const fetchPurchases = async () => {
    try {
      setError(null);
      const res = await fetch("/api/purchase-history");

      if (!res.ok) {
        throw new Error(`Failed to fetch purchases: ${res.status}`);
      }

      const data = await res.json();
      const purchasesList = data.purchases || [];

      console.log("📦 Purchase History:", purchasesList.length, "purchases");

      setPurchases(purchasesList);

      if (purchasesList.length > 0) {
        await fetchProductDetails(purchasesList);
      }
    } catch (err) {
      console.error("Error fetching purchases:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchProductDetails = async (purchases) => {
    try {
      const allProductIds = purchases.flatMap((purchase) =>
        purchase.items.map((item) => item.product_id)
      );
      const uniqueProductIds = [...new Set(allProductIds.filter(Boolean))];

      console.log("🔍 Fetching", uniqueProductIds.length, "unique products");

      if (uniqueProductIds.length === 0) return;

      const productDetails = await Promise.allSettled(
        uniqueProductIds.map(async (id) => {
          const isMongoDB = /^[0-9a-f]{24}$/i.test(id);

          try {
            let res;
            let url;

            if (isMongoDB) {
              url = `/api/products/by-mongo-id?_id=${id}`;
              res = await fetch(url);
            } else {
              url = `/api/products/${id}`;
              res = await fetch(url);
            }

            if (res.ok) {
              const product = await res.json();
              console.log("✅ Found product:", product.title);
              return {
                storedId: id,
                actualProductId: product.product_id || id,
                title: product.title || product.name || "Unknown Product",
                imgUrl: product.imgUrl || product.image || null,
              };
            }
          } catch (err) {
            console.error(`❌ Error fetching product ${id}:`, err);
          }

          return {
            storedId: id,
            actualProductId: id,
            title: `Product (${id.slice(-8)})`,
            imgUrl: null,
          };
        })
      );

      const map = {};
      productDetails.forEach((result) => {
        if (result.status === "fulfilled" && result.value) {
          map[result.value.storedId] = result.value;
        }
      });

      console.log(
        "✅ Product map created:",
        Object.keys(map).length,
        "products"
      );
      setProductMap(map);
    } catch (err) {
      console.error("Error fetching product details:", err);
    }
  };

  const handleProductClick = (productId) => {
    if (productId) {
      router.push(`/products/${productId}`);
    }
  };

  if (loading) {
    return (
      <div
        className="flex justify-center items-center min-h-screen"
        style={{ background: isDarkMode ? "#000000" : "#f9fafb" }}
      >
        <div className="flex flex-col items-center gap-4">
          <Loader2
            className="w-12 h-12 animate-spin"
            style={{ color: hexColor }}
            strokeWidth={2}
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

  if (error) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ background: isDarkMode ? "#000000" : "#f9fafb" }}
      >
        <div
          className="max-w-md w-full p-8 rounded-2xl text-center"
          style={{
            background: isDarkMode
              ? "rgba(31, 41, 55, 0.6)"
              : "rgba(255, 255, 255, 0.9)",
            border: `1px solid ${isDarkMode ? "#374151" : "#e5e7eb"}`,
          }}
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: `${hexColor}15` }}
          >
            <ShoppingBag
              className="w-8 h-8"
              style={{ color: hexColor }}
              strokeWidth={2}
            />
          </div>
          <h2
            className={`text-xl font-semibold mb-2 ${
              isDarkMode ? "text-gray-100" : "text-gray-800"
            }`}
          >
            Failed to Load Purchases
          </h2>
          <p
            className={`mb-6 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
          >
            {error}
          </p>
          <button
            onClick={fetchPurchases}
            className="px-6 py-3 rounded-lg text-white font-medium transition-all hover:opacity-90 active:scale-95"
            style={{
              background: `linear-gradient(135deg, ${hexColor} 0%, ${hexColor}dd 100%)`,
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen pt-13"
      style={{ background: isDarkMode ? "#000000" : "#f9fafb" }}
    >
      <div className="max-w-6xl mx-auto p-6 sm:p-8 pb-8">
        <div className="mb-8">
          <h1
            className={`text-3xl sm:text-4xl font-bold mb-2 ${
              isDarkMode ? "text-gray-100" : "text-gray-800"
            }`}
          >
            Purchase History
          </h1>
          <p
            className={`text-sm sm:text-base ${
              isDarkMode ? "text-gray-400" : "text-gray-600"
            }`}
          >
            View all your past orders and transactions
          </p>
        </div>

        {purchases.length === 0 ? (
          <div
            className="text-center py-16 rounded-2xl"
            style={{
              background: isDarkMode
                ? `linear-gradient(145deg, rgba(31,41,55,0.6) 0%, rgba(31,41,55,0.4) 50%, ${hexColor}15 100%)`
                : `linear-gradient(145deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 50%, ${hexColor}10 100%)`,
              backdropFilter: "blur(15px)",
              WebkitBackdropFilter: "blur(15px)",
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
                className="rounded-2xl p-6 transition-all hover:shadow-xl"
                style={{
                  background: isDarkMode
                    ? `linear-gradient(145deg, rgba(31,41,55,0.6) 0%, rgba(31,41,55,0.4) 50%, ${hexColor}12 100%)`
                    : `linear-gradient(145deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 50%, ${hexColor}10 100%)`,
                  backdropFilter: "blur(15px)",
                  WebkitBackdropFilter: "blur(15px)",
                  border: isDarkMode
                    ? `1px solid ${hexColor}30`
                    : `1px solid ${hexColor}20`,
                  boxShadow: isDarkMode
                    ? `0 4px 20px rgba(0,0,0,0.4), inset 0 0 15px ${hexColor}08`
                    : `0 4px 20px rgba(0,0,0,0.06), inset 0 0 15px ${hexColor}08`,
                }}
              >
                <div
                  className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6 pb-6 border-b"
                  style={{
                    borderColor: isDarkMode ? `${hexColor}20` : `${hexColor}15`,
                  }}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
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
                        Order #
                        {(purchase.transaction_id || purchase._id)
                          .slice(-8)
                          .toUpperCase()}
                      </h3>
                    </div>
                    <p
                      className={`text-sm mb-3 ${
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
                          className="px-3 py-1.5 rounded-full text-xs font-medium"
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
                          className="px-3 py-1.5 rounded-full text-xs font-medium"
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
                      className="text-2xl sm:text-3xl font-bold"
                      style={{ color: hexColor }}
                    >
                      ${(purchase.total_amount || 0).toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4
                    className={`font-semibold mb-3 text-sm ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Items Purchased ({purchase.items?.length || 0}):
                  </h4>
                  {purchase.items?.map((item, idx) => {
                    const productInfo = productMap[item.product_id];
                    const productTitle =
                      productInfo?.title || "Loading product...";
                    const linkProductId =
                      productInfo?.actualProductId || item.product_id;
                    const productImage = productInfo?.imgUrl;

                    return (
                      <div
                        key={`${purchase._id}-${idx}`}
                        className="flex items-center gap-4 p-4 rounded-xl transition-all hover:scale-[1.01] cursor-pointer"
                        onClick={() => handleProductClick(linkProductId)}
                        style={{
                          background: isDarkMode
                            ? "rgba(55, 65, 81, 0.5)"
                            : "rgba(255, 255, 255, 0.6)",
                          border: `1px solid ${hexColor}10`,
                        }}
                      >
                        {/* Product Image */}
                        <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0">
                          {productImage ? (
                            <>
                              <img
                                src={productImage}
                                alt={productTitle}
                                className="w-full h-full object-cover rounded-lg"
                                onLoad={(e) => {
                                  console.log("✅ Image loaded:", productTitle);
                                  e.target.style.display = "block";
                                  const placeholder =
                                    e.target.nextElementSibling;
                                  if (placeholder)
                                    placeholder.style.display = "none";
                                }}
                                onError={(e) => {
                                  console.error(
                                    "❌ Image failed:",
                                    productImage
                                  );
                                  e.target.style.display = "none";
                                  const placeholder =
                                    e.target.nextElementSibling;
                                  if (placeholder)
                                    placeholder.style.display = "flex";
                                }}
                              />
                              <div
                                className={`absolute inset-0 w-full h-full rounded-lg flex items-center justify-center ${
                                  isDarkMode ? "bg-gray-800" : "bg-gray-200"
                                }`}
                                style={{ display: "none" }}
                              >
                                <ShoppingBag
                                  className={`w-6 h-6 ${
                                    isDarkMode
                                      ? "text-gray-600"
                                      : "text-gray-400"
                                  }`}
                                />
                              </div>
                            </>
                          ) : (
                            <div
                              className={`w-full h-full rounded-lg flex items-center justify-center ${
                                isDarkMode ? "bg-gray-800" : "bg-gray-200"
                              }`}
                            >
                              <ShoppingBag
                                className={`w-6 h-6 ${
                                  isDarkMode ? "text-gray-600" : "text-gray-400"
                                }`}
                              />
                            </div>
                          )}
                        </div>

                        {/* Product Details */}
                        <div className="flex-1 min-w-0">
                          <p
                            className={`font-medium mb-1 truncate transition-colors ${
                              isDarkMode ? "text-gray-100" : "text-gray-800"
                            }`}
                            style={{
                              color: productInfo ? hexColor : undefined,
                            }}
                          >
                            {productTitle}
                          </p>
                          <p
                            className={`text-xs mb-1 font-mono ${
                              isDarkMode ? "text-gray-500" : "text-gray-400"
                            }`}
                          >
                            ID: {item.product_id.slice(-12)}
                          </p>
                          <p
                            className={`text-sm ${
                              isDarkMode ? "text-gray-400" : "text-gray-600"
                            }`}
                          >
                            ${(item.unit_price || 0).toFixed(2)} ×{" "}
                            {item.quantity || 1}
                          </p>
                        </div>

                        {/* Price */}
                        <div className="text-right">
                          <p
                            className={`font-semibold text-lg ${
                              isDarkMode ? "text-gray-100" : "text-gray-800"
                            }`}
                          >
                            $
                            {(
                              (item.unit_price || 0) * (item.quantity || 1)
                            ).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
