// app/api/user-profile/[userId]/route.ts
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  try {
    const { userId } = params;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Call your database function to get user's current profile
    // This should match the get_user_current_profile function from your database.py
    const FASTAPI_URL = process.env.FASTAPI_URL || "http://localhost:8000";
    const response = await fetch(`${FASTAPI_URL}/user/${userId}/profile`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        // New user - return default values
        return NextResponse.json({
          user_id: userId,
          age: 30,
          gender: "Male",
          occupation: "Other",
          region: "Urban",
          device_type: "Mobile",
          past_transactions: 0,
          past_upi_ratio: 0,
          past_card_ratio: 0,
          past_cod_ratio: 0,
          average_order_value: 0,
          last_payment_method: "upi",
          days_since_last_purchase: 999,
          is_new_user: true,
        });
      }

      const errorData = await response.json();
      console.error("FastAPI Error:", errorData);
      return NextResponse.json(
        { error: "Failed to fetch user profile", details: errorData },
        { status: response.status }
      );
    }

    const profileData = await response.json();

    return NextResponse.json({
      ...profileData,
      is_new_user: false,
    });
  } catch (error) {
    console.error("User profile fetch error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
