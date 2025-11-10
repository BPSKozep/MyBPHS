"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import type { PropsWithChildren } from "react";
import { useEffect } from "react";
import { api } from "@/trpc/react";
import Loading from "../Loading";

export default function OnlyBlocked({ children }: PropsWithChildren) {
  const router = useRouter();
  const session = useSession();
  const user = api.user.get.useQuery(session.data?.user?.email ?? "");

  // biome-ignore lint/correctness/useExhaustiveDependencies: router.replace
  useEffect(() => {
    if (user.data?.blocked) router.replace("/lunch");
  }, [user.data]);

  if (user.data?.blocked) return children;

  return (
    <div className="flex h-full w-full items-center justify-center align-middle">
      <Loading />
    </div>
  );
}
