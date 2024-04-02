import { useSession } from "next-auth/react";
import { PropsWithChildren, ReactNode, useMemo } from "react";
import { trpc } from "utils/trpc";

function OnlyRolesComponent({
    roles,
    fallback,
    children,
}: { roles: string[]; fallback?: ReactNode } & PropsWithChildren) {
    const { data } = useSession();
    const { data: user } = trpc.user.get.useQuery(data?.user?.email || "");
    const isAllowed = useMemo(
        () => roles.some((role) => user && user.roles.indexOf(role) !== -1),
        [roles, user]
    );

    if (isAllowed) return children;

    return fallback;
}

export default OnlyRolesComponent;
