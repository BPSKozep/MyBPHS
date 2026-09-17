"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { Suspense, useEffect, useRef, useState } from "react";
import Loading from "@/components/Loading";

function KioskAuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();
  const [error, setError] = useState<string | null>(null);
  const isAuthenticating = useRef(false);

  useEffect(() => {
    if (status === "loading") return;

    if (status === "authenticated") {
      router.replace("/lunch/kiosk");
      return;
    }

    const tokenFromQuery = searchParams.get("token");
    if (tokenFromQuery) {
      try {
        localStorage.setItem("kiosk_token", tokenFromQuery);
      } catch (e) {
        console.error("Failed to save kiosk_token to localStorage:", e);
      }
    }

    const token =
      tokenFromQuery ??
      (() => {
        try {
          return localStorage.getItem("kiosk_token");
        } catch {
          return null;
        }
      })();

    if (!token) {
      setError("Hiányzó kiosk token.");
      return;
    }

    if (isAuthenticating.current) return;
    isAuthenticating.current = true;

    signIn("kiosk", {
      token,
      callbackUrl: "/lunch/kiosk",
      redirect: false,
    })
      .then((res) => {
        if (res?.error) {
          setError("Érvénytelen kiosk token vagy inaktív kiosk felhasználó.");
          isAuthenticating.current = false;
        } else if (res?.ok) {
          router.replace("/lunch/kiosk");
        }
      })
      .catch((err) => {
        console.error("Kiosk login error:", err);
        setError("Hiba történt a bejelentkezés során.");
        isAuthenticating.current = false;
      });
  }, [status, searchParams, router]);

  if (error) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center  p-6 text-center text-white">
        <h1 className="mb-4 text-3xl font-bold text-red-500">{error}</h1>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center  text-white">
      <Loading />
      <p className="mt-6 text-lg font-medium text-gray-300">
        Kiosk bejelentkezés folyamatban...
      </p>
    </div>
  );
}

export default function KioskAuthPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-full flex-col items-center justify-center  text-white">
          <Loading />
        </div>
      }
    >
      <KioskAuthContent />
    </Suspense>
  );
}
