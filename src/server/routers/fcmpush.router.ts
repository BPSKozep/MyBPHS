import { procedure, router } from "server/trpc";
import admin from "firebase-admin";
import { Message } from "firebase-admin/messaging";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

if (!admin.apps.length) {
  const serviceAccount = ("data/firebase-servicekey.json");
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const fcmPushRouter = router({
    sendPush: procedure
    .input(z.strictObject({
        token: z.string(),
        title: z.string(),
        message: z.string(),
        link: z.string().optional(),
    }))
    .mutation(async ({ input }) => {

    const payload: Message = {
      token: input.token,
      notification: {
        title: input.title,
        body: input.message,
      },
      webpush: input.link ? {
        fcmOptions: {
          link: input.link,
          },
      } : undefined,
    };

    try {
    await admin.messaging().send(payload);

    return;

  } catch (error) {
    throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "An error occurred while sending the push notification",
    })
  }

    })
});

export default fcmPushRouter;
