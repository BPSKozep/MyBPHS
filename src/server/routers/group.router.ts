import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc";

import { Group } from "@/models";
import { TRPCError } from "@trpc/server";
import { checkRoles } from "@/utils/authorization";
import type { IGroup } from "@/models/Group.model";

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
                "teacher",
            ]);

            if (!authorized) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "Access denied to the requested resource",
                });
            }

            return await Group.findOne({ name: input }).select<IGroup>(
                "-_id -__v",
            );
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
                "teacher",
            ]);

            if (!authorized) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "Access denied to the requested resource",
                });
            }

            await Group.findOneAndReplace(
                { name: input.name },
                input.newValue,
                {
                    upsert: true,
                },
            );
        }),
});
