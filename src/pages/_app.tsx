import "@fontsource-variable/montserrat";
import "@fontsource-variable/source-code-pro";
import "@fontsource-variable/roboto-slab";
import "@fontsource/lily-script-one";
import "styles/globals.css";
import type { AppProps } from "next/app";
import { trpc } from "utils/trpc";
import { wrapper } from "store/store";
import { Provider } from "react-redux";
import { SessionProvider } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/router";

function App({ Component, ...rest }: AppProps) {
    const { store, props } = wrapper.useWrappedStore(rest);
    const {
        pageProps: { session, ...pageProps },
    } = props;

    const router = useRouter();

    return (
        <Provider store={store}>
            <SessionProvider session={session}>
                <div className="bg-slate-800 h-[7vh]"></div>
                <AnimatePresence>
                    <motion.div
                        key={router.route}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="top-0 bottom-0 left-0 right-0 absolute"
                    >
                        <Component {...pageProps} />
                    </motion.div>
                </AnimatePresence>
            </SessionProvider>
        </Provider>
    );
}

export default trpc.withTRPC(App);
