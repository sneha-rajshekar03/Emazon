// app/api/newsletter/route.js
// FUNCTIONAL VERSION - DATABASE + EMAIL SENDING (NODEMAILER)

import { NextResponse } from "next/server";
import { connectToDB } from "@/app/utils/database";
import Newsletter from "@/app/models/Newsletter";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import nodemailer from "nodemailer";

// Create email transporter
const transporter = nodemailer.createTransport({
  service: "gmail", // or 'hotmail', 'yahoo', etc.
  auth: {
    user: process.env.EMAIL_USER, // Your email
    pass: process.env.EMAIL_PASSWORD, // Your email password or app password
  },
});

// Email templates
const getWelcomeEmail = (email) => ({
  from: `"Emzon" <${process.env.EMAIL_USER}>`,
  to: email,
  subject: "Welcome to Our Newsletter! 🎉",
  html: `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">
                      Welcome Aboard! 
                    </h1>
                  </td>
                </tr>
                
                <!-- Body -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 22px;">
                      Thanks for subscribing!
                    </h2>
                    
                    <p style="color: #666666; line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">
                      We're thrilled to have you as part of our community. You'll now receive:
                    </p>
                    
                    <ul style="color: #666666; line-height: 1.8; margin: 0 0 30px 0; padding-left: 20px;">
                      <li>Exclusive offers and early access to deals</li>
                      <li>Latest updates and product launches</li>
                      <li>Tips, tricks, and valuable insights</li>
                      <li>Special subscriber-only content</li>
                    </ul>
                    
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                      <tr>
                        <td align="center">
                          <a href="https://yourdomain.com" style="display: inline-block; padding: 14px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                            Visit Our Website
                          </a>
                        </td>
                      </tr>
                    </table>
                    
                    <p style="color: #666666; line-height: 1.6; margin: 20px 0 0 0; font-size: 14px;">
                      Stay tuned for our next update!
                    </p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
                    <p style="color: #999999; margin: 0 0 10px 0; font-size: 14px;">
                      You're receiving this email because you subscribed to our newsletter.
                    </p>
                    <p style="color: #999999; margin: 0; font-size: 12px;">
                      <a href="https://yourdomain.com/unsubscribe?email=${encodeURIComponent(
                        email
                      )}" style="color: #667eea; text-decoration: none;">
                        Unsubscribe
                      </a> | 
                      <a href="https://yourdomain.com" style="color: #667eea; text-decoration: none;">
                        Visit Website
                      </a>
                    </p>
                  </td>
                </tr>
                
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `,
  text: `
    Welcome to Our Newsletter!
    
    Thanks for subscribing! We're thrilled to have you as part of our community.
    
    You'll now receive:
    - Exclusive offers and early access to deals
    - Latest updates and product launches
    - Tips, tricks, and valuable insights
    - Special subscriber-only content
    
    Visit our website: https://yourdomain.com
    
    Stay tuned for our next update!
  `,
});

const getReturningUserEmail = (email) => ({
  from: `"Emzon" <${process.env.EMAIL_USER}>`,
  to: email,
  subject: "Welcome Back! We've Missed You 💜",
  html: `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 40px 30px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">
                      Welcome Back! 
                    </h1>
                  </td>
                </tr>
                
                <!-- Body -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 22px;">
                      Great to see you again!
                    </h2>
                    
                    <p style="color: #666666; line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">
                      Thanks for reconnecting with us! As a valued returning subscriber, you'll continue to enjoy:
                    </p>
                    
                    <div style="background-color: #fff5f5; border-left: 4px solid #f5576c; padding: 20px; margin: 20px 0; border-radius: 4px;">
                      <p style="color: #333333; margin: 0; font-size: 16px; font-weight: bold;">
                        🎁 Special Welcome Back Offer
                      </p>
                      <p style="color: #666666; margin: 10px 0 0 0; font-size: 14px;">
                        Check your inbox for an exclusive discount coming your way soon!
                      </p>
                    </div>
                    
                    <ul style="color: #666666; line-height: 1.8; margin: 20px 0 30px 0; padding-left: 20px;">
                      <li>Priority access to new features</li>
                      <li>Exclusive deals you won't find anywhere else</li>
                      <li>Personalized recommendations</li>
                    </ul>
                    
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                      <tr>
                        <td align="center">
                          <a href="https://yourdomain.com/offers" style="display: inline-block; padding: 14px 40px; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                            View Latest Offers
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
                    <p style="color: #999999; margin: 0 0 10px 0; font-size: 14px;">
                      You're receiving this email because you're a valued subscriber.
                    </p>
                    <p style="color: #999999; margin: 0; font-size: 12px;">
                      <a href="https://yourdomain.com/unsubscribe?email=${encodeURIComponent(
                        email
                      )}" style="color: #f5576c; text-decoration: none;">
                        Unsubscribe
                      </a> | 
                      <a href="https://yourdomain.com" style="color: #f5576c; text-decoration: none;">
                        Visit Website
                      </a>
                    </p>
                  </td>
                </tr>
                
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `,
  text: `
    Welcome Back! We've Missed You
    
    Great to see you again! Thanks for reconnecting with us.
    
    As a valued returning subscriber, you'll continue to enjoy:
    - Priority access to new features
    - Exclusive deals you won't find anywhere else
    - Personalized recommendations
    
    Special Welcome Back Offer: Check your inbox for an exclusive discount coming your way soon!
    
    Visit our website: https://yourdomain.com/offers
  `,
});

export async function POST(req) {
  try {
    console.log("🔥 Newsletter API HIT");

    // Connect to database
    await connectToDB();
    console.log("✅ DB connected");

    const body = await req.json();
    console.log("📦 Request body:", body);

    const { email } = body;

    // Validate email
    if (!email) {
      console.log("❌ Email missing");
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log("❌ Invalid email format");
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Get session if available
    const session = await getServerSession(authOptions);
    console.log("👤 Session:", session?.user?.email);

    // Use session email if available, otherwise use provided email
    const userEmail = session?.user?.email || email;
    console.log("📩 Final email used:", userEmail);

    // Check if already subscribed
    const existing = await Newsletter.findOne({
      email: userEmail.toLowerCase().trim(),
    });
    console.log("🔎 Existing subscriber:", existing);

    if (existing) {
      // Send returning user email
      try {
        console.log("📧 Sending returning user email...");
        const emailData = getReturningUserEmail(userEmail);
        await transporter.sendMail(emailData);
        console.log("✅ Returning user email sent successfully");
      } catch (emailError) {
        console.error("❌ Email sending failed:", emailError);
        // Don't fail the request if email fails
      }

      return NextResponse.json(
        {
          message:
            "Thanks for coming back! We'll keep you updated with exclusive offers.",
          isReturning: true,
        },
        { status: 200 }
      );
    }

    // Create new subscriber
    const saved = await Newsletter.create({
      email: userEmail.toLowerCase().trim(),
      source: "newsletter",
      subscribedAt: new Date(),
    });

    console.log("✅ Saved to DB:", saved);

    // Send welcome email to new subscriber
    try {
      console.log("📧 Sending welcome email...");
      const emailData = getWelcomeEmail(userEmail);
      await transporter.sendMail(emailData);
      console.log("✅ Welcome email sent successfully");
    } catch (emailError) {
      console.error("❌ Email sending failed:", emailError);
      // Don't fail the request if email fails - user is still subscribed
    }

    console.log("✅ New subscriber added successfully");

    return NextResponse.json(
      {
        message:
          "Successfully subscribed! Check your email for a welcome message.",
        isReturning: false,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ Newsletter API error:", error);

    // Handle duplicate key error
    if (error.code === 11000) {
      return NextResponse.json(
        { error: "This email is already subscribed" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to subscribe. Please try again later." },
      { status: 500 }
    );
  }
}
