"use client";

import { useSession } from "next-auth/react";
import type { PropsWithChildren } from "react";
import { useEffect, useRef } from "react";
import { api } from "@/trpc/react";

export default function ProfilePictureSync({ children }: PropsWithChildren) {
  const { data: session } = useSession();
  const syncAttemptedRef = useRef<string | null>(null);

  const checkAndGetUploadUrl =
    api.profilePicture.checkAndGetUploadUrl.useMutation();

  // biome-ignore lint/correctness/useExhaustiveDependencies: mutateAsync is stable, ref prevents re-runs
  useEffect(() => {
    const syncProfilePicture = async () => {
      if (
        !session?.user?.googleImage ||
        !session?.user?.email ||
        syncAttemptedRef.current === session.user.email
      ) {
        return;
      }

      syncAttemptedRef.current = session.user.email;

      try {
        const data = await checkAndGetUploadUrl.mutateAsync({
          googleImageUrl: session.user.googleImage,
        });

        console.debug(data.message ?? "Profile picture sync complete");
      } catch (error) {
        console.error("Error syncing profile picture:", error);
      }
    };

    void syncProfilePicture();
  }, [session?.user?.googleImage, session?.user?.email]);

  return children;
}
