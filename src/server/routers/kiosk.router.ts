import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { Kiosk } from "@/models";
import type { IKiosk } from "@/models/Kiosk.model";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc";
import { checkRoles } from "@/utils/authorization";

export const kioskRouter = createTRPCRouter({
  save: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      const authorized = await checkRoles(ctx.session, [
        "administrator",
        "lunch-system",
      ]);

      if (!authorized) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Access denied to the requested resource",
        });
      }

      const date = new Date();
      date.setUTCHours(0, 0, 0, 0);

      let kiosk = await Kiosk.findOne({
        date,
      });

      kiosk ??= await new Kiosk<IKiosk>({
        date,
        options: new Map<string, number>(),
      }).save();

      // add data
      kiosk.options.set(input, (kiosk.options.get(input) ?? 0) + 1);
      await kiosk.save();
    }),
  get: protectedProcedure
    .output(z.array(z.tuple([z.string(), z.number()])))
    .query(async ({ ctx }) => {
      const authorized = await checkRoles(ctx.session, [
        "administrator",
        "lunch-system",
      ]);

      if (!authorized) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Access denied to the requested resource",
        });
      }

      const date = new Date();
      date.setUTCHours(0, 0, 0, 0);

      const kiosk = await Kiosk.findOne({
        date,
      });

      if (!kiosk) {
        return [];
      }

      return Array.from(kiosk.options.entries());
    }),
});

export default kioskRouter;
