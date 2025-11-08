/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "m.media-amazon.com" },
      { protocol: "https", hostname: "api.dicebear.com" },
    ],
    formats: ["image/avif", "image/webp"], // modern formats
    dangerouslyAllowSVG: true,
    // keep simple CSP here if you want; Next may ignore some values for images
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Headers for caching static assets and APIs (improves LCP / repeated loads)
  async headers() {
    return [
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/assets/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=604800, immutable" },
        ],
      },
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=60, stale-while-revalidate=30",
          },
        ],
      },
    ];
  },

  // Experimental flags — keep only the safe ones known to Next.js
  experimental: {
    optimizeCss: true,
  },

  // Optional: skip ESLint during build in CI/dev if desired (reduce build failures)
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
