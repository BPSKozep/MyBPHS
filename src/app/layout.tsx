import "@fontsource-variable/montserrat";
import "@fontsource-variable/source-code-pro";
import "@fontsource-variable/roboto-slab";
import "@fontsource/lily-script-one";
import "styles/globals.css";
// import { AnimatePresence } from "framer-motion";
// import { motion } from "framer-motion";
// import { usePathname } from "next/navigation";
import OnlyAuthed from "components/OnlyAuthed";
import Providers from "./providers";
import MainHeader from "components/MainHeader";
import IdentifyUser from "components/IdentifyUser";
import { Metadata, Viewport } from "next";

export const metadata: Metadata = {
    applicationName: "MyBPHS",
    title: "MyBPHS",
    description: "User portal for BPS JPP",
    manifest: "/manifest.json",
    appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: "MyBPHS",
    },
    openGraph: {
        type: "website",
        siteName: "MyBPHS",
        title: "MyBPHS",
        description: "User portal for BPS JPP",
    },
};

export const viewport: Viewport = {
    themeColor: "#111827",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // const pathname = usePathname();

    return (
        <html lang="hu">
            <body>
                <Providers>
                    <OnlyAuthed>
                        <IdentifyUser>
                            <div className="box-border flex h-[100vh] w-full flex-col">
                                <MainHeader />
                                {/* <AnimatePresence mode="wait">
                                    <motion.main
                                        key={pathname}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.15 }}
                                        className="h-full w-full"
                                    > */}
                                {children}
                                {/* </motion.main>
                                </AnimatePresence> */}
                            </div>
                        </IdentifyUser>
                    </OnlyAuthed>
                </Providers>
            </body>
        </html>
    );
}
