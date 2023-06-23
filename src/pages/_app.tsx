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

function App({ Component, ...rest }: AppProps) {
    const { store, props } = wrapper.useWrappedStore(rest);
    const {
        pageProps: { session, ...pageProps },
    } = props;

    return (
        <Provider store={store}>
            <SessionProvider session={session}>
                <Component {...pageProps} />
            </SessionProvider>
        </Provider>
    );
}

export default trpc.withTRPC(App);
