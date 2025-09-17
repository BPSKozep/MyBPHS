import "@fontsource-variable/montserrat";
import "@fontsource-variable/source-code-pro";
import "@fontsource-variable/roboto-slab";
import "@fontsource/lily-script-one";
import "./globals.css";

import Providers from "@/app/providers";
import MainHeader from "@/components/MainHeader";
import IdentifyUser from "@/components/auth/IdentifyUser";
import type { Metadata, Viewport } from "next";
import PageTransition from "@/components/PageTransition";
import { getServerAuthSession } from "@/server/auth";

const metadata: Metadata = {
    applicationName: "MyBPHS",
    title: {
        default: "MyBPHS",
        template: "%s - MyBPHS",
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

export { metadata };

export const viewport: Viewport = {
    themeColor: "#111827",
};

export default async function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getServerAuthSession();

    return (
        <html lang="hu">
            <body>
                {/* Jira Widget */}
                {session && (
                    <script
                        data-jsd-embedded
                        data-key="ade8f754-42e4-4153-bad2-bd4b153ff206"
                        data-base-url="https://jsd-widget.atlassian.com"
                        src="https://jsd-widget.atlassian.com/assets/embed.js"
                        defer
                    ></script>
                )}
                <Providers>
                    <IdentifyUser>
                        <div className="box-border flex h-screen w-full flex-col">
                            <MainHeader />
                            <PageTransition>{children}</PageTransition>
                        </div>
                    </IdentifyUser>
                </Providers>
            </body>
        </html>
    );
}
