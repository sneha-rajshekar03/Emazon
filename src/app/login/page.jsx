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

export default function AccountPage() {
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(true);
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const redirectUrl = searchParams.get("redirect");

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
      // Create user in Firebase
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      if (displayName) {
        await updateProfile(userCredential.user, { displayName });
      }

      // Now sign in with NextAuth using credentials
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
        className={`flex min-h-screen items-center justify-center transition-colors duration-300 ${
          isDarkMode ? "bg-black" : "bg-white"
        }`}
      >
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-white"></div>
      </div>
    );
  }

  if (session) {
    return (
      <div
        className={`flex min-h-screen items-center justify-center transition-colors duration-300 ${
          isDarkMode ? "bg-black" : "bg-white"
        }`}
      >
        <div
          className={`w-full max-w-2xl rounded-3xl border p-10 shadow-[0_4px_40px_rgba(0,0,0,0.08)] backdrop-blur-2xl transition-all duration-500 hover:shadow-[0_6px_60px_rgba(0,0,0,0.1)] ${
            isDarkMode
              ? "border-zinc-800 bg-zinc-900/70"
              : "border-gray-200 bg-white/70"
          }`}
        >
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
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
              className={`mb-2 text-3xl font-semibold tracking-tight ${
                isDarkMode ? "text-white" : "text-[#3A3A3C]"
              }`}
            >
              Account Dashboard
            </h1>
            <p className={isDarkMode ? "text-zinc-500" : "text-gray-500"}>
              Welcome back!
            </p>
          </div>

          {message && (
            <div className="mb-6 rounded-xl border border-green-500/20 bg-green-500/10 p-4 text-green-400">
              {message}
            </div>
          )}

          <div className="mb-8 space-y-4">
            <div
              className={`flex items-center rounded-xl border p-4 ${
                isDarkMode
                  ? "border-zinc-800 bg-zinc-800/50"
                  : "border-gray-200 bg-gray-50"
              }`}
            >
              <svg
                className={`mr-3 h-5 w-5 ${
                  isDarkMode ? "text-zinc-500" : "text-gray-500"
                }`}
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
                  className={`text-sm ${
                    isDarkMode ? "text-zinc-500" : "text-gray-500"
                  }`}
                >
                  Display Name
                </p>
                <p
                  className={`font-medium ${
                    isDarkMode ? "text-white" : "text-[#3A3A3C]"
                  }`}
                >
                  {session.user?.name || "Not set"}
                </p>
              </div>
            </div>

            <div
              className={`flex items-center rounded-xl border p-4 ${
                isDarkMode
                  ? "border-zinc-800 bg-zinc-800/50"
                  : "border-gray-200 bg-gray-50"
              }`}
            >
              <svg
                className={`mr-3 h-5 w-5 ${
                  isDarkMode ? "text-zinc-500" : "text-gray-500"
                }`}
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
                  className={`text-sm ${
                    isDarkMode ? "text-zinc-500" : "text-gray-500"
                  }`}
                >
                  Email Address
                </p>
                <p
                  className={`font-medium ${
                    isDarkMode ? "text-white" : "text-[#3A3A3C]"
                  }`}
                >
                  {session.user?.email}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className={`w-full rounded-xl py-3 font-semibold text-white shadow-lg transition active:scale-95 ${
              isDarkMode
                ? "bg-red-600 hover:bg-red-700"
                : "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
            }`}
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex min-h-screen items-center justify-center transition-colors duration-300 ${
        isDarkMode ? "bg-black" : "bg-white"
      }`}
    >
      <div
        className={`w-full max-w-md rounded-3xl border p-10 shadow-[0_4px_40px_rgba(0,0,0,0.08)] backdrop-blur-2xl transition-all duration-500 hover:shadow-[0_6px_60px_rgba(0,0,0,0.1)] ${
          isDarkMode
            ? "border-zinc-800 bg-zinc-900/70"
            : "border-gray-200 bg-white/70"
        }`}
      >
        <h1
          className={`mb-8 text-center text-3xl font-semibold tracking-tight ${
            isDarkMode ? "text-white" : "text-[#3A3A3C]"
          }`}
        >
          {isLogin ? (
            <>
              <span>Sign in to </span>
              <span className="font-bold">Emzon</span>
            </>
          ) : (
            <>
              <span>Create </span>
              <span className="font-bold">Emzon</span>
              <span> Account</span>
            </>
          )}
        </h1>

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
            {error}
          </div>
        )}
        {message && (
          <div className="mb-6 rounded-xl border border-green-500/20 bg-green-500/10 p-4 text-sm text-green-400">
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
              className={`w-full rounded-xl border px-4 py-3 transition focus:ring-1 ${
                isDarkMode
                  ? "border-zinc-700 bg-zinc-800 text-white placeholder-zinc-500 focus:border-white focus:ring-white"
                  : "border-gray-300 bg-white text-[#3A3A3C] placeholder-gray-500 focus:border-black focus:ring-black"
              }`}
            />
          )}
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`w-full rounded-xl border px-4 py-3 transition focus:ring-1 ${
              isDarkMode
                ? "border-zinc-700 bg-zinc-800 text-white placeholder-zinc-500 focus:border-white focus:ring-white"
                : "border-gray-300 bg-white text-[#3A3A3C] placeholder-gray-500 focus:border-black focus:ring-black"
            }`}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`w-full rounded-xl border px-4 py-3 transition focus:ring-1 ${
              isDarkMode
                ? "border-zinc-700 bg-zinc-800 text-white placeholder-zinc-500 focus:border-blue-500 focus:ring-blue-500"
                : "border-gray-300 bg-white text-[#3A3A3C] placeholder-gray-500 focus:border-black focus:ring-black"
            }`}
            required
          />
          <button
            onClick={isLogin ? handleLogin : handleSignup}
            disabled={loading}
            className={`w-full rounded-xl py-3 font-semibold text-white shadow-lg transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
              isDarkMode
                ? "bg-black hover:bg-zinc-800"
                : "bg-gradient-to-r from-gray-800 to-black hover:from-gray-700 hover:to-gray-900 hover:shadow-gray-800/30"
            }`}
          >
            {loading ? "Processing..." : isLogin ? "Sign in" : "Create Account"}
          </button>
        </div>

        {isLogin && (
          <button
            onClick={handlePasswordReset}
            className={`mb-6 w-full text-center text-sm transition hover:underline ${
              isDarkMode ? "text-zinc-500" : "text-gray-500"
            }`}
          >
            Forgot Password?
          </button>
        )}

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div
              className={`w-full border-t ${
                isDarkMode ? "border-zinc-700" : "border-gray-300"
              }`}
            ></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span
              className={`px-3 ${
                isDarkMode
                  ? "bg-zinc-900/70 text-zinc-500"
                  : "bg-white/70 text-gray-500"
              }`}
            >
              or
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          className={`w-full rounded-xl border py-3 font-medium transition active:scale-95 ${
            isDarkMode
              ? "bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
              : "bg-white border-gray-300 text-[#3A3A3C] hover:bg-gray-100"
          }`}
        >
          Continue with Google
        </button>

        <p
          className={`mt-8 text-center text-sm ${
            isDarkMode ? "text-zinc-500" : "text-gray-500"
          }`}
        >
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError("");
              setMessage("");
            }}
            className={`cursor-pointer hover:underline ${
              isDarkMode ? "text-white" : "text-[#3A3A3C]"
            }`}
          >
            {isLogin ? "Create one" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}
