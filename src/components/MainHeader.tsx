"use client";

import Image from "next/image";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";
import {
  FaBell,
  FaEnvelope,
  FaIdCard,
  FaRightFromBracket,
} from "react-icons/fa6";
import PWAInstall from "@/components/PWAInstall";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import rolesJson from "@/data/roles.json";
import { api } from "@/trpc/react";
import sleep from "@/utils/sleep";
import SmallLoading from "./SmallLoading";

export default function MainHeader() {
  const { data } = useSession();
  const [imageError, setImageError] = useState(false);

  const NfcId = api.user.getNfcId.useQuery(data?.user?.email ?? "", {
    enabled: !!data?.user?.email,
  });

  const userDetails = api.user.get.useQuery(data?.user?.email ?? "", {
    enabled: !!data?.user?.email,
  });

  const sendSlackWebhook = api.webhook.sendSlackWebhook.useMutation();

  const [signOutLoading, setSignOutLoading] = useState(false);
  const [testWebhookLoading, setTestWebhookLoading] = useState(false);

  const userInitial = data?.user?.name?.charAt(0)?.toUpperCase() ?? "U";

  return (
    <header className="flex h-16 shrink-0 items-center justify-center bg-slate-800 select-none">
      <div className="absolute left-10 flex w-10 items-center justify-end">
        <PWAInstall />
      </div>
      <div className="text-center text-2xl font-bold text-white">
        {data ? (
          <h1 className="text-center text-2xl font-bold text-white">
            <Link href="/">
              <span className="hidden sm:inline">Üdvözlünk a </span>
              <span className="font-handwriting text-amber-400">My</span>
              <span className="font-black">BPHS</span>
              <span className="hidden sm:inline">-ben!</span>
            </Link>
          </h1>
        ) : (
          <>
            <span className="hidden sm:inline">Üdvözlünk a </span>
            <span className="font-handwriting text-amber-400">My</span>
            <span className="font-black">BPHS</span>
            <span className="hidden sm:inline">-ben!</span>
          </>
        )}
      </div>
      {data && (
        <Sheet>
          <SheetTrigger asChild>
            <div className="absolute right-10 flex w-10 cursor-pointer items-center justify-end">
              {data?.user?.image && !imageError ? (
                <Image
                  src={data.user.image}
                  alt="Profile picture"
                  className="cursor-pointer rounded-full"
                  draggable="false"
                  unoptimized
                  width={40}
                  height={40}
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-linear-to-br from-blue-500 to-purple-600 text-lg font-bold text-white">
                  {userInitial}
                </div>
              )}
            </div>
          </SheetTrigger>
          <SheetContent
            side="right"
            className="flex flex-col border-gray-700 bg-slate-800 px-5"
          >
            <SheetHeader>
              <SheetTitle className="text-2xl font-bold text-white">
                Felhasználói profil
              </SheetTitle>
              <SheetDescription className="text-gray-400">
                Itt megtekintheted a saját információidat vagy kijelentkezhetsz.
              </SheetDescription>
            </SheetHeader>

            {/* Main Content Area */}
            <div className="flex flex-1 flex-col">
              {/* Profile Header */}
              <div className="mt-6 flex flex-col items-center space-y-4">
                <div className="relative">
                  {data?.user?.image && !imageError ? (
                    <Image
                      src={data.user.image}
                      alt="Profile picture"
                      className="rounded-full ring-4 ring-blue-500/20"
                      draggable="false"
                      unoptimized
                      width={80}
                      height={80}
                      onError={() => setImageError(true)}
                    />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-linear-to-br from-blue-500 to-purple-600 text-2xl font-bold text-white ring-4 ring-blue-500/20">
                      {userInitial}
                    </div>
                  )}
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-white">
                    {data?.user?.name ?? "Névtelen felhasználó"}
                  </h3>
                </div>
                {userDetails.data?.roles &&
                  userDetails.data.roles.length > 0 && (
                    <div className="mt-1 text-xs font-medium text-gray-400">
                      {userDetails.data.roles
                        .map(
                          (role) =>
                            (rolesJson as Record<string, string>)[role] ?? role,
                        )
                        .join(", ")}
                    </div>
                  )}
              </div>

              {/* User Details */}
              <div className="mt-8 space-y-4">
                {/* Email Section */}
                <div className="rounded-xl bg-slate-700/50 p-4 backdrop-blur-sm">
                  <div className="flex items-center space-x-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/20">
                      <FaEnvelope className="text-green-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-400">
                        Email cím
                      </p>
                      <p className="text-sm font-semibold break-all text-white">
                        {data?.user?.email ?? "Nincs adat"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* NFC Token Section */}
                <div className="rounded-xl bg-slate-700/50 p-4 backdrop-blur-sm">
                  <div className="flex items-center space-x-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/20">
                      <FaIdCard className="text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-400">
                        Token azonosító
                      </p>
                      <p className="font-semibold text-white">
                        {NfcId.data ?? "Nincs adat"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Development Test Section */}
            {process.env.NODE_ENV === "development" && (
              <div className="mt-auto">
                <div className="rounded-xl bg-blue-600/20 p-4 backdrop-blur-sm border border-blue-500/30">
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/30">
                      <FaBell className="text-blue-400" />
                    </div>
                    <h3 className="text-sm font-semibold text-white">
                      Dev Tools
                    </h3>
                  </div>
                  <button
                    className="w-full cursor-pointer rounded-lg bg-blue-600/30 p-3 text-sm text-white transition-all duration-200 hover:bg-blue-600/40 focus:ring-2 focus:ring-blue-500/50 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                    type="button"
                    onClick={async () => {
                      setTestWebhookLoading(true);
                      try {
                        await sendSlackWebhook.mutateAsync({
                          title: "Test Webhook",
                          body: `Teszt üzenet küldve: ${new Date().toLocaleString("hu-HU")}`,
                        });
                      } catch (error) {
                        console.error("Failed to send test webhook:", error);
                      } finally {
                        setTestWebhookLoading(false);
                      }
                    }}
                    disabled={testWebhookLoading}
                  >
                    {testWebhookLoading ? (
                      <div className="flex items-center justify-center">
                        <SmallLoading />
                      </div>
                    ) : (
                      "Teszt Webhook Küldése"
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Sign Out Button - Fixed at bottom */}
            <div
              className={
                process.env.NODE_ENV === "development"
                  ? "mt-4 mb-6"
                  : "mt-auto mb-6"
              }
            >
              <button
                className="w-full cursor-pointer rounded-xl bg-red-600/20 p-4 text-white transition-all duration-200 hover:bg-red-600/30 focus:ring-2 focus:ring-red-500/50 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                type="button"
                onClick={async () => {
                  setSignOutLoading(true);
                  await sleep(1500);
                  setSignOutLoading(false);
                  await signOut({
                    callbackUrl: "/",
                  });
                }}
                disabled={signOutLoading}
              >
                {!signOutLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <FaRightFromBracket className="text-red-400" />
                    <span className="font-semibold">Kijelentkezés</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <SmallLoading />
                  </div>
                )}
              </button>
            </div>
          </SheetContent>
        </Sheet>
      )}
    </header>
  );
}
