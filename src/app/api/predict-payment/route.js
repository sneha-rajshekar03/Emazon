// app/api/predict-payment/route.js
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const payload = await request.json();

    console.log("📥 Incoming prediction request:", {
      user_id: payload.user_id,
      product_price: payload.product_price,
      timestamp: new Date().toISOString(),
    });

    // Validate required fields
    if (!payload.user_id || !payload.product_price) {
      console.warn("⚠️ Missing required fields");
      return NextResponse.json(
        { error: "Missing required fields: user_id and product_price" },
        { status: 400 }
      );
    }

    // Prepare the request for FastAPI backend
    const fastApiPayload = {
      user_id: payload.user_id,
      product_price: payload.product_price,
      age: payload.age || 30,
      gender: payload.gender || "Male",
      occupation: payload.occupation || "Other",
      region: payload.region || "Urban",
      device_type: payload.device_type || "Mobile",
      hour_of_day: payload.hour_of_day ?? new Date().getHours(),
      is_weekend: payload.is_weekend === 1 || payload.is_weekend === true,
    };

    console.log("📦 Prepared payload for FastAPI:", fastApiPayload);

    // Call your FastAPI backend
    const FASTAPI_URL = process.env.FASTAPI_URL || "http://localhost:5050";
    const apiUrl = `${FASTAPI_URL}/predict`;

    console.log("🚀 Calling FastAPI:", apiUrl);

    // Add timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(fastApiPayload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      console.log(`📡 FastAPI Response Status: ${response.status}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("❌ FastAPI Error:", errorData);

        // Return fallback prediction on error
        return NextResponse.json(
          {
            error: "Prediction service returned an error",
            details: errorData,
            fallback: true,
            ...generateFallbackPrediction(fastApiPayload),
          },
          { status: 200 } // Return 200 with fallback data
        );
      }

      const predictionData = await response.json();
      console.log("✅ Prediction successful:", {
        predicted_method: predictionData.prediction,
        confidence: predictionData.confidence,
      });

      // Transform response to match frontend expectations
      return NextResponse.json({
        predicted_method: predictionData.prediction,
        confidence: predictionData.confidence,
        confidence_level: predictionData.confidence_level,
        probabilities: predictionData.probabilities,
        user_profile: predictionData.user_profile,
        insights: predictionData.insights,
        is_new_user: predictionData.is_new_user,
        fallback: false,
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);

      // Handle connection refused or timeout - return fallback prediction
      if (
        fetchError.cause?.code === "ECONNREFUSED" ||
        fetchError.name === "AbortError"
      ) {
        console.warn(
          "⚠️ FastAPI server unreachable, using fallback prediction"
        );

        return NextResponse.json({
          ...generateFallbackPrediction(fastApiPayload),
          fallback: true,
          message: "Using fallback prediction - ML service unavailable",
        });
      }

      throw fetchError; // Re-throw other errors
    }
  } catch (error) {
    console.error("💥 Payment prediction error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
        suggestion: "Check if FastAPI server is running on the correct port",
      },
      { status: 500 }
    );
  }
}

// Fallback prediction logic based on simple heuristics
function generateFallbackPrediction(payload) {
  const price = payload.product_price;
  const age = payload.age;
  const deviceType = payload.device_type;

  // Simple rule-based prediction
  let predictedMethod = "upi";
  let upiProb = 0.5;
  let cardProb = 0.3;
  let codProb = 0.2;

  // High-value orders tend to use cards
  if (price > 5000) {
    predictedMethod = "card";
    cardProb = 0.55;
    upiProb = 0.3;
    codProb = 0.15;
  }
  // Low-value orders prefer UPI
  else if (price < 1000) {
    predictedMethod = "upi";
    upiProb = 0.6;
    cardProb = 0.2;
    codProb = 0.2;
  }

  // Younger users prefer UPI
  if (age < 30) {
    upiProb += 0.1;
    cardProb -= 0.05;
    codProb -= 0.05;
  }

  // Desktop users more likely to use cards
  if (deviceType === "Desktop") {
    cardProb += 0.1;
    upiProb -= 0.1;
  }

  // Normalize probabilities
  const total = upiProb + cardProb + codProb;
  upiProb = Math.round((upiProb / total) * 100) / 100;
  cardProb = Math.round((cardProb / total) * 100) / 100;
  codProb = Math.round((1 - upiProb - cardProb) * 100) / 100;

  // Determine which method has highest probability
  const maxProb = Math.max(upiProb, cardProb, codProb);
  if (maxProb === cardProb) predictedMethod = "card";
  else if (maxProb === codProb) predictedMethod = "cod";
  else predictedMethod = "upi";

  const confidence = maxProb;
  let confidenceLevel = "low";
  if (confidence > 0.7) confidenceLevel = "high";
  else if (confidence > 0.5) confidenceLevel = "medium";

  return {
    predicted_method: predictedMethod,
    confidence: confidence,
    confidence_level: confidenceLevel,
    probabilities: {
      upi: upiProb,
      card: cardProb,
      cod: codProb,
    },
    user_profile: {
      user_id: payload.user_id,
      age: payload.age,
      gender: payload.gender,
      occupation: payload.occupation,
      region: payload.region,
      device_type: payload.device_type,
    },
    insights: [
      `Based on ₹${price} price point`,
      `${payload.device_type} device preference`,
      "Rule-based fallback prediction",
    ],
    is_new_user: false,
  };
}
