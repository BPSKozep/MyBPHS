import "@fontsource-variable/montserrat";
import "@fontsource-variable/source-code-pro";
import "@fontsource-variable/roboto-slab";
import "@fontsource/lily-script-one";
import "./globals.css";

import OnlyAuthed from "components/OnlyAuthed";
import Providers from "./providers";
import MainHeader from "components/MainHeader";
import IdentifyUser from "components/IdentifyUser";
import { Metadata, Viewport } from "next";
import PageTransition from "components/PageTransition";

export const metadata: Metadata = {
    applicationName: "MyBPHS - Dev",
    title: {
        default: "MyBPHS - Dev",
        template: "%s - MyBPHS - Dev",
    },
    description: "Hasznos eszközök a BPS JPP tagjainak",
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
        description: "Hasznos eszközök a BPS JPP tagjainak",
    },
    twitter: {
        card: "summary_large_image",
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
    return (
        <html lang="hu">
            <body>
                <Providers>
                    <OnlyAuthed>
                        <IdentifyUser>
                            <div className="box-border flex h-[100vh] w-full flex-col">
                                <MainHeader />
                                <PageTransition>{children}</PageTransition>
                            </div>
                        </IdentifyUser>
                    </OnlyAuthed>
                </Providers>
            </body>
        </html>
    );
}
