"use client";

import { signOut } from "next-auth/react";
import { FaRightFromBracket } from "react-icons/fa6";

export default function DisabledComponent() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center p-6 text-center text-white bg-gray-900">
      <div className="flex max-w-md flex-col items-center gap-4 rounded-2xl bg-[#2e2e2e] p-8 shadow-2xl border border-gray-700">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-900/40 text-3xl">
          🚫
        </div>

        <h1 className="text-2xl font-bold text-red-400">
          A fiókod le van tiltva
        </h1>

        <p className="text-gray-300">
          Kérjük, vedd fel velünk a kapcsolatot a{" "}
          <a
            href="mailto:support@bphs.hu"
            className="font-semibold text-blue-400 underline hover:text-blue-300"
          >
            support@bphs.hu
          </a>{" "}
          email címen.
        </p>

        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/auth/signin" })}
          className="mt-4 flex items-center gap-2 rounded-xl bg-[#454545] px-5 py-2.5 font-medium text-white transition-colors hover:bg-[#565656]"
        >
          <FaRightFromBracket className="size-4" />
          Kijelentkezés
        </button>
      </div>
    </div>
  );
}
