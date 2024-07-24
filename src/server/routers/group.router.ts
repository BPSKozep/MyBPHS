import { z } from "zod";
import { procedure, router } from "server/trpc";

import { Group, User } from "models";
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
                    override: z.boolean(),
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
            z.strictObject({
                name: z.string(),
                newValue: z.strictObject({
                    name: z.string(),
                    timetable: z.string().nullable().array().array(),
                    priority: z.number(),
                    override: z.boolean(),
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
    
    list: procedure
        .output(
            z.array(
                z.object({
                    groupName: z.string(),
                })
            )
        )
        .query(async ({ ctx }) => {
            if (!ctx.session) {
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "Unauthorized",
                });
            }

            const authorized = await checkRoles(ctx.session, ["administrator", "teacher"]);

            if (!authorized) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "Access denied to the requested resource",
                });
            }

            const groups = await Group.find().select("name");

            return groups.map((group) => ({
                groupName: group.name,
            }));
        }),
    
    getMembers: procedure
        .input(z.string())
        .output(
            z.array(
                z.object({
                    name: z.string(),
                    email: z.string(),
                })
            )
        )
        .query(async ({ ctx, input }) => {
            if (!ctx.session) {
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "Unauthorized",
                });
            }

            const authorized = await checkRoles(ctx.session, ["administrator", "teacher"]);

            if (!authorized) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "Access denied to the requested resource",
                });
            }

            const groupId = await Group.find({ name: input }).select("_id");

            const users = await User.find({ groups: groupId }).select("name email");
            
            return users.map((user) => ({
                name: user.name,
                email: user.email,
            }));
        }),
});

export default groupRouter;
