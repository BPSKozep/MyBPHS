/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_BUILD_DATE: new Date().toLocaleDateString("hu-HU", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }),
  },
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        hostname: "cdn.bphs.hu",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/relay-cgHT/static/:path*",
        destination: "https://eu-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/relay-cgHT/:path*",
        destination: "https://eu.i.posthog.com/:path*",
      },
    ];
  },
  skipTrailingSlashRedirect: true,
};

module.exports = nextConfig;
