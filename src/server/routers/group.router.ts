import { z } from "zod";
import { procedure, router } from "../trpc";

import { Group } from "models";
import { TRPCError } from "@trpc/server";
import { checkRoles } from "utils/authorization";
import { IGroup } from "models/Group.model";

const groupRouter = router({
    get: procedure
        .input(z.string())
        .output(
            z
                .object({
                    name: z.string(),
                    timetable: z.string().nullable().array().array(),
                    priority: z.number(),
                })
                .nullable()
        )
        .query(async ({ ctx, input }) => {
            if (!ctx.session) {
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "Unauthorized",
                });
            }

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
                "-_id -__v"
            );
        }),
    update: procedure
        .input(
            z.object({
                name: z.string(),
                newValue: z.object({
                    name: z.string(),
                    timetable: z.string().nullable().array().array(),
                    priority: z.number(),
                }),
            })
        )
        .mutation(async ({ ctx, input }) => {
            if (!ctx.session) {
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "Unauthorized",
                });
            }

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
                }
            );
        }),
});

export default groupRouter;
