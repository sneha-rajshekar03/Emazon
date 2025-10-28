import { useEffect } from "react";

/**
 * Hook to sync recently viewed products between localStorage and database
 * Use this hook in your auth context or main layout
 */
export function useRecentlyViewedSync(userId, isAuthenticated) {
  useEffect(() => {
    // When user logs in, merge localStorage data to DB
    const syncOnLogin = async () => {
      if (userId && isAuthenticated) {
        const localData = localStorage.getItem("recentlyViewed");
        if (localData) {
          try {
            const products = JSON.parse(localData);

            // Send each product to the backend
            for (const product of products) {
              await fetch("/api/user/recently-viewed", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  userId,
                  productId: product.product_id,
                  productData: product,
                }),
              });
            }

            // Clear localStorage after successful sync
            localStorage.removeItem("recentlyViewed");
            console.log("Recently viewed synced to database on login");
          } catch (error) {
            console.error("Error syncing recently viewed on login:", error);
          }
        }
      }
    };

    syncOnLogin();
  }, [userId, isAuthenticated]);

  // Function to call on logout
  const syncOnLogout = async () => {
    if (userId) {
      try {
        // Fetch user's recently viewed from DB
        const response = await fetch(
          `/api/user/recently-viewed?userId=${userId}`
        );
        if (response.ok) {
          const products = await response.json();

          // Store in localStorage for guest session
          localStorage.setItem("recentlyViewed", JSON.stringify(products));
          console.log("Recently viewed saved to localStorage on logout");
        }
      } catch (error) {
        console.error("Error syncing recently viewed on logout:", error);
      }
    }
  };

  return { syncOnLogout };
}

// Usage in your auth context or logout handler:
// const { syncOnLogout } = useRecentlyViewedSync(userId, isAuthenticated);
//
// const handleLogout = async () => {
//   await syncOnLogout();
//   // ... rest of logout logic
// };
