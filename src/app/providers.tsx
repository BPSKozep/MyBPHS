"use client";

import { SessionProvider } from "next-auth/react";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import { Suspense } from "react";
import PostHogPageView from "@/components/PostHogPageView";
import { env } from "@/env/client";
import { TRPCReactProvider } from "@/trpc/react";

if (typeof window !== "undefined") {
  posthog.init(env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: "/relay-cgHT",
    ui_host: "https://eu.posthog.com",
    capture_pageview: false, // Disable automatic pageview capture, as we capture manually
  });
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PostHogProvider client={posthog}>
      <SessionProvider>
        <TRPCReactProvider>
          <Suspense>
            <PostHogPageView />
          </Suspense>
          {children}
        </TRPCReactProvider>
      </SessionProvider>
    </PostHogProvider>
  );
}
