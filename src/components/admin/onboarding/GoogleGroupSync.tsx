"use client";

import { RefreshCwIcon } from "lucide-react";
import Card from "@/components/Card";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";

function formatRelativeTimeHu(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return "az imént";
  if (diffMinutes < 60) return `${diffMinutes} perccel ezelőtt`;
  if (diffHours < 24) return `${diffHours} órával ezelőtt`;
  return `${diffDays} nappal ezelőtt`;
}

export default function GoogleGroupSync() {
  const { data, isLoading } = api.googleGroup.syncStatus.useQuery();

  const active = data?.active ?? false;
  const lastSync = data?.lastSync ? new Date(data.lastSync) : null;

  return (
    <Card>
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center gap-2 border-b border-gray-600 pb-3">
          <RefreshCwIcon className="size-5 text-white" />
          <h2 className="text-lg font-semibold text-white">
            Google Group Szinkronizálás
          </h2>
        </div>

        {/* Status */}
        {isLoading ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Betöltés...</span>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-300">
                Szinkronizálás státusz:{" "}
                <span
                  className={cn(
                    "font-semibold",
                    active ? "text-green-400" : "text-red-400",
                  )}
                >
                  {active ? "Aktív" : "Inaktív"}
                </span>
              </span>
              <span className="relative flex size-3 shrink-0 items-center justify-center">
                {active ? (
                  <>
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-green-400 opacity-60" />
                    <span className="relative size-2 rounded-full bg-green-500" />
                  </>
                ) : (
                  <span className="size-2 rounded-full bg-red-500" />
                )}
              </span>
            </div>

            {lastSync && (
              <span className="text-xs text-gray-500">
                {formatRelativeTimeHu(lastSync)}
              </span>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
