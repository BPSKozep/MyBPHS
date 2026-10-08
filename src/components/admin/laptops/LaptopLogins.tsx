"use client";

import { LaptopIcon, UserIcon } from "lucide-react";
import { useMemo, useState } from "react";
import Card from "@/components/Card";
import Loading from "@/components/Loading";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import UserInput from "@/components/ui/UserInput";
import { cn } from "@/lib/utils";
import type { IUser } from "@/models/User.model";
import { api } from "@/trpc/react";

export default function LaptopLogins() {
  const [selectedUserEmail, setSelectedUserEmail] = useState<string>("");
  const [laptopInput, setLaptopInput] = useState<string>("");
  const [range] = useState<number>(50);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false);
  const [selectedGuestLogin, setSelectedGuestLogin] = useState<
    NonNullable<typeof logins>[number] | null
  >(null);

  // Extract number from BPHS-XX format
  const laptopNumber = useMemo(() => {
    if (!laptopInput) return undefined;
    const match = /(\d+)/.exec(laptopInput);
    return match?.[1] ? parseInt(match[1], 10) : undefined;
  }, [laptopInput]);

  // Fetch users for dropdown
  const { data: users } = api.user.list.useQuery("all");

  const selectedUsername = useMemo(() => {
    if (!selectedUserEmail) return undefined;
    return selectedUserEmail.split("@")[0];
  }, [selectedUserEmail]);

  // Fetch logins with filters
  const {
    data: logins,
    isLoading: loginsLoading,
    error,
  } = api.laptop.getLogins.useQuery(
    {
      range,
      number: laptopNumber,
      user: selectedUsername,
    },
    {
      refetchInterval: autoRefreshEnabled ? 3000 : false,
      refetchIntervalInBackground: false,
      refetchOnWindowFocus: autoRefreshEnabled,
      staleTime: 0,
    },
  );

  // Create a map of username (email part before @) to user for quick lookups
  const usernameToUserMap = useMemo(() => {
    if (!users) return new Map();
    return new Map(
      users.map((u) => {
        const username = u.email.split("@")[0];
        return [username, u];
      }),
    );
  }, [users]);

  const getUserInitials = (name: string): string => {
    return name
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase())
      .join("")
      .slice(0, 2);
  };

  const getUserNameFromUsername = (username: string): string => {
    const user = usernameToUserMap.get(username) as IUser;
    return user?.name ?? username;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString("hu-HU", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (error) {
    return (
      <Card>
        <div className="rounded-lg border border-red-500/30 bg-red-900/20 p-4 text-center text-red-200">
          <h3 className="mb-2 text-lg font-bold">
            Hiba a bejelentkezések betöltésekor
          </h3>
          <p className="text-sm">{error.message}</p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="space-y-4">
        {/* Header with Auto-refresh Toggle */}
        <div className="flex items-center justify-between border-b border-gray-600 pb-3">
          <div className="flex items-center gap-2">
            <LaptopIcon className="size-5 text-white" />
            <h2 className="text-lg font-semibold text-white">
              Laptop Bejelentkezések
            </h2>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-300">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 focus:outline-none ${
                  autoRefreshEnabled ? "bg-green-600" : "bg-gray-600"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    autoRefreshEnabled ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
              <span className="hidden sm:inline">Automatikus frissítés</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-row gap-4">
          {/* User Selection */}
          <div className="space-y-2">
            <UserInput
              showAllOption
              onSelect={(user) => {
                if (user.email === "all") {
                  setSelectedUserEmail("");
                } else {
                  setSelectedUserEmail(user.email);
                }
              }}
            />
          </div>

          {/* Laptop Number Input */}
          <div className="space-y-2">
            <div className="relative">
              <span className="absolute top-1/2 left-3 -translate-y-1/2 text-sm text-gray-400">
                BPHS-
              </span>
              <Input
                type="text"
                placeholder="XX"
                value={laptopInput}
                onChange={(e) => setLaptopInput(e.target.value)}
                className="max-w-32 border-gray-600 bg-[#1a1a1a] pl-[3.6rem] text-white placeholder:text-gray-500"
              />
            </div>
          </div>
        </div>

        {/* Logins Table */}
        <div className="scrollbar-thin scrollbar-track-gray-800 scrollbar-thumb-gray-600 max-h-96 overflow-y-auto">
          {loginsLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loading />
              <p className="mt-4 text-sm text-gray-300">
                Bejelentkezések betöltése...
              </p>
            </div>
          ) : !logins || logins.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <LaptopIcon className="size-12 text-gray-500" />
              <p className="mt-4 text-lg font-medium text-gray-300">
                Nincs bejelentkezés
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {logins.map((login, index) => {
                const userName = getUserNameFromUsername(login.user);
                const isGuest = login.user.trim().toLowerCase() === "guest";
                return (
                  <div
                    // biome-ignore lint/suspicious/noArrayIndexKey: logins may have identical timestamps
                    key={`${login.user}-${login.date.toString()}-${index}`}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-[#2a2a2a]",
                      index % 2 === 0
                        ? "border-gray-600 bg-[#242424]"
                        : "border-gray-600 bg-[#2e2e2e]",
                    )}
                  >
                    {/* User Avatar */}
                    {isGuest ? (
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gray-600 text-gray-200">
                        <UserIcon className="size-5" />
                      </div>
                    ) : (
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-blue-500 to-purple-600 text-sm font-bold text-white">
                        {getUserInitials(userName)}
                      </div>
                    )}

                    {/* Login Info */}
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-white">{userName}</h3>
                        <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-xs font-medium text-blue-400">
                          BPHS-{login.number}
                        </span>
                      </div>
                      <p className="text-sm text-gray-300">
                        {formatDate(login.date)}
                      </p>
                    </div>

                    {/* Guest details button */}
                    {isGuest && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedGuestLogin(login)}
                        className="text-sm font-medium text-blue-400 hover:bg-blue-500/10 hover:text-blue-300"
                      >
                        Részletek
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="border-t border-gray-600 pt-3">
          <p className="text-xs text-gray-400">
            Összesen: {logins?.length ?? 0} bejelentkezés
          </p>
        </div>
      </div>

      {/* Guest Details Dialog */}
      <Dialog
        open={!!selectedGuestLogin}
        onOpenChange={(open) => {
          if (!open) setSelectedGuestLogin(null);
        }}
      >
        <DialogContent className="border-gray-600 bg-[#242424] text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <UserIcon className="size-5 text-gray-400" />
              Vendég bejelentkezés részletei
            </DialogTitle>
          </DialogHeader>

          {selectedGuestLogin && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg border border-gray-700 bg-[#1e1e1e] p-3">
                  <span className="mb-1 block text-xs text-gray-400">
                    Felhasználó
                  </span>
                  <span className="font-medium text-white">
                    {getUserNameFromUsername(selectedGuestLogin.user)}
                  </span>
                </div>
                <div className="rounded-lg border border-gray-700 bg-[#1e1e1e] p-3">
                  <span className="mb-1 block text-xs text-gray-400">
                    Laptop
                  </span>
                  <span className="font-semibold text-blue-400">
                    BPHS-{selectedGuestLogin.number}
                  </span>
                </div>
                <div className="col-span-2 rounded-lg border border-gray-700 bg-[#1e1e1e] p-3">
                  <span className="mb-1 block text-xs text-gray-400">
                    Időpont
                  </span>
                  <span className="font-medium text-white">
                    {formatDate(selectedGuestLogin.date)}
                  </span>
                </div>
              </div>

              <div className="rounded-lg border border-gray-700 bg-[#1e1e1e] p-3">
                <span className="mb-1 block text-xs text-gray-400">
                  Indoklás
                </span>
                <p className="text-sm text-gray-200 whitespace-pre-wrap">
                  {selectedGuestLogin.reason?.trim() ||
                    "Nincs megadva indoklás."}
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setSelectedGuestLogin(null)}
              className="border-gray-600 bg-transparent text-gray-200 hover:bg-gray-700 hover:text-white"
            >
              Bezárás
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
