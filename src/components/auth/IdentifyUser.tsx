"use client";

import { useSession } from "next-auth/react";
import posthog from "posthog-js";
import type { PropsWithChildren } from "react";
import { useEffect } from "react";

export default function IdentifyUser({ children }: PropsWithChildren) {
  const { data } = useSession();

  useEffect(() => {
    if (data?.user?.email) {
      posthog.identify(data.user.email, {
        email: data.user.email,
        name: data.user.name,
      });
    } else {
      posthog.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.user?.email, data?.user?.name]);

  return children;
}
