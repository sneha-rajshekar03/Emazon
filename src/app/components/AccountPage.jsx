"use client";

import React, { useState, useEffect } from "react";
import { auth } from "../../lib/firebaseClient";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
} from "firebase/auth";

import { signIn, signOut, useSession } from "next-auth/react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useColor } from "@/app/context/ColorContext";
import { FcGoogle } from "react-icons/fc";

export default function AccountPage() {
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
  const pathname = usePathname();
  const { hexColor, isDarkMode } = useColor();

  const redirectUrl = searchParams.get("redirect");
  const themeColor = hexColor || (isDarkMode ? "#A0A0A0" : "#333");

  // Redirect authenticated users
  useEffect(() => {
    if (status === "authenticated" && session) {
      router.replace(redirectUrl || "/");
    }
  }, [status, session, router, redirectUrl]);

  // SIGNUP
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
        setError("Account created but login failed. Try signing in.");
      } else {
        router.replace("/");
      }
    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        setError("Email already registered. Please sign in.");
      } else if (err.code === "auth/weak-password") {
        setError("Password must be at least 6 characters.");
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // LOGIN
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
        router.replace("/");
      }
    } catch {
      setError("Login failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  // GOOGLE
  const handleGoogleSignIn = async () => {
    try {
      const callbackUrl = redirectUrl ? decodeURIComponent(redirectUrl) : "/";
      await signIn("google", { callbackUrl });
    } catch {
      setError("Google sign-in failed. Try again.");
    }
  };

  // RESET PASSWORD
  const handlePasswordReset = async () => {
    if (!email) return setError("Enter your email first");

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("Password reset email sent!");
    } catch (err) {
      setError(err.message);
    }
  };

  // LOGOUT
  const handleLogout = async () => {
    try {
      await signOut({ redirect: false });
      router.push("/login");
    } catch (err) {
      setError(err.message);
    }
  };

  // LOADING STATE
  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div
          className="h-12 w-12 animate-spin rounded-full border-b-2"
          style={{ borderColor: themeColor }}
        ></div>
      </div>
    );
  }

  // AUTHENTICATED DASHBOARD
  if (session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div
          className="w-full max-w-lg rounded-3xl p-10 text-center shadow-lg"
          style={{
            background: isDarkMode ? "rgba(45,45,45,0.9)" : "#fff",
            border: `1px solid ${themeColor}40`,
          }}
        >
          <h1 className="text-3xl font-bold">Account Dashboard</h1>

          <p className="mt-4">{session.user?.name || "User"}</p>
          <p className="mb-6 text-gray-500">{session.user?.email}</p>

          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-6 py-3 rounded-xl"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  // LOGIN / SIGNUP FORM
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div
        className="w-full max-w-md p-10 rounded-3xl shadow-lg"
        style={{
          background: isDarkMode ? "rgba(35,35,35,0.95)" : "#fff",
          border: `1px solid ${themeColor}40`,
        }}
      >
        <h1 className="text-3xl font-bold text-center mb-8">
          {isLogin ? "Sign in to Emzon" : "Create an Emzon Account"}
        </h1>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-600 rounded">
            {error}
          </div>
        )}
        {message && (
          <div
            className="mb-4 p-3 rounded"
            style={{
              background: `${themeColor}15`,
              color: themeColor,
            }}
          >
            {message}
          </div>
        )}

        {!isLogin && (
          <input
            type="text"
            placeholder="Display Name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full mb-3 p-3 rounded border"
          />
        )}

        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-3 p-3 rounded border"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-6 p-3 rounded border"
        />

        <button
          onClick={isLogin ? handleLogin : handleSignup}
          disabled={loading}
          className="w-full py-3 rounded-lg font-semibold text-white"
          style={{
            background: themeColor,
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? "Processing..." : isLogin ? "Sign In" : "Create Account"}
        </button>

        {/* Google Login */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-3 bg-white text-gray-500">or</span>
          </div>
        </div>

        <button
          onClick={handleGoogleSignIn}
          className="w-full flex items-center justify-center gap-3 py-3 rounded-lg border"
        >
          <FcGoogle className="text-xl" /> Continue with Google
        </button>

        {isLogin && (
          <button
            onClick={handlePasswordReset}
            className="w-full mt-4 text-sm text-gray-500 underline"
          >
            Forgot Password?
          </button>
        )}

        <p className="mt-8 text-center text-sm">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError("");
              setMessage("");
            }}
            className="font-semibold underline"
            style={{ color: themeColor }}
          >
            {isLogin ? "Create one" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}
