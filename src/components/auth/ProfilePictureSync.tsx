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

        if (!data.needsUpload) {
          console.debug(data.message || "Profile picture already up to date");
          return;
        }

        if (data.presignedUrl && data.imageBase64 && data.contentType) {
          const binaryString = atob(data.imageBase64);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          const imageBlob = new Blob([bytes], { type: data.contentType });

          // Only send Content-Type header (required, part of signature).
          // Don't add x-amz-meta-* headers - metadata is in the presigned URL.
          const uploadResponse = await fetch(data.presignedUrl, {
            method: "PUT",
            headers: {
              "Content-Type": data.contentType,
            },
            body: imageBlob,
          });

          if (uploadResponse.ok) {
            console.debug("Profile picture synced successfully");
          } else {
            console.error(
              "Failed to upload profile picture to S3:",
              uploadResponse.status,
            );
          }
        }
      } catch (error) {
        console.error("Error syncing profile picture:", error);
      }
    };

    void syncProfilePicture();
  }, [session?.user?.googleImage, session?.user?.email]);

  return children;
}
