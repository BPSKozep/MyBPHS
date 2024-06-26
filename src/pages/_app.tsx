import "@fontsource-variable/montserrat";
import "@fontsource-variable/source-code-pro";
import "@fontsource-variable/roboto-slab";
import "@fontsource/lily-script-one";
import "styles/globals.css";
import type { AppProps } from "next/app";
import { trpc } from "utils/trpc";
import { SessionProvider, useSession } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/router";
import OnlyAuthed from "components/OnlyAuthed";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import { PropsWithChildren, useEffect } from "react";
import PWAInstall from "components/PWAInstall";
import Link from "next/link";

if (typeof window !== "undefined") {
    // checks that we are client-side
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY as string, {
        api_host: "/ingest",
        ui_host: "https://eu.posthog.com",
        loaded: (posthog) => {
            if (process.env.NODE_ENV === "development") posthog.debug(); // debug mode in development
        },
    });
}

function MainHeader() {
    const { data } = useSession();

    return (
        <header className="flex h-16 flex-shrink-0 select-none items-center justify-center bg-slate-800">
            <div className="absolute left-10 flex w-10 items-center justify-end">
                <PWAInstall />
            </div>
            <h1 className="text-center text-2xl font-bold text-white">
                <Link href="/">
                    <span className="hidden sm:inline">Üdvözlünk a </span>
                    <span className="font-handwriting text-amber-400">My</span>
                    <span className="font-black">BPHS</span>
                    <span className="hidden sm:inline">-ben!</span>
                </Link>
            </h1>
            <div className="absolute right-10 flex w-10 items-center justify-end">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={data?.user?.image || ""}
                    alt="Profile picture"
                    className="rounded-full"
                    draggable="false"
                />
            </div>
        </header>
    );
}

function IdentifyUser({ children }: PropsWithChildren) {
    const { data } = useSession();

    useEffect(() => {
        if (data?.user?.email) {
            posthog.identify(data.user.email, {
                email: data.user.email,
                name: data.user.name,
            });
        } else {
            posthog.reset();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data?.user?.email]);

    return children;
}

function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
    const router = useRouter();

    useEffect(() => {
        // Track page views
        const handleRouteChange = () => posthog?.capture("$pageview");
        router.events.on("routeChangeComplete", handleRouteChange);

        return () => {
            router.events.off("routeChangeComplete", handleRouteChange);
        };
    }, [router.events]);

    return (
        <PostHogProvider client={posthog}>
            <SessionProvider session={session}>
                <OnlyAuthed enable={router.route !== "/forbidden"}>
                    <IdentifyUser>
                        <div className="box-border flex h-[100vh] w-full flex-col">
                            <MainHeader />
                            <AnimatePresence mode="wait">
                                <motion.main
                                    key={router.route}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.15 }}
                                    className="h-full w-full"
                                >
                                    <Component {...pageProps} />
                                </motion.main>
                            </AnimatePresence>
                        </div>
                    </IdentifyUser>
                </OnlyAuthed>
            </SessionProvider>
        </PostHogProvider>
    );
}

export default trpc.withTRPC(App);
