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
import { PropsWithChildren, useEffect, useState } from "react";
import PWAInstall from "components/PWAInstall";
import Link from "next/link";
import { appWithTranslation } from "next-i18next";
import Sheet from "components/Sheet";
import IconSubmitButton from "components/IconSubmitButton";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import sleep from "utils/sleep";
import { faRightFromBracket } from "@fortawesome/free-solid-svg-icons";
import { signOut } from "next-auth/react";

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
    const [isSheetOpen, setSheetOpen] = useState(false);

    const NfcId = trpc.user.getNfcId.useQuery(data?.user?.email || "");

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
            <div
                className="absolute right-10 flex w-10 items-center justify-end"
                onClick={() => {
                    setSheetOpen(true);
                }}
            >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={data?.user?.image || ""}
                    alt="Profile picture"
                    className="cursor-pointer rounded-full"
                    draggable="false"
                />
            </div>
            <Sheet
                isOpen={isSheetOpen}
                onClose={() => {
                    setSheetOpen(false);
                }}
            >
                <h1 className="text-2xl font-bold text-white">Felhasználó</h1>
                <p className="my-3 text-gray-400">
                    Itt megtekintheted a saját információidat
                </p>
                <div className="flex flex-col gap-3 align-middle">
                    <h2 className="text-center align-middle font-bold text-white">
                        Név
                    </h2>
                    <input
                        type="text"
                        value={data?.user?.name || "Nincs adat"}
                        className="mb-5 h-10 rounded-md border-2 border-slate-400 bg-[#09090b] p-[0.1rem] text-center text-slate-500"
                    />
                </div>
                <div className="flex flex-col gap-3 align-middle">
                    <h2 className="text-center font-bold text-white">
                        Email cím
                    </h2>
                    <input
                        type="text"
                        value={data?.user?.email || "Nincs adat"}
                        className="mb-5 h-10 rounded-md border-2 border-slate-400 bg-[#09090b] p-[0.1rem] text-center text-slate-500"
                    />
                </div>
                <div className="flex flex-col gap-3 align-middle">
                    <h2 className="text-center font-bold text-white">
                        Token azonosító
                    </h2>
                    <input
                        type="text"
                        value={NfcId.data || "Nincs adat"}
                        className="mb-5 h-10 rounded-md border-2 border-slate-400 bg-[#09090b] p-[0.1rem] text-center text-slate-500"
                    />
                </div>
                <div className="flex justify-center">
                    <IconSubmitButton
                        icon={<FontAwesomeIcon icon={faRightFromBracket} />}
                        onClick={async () => {
                            try {
                                await sleep(500);

                                await signOut({
                                    callbackUrl: "/",
                                });

                                return true;
                            } catch (err) {
                                return false;
                            }
                        }}
                    />
                </div>
            </Sheet>
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

    useEffect(() => {
        const handler = (event: MouseEvent) => {
            const [x, y] = [event.clientX, event.clientY];
            window.moveBy(x - 200, y - 200);
            window.resizeTo(400, 400);
        };

        window.addEventListener("mousemove", handler);

        return () => window.removeEventListener("mousemove", handler);
    }, []);

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

export default trpc.withTRPC(appWithTranslation(App));
