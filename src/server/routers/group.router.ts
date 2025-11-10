import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { Group } from "@/models";
import type { IGroup } from "@/models/Group.model";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc";
import { checkRoles } from "@/utils/authorization";

export const groupRouter = createTRPCRouter({
  get: protectedProcedure
    .input(z.string())
    .output(
      z
        .object({
          name: z.string(),
          timetable: z.string().nullable().array().array(),
          priority: z.number(),
          override: z.boolean(),
        })
        .nullable(),
    )
    .query(async ({ ctx, input }) => {
      const authorized = await checkRoles(ctx.session, [
        "administrator",
        "staff",
      ]);

      if (!authorized) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Access denied to the requested resource",
        });
      }

      return await Group.findOne({ name: input }).select<IGroup>("-_id -__v");
    }),
  update: protectedProcedure
    .input(
      z.strictObject({
        name: z.string(),
        newValue: z.strictObject({
          name: z.string(),
          timetable: z.string().nullable().array().array(),
          priority: z.number(),
          override: z.boolean(),
        }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const authorized = await checkRoles(ctx.session, [
        "administrator",
        "staff",
      ]);

      if (!authorized) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Access denied to the requested resource",
        });
      }

      await Group.findOneAndReplace({ name: input.name }, input.newValue, {
        upsert: true,
      });
    }),
});
