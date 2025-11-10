import { getServerSession } from "next-auth";
import type { PropsWithChildren, ReactNode } from "react";
import { authOptions } from "@/server/auth";
import { api } from "@/trpc/server";

export default async function OnlyRolesComponent({
  roles,
  fallback,
  children,
}: { roles: string[]; fallback?: ReactNode } & PropsWithChildren) {
  const session = await getServerSession(authOptions);
  const user = await api.user.get(session?.user?.email ?? "");
  const isAllowed = roles.some((role) => user?.roles.includes(role));

  if (isAllowed) return children;

  return fallback;
}
