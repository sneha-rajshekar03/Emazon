// app/api/predict-payment/route.ts
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const payload = await request.json();

    // Validate required fields
    if (!payload.user_id || !payload.product_price) {
      return NextResponse.json(
        { error: "Missing required fields: user_id and product_price" },
        { status: 400 }
      );
    }

    // Prepare the request for FastAPI backend
    const fastApiPayload = {
      user_id: payload.user_id,
      product_price: payload.product_price,
      age: payload.age,
      gender: payload.gender,
      occupation: payload.occupation,
      region: payload.region,
      device_type: payload.device_type,
      hour_of_day: payload.hour_of_day,
      is_weekend: payload.is_weekend === 1 || payload.is_weekend === true,
    };

    // Call your FastAPI backend
    const FASTAPI_URL = process.env.FASTAPI_URL || "http://localhost:8000";
    const response = await fetch(`${FASTAPI_URL}/predict`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(fastApiPayload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("FastAPI Error:", errorData);
      return NextResponse.json(
        { error: "Prediction service unavailable", details: errorData },
        { status: response.status }
      );
    }

    const predictionData = await response.json();

    // Transform response to match frontend expectations
    return NextResponse.json({
      predicted_method: predictionData.prediction,
      confidence: predictionData.confidence,
      confidence_level: predictionData.confidence_level,
      probabilities: predictionData.probabilities,
      user_profile: predictionData.user_profile,
      insights: predictionData.insights,
      is_new_user: predictionData.is_new_user,
    });
  } catch (error) {
    console.error("Payment prediction error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
