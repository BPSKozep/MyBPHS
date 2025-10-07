"use client";

import Card from "@/components/Card";
import { api } from "@/trpc/react";
import { useState, useMemo } from "react";
import Loading from "@/components/Loading";
import { Input } from "@/components/ui/input";
import UserInput from "@/components/ui/UserInput";
import { LaptopIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { IUser } from "@/models/User.model";

export default function LaptopLogins() {
    const [selectedUserEmail, setSelectedUserEmail] = useState<string>("");
    const [laptopInput, setLaptopInput] = useState<string>("");
    const [range] = useState<number>(50);
    const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false);

    // Extract number from BPHS-XX format
    const laptopNumber = useMemo(() => {
        if (!laptopInput) return undefined;
        const match = /(\d+)/.exec(laptopInput);
        return match?.[1] ? parseInt(match[1], 10) : undefined;
    }, [laptopInput]);

    // Fetch users for dropdown
    const { data: users } = api.user.getAll.useQuery();

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

    // Create a map of email to user for quick lookups
    const userMap = useMemo(() => {
        if (!users) return new Map();
        return new Map(users.map((u) => [u.email, u]));
    }, [users]);

    const getUserInitials = (name: string): string => {
        return name
            .split(" ")
            .map((word) => word.charAt(0).toUpperCase())
            .join("")
            .slice(0, 2);
    };

    const getUserNameFromEmail = (email: string): string => {
        const user = userMap.get(email) as IUser;
        return user?.name ?? email;
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
                                onClick={() =>
                                    setAutoRefreshEnabled(!autoRefreshEnabled)
                                }
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 focus:outline-none ${
                                    autoRefreshEnabled
                                        ? "bg-green-600"
                                        : "bg-gray-600"
                                }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                        autoRefreshEnabled
                                            ? "translate-x-6"
                                            : "translate-x-1"
                                    }`}
                                />
                            </button>
                            <span className="hidden sm:inline">
                                Automatikus frissítés
                            </span>
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
                                const userName = getUserNameFromEmail(
                                    login.user,
                                );
                                return (
                                    <div
                                        key={`${login.user}-${login.date.toString()}-${index}`}
                                        className={cn(
                                            "flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-[#2a2a2a]",
                                            index % 2 === 0
                                                ? "border-gray-600 bg-[#242424]"
                                                : "border-gray-600 bg-[#2e2e2e]",
                                        )}
                                    >
                                        {/* User Avatar */}
                                        <div className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-sm font-bold text-white">
                                            {getUserInitials(userName)}
                                        </div>

                                        {/* Login Info */}
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-medium text-white">
                                                    {userName}
                                                </h3>
                                                <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-xs font-medium text-blue-400">
                                                    BPHS-{login.number}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-300">
                                                {formatDate(login.date)}
                                            </p>
                                        </div>
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
        </Card>
    );
}
