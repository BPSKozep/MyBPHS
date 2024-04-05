import "@fontsource-variable/montserrat";
import "@fontsource-variable/source-code-pro";
import "@fontsource-variable/roboto-slab";
import "@fontsource/lily-script-one";
import "styles/globals.css";
import type { AppProps } from "next/app";
import { trpc } from "utils/trpc";
import { wrapper } from "store/store";
import { Provider } from "react-redux";
import { SessionProvider, useSession } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/router";
import OnlyAuthed from "components/OnlyAuthed";
import * as Sentry from "@sentry/nextjs";

function MainHeader() {
    const { data } = useSession();

    Sentry.setUser({
        username: data?.user?.name || undefined,
        email: data?.user?.email || undefined,
    });

    Sentry.withScope((scope) => {
        scope.setExtra("battery", 0.7);
        scope.setTag("user_mode", "admin");
    });

    return (
        <header className="flex h-16 flex-shrink-0 select-none items-center justify-center bg-slate-800">
            <h1 className="text-center text-2xl font-bold text-white">
                <span className="hidden sm:inline">Üdvözlünk a </span>
                <span className="font-handwriting text-amber-400">My</span>
                <span className="font-black">BPHS</span>
                <span className="hidden sm:inline">-ben!</span>
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

function App({ Component, ...rest }: AppProps) {
    const { store, props } = wrapper.useWrappedStore(rest);
    const {
        pageProps: { session, ...pageProps },
    } = props;

    const router = useRouter();

    return (
        <Provider store={store}>
            <SessionProvider session={session}>
                <OnlyAuthed enable={router.route !== "/forbidden"}>
                    <div className="box-border flex h-[100vh] w-full flex-col">
                        <MainHeader />
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={router.route}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="h-full w-full"
                            >
                                <Component {...pageProps} />
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </OnlyAuthed>
            </SessionProvider>
        </Provider>
    );
}

export default trpc.withTRPC(App);
