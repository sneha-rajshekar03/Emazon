// app/api/product-interaction/route.js
import { NextResponse } from "next/server";

const ML_API_URL = process.env.ML_API_URL || "http://localhost:8000";

export async function POST(request) {
  try {
    const body = await request.json();

    const signalType = body.weak_signal ? "WEAK (view)" : "STRONG (click)";
    const emoji = body.weak_signal ? "🟦" : "🟣";

    console.log(`${emoji} [Next.js] ${signalType}:`, {
      user_id: body.user_id,
      product_id: body.product_id,
      category: body.category,
    });

    // Forward to FastAPI
    const response = await fetch(`${ML_API_URL}/user/interaction`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ [FastAPI] Error:", response.status, errorText);

      return NextResponse.json(
        {
          success: false,
          error: `Backend returned ${response.status}`,
          total_clicks: 0, // ✅ Default value
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    // ✅ Extract total_clicks safely
    const totalClicks = data.total_clicks !== undefined ? data.total_clicks : 0;

    console.log(`✅ [FastAPI] ${signalType} recorded:`, {
      status: data.status,
      total_clicks: totalClicks,
    });

    // ✅ Return consistent structure
    return NextResponse.json({
      success: true,
      status: data.status || "success",
      user_id: data.user_id || body.user_id,
      total_clicks: totalClicks, // ✅ ALWAYS present
      ml_response: {
        total_clicks: totalClicks, // ✅ Also in ml_response for backwards compat
        updated_preferences: data.updated_preferences || {},
      },
    });
  } catch (error) {
    console.error("❌ [Next.js] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        total_clicks: 0, // ✅ Default value
      },
      { status: 500 }
    );
  }
}
