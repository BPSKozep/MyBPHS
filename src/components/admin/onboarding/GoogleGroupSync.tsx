"use client";

import { RefreshCwIcon, TriangleAlertIcon } from "lucide-react";
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

  const backfillMutation = api.googleGroup.backfillJoinDates.useMutation();

  const active = data?.active ?? false;
  const lastSync = data?.lastSync ? new Date(data.lastSync) : null;
  const lastApplied = data?.lastApplied ? new Date(data.lastApplied) : null;

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
          <div className="space-y-2">
            {/* Active indicator + last received */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-300">
                  Státusz:{" "}
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
                  Utolsó adat: {formatRelativeTimeHu(lastSync)}
                </span>
              )}
            </div>

            {/* Last applied row */}
            {lastApplied && (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="text-sm text-gray-300">
                  Utolsó szinkronizálás:{" "}
                  <span className="font-semibold text-blue-400">
                    {formatRelativeTimeHu(lastApplied)}
                  </span>
                </span>
                {data?.lastAppliedCount !== null &&
                  data?.lastAppliedCount !== undefined && (
                    <span className="text-xs text-gray-500">
                      ({data.lastAppliedCount} felhasználó)
                    </span>
                  )}
              </div>
            )}

            {/* Error indicator */}
            {data?.lastApplyError && (
              <div className="flex items-start gap-2 rounded border border-yellow-600/40 bg-yellow-900/20 px-3 py-2 text-xs text-yellow-300">
                <TriangleAlertIcon className="mt-0.5 size-3 shrink-0" />
                <span>{data.lastApplyError}</span>
              </div>
            )}

            {/* Backfill join dates */}
            <div className="border-t border-gray-700 pt-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-gray-400">
                  Csatlakozási dátumok betöltése Google előzményekből
                </span>
                <button
                  type="button"
                  onClick={() => backfillMutation.mutate()}
                  disabled={backfillMutation.isPending}
                  className="shrink-0 rounded bg-blue-700 px-3 py-1 text-xs text-white hover:bg-blue-600 disabled:opacity-50"
                >
                  {backfillMutation.isPending ? "Folyamatban..." : "Betöltés"}
                </button>
              </div>
              {backfillMutation.data && (
                <div className="mt-2 text-xs text-gray-400">
                  Frissítve: {backfillMutation.data.updated} felhasználó.
                  {backfillMutation.data.missing.length > 0 && (
                    <span className="text-yellow-400">
                      {" "}
                      {backfillMutation.data.missing.length} felhasználónak
                      nincs adat a Google előzményekben.
                    </span>
                  )}
                </div>
              )}
              {backfillMutation.error && (
                <div className="mt-2 text-xs text-red-400">
                  Hiba: {backfillMutation.error.message}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
