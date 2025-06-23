import React from "react";
import { BigLinkButtonClient } from "@/components/BigLinkButtonClient";
import { env } from "@/env/server";

async function checkSiteStatus(url: string, baseUrl: string): Promise<boolean> {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const fullUrl = url.startsWith("/") ? `${baseUrl}${url}` : url;

        const response = await fetch(fullUrl, {
            method: "GET",
            signal: controller.signal,
            cache: "no-store",
            headers: url.startsWith("/")
                ? {
                      Authorization: `Bearer ${env.PING_SECRET}`,
                  }
                : undefined,
        });

        clearTimeout(timeoutId);

        const isSuccess =
            response.ok && response.status >= 200 && response.status < 300;

        return isSuccess;
    } catch {
        return false;
    }
}

async function checkAllSites(
    statuswebsites: string[],
    baseUrl: string,
): Promise<boolean> {
    try {
        const results = await Promise.all(
            statuswebsites.map((url) => checkSiteStatus(url, baseUrl)),
        );
        const allUp =
            results.length > 0 && results.every((result) => result === true);
        return allUp;
    } catch {
        return false;
    }
}

export default async function BigLinkButton({
    title,
    url,
    disabled,
    statuswebsites,
}: {
    title: string;
    url: string;
    disabled?: boolean;
    statuswebsites?: string[];
}) {
    let allSitesUp: boolean | null = null;

    if (statuswebsites && statuswebsites.length > 0) {
        allSitesUp = await checkAllSites(statuswebsites, env.NEXTAUTH_URL);
    }

    return (
        <BigLinkButtonClient
            title={title}
            url={url}
            disabled={disabled}
            allSitesUp={allSitesUp}
        />
    );
}
