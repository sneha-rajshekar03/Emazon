/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      "lh3.googleusercontent.com",
      "m.media-amazon.com", // ✅ add this
    ],
  },
};

export default nextConfig;
