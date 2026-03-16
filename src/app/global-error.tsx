"use client";

import "@fontsource-variable/montserrat";
import "@fontsource-variable/source-code-pro";
import "@fontsource-variable/roboto-slab";
import "@fontsource/lily-script-one";
import "./globals.css";

import { AlertTriangleIcon } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import Button from "@/components/Button";
import { InfoBox } from "@/components/InfoBox";
import PageWithHeader from "@/components/PageWithHeader";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error }: GlobalErrorProps) {
  useEffect(() => {
    console.error("Global error boundary caught:", error);
  }, [error]);

  return (
    <html lang="hu">
      <body className="h-screen w-full bg-slate-900">
        <PageWithHeader title="">
          <div className="flex h-full flex-col items-center justify-center gap-4 px-4">
            <h1 className="text-center text-xl font-black text-white">
              Váratlan hiba történt.
            </h1>

            <InfoBox
              variant="error"
              icon={AlertTriangleIcon}
              className="w-full max-w-xl border-red-900/50 bg-red-950/30 text-red-200 shadow-lg backdrop-blur-sm"
            >
              <div className="space-y-2">
                <p className="wrap-break-word text-sm text-white">
                  {error.message || "Ismeretlen hiba."}
                </p>
              </div>
            </InfoBox>

            <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
              <Link href="/">
                <Button className="bg-slate-700 hover:bg-slate-600">
                  Vissza a főoldalra
                </Button>
              </Link>
            </div>
          </div>
        </PageWithHeader>
      </body>
    </html>
  );
}
