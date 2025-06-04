import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc";

import { User } from "@/models";
import { TRPCError } from "@trpc/server";
import Group from "@/models/Group.model";
import type { IGroup } from "@/models/Group.model";
import type { Document } from "mongoose";
import type { IGroupOverride } from "@/models/GroupOverride.model";
import { checkRoles } from "@/utils/authorization";
import type { IUser } from "@/models/User.model";

export const userRouter = createTRPCRouter({
    get: protectedProcedure
        .input(z.string().email())
        .output(
            z
                .object({
                    name: z.string(),
                    email: z.string(),
                    roles: z.string().array(),
                    blocked: z.boolean().optional(),
                })
                .nullable(),
        )
        .query(async ({ ctx, input }) => {
            const authorized = await checkRoles(ctx.session, ["administrator"]);

            const requester = await User.findOne({
                email: ctx.session.user?.email,
            });

            if (!authorized && requester?.email !== input) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "Access denied to the requested resource",
                });
            }

            return await User.findOne({ email: input }).select<IUser>(
                "-_id -__v",
            );
        }),
    getUserByNfcId: protectedProcedure
        .input(z.string())
        .output(
            z
                .object({
                    name: z.string(),
                    email: z.string(),
                    roles: z.string().array(),
                    blocked: z.boolean().optional(),
                })
                .nullable(),
        )
        .query(async ({ ctx, input }) => {
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

            return await User.findOne({ nfcId: input }).select<IUser>(
                "-_id -__v",
            );
        }),
    createMany: protectedProcedure
        .input(
            z.strictObject({
                names: z.string().array(),
                emails: z.string().email().array(),
                roles: z.string().array().array(),
                nfcIds: z.string().array(),
            }),
        )
        .mutation(async ({ ctx, input }) => {
            const authorized = await checkRoles(ctx.session, ["administrator"]);

            if (!authorized) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "Access denied to the requested resource",
                });
            }

            // Ensure all arrays have the same length
            const length = input.names.length;
            if (
                input.emails.length !== length ||
                input.roles.length !== length ||
                input.nfcIds.length !== length
            ) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "All input arrays must have the same length",
                });
            }

            const users: IUser[] = input.names.map((name, index) => {
                const email = input.emails[index];
                const roles = input.roles[index];
                const nfcId = input.nfcIds[index];

                // TypeScript now knows these are defined due to length check above
                if (!email || !roles || !nfcId) {
                    throw new TRPCError({
                        code: "BAD_REQUEST",
                        message: "Missing required fields",
                    });
                }

                return {
                    name,
                    email,
                    roles,
                    nfcId,
                    groups: [],
                };
            });

            await User.insertMany<IUser>(users);
        }),
    getTimetable: protectedProcedure
        .input(z.string().email())
        .output(z.string().nullable().array().array())
        .query(async ({ ctx, input }) => {
            const authorized = await checkRoles(ctx.session, ["administrator"]);

            const requester = await User.findOne({
                email: ctx.session.user?.email,
            });

            if (!authorized && requester?.email !== input) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "Access denied to the requested resource",
                });
            }

            const user = await User.findOne({ email: input }).populate<{
                groups: (Document &
                    IGroup & { overrides: (Document & IGroupOverride)[] })[];
            }>({ path: "groups", populate: { path: "overrides" } });

            const timetables: {
                timetable: (string | null)[][];
                priority: number;
                override: boolean;
                isOverride: boolean;
            }[] = [];

            for (const group of user?.groups ?? []) {
                const groupObj = group.toObject() as IGroupOverride;

                timetables.push({
                    timetable: groupObj.timetable,
                    priority: groupObj.priority,
                    override: groupObj.override,
                    isOverride: false,
                });

                for (const override of group.overrides) {
                    const overrideObj = override.toObject() as IGroupOverride;

                    timetables.push({
                        timetable: overrideObj.timetable,
                        priority: overrideObj.priority,
                        override: overrideObj.override,
                        isOverride: true,
                    });
                }
            }

            timetables.sort((a, b) => {
                if (a.priority > b.priority) {
                    return 1;
                }

                if (a.priority < b.priority) {
                    return -1;
                }

                if (a.override && !b.override) {
                    return 1;
                }

                if (!a.override && b.override) {
                    return -1;
                }

                return 0;
            });

            let compiled_timetable: (string | null)[][] = [];

            for (const timetable of timetables) {
                if (timetable.override) {
                    compiled_timetable = timetable.timetable;
                    continue;
                }

                for (const [i, day] of timetable.timetable.entries()) {
                    if (compiled_timetable[i] === undefined) {
                        compiled_timetable.push([]);
                    }

                    for (const [j, lesson] of day.entries()) {
                        // Ensure the day array exists and has the required index
                        compiled_timetable[i] ??= [];

                        if (
                            lesson ||
                            !compiled_timetable[i][j] ||
                            compiled_timetable[i][j] === undefined
                        )
                            compiled_timetable[i][j] = lesson;
                    }
                }
            }

            return compiled_timetable;
        }),
    batchUpdateGroups: protectedProcedure
        .input(
            z.strictObject({
                mode: z.enum(["add", "remove", "replace"]),
                update: z
                    .object({
                        email: z.string().email(),
                        newGroups: z.string().array(),
                    })
                    .array(),
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

            if (input.mode === "replace") {
                for (const request of input.update) {
                    await User.findOneAndUpdate(
                        { email: request.email },
                        {
                            $set: {
                                groups: await Group.find({
                                    name: { $in: request.newGroups },
                                }),
                            },
                        },
                    );
                }
            } else if (input.mode === "add") {
                for (const request of input.update) {
                    await User.findOneAndUpdate(
                        { email: request.email },
                        {
                            $push: {
                                groups: {
                                    $each: await Group.find({
                                        name: { $in: request.newGroups },
                                    }),
                                },
                            },
                        },
                    );
                }
            } else if (input.mode === "remove") {
                for (const request of input.update) {
                    await User.findOneAndUpdate(
                        { email: request.email },
                        {
                            $pullAll: {
                                groups: await Group.find({
                                    name: { $in: request.newGroups },
                                }),
                            },
                        },
                    );
                }
            }
        }),
    list: protectedProcedure
        .input(z.enum(["all", "student", "teacher", "administrator"]))
        .output(
            z.array(
                z.object({
                    email: z.string(),
                    name: z.string(),
                    blocked: z.boolean(),
                }),
            ),
        )
        .query(async ({ ctx, input }) => {
            const authorized = await checkRoles(ctx.session, ["administrator"]);

            if (!authorized) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "Access denied to the requested resource",
                });
            }

            let roleFilter = {};
            if (input === "student") {
                roleFilter = { roles: "student" };
            } else if (input === "teacher") {
                roleFilter = { roles: "teacher" };
            } else if (input === "administrator") {
                roleFilter = { roles: "administrator" };
            }

            const users =
                await User.find(roleFilter).select("email name blocked");

            return users.map((user) => ({
                email: user.email,
                name: user.name,
                blocked: user.blocked ?? false,
            }));
        }),
    getNfcId: protectedProcedure
        .input(z.string().email())
        .output(z.string())
        .query(async ({ ctx, input }) => {
            const authorized = await checkRoles(ctx.session, [
                "student",
                "teacher",
                "lunch-system",
            ]);

            if (!authorized) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "Access denied to the requested resource",
                });
            }

            const user = await User.findOne({ email: input });

            return user?.nfcId ?? "";
        }),

    toggleBlocked: protectedProcedure
        .input(z.string())
        .mutation(async ({ ctx, input }) => {
            const authorized = await checkRoles(ctx.session, ["administrator"]);

            if (!authorized) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "Access denied to the requested resource",
                });
            }

            const user = await User.findOne({
                email: input,
            });

            if (!user) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "User not found",
                });
            }

            user.blocked = !user.blocked;

            await user.save();

            return "OK";
        }),
});
