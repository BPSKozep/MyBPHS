"use client";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import { SessionProvider } from "next-auth/react";
import PostHogPageView from "components/PostHogPageView";
import { trpc } from "utils/trpc";
import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";

if (typeof window !== "undefined") {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
        person_profiles: "identified_only",
        capture_pageview: false, // Disable automatic pageview capture, as we capture manually
    });
}

function getBaseUrl() {
    if (typeof window !== "undefined")
        // browser should use relative path
        return "";

    if (process.env.VERCEL_URL)
        // reference for vercel.com
        return `https://${process.env.VERCEL_URL}`;

    // assume localhost
    return `http://localhost:${process.env.PORT ?? 3000}`;
}

export default function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(() => new QueryClient());
    const [trpcClient] = useState(() =>
        trpc.createClient({
            links: [
                httpBatchLink({
                    url: `${getBaseUrl()}/api/trpc`,
                }),
            ],
        })
    );

    return (
        <PostHogProvider client={posthog}>
            <SessionProvider>
                <trpc.Provider client={trpcClient} queryClient={queryClient}>
                    <QueryClientProvider client={queryClient}>
                        <PostHogPageView />
                        {children}
                    </QueryClientProvider>
                </trpc.Provider>
            </SessionProvider>
        </PostHogProvider>
    );
}
