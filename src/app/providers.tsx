"use client";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import { TRPCReactProvider } from "trpc/react";
import { SessionProvider } from "next-auth/react";
import PostHogPageView from "components/PostHogPageView";

if (typeof window !== "undefined") {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
        person_profiles: "identified_only",
        capture_pageview: false, // Disable automatic pageview capture, as we capture manually
    });
}

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <PostHogProvider client={posthog}>
            <TRPCReactProvider>
                <SessionProvider>
                    <PostHogPageView />
                    {children}
                </SessionProvider>
            </TRPCReactProvider>
        </PostHogProvider>
    );
}
