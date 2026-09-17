"use client";

import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import type { PropsWithChildren } from "react";
import { useEffect } from "react";
import DisabledComponent from "@/components/auth/DisabledComponent";

export default function DisabledGuard({ children }: PropsWithChildren) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  const isDisabled = status === "authenticated" && !!session?.user?.disabled;

  useEffect(() => {
    if (isDisabled && pathname !== "/disabled") {
      router.replace("/disabled");
    }
  }, [isDisabled, pathname, router]);

  if (isDisabled) {
    return <DisabledComponent />;
  }

  return <>{children}</>;
}
