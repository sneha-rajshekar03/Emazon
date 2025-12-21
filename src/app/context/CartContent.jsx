"use client";
import { createContext, useContext, useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const prevSessionRef = useRef(null);

  // Load cart from DB when user logs in
  useEffect(() => {
    console.log("🔄 [CART CONTEXT] Load effect triggered");
    console.log("🔄 [CART CONTEXT] Status:", status);
    console.log("🔄 [CART CONTEXT] Session exists:", !!session);
    console.log("🔄 [CART CONTEXT] User ID:", session?.user?.id);

    if (status === "loading") {
      console.log("⏳ [CART CONTEXT] Auth still loading, waiting...");
      return;
    }

    const loadCart = async () => {
      if (session?.user?.id) {
        console.log(
          "📥 [CART CONTEXT] User logged in, loading cart from DB..."
        );
        try {
          const res = await fetch("/api/cart");
          console.log("📥 [CART CONTEXT] Fetch response status:", res.status);

          if (res.ok) {
            const data = await res.json();
            console.log(
              "📥 [CART CONTEXT] Cart loaded:",
              data.items?.length || 0,
              "items"
            );

            // 🔍 DEBUG: Log each cart item including imgUrl
            data.items?.forEach((item, idx) => {
              console.log(`📥 [CART CONTEXT] Item ${idx + 1}:`, {
                product_id: item.product_id,
                _id: item._id,
                title: item.title,
                imgUrl: item.imgUrl,
                hasImage: !!item.imgUrl,
              });
            });

            setCart(data.items || []);
          } else {
            const errorData = await res.json();
            console.error("❌ [CART CONTEXT] Failed to load cart:", errorData);
          }
        } catch (error) {
          console.error("❌ [CART CONTEXT] Error loading cart:", error);
        }
      } else {
        console.log("🚫 [CART CONTEXT] No user session, clearing cart");
        setCart([]);
      }
      console.log(
        "✅ [CART CONTEXT] Load complete, setting isLoading to false"
      );
      setIsLoading(false);
    };

    loadCart();
  }, [session?.user?.id, status]);

  // Save cart to DB when user logs out
  useEffect(() => {
    console.log("💾 [CART CONTEXT] Logout effect triggered");
    console.log(
      "💾 [CART CONTEXT] Previous session:",
      prevSessionRef.current?.user?.id || "none"
    );
    console.log(
      "💾 [CART CONTEXT] Current session:",
      session?.user?.id || "none"
    );
    console.log("💾 [CART CONTEXT] Cart items:", cart.length);

    const handleLogout = async () => {
      // User was logged in before, but now logged out
      if (
        prevSessionRef.current?.user?.id &&
        !session?.user?.id &&
        cart.length > 0
      ) {
        console.log("🚪 [CART CONTEXT] User logged out, saving cart to DB...");
        try {
          const res = await fetch("/api/cart", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ items: cart }),
          });

          if (res.ok) {
            console.log("✅ [CART CONTEXT] Cart saved on logout");
          } else {
            const errorData = await res.json();
            console.error(
              "❌ [CART CONTEXT] Failed to save cart on logout:",
              errorData
            );
          }
        } catch (error) {
          console.error(
            "❌ [CART CONTEXT] Error saving cart on logout:",
            error
          );
        }
      }
    };

    handleLogout();
    prevSessionRef.current = session;
  }, [session, cart]);

  const addToCart = async (product, quantity = 1) => {
    console.log("➕ [CART CONTEXT] addToCart called");
    console.log("➕ [CART CONTEXT] Product object:", {
      product_id: product.product_id,
      _id: product._id,
      title: product.title,
      price: product.price,
      imgUrl: product.imgUrl,
      hasImage: !!product.imgUrl,
    });
    console.log("➕ [CART CONTEXT] Quantity:", quantity);
    console.log("➕ [CART CONTEXT] User logged in:", !!session?.user?.id);

    if (!session?.user?.id) {
      console.error("❌ [CART CONTEXT] User must be logged in to add to cart");
      return;
    }

    // 🔍 VALIDATION: Ensure we're using product_id, not _id
    if (!product.product_id) {
      console.error("❌ [CART CONTEXT] Product missing product_id field!");
      console.error("❌ [CART CONTEXT] Product object:", product);
      throw new Error("Product must have a product_id field");
    }

    const updatedCart = await new Promise((resolve) => {
      setCart((prevCart) => {
        console.log(
          "➕ [CART CONTEXT] Previous cart:",
          prevCart.length,
          "items"
        );
        const existingItem = prevCart.find(
          (item) => item.product_id === product.product_id
        );

        let newCart;
        if (existingItem) {
          console.log("➕ [CART CONTEXT] Item exists, updating quantity");
          newCart = prevCart.map((item) =>
            item.product_id === product.product_id
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
        } else {
          console.log("➕ [CART CONTEXT] New item, adding to cart");
          // ✅ Store ALL product data including imgUrl
          const cartItem = {
            product_id: product.product_id,
            title: product.title,
            price: product.price,
            quantity: quantity,
            imgUrl: product.imgUrl, // ✅ Explicitly preserve image URL
            category: product.category_name || product.category,
            // Include any other fields you might need
            stars: product.stars,
            listPrice: product.listPrice,
          };

          console.log("➕ [CART CONTEXT] Cart item to add:", cartItem);

          newCart = [...prevCart, cartItem];
        }

        console.log("➕ [CART CONTEXT] New cart:", newCart.length, "items");
        console.log(
          "➕ [CART CONTEXT] New cart items:",
          newCart.map((i) => ({
            product_id: i.product_id,
            title: i.title,
            hasImage: !!i.imgUrl,
            imgUrl: i.imgUrl?.substring(0, 50) + "...",
          }))
        );
        resolve(newCart);
        return newCart;
      });
    });

    // Save to DB immediately after adding
    console.log("💾 [CART CONTEXT] Saving cart to DB after add...");
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: updatedCart }),
      });

      if (res.ok) {
        console.log("✅ [CART CONTEXT] Cart saved to DB successfully");
      } else {
        const errorData = await res.json();
        console.error(
          "❌ [CART CONTEXT] Failed to save cart to DB:",
          errorData
        );
      }
    } catch (error) {
      console.error("❌ [CART CONTEXT] Error saving cart to DB:", error);
    }
  };

  const removeFromCart = async (product_id) => {
    console.log("➖ [CART CONTEXT] removeFromCart called for:", product_id);

    const updatedCart = await new Promise((resolve) => {
      setCart((prevCart) => {
        const newCart = prevCart.filter(
          (item) => item.product_id !== product_id
        );
        console.log(
          "➖ [CART CONTEXT] Cart after removal:",
          newCart.length,
          "items"
        );
        resolve(newCart);
        return newCart;
      });
    });

    // Save to DB
    if (session?.user?.id) {
      console.log("💾 [CART CONTEXT] Saving cart to DB after removal...");
      try {
        const res = await fetch("/api/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: updatedCart }),
        });

        if (res.ok) {
          console.log("✅ [CART CONTEXT] Cart saved to DB successfully");
        } else {
          const errorData = await res.json();
          console.error(
            "❌ [CART CONTEXT] Failed to save cart to DB:",
            errorData
          );
        }
      } catch (error) {
        console.error("❌ [CART CONTEXT] Error saving cart to DB:", error);
      }
    }
  };

  const updateQuantity = async (product_id, quantity) => {
    console.log(
      "🔄 [CART CONTEXT] updateQuantity called for:",
      product_id,
      "Quantity:",
      quantity
    );

    if (quantity <= 0) {
      console.log("🔄 [CART CONTEXT] Quantity <= 0, removing item");
      removeFromCart(product_id);
      return;
    }

    const updatedCart = await new Promise((resolve) => {
      setCart((prevCart) => {
        const newCart = prevCart.map((item) =>
          item.product_id === product_id ? { ...item, quantity } : item
        );
        console.log(
          "🔄 [CART CONTEXT] Cart after quantity update:",
          newCart.length,
          "items"
        );
        resolve(newCart);
        return newCart;
      });
    });

    // Save to DB
    if (session?.user?.id) {
      console.log(
        "💾 [CART CONTEXT] Saving cart to DB after quantity update..."
      );
      try {
        const res = await fetch("/api/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: updatedCart }),
        });

        if (res.ok) {
          console.log("✅ [CART CONTEXT] Cart saved to DB successfully");
        } else {
          const errorData = await res.json();
          console.error(
            "❌ [CART CONTEXT] Failed to save cart to DB:",
            errorData
          );
        }
      } catch (error) {
        console.error("❌ [CART CONTEXT] Error saving cart to DB:", error);
      }
    }
  };

  const clearCart = () => {
    setCart([]);
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getCartCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  };

  const checkout = async (paymentMethod) => {
    console.log("🛒 [CART CONTEXT] Checkout initiated");
    console.log("🛒 [CART CONTEXT] User logged in:", !!session?.user?.id);
    console.log("🛒 [CART CONTEXT] Cart items:", cart.length);
    console.log("🛒 [CART CONTEXT] Cart total:", getCartTotal());

    if (!session?.user?.id) {
      console.error("❌ [CART CONTEXT] User must be logged in to checkout");
      throw new Error("User must be logged in to checkout");
    }

    if (cart.length === 0) {
      console.error("❌ [CART CONTEXT] Cart is empty");
      throw new Error("Cart is empty");
    }

    // Detect device type
    const getDeviceType = () => {
      const ua = navigator.userAgent;
      if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
        return "Tablet";
      }
      if (
        /Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(
          ua
        )
      ) {
        return "Mobile";
      }
      return "Desktop";
    };

    const deviceType = getDeviceType();
    console.log("📱 [CART CONTEXT] Device type detected:", deviceType);

    // Generate transaction ID
    const transactionId = `TXN${Date.now()}`;
    console.log("🆔 [CART CONTEXT] Transaction ID generated:", transactionId);

    // 🔍 DEBUG: Log cart items before formatting
    console.log("🛒 [CART CONTEXT] Cart items before formatting:");
    cart.forEach((item, idx) => {
      console.log(`  Item ${idx + 1}:`, {
        product_id: item.product_id,
        _id: item._id,
        title: item.title,
        price: item.price,
        quantity: item.quantity,
        isMongoDB: /^[0-9a-f]{24}$/i.test(item.product_id),
      });
    });

    // ✅ Map cart items to match schema - ensure product_id is correct
    const formattedItems = cart.map((item) => {
      const formatted = {
        product_id: item.product_id, // This should be like "B08LYT4Q2X"
        quantity: item.quantity,
        unit_price: item.price,
      };

      console.log("🛒 [CART CONTEXT] Formatted item:", formatted);

      // ⚠️ VALIDATION: Warn if product_id looks like MongoDB _id
      if (/^[0-9a-f]{24}$/i.test(formatted.product_id)) {
        console.warn(
          "⚠️ [CART CONTEXT] WARNING: product_id looks like MongoDB _id!",
          formatted.product_id
        );
        console.warn(
          "⚠️ [CART CONTEXT] This should be the actual product_id like 'B08LYT4Q2X'"
        );
      }

      return formatted;
    });

    console.log(
      "🛒 [CART CONTEXT] All formatted items:",
      JSON.stringify(formattedItems, null, 2)
    );

    try {
      console.log("🛒 [CART CONTEXT] Sending checkout request...");
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transaction_id: transactionId,
          user_id: session.user.id,
          items: formattedItems,
          payment_method: paymentMethod,
          device_type: deviceType,
        }),
      });

      console.log("🛒 [CART CONTEXT] Checkout response status:", res.status);

      if (!res.ok) {
        const error = await res.json();
        console.error("❌ [CART CONTEXT] Checkout failed:", error);
        throw new Error(error.error || "Checkout failed");
      }

      const data = await res.json();
      console.log("✅ [CART CONTEXT] Checkout successful:", data);

      // Clear cart after successful checkout
      console.log("🧹 [CART CONTEXT] Clearing cart...");
      clearCart();

      // Clear cart in DB
      console.log("🧹 [CART CONTEXT] Clearing cart in DB...");
      await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: [] }),
      });

      console.log("✅ [CART CONTEXT] Cart cleared successfully");
      return data;
    } catch (error) {
      console.error("❌ [CART CONTEXT] Checkout error:", error);
      throw error;
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal,
        getCartCount,
        checkout,
        isLoading,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}
