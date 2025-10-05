"use client";
import React, { useState, useEffect } from "react";
import { signIn, getProviders, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useColor } from "@app/context/ColorContext";

export default function SignInPage() {
  const [providers, setProviders] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hexColor, isDarkMode } = useColor();

  const redirectUrl = searchParams.get("redirect");

  useEffect(() => {
    if (session) {
      router.push(redirectUrl || "/");
    }
  }, [session, router, redirectUrl]);

  useEffect(() => {
    const fetchProviders = async () => {
      const resp = await getProviders();
      setProviders(resp);
    };
    fetchProviders();
  }, []);

  const handleAmazonLogin = (e) => {
    e.preventDefault();
    console.log("Emzon login:", { email, password });
  };

  const handleGoogleSignIn = async (providerId) => {
    const callbackUrl = redirectUrl ? decodeURIComponent(redirectUrl) : "/";
    await signIn(providerId, { callbackUrl });
  };

  return (
    <div
      className={`flex min-h-screen items-center justify-center transition-colors duration-300 ${
        isDarkMode ? "bg-black" : "bg-white"
      }`}
    >
      {/* Glass Card */}
      <div
        className={`w-full max-w-md rounded-3xl backdrop-blur-2xl border p-10 shadow-[0_4px_40px_rgba(0,0,0,0.08)] transition-all duration-500 hover:shadow-[0_6px_60px_rgba(0,0,0,0.1)] ${
          isDarkMode
            ? "bg-zinc-900/70 border-zinc-800"
            : "bg-white/70 border-gray-200"
        }`}
      >
        {/* Header */}
        <h1
          className={`mb-8 text-center text-3xl font-semibold tracking-tight ${
            isDarkMode ? "text-white" : "text-[#3A3A3C]"
          }`}
        >
          Sign in to <span className="font-bold">Emzon</span>
        </h1>

        {/* Email Login */}
        <form onSubmit={handleAmazonLogin} className="mb-8 space-y-4">
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`w-full rounded-xl border px-4 py-3 transition focus:ring-1 ${
              isDarkMode
                ? "bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500 focus:border-white focus:ring-white"
                : "bg-white border-gray-300 text-[#3A3A3C] placeholder-gray-500 focus:border-black focus:ring-black"
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
                ? "bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500 focus:border-blue-500 focus:ring-blue-500"
                : "bg-white border-gray-300 text-[#3A3A3C] placeholder-gray-500 focus:border-black focus:ring-black"
            }`}
            required
          />
          <button
            type="submit"
            className={`w-full rounded-xl py-3 font-semibold text-white transition active:scale-95 shadow-lg ${
              isDarkMode
                ? "bg-black  text-white hover:bg-zinc-100"
                : "bg-gradient-to-r from-gray-800 to-black hover:from-gray-700 hover:to-gray-900 hover:shadow-gray-800/30"
            }`}
          >
            Sign in
          </button>
        </form>

        {/* Divider */}
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

        {/* Google Sign-In */}
        {providers &&
          Object.values(providers).map(
            (provider) =>
              provider.id === "google" && (
                <button
                  type="button"
                  key={provider.name}
                  onClick={() => handleGoogleSignIn(provider.id)}
                  className={`w-full rounded-xl border py-3 font-medium transition active:scale-95 ${
                    isDarkMode
                      ? "bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
                      : "bg-white border-gray-300 text-[#3A3A3C] hover:bg-gray-100"
                  }`}
                >
                  Continue with Google
                </button>
              )
          )}

        {/* Footer */}
        <p
          className={`mt-8 text-center text-sm ${
            isDarkMode ? "text-zinc-500" : "text-gray-500"
          }`}
        >
          Don't have an account?{" "}
          <span
            className={`hover:underline cursor-pointer ${
              isDarkMode ? "text-white" : "text-[#3A3A3C]"
            }`}
          >
            Create one
          </span>
        </p>
      </div>
    </div>
  );
}
