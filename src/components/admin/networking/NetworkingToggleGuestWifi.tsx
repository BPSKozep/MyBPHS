"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { api } from "@/trpc/react";

export default function NetworkingToggleGuestWifi() {
  const [isPending, setIsPending] = useState(false);

  const { data, isLoading, isError, refetch } =
    api.networking.getGuestWifiStatus.useQuery();

  const { mutateAsync: setGuestWifiStatus } =
    api.networking.setGuestWifiStatus.useMutation();

  async function handleToggle(checked: boolean) {
    setIsPending(true);
    try {
      await setGuestWifiStatus(checked);
      await refetch();
    } catch {
      await refetch();
    } finally {
      setIsPending(false);
    }
  }

  const isDisabled = isLoading || isPending || isError;

  return (
    <div>
      <h2 className="mb-4 text-lg font-bold text-white">Vendég WiFi</h2>
      <div className="flex items-center gap-4 rounded-xl bg-[#1e1e1e] px-5 py-4">
        <Switch
          checked={data?.enabled ?? false}
          onCheckedChange={handleToggle}
          disabled={isDisabled}
          className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-gray-600 disabled:opacity-40"
        />
        <div className="flex flex-col">
          <span className="font-semibold text-white">
            Vendég hálózat engedélyezése
          </span>
          <span className="text-sm text-gray-400">
            {isLoading || isPending ? (
              "Betöltés..."
            ) : isError ? (
              <span className="text-red-400">Hiba a státusz lekérésekor</span>
            ) : data?.enabled ? (
              <span className="text-green-400">
                Bekapcsolva &mdash;{" "}
                {data.connectedUsers === 0
                  ? "nincs csatlakozott eszköz"
                  : `${data.connectedUsers} csatlakozott eszköz`}
              </span>
            ) : (
              <span className="text-gray-400">Kikapcsolva</span>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
