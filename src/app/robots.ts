import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const host = "https://my.bphs.hu";
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/public",
        disallow: "/",
      },
    ],
    sitemap: `${host}/sitemap.xml`,
    host,
  };
}
