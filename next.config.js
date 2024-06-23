/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,
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
                protocol: "https",
                hostname: "cdn.bpskozep.hu",
                port: "",
                pathname: "**",
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

// eslint-disable-next-line @typescript-eslint/no-var-requires
const withPWA = require("next-pwa")({
    dest: "public",
});

module.exports = withPWA(module.exports);

module.exports = {
    i18n: {
        locales: ["en-US", "hu-HU"],
        defaultLocale: "en-US",
        localeDetection: true,
    },
};
