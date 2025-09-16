/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    webpack: (config) => {
        config.experiments = {
            ...config.experiments,
            topLevelAwait: true,
        };
        return config;
    },
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
                source: "/ingest/static/:path*",
                destination: "https://eu-assets.i.posthog.com/static/:path*",
            },
            {
                source: "/ingest/:path*",
                destination: "https://eu.i.posthog.com/:path*",
            },
        ];
    },
    skipTrailingSlashRedirect: true,
};

module.exports = nextConfig;
