// hooks/useProfileData.js
import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";

export const useProfileData = () => {
  const { data: session } = useSession();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch profile data
  const fetchProfile = useCallback(async () => {
    if (!session?.user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/profile?userId=${session.user.id}`);
      const data = await response.json();

      if (data.success && data.data) {
        setProfileData(data.data);
        setError(null);
      } else {
        setError(data.message || "Failed to fetch profile");
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
      setError("Failed to fetch profile data");
    } finally {
      setLoading(false);
    }
  }, [session]);

  // Initial fetch
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Save profile data to database
  const saveProfile = useCallback(
    async (updates) => {
      if (!session?.user?.id) {
        console.error("No user session found");
        return { success: false, message: "No user session" };
      }

      try {
        setIsSaving(true);
        const response = await fetch("/api/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: session.user.id,
            ...updates,
          }),
        });

        const result = await response.json();

        if (result.success) {
          // Update local state with new data
          setProfileData((prev) => ({ ...prev, ...updates }));
          setError(null);
        } else {
          setError(result.message || "Failed to save profile");
        }

        return result;
      } catch (err) {
        console.error("Error saving profile:", err);
        setError("Failed to save profile data");
        return { success: false, message: err.message };
      } finally {
        setIsSaving(false);
      }
    },
    [session]
  );

  // Save to localStorage for later (e.g., before sign out)
  const savePendingUpdate = useCallback(
    (updates) => {
      try {
        localStorage.setItem(
          "pendingProfileUpdate",
          JSON.stringify({
            userId: session?.user?.id,
            ...updates,
          })
        );
      } catch (err) {
        console.error("Failed to save pending update to localStorage:", err);
      }
    },
    [session]
  );

  // Update profile data locally (optimistic update)
  const updateProfileLocally = useCallback((updates) => {
    setProfileData((prev) => ({ ...prev, ...updates }));
  }, []);

  // Calculate profile completion percentage
  const calculateCompletion = useCallback(() => {
    if (!profileData) return 0;

    const fields = [
      profileData.age,
      profileData.brand,
      profileData.priceRange,
      profileData.occupation,
      profileData.travelMode,
      profileData.livingStatus,
      profileData.location,
      profileData.pets,
      profileData.paymentMode,
    ];

    const filled = fields.filter((f) => f && f !== "").length;
    const hobbiesScore = profileData.hobbies?.length > 0 ? 1 : 0;
    const petTypeScore =
      profileData.pets === "Yes" && profileData.petType ? 1 : 0;

    const totalFields =
      fields.length + 1 + (profileData.pets === "Yes" ? 1 : 0);
    const totalFilled = filled + hobbiesScore + petTypeScore;

    return Math.round((totalFilled / totalFields) * 100);
  }, [profileData]);

  return {
    profileData,
    loading,
    error,
    isSaving,
    fetchProfile,
    saveProfile,
    savePendingUpdate,
    updateProfileLocally,
    profileCompletion: calculateCompletion(),
  };
};
