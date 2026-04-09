"use client";

import { ChevronDownIcon, UserIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import React from "react";
import Card from "@/components/Card";
import Loading from "@/components/Loading";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";

export default function LastUsers() {
  const [isOpen, setIsOpen] = React.useState(false);

  const {
    data: users,
    isLoading,
    error,
  } = api.user.list.useQuery("all", {
    refetchInterval: 3000,
  });

  const latestUsers = React.useMemo(() => {
    if (!users) return [];
    return [...users].reverse().slice(0, 30);
  }, [users]);

  const getUserInitials = (name: string): string => {
    return name
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase())
      .join("")
      .slice(0, 2);
  };

  if (error) {
    return (
      <Card>
        <div className="rounded-lg border border-red-500/30 bg-red-900/20 p-4 text-center text-red-200">
          <h3 className="mb-2 text-lg font-bold">
            Hiba a felhasználók betöltésekor
          </h3>
          <p className="text-sm">{error.message}</p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      {/* Header — always visible, click to toggle */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between focus:outline-none"
      >
        <div className="flex items-center gap-2">
          <UserIcon className="size-5 text-white" />
          <h2 className="text-lg font-semibold text-white">
            Legújabb felhasználók
          </h2>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
        >
          <ChevronDownIcon className="size-5 text-gray-400" />
        </motion.div>
      </button>

      {/* Animated body */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: "hidden" }}
          >
            <div className="space-y-3 pt-3">
              <div className="border-t border-gray-600" />

              {/* Users list */}
              <div className="scrollbar-thin scrollbar-track-gray-800 scrollbar-thumb-gray-600 max-h-96 overflow-y-auto">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loading />
                    <p className="mt-4 text-sm text-gray-300">
                      Felhasználók betöltése...
                    </p>
                  </div>
                ) : latestUsers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <UserIcon className="size-12 text-gray-500" />
                    <p className="mt-4 text-lg font-medium text-gray-300">
                      Nincs felhasználó
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {latestUsers.map((user, index) => (
                      <div
                        key={user._id}
                        className={cn(
                          "flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-[#2a2a2a]",
                          index % 2 === 0
                            ? "border-gray-600 bg-[#242424]"
                            : "border-gray-600 bg-[#2e2e2e]",
                        )}
                      >
                        <div className="flex size-10 items-center justify-center rounded-full bg-linear-to-br from-blue-500 to-purple-600 text-sm font-bold text-white">
                          {getUserInitials(user.name)}
                        </div>

                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-white">
                              {user.name}
                            </h3>
                          </div>
                          <p className="break-all text-sm text-gray-300">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
