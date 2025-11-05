// app/api/user-profile/[userId]/route.js
import { NextResponse } from "next/server";

export async function GET(request, context) {
  try {
    const { userId } = await context.params; // ✅ await params

    console.log("📥 Incoming request for user profile:", userId);

    if (!userId) {
      console.warn("⚠️ Missing userId in request params");
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const FASTAPI_URL = process.env.FASTAPI_URL || "http://localhost:5050";
    const apiUrl = `${FASTAPI_URL}/user/${userId}/profile`;

    console.log("🚀 Sending request to FastAPI:", apiUrl);

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log(`📡 FastAPI Response Status: ${response.status}`);

    if (!response.ok) {
      if (response.status === 404) {
        console.log("🆕 User not found — returning default profile.");
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

      const errorData = await response.json().catch(() => ({}));
      console.error("❌ FastAPI Error:", errorData);
      return NextResponse.json(
        { error: "Failed to fetch user profile", details: errorData },
        { status: response.status }
      );
    }

    const profileData = await response.json();
    console.log(
      "✅ FastAPI Response Data:",
      JSON.stringify(profileData, null, 2)
    );

    const transformedResponse = {
      ...profileData,
      is_new_user: false,
    };

    console.log(
      "📊 Transformed Response to Frontend:",
      JSON.stringify(transformedResponse, null, 2)
    );

    return NextResponse.json(transformedResponse);
  } catch (error) {
    console.error("💥 User profile fetch error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
