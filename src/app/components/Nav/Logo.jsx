"use client";
import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
} from "firebase/auth";
import { signIn, signOut, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useColor } from "@/app/context/ColorContext";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export default function Logo() {
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hexColor, isDarkMode } = useColor();

  const redirectUrl = searchParams.get("redirect");
  const themeColor = hexColor || (isDarkMode ? "#A0A0A0" : "#D0D3D7");

  // Redirect if already logged in
  useEffect(() => {
    if (status === "authenticated" && session) {
      router.push(redirectUrl || "/");
    }
  }, [session, status, router, redirectUrl]);

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      if (displayName) {
        await updateProfile(userCredential.user, { displayName });
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Account created but login failed. Please try logging in.");
      } else {
        setMessage("Account created successfully!");
        setEmail("");
        setPassword("");
        setDisplayName("");
      }
    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        setError("This email is already registered. Please sign in instead.");
      } else if (err.code === "auth/weak-password") {
        setError("Password should be at least 6 characters.");
      } else if (err.code === "auth/invalid-email") {
        setError("Invalid email address.");
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password.");
      } else {
        setMessage("Logged in successfully!");
        setEmail("");
        setPassword("");
      }
    } catch (err) {
      setError("An error occurred during login.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    const callbackUrl = redirectUrl ? decodeURIComponent(redirectUrl) : "/";
    await signIn("google", { callbackUrl });
  };

  const handleLogout = async () => {
    try {
      await signOut({ redirect: false });
      setMessage("Logged out successfully!");
      router.push("/account");
    } catch (err) {
      setError(err.message);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      setError("Please enter your email address first");
      return;
    }
    setError("");
    setMessage("");

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage(
        "Password reset email sent! Check your inbox and spam folder."
      );
    } catch (err) {
      if (err.code === "auth/user-not-found") {
        setError("No account found with this email address");
      } else if (err.code === "auth/invalid-email") {
        setError("Invalid email address");
      } else if (err.code === "auth/too-many-requests") {
        setError("Too many requests. Please try again later.");
      } else {
        setError(`Error: ${err.message}`);
      }
      console.error("Password reset error:", err);
    }
  };

  if (status === "loading") {
    return (
      <div
        className="flex min-h-screen items-center justify-center transition-colors duration-300"
        style={{
          background: isDarkMode
            ? `linear-gradient(135deg, ${themeColor}15 0%, rgba(0,0,0,0.95) 100%)`
            : `linear-gradient(135deg, ${themeColor}20 0%, rgba(255,255,255,0.95) 100%)`,
        }}
      >
        <div
          className="h-12 w-12 animate-spin rounded-full border-b-2"
          style={{ borderColor: themeColor }}
        ></div>
      </div>
    );
  }

  if (session) {
    return (
      <div
        className="flex min-h-screen items-center justify-center transition-colors duration-300"
        style={{
          background: isDarkMode
            ? `linear-gradient(135deg, ${themeColor}15 0%, rgba(0,0,0,0.95) 100%)`
            : `linear-gradient(135deg, ${themeColor}20 0%, rgba(255,255,255,0.95) 100%)`,
        }}
      >
        <div
          className="w-full max-w-2xl rounded-3xl p-10 shadow-[0_4px_40px_rgba(0,0,0,0.08)] transition-all duration-500 hover:shadow-[0_6px_60px_rgba(0,0,0,0.1)]"
          style={{
            background: isDarkMode
              ? `linear-gradient(180deg, rgba(45,45,45,0.95), rgba(35,35,35,0.9))`
              : `linear-gradient(180deg, rgba(255,255,255,0.95), rgba(245,245,245,0.9))`,
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: `1px solid ${themeColor}40`,
          }}
        >
          <div className="mb-8 text-center">
            <div
              className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full"
              style={{
                background: `linear-gradient(135deg, ${themeColor}, ${themeColor}80)`,
                boxShadow: `0 8px 24px ${themeColor}40`,
              }}
            >
              <svg
                className="h-12 w-12 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <h1
              className="mb-2 text-3xl font-semibold tracking-tight"
              style={{
                color: isDarkMode ? "#FFFFFF" : "#3A3A3C",
              }}
            >
              Account Dashboard
            </h1>
            <p
              style={{
                color: isDarkMode ? "#A0A0A0" : "#6B7280",
              }}
            >
              Welcome back!
            </p>
          </div>

          {message && (
            <div
              className="mb-6 rounded-xl p-4"
              style={{
                border: `1px solid ${themeColor}40`,
                background: `${themeColor}15`,
                color: themeColor,
              }}
            >
              {message}
            </div>
          )}

          <div className="mb-8 space-y-4">
            <div
              className="flex items-center rounded-xl p-4"
              style={{
                background: isDarkMode
                  ? "rgba(45,45,45,0.5)"
                  : "rgba(245,245,245,0.8)",
                border: `1px solid ${themeColor}30`,
              }}
            >
              <svg
                className="mr-3 h-5 w-5"
                style={{ color: themeColor }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <div>
                <p
                  className="text-sm"
                  style={{
                    color: isDarkMode ? "#A0A0A0" : "#6B7280",
                  }}
                >
                  Display Name
                </p>
                <p
                  className="font-medium"
                  style={{
                    color: isDarkMode ? "#FFFFFF" : "#3A3A3C",
                  }}
                >
                  {session.user?.name || "Not set"}
                </p>
              </div>
            </div>

            <div
              className="flex items-center rounded-xl p-4"
              style={{
                background: isDarkMode
                  ? "rgba(45,45,45,0.5)"
                  : "rgba(245,245,245,0.8)",
                border: `1px solid ${themeColor}30`,
              }}
            >
              <svg
                className="mr-3 h-5 w-5"
                style={{ color: themeColor }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              <div>
                <p
                  className="text-sm"
                  style={{
                    color: isDarkMode ? "#A0A0A0" : "#6B7280",
                  }}
                >
                  Email Address
                </p>
                <p
                  className="font-medium"
                  style={{
                    color: isDarkMode ? "#FFFFFF" : "#3A3A3C",
                  }}
                >
                  {session.user?.email}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full rounded-xl py-3 font-semibold text-white shadow-lg transition active:scale-95"
            style={{
              background: "#EF4444",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#DC2626";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#EF4444";
            }}
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center transition-colors duration-300"
      style={{
        background: isDarkMode
          ? `linear-gradient(135deg, ${themeColor}15 0%, rgba(0,0,0,0.95) 100%)`
          : `linear-gradient(135deg, ${themeColor}20 0%, rgba(255,255,255,0.95) 100%)`,
      }}
    >
      <div
        className="w-full max-w-md rounded-3xl p-10 shadow-[0_4px_40px_rgba(0,0,0,0.08)] transition-all duration-500 hover:shadow-[0_6px_60px_rgba(0,0,0,0.1)]"
        style={{
          background: isDarkMode
            ? `linear-gradient(180deg, rgba(45,45,45,0.95), rgba(35,35,35,0.9))`
            : `linear-gradient(180deg, rgba(255,255,255,0.95), rgba(245,245,245,0.9))`,
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: `1px solid ${themeColor}40`,
        }}
      >
        <h1
          className="mb-8 text-center text-3xl font-semibold tracking-tight"
          style={{
            color: isDarkMode ? "#FFFFFF" : "#3A3A3C",
          }}
        >
          {isLogin ? (
            <>
              <span>Sign in to </span>
              <span className="font-bold" style={{ color: themeColor }}>
                Emzon
              </span>
            </>
          ) : (
            <>
              <span>Create </span>
              <span className="font-bold" style={{ color: themeColor }}>
                Emzon
              </span>
              <span> Account</span>
            </>
          )}
        </h1>

        {error && (
          <div
            className="mb-6 rounded-xl p-4 text-sm"
            style={{
              border: "1px solid rgba(239, 68, 68, 0.3)",
              background: "rgba(239, 68, 68, 0.1)",
              color: "#EF4444",
            }}
          >
            {error}
          </div>
        )}
        {message && (
          <div
            className="mb-6 rounded-xl p-4 text-sm"
            style={{
              border: `1px solid ${themeColor}40`,
              background: `${themeColor}15`,
              color: themeColor,
            }}
          >
            {message}
          </div>
        )}

        <div className="mb-8 space-y-4">
          {!isLogin && (
            <input
              type="text"
              placeholder="Display Name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full rounded-xl px-4 py-3 transition focus:ring-1 focus:outline-none"
              style={{
                background: isDarkMode ? "rgba(45,45,45,0.7)" : "#FFFFFF",
                border: `1px solid ${themeColor}40`,
                color: isDarkMode ? "#FFFFFF" : "#3A3A3C",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = themeColor;
                e.target.style.boxShadow = `0 0 0 1px ${themeColor}`;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = `${themeColor}40`;
                e.target.style.boxShadow = "none";
              }}
            />
          )}
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl px-4 py-3 transition focus:ring-1 focus:outline-none"
            style={{
              background: isDarkMode ? "rgba(45,45,45,0.7)" : "#FFFFFF",
              border: `1px solid ${themeColor}40`,
              color: isDarkMode ? "#FFFFFF" : "#3A3A3C",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = themeColor;
              e.target.style.boxShadow = `0 0 0 1px ${themeColor}`;
            }}
            onBlur={(e) => {
              e.target.style.borderColor = `${themeColor}40`;
              e.target.style.boxShadow = "none";
            }}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl px-4 py-3 transition focus:ring-1 focus:outline-none"
            style={{
              background: isDarkMode ? "rgba(45,45,45,0.7)" : "#FFFFFF",
              border: `1px solid ${themeColor}40`,
              color: isDarkMode ? "#FFFFFF" : "#3A3A3C",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = themeColor;
              e.target.style.boxShadow = `0 0 0 1px ${themeColor}`;
            }}
            onBlur={(e) => {
              e.target.style.borderColor = `${themeColor}40`;
              e.target.style.boxShadow = "none";
            }}
            required
          />
          <button
            onClick={isLogin ? handleLogin : handleSignup}
            disabled={loading}
            className="w-full rounded-xl py-3 font-semibold text-white shadow-lg transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: `linear-gradient(135deg, ${themeColor}, ${themeColor}CC)`,
              boxShadow: `0 4px 16px ${themeColor}40`,
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = `0 6px 24px ${themeColor}60`;
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = `0 4px 16px ${themeColor}40`;
              }
            }}
          >
            {loading ? "Processing..." : isLogin ? "Sign in" : "Create Account"}
          </button>
        </div>

        {isLogin && (
          <button
            onClick={handlePasswordReset}
            className="mb-6 w-full text-center text-sm transition hover:underline"
            style={{
              color: isDarkMode ? "#A0A0A0" : "#6B7280",
            }}
          >
            Forgot Password?
          </button>
        )}

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div
              className="w-full border-t"
              style={{
                borderColor: `${themeColor}30`,
              }}
            ></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span
              className="px-3"
              style={{
                background: isDarkMode
                  ? "rgba(35,35,35,0.9)"
                  : "rgba(255,255,255,0.9)",
                color: isDarkMode ? "#A0A0A0" : "#6B7280",
              }}
            >
              or
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          className="w-full rounded-xl py-3 font-medium transition active:scale-95"
          style={{
            background: isDarkMode ? "rgba(45,45,45,0.7)" : "#FFFFFF",
            border: `1px solid ${themeColor}40`,
            color: isDarkMode ? "#FFFFFF" : "#3A3A3C",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = isDarkMode
              ? "rgba(55,55,55,0.8)"
              : "rgba(245,245,245,0.8)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = isDarkMode
              ? "rgba(45,45,45,0.7)"
              : "#FFFFFF";
          }}
        >
          Continue with Google
        </button>

        <p
          className="mt-8 text-center text-sm"
          style={{
            color: isDarkMode ? "#A0A0A0" : "#6B7280",
          }}
        >
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError("");
              setMessage("");
            }}
            className="cursor-pointer hover:underline"
            style={{
              color: themeColor,
            }}
          >
            {isLogin ? "Create one" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}
