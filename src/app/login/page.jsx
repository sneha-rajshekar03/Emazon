"use client";
import React, { useState, useEffect } from "react";
import { signIn, getProviders } from "next-auth/react";

export default function LoginPage() {
  const [providers, setProviders] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // fetch NextAuth providers (like Google, GitHub, etc.)
  useEffect(() => {
    const fetchProviders = async () => {
      const resp = await getProviders();
      setProviders(resp);
    };
    fetchProviders();
  }, []);

  // Amazon/email login (dummy for now, you can connect to your backend)
  const handleAmazonLogin = (e) => {
    e.preventDefault();
    console.log("Amazon login:", { email, password });
    // TODO: call your API or NextAuth Email provider
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
        <h1 className="mb-6 text-center text-2xl font-bold">Login to Ezon</h1>

        {/* Amazon/email login form */}
        <form onSubmit={handleAmazonLogin} className="mb-6 space-y-4">
          <input
            type="email"
            placeholder="Emzon Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border p-2"
            required
          />
          <input
            type="password"
            placeholder="Emzon Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border p-2"
            required
          />
          <button
            type="submit"
            className="w-full rounded-lg bg-amber-500 py-2 font-semibold text-white hover:bg-amber-600"
          >
            Login with Emzon
          </button>
        </form>

        {/* Divider */}
        <div className="mb-6 flex items-center">
          <hr className="flex-1 border-gray-300" />
          <span className="px-2 text-gray-500">OR</span>
          <hr className="flex-1 border-gray-300" />
        </div>

        {/* Google login */}
        {providers &&
          Object.values(providers).map(
            (provider) =>
              provider.id === "google" && (
                <button
                  type="button"
                  key={provider.name}
                  onClick={() => signIn(provider.id)}
                  className="w-full rounded-lg border border-gray-300 bg-white py-2 font-semibold text-gray-700 hover:bg-gray-100"
                >
                  Continue with {provider.name}
                </button>
              )
          )}
      </div>
    </div>
  );
}
