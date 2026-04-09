import { TRPCError } from "@trpc/server";
import { z } from "zod";
import mongooseConnect from "@/clients/mongoose";
import { GoogleGroup } from "@/models";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc";
import { checkRoles } from "@/utils/authorization";

export const googleGroupRouter = createTRPCRouter({
  syncStatus: protectedProcedure
    .output(
      z.object({
        active: z.boolean(),
        lastSync: z.date().nullable(),
      }),
    )
    .query(async ({ ctx }) => {
      const authorized = await checkRoles(ctx.session, ["administrator"]);

      if (!authorized) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Access denied to the requested resource",
        });
      }

      await mongooseConnect();

      const latest = await GoogleGroup.findOne()
        .sort({ receivedAt: -1 })
        .select("receivedAt")
        .lean<{ receivedAt: Date }>();

      if (!latest) {
        return { active: false, lastSync: null };
      }

      const twentyFiveHoursAgo = new Date(Date.now() - 25 * 60 * 60 * 1000);

      return {
        active: latest.receivedAt > twentyFiveHoursAgo,
        lastSync: latest.receivedAt,
      };
    }),
});
