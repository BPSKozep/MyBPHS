"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { type PropsWithChildren, useEffect, useMemo } from "react";
import { api } from "@/trpc/react";

export default function OnlyRoles({
  roles,
  children,
}: { roles: string[] } & PropsWithChildren) {
  const router = useRouter();
  const session = useSession();
  const user = api.user.get.useQuery(session.data?.user?.email ?? "", {
    enabled: !!session.data,
  });
  const isAllowed = useMemo(
    () => roles.some((role) => user.data?.roles.includes(role)),
    [roles, user],
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: router.replace
  useEffect(() => {
    if (user.data && !isAllowed) router.replace("/forbidden");
  }, [user.data, isAllowed]);

  if (isAllowed) return children;
}
