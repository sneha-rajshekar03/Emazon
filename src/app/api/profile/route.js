import { NextResponse } from "next/server";
import { connectToDB } from "@app/utils/database";
import Profile from "@app/models/Profile";
import User from "@app/models/user";

// GET - Fetch profile by userId
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "UserId is required" },
        { status: 400 }
      );
    }

    await connectToDB();

    // Fetch profile and populate user details
    const profile = await Profile.findOne({ userId }).lean();

    if (!profile) {
      return NextResponse.json(
        { success: false, error: "Profile not found" },
        { status: 404 }
      );
    }

    // Optionally fetch associated user data
    const user = await User.findById(userId)
      .select("username email image color")
      .lean();

    return NextResponse.json({
      success: true,
      data: {
        ...profile,
        user: user || null,
      },
    });
  } catch (error) {
    console.error("GET Profile Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST - Create new profile
export async function POST(request) {
  try {
    const body = await request.json();

    // COMPREHENSIVE DEBUG LOGGING
    console.log("=== POST Profile Debug ===");
    console.log("Full body:", JSON.stringify(body, null, 2));
    console.log("Body keys:", Object.keys(body));
    console.log("userId:", body.userId);
    console.log("_id:", body._id);
    console.log("user:", body.user);
    console.log("==========================");

    // Extract userId from various possible locations
    let userIdToUse = null;

    if (body.userId) {
      userIdToUse = body.userId;
    } else if (body._id) {
      // Handle MongoDB ObjectId format
      userIdToUse = typeof body._id === "string" ? body._id : body._id.$oid;
    } else if (body.user?._id) {
      userIdToUse =
        typeof body.user._id === "string" ? body.user._id : body.user._id.$oid;
    }

    console.log("Extracted userIdToUse:", userIdToUse);

    if (!userIdToUse) {
      console.error("ERROR: No userId found in request body");
      return NextResponse.json(
        {
          success: false,
          error: "UserId is required",
          debug: {
            receivedKeys: Object.keys(body),
            bodyStructure: Object.keys(body).reduce((acc, key) => {
              acc[key] = typeof body[key];
              return acc;
            }, {}),
          },
        },
        { status: 400 }
      );
    }

    await connectToDB();

    // Check if user exists (using the ObjectId string)
    const userExists = await User.findById(userIdToUse);
    if (!userExists) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Check if profile already exists
    const existingProfile = await Profile.findOne({ userId: userIdToUse });
    if (existingProfile) {
      return NextResponse.json(
        { success: false, error: "Profile already exists for this user" },
        { status: 409 }
      );
    }

    // Create new profile
    const profile = await Profile.create({
      ...body,
      userId: userIdToUse,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({ success: true, data: profile }, { status: 201 });
  } catch (error) {
    console.error("POST Profile Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}

// PUT - Update existing profile
export async function PUT(request) {
  try {
    const body = await request.json();
    const { userId, ...updateData } = body;

    console.log("=== PUT Profile Debug ===");
    console.log("userId:", userId);
    console.log("updateData:", updateData);
    console.log("========================");

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "UserId is required" },
        { status: 400 }
      );
    }

    await connectToDB();

    // Use $set operator for proper updates
    const profile = await Profile.findOneAndUpdate(
      { userId },
      {
        $set: {
          ...updateData,
          updatedAt: new Date(),
        },
      },
      {
        new: true, // Return updated document
        runValidators: true, // Run schema validators
        upsert: true, // Create if doesn't exist
      }
    );

    if (!profile) {
      return NextResponse.json(
        { success: false, error: "Failed to update profile" },
        { status: 500 }
      );
    }

    console.log("✅ Profile updated successfully:", profile.preferredLanguage);

    return NextResponse.json({ success: true, data: profile });
  } catch (error) {
    console.error("PUT Profile Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}
