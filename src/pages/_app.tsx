import "@fontsource-variable/montserrat";
import "@fontsource-variable/source-code-pro";
import "@fontsource-variable/roboto-slab";
import "@fontsource/lily-script-one";
import "../styles/globals.css";
import type { AppProps } from "next/app";
import { trpc } from "../utils/trpc";

function App({ Component, pageProps }: AppProps) {
    return <Component {...pageProps} />;
}

export default trpc.withTRPC(App);
