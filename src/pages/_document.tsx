import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
    return (
        <Html lang="hu">
            <Head>
                <meta name="application-name" content="MyBPHS" />
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta
                    name="apple-mobile-web-app-status-bar-style"
                    content="default"
                />
                <meta name="apple-mobile-web-app-title" content="MyBPHS" />
                <meta name="description" content="MyBPHS" />
                <meta name="format-detection" content="telephone=no" />
                <meta name="mobile-web-app-capable" content="yes" />
                <meta name="theme-color" content="#111827" />

                <link
                    rel="icon"
                    type="image/png"
                    sizes="32x32"
                    href="/favicon-32x32.png"
                />
                <link
                    rel="icon"
                    type="image/png"
                    sizes="16x16"
                    href="/favicon-16x16.png"
                />
                <link
                    rel="manifest"
                    href="/manifest.json"
                    crossOrigin="use-credentials"
                />
                <link
                    rel="mask-icon"
                    href="/safari-pinned-tab.svg"
                    color="#111827"
                />
                <link rel="shortcut icon" href="/favicon.ico" />

                <meta name="twitter:card" content="summary" />
                <meta name="twitter:url" content="https://my.bphs.hu" />
                <meta name="twitter:title" content="MyBPHS" />
                <meta name="twitter:description" content="MyBPHS" />
                <meta
                    name="twitter:image"
                    content="https://my.bphs.hu/android-chrome-192x192.png"
                />
                <meta property="og:type" content="website" />
                <meta property="og:title" content="MyBPHS" />
                <meta property="og:description" content="MyBPHS" />
                <meta property="og:site_name" content="MyBPHS" />
                <meta property="og:url" content="https://my.bphs.hu" />
                <meta
                    property="og:image"
                    content="https://my.bphs.hu/apple-touch-icon.png"
                />
            </Head>
            <body>
                <Main />
                <NextScript />
            </body>
        </Html>
    );
}
