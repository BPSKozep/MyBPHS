import type { MetadataRoute } from "next";

const baseUrl = "https://my.bphs.hu";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    {
      url: `${baseUrl}/public`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 1,
    },
  ];
}
