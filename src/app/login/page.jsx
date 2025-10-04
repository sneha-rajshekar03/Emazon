"use client";
import React, { useState, useEffect } from "react";
import { signIn, getProviders, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

export default function SignInPage() {
  const [providers, setProviders] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

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
    <div className="flex min-h-screen items-center justify-center bg-white text-[#3A3A3C]">
      {/* Glass Card */}
      <div className="w-full max-w-md rounded-3xl backdrop-blur-2xl bg-white/70 border border-gray-200 p-10 shadow-[0_4px_40px_rgba(0,0,0,0.08)] transition-all duration-500 hover:shadow-[0_6px_60px_rgba(0,0,0,0.1)]">
        {/* Header */}
        <h1 className="mb-8 text-center text-3xl font-semibold tracking-tight text-[#3A3A3C]">
          Sign in to <span className="font-bold">Emzon</span>
        </h1>

        {/* Email Login */}
        <form onSubmit={handleAmazonLogin} className="mb-8 space-y-4">
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-[#3A3A3C] placeholder-gray-500 focus:border-black focus:ring-1 focus:ring-black transition"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-[#3A3A3C] placeholder-gray-500 focus:border-black focus:ring-1 focus:ring-black transition"
            required
          />
          <button
            type="submit"
            className="w-full rounded-xl bg-gradient-to-r from-gray-800 to-black py-3 font-semibold text-white transition hover:from-gray-700 hover:to-gray-900 active:scale-95 shadow-lg hover:shadow-gray-800/30"
          >
            Sign in
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white/70 px-3 text-gray-500">or</span>
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
                  className="w-full rounded-xl border border-gray-300 bg-white py-3 font-medium text-[#3A3A3C] hover:bg-gray-100 transition active:scale-95"
                >
                  Continue with Google
                </button>
              )
          )}

        {/* Footer */}
        <p className="mt-8 text-center text-sm text-gray-500">
          Don’t have an account?{" "}
          <span className="text-[#3A3A3C] hover:underline cursor-pointer">
            Create one
          </span>
        </p>
      </div>
    </div>
  );
}
