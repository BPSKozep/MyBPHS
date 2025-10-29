import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
    const host = "https://my.bphs.hu";
    return {
        rules: [
            {
                userAgent: "*",
                allow: "/",
                disallow: ["/api/", "/auth/", "/lunch/kiosk", "/forbidden"],
            },
        ],
        sitemap: `${host}/sitemap.xml`,
        host,
    };
}
