import { type PropsWithChildren, type ReactNode } from "react";
import { api } from "@/trpc/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth";

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
