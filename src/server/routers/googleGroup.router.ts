import { TRPCError } from "@trpc/server";
import { z } from "zod";
import mongooseConnect from "@/clients/mongoose";
import { GoogleGroup } from "@/models";
import { backfillJoinDatesFromGoogleHistory } from "@/server/services/googleSync";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc";
import { checkRoles } from "@/utils/authorization";

export const googleGroupRouter = createTRPCRouter({
  syncStatus: protectedProcedure
    .output(
      z.object({
        active: z.boolean(),
        lastSync: z.date().nullable(),
        lastApplied: z.date().nullable(),
        lastAppliedCount: z.number().nullable(),
        lastApplyError: z.string().nullable(),
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
        .select("receivedAt appliedAt appliedCount applyError")
        .lean<{
          receivedAt: Date;
          appliedAt?: Date;
          appliedCount?: number;
          applyError?: string;
        }>();

      if (!latest) {
        return {
          active: false,
          lastSync: null,
          lastApplied: null,
          lastAppliedCount: null,
          lastApplyError: null,
        };
      }

      const twentyFiveHoursAgo = new Date(Date.now() - 25 * 60 * 60 * 1000);

      return {
        active: latest.receivedAt > twentyFiveHoursAgo,
        lastSync: latest.receivedAt,
        lastApplied: latest.appliedAt ?? null,
        lastAppliedCount: latest.appliedCount ?? null,
        lastApplyError: latest.applyError ?? null,
      };
    }),

  backfillJoinDates: protectedProcedure
    .output(
      z.object({
        updated: z.number(),
        missing: z.string().array(),
      }),
    )
    .mutation(async ({ ctx }) => {
      const authorized = await checkRoles(ctx.session, ["administrator"]);

      if (!authorized) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Access denied to the requested resource",
        });
      }

      return await backfillJoinDatesFromGoogleHistory();
    }),
});
