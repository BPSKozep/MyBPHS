import type { MetadataRoute } from "next";

const baseUrl = "https://my.bphs.hu";

export default function sitemap(): MetadataRoute.Sitemap {
    const staticRoutes = ["", "/lunch", "/school-password"];

    const now = new Date();

    return staticRoutes.map((path) => ({
        url: `${baseUrl}${path}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: path === "" ? 1 : 0.5,
    }));
}
