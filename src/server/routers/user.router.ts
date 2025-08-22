import { z } from "zod";
import {
    createTRPCRouter,
    protectedProcedure,
    publicProcedure,
} from "@/server/trpc";

import { User } from "@/models";
import { TRPCError } from "@trpc/server";
import Group from "@/models/Group.model";
import mongooseConnect from "@/clients/mongoose";
import type { IGroup } from "@/models/Group.model";
import type { Document } from "mongoose";
import type { IGroupOverride } from "@/models/GroupOverride.model";
import { checkRoles } from "@/utils/authorization";
import type { IUser } from "@/models/User.model";
import { sortByPropertyHungarian } from "@/utils/hungarianCollator";

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
                "staff",
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
        .input(z.enum(["all", "student", "staff", "administrator"]))
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
            } else if (input === "staff") {
                roleFilter = { roles: "staff" };
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
                "staff",
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

    update: protectedProcedure
        .input(
            z.object({
                _id: z.string(),
                name: z.string(),
                email: z.string().email(),
                nfcId: z.string(),
                roles: z.array(z.string()),
                blocked: z.boolean(),
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

            const { _id, ...updateData } = input;

            const updatedUser = await User.findByIdAndUpdate(_id, updateData, {
                new: true,
            }).exec();

            if (!updatedUser) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "User not found",
                });
            }

            return {
                _id: updatedUser._id?.toString() ?? "",
                name: updatedUser.name,
                email: updatedUser.email,
                nfcId: updatedUser.nfcId,
                roles: updatedUser.roles,
                blocked: updatedUser.blocked ?? false,
            };
        }),

    // Get all users for client-side management
    getAll: protectedProcedure
        .output(
            z.array(
                z.object({
                    _id: z.string(),
                    name: z.string(),
                    email: z.string(),
                    nfcId: z.string(),
                    laptopPasswordChanged: z.date().nullable(),
                    roles: z.array(z.string()),
                    blocked: z.boolean(),
                }),
            ),
        )
        .query(async ({ ctx }) => {
            const authorized = await checkRoles(ctx.session, ["administrator"]);

            if (!authorized) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "Access denied to the requested resource",
                });
            }

            // Get all users, without server-side sorting (will be sorted client-side with Hungarian collation)
            const users = await User.find().exec();

            // Map users to the response format
            const mappedUsers = users.map((user) => {
                return {
                    _id: user._id?.toString() ?? "",
                    name: user.name,
                    email: user.email,
                    nfcId: user.nfcId,
                    laptopPasswordChanged: user.laptopPasswordChanged ?? null,
                    roles: user.roles,
                    blocked: user.blocked ?? false,
                };
            });

            // Sort by name using Hungarian collation
            return sortByPropertyHungarian(mappedUsers, (user) => user.name);
        }),

    // Create a single user
    create: publicProcedure
        .input(
            z.object({
                name: z.string().min(1),
                email: z.string().email(),
                nfcId: z.string().min(1),
                roles: z.array(z.string()).min(1),
                blocked: z.boolean().default(false),
            }),
        )
        .mutation(
            async ({
                // ctx,
                input,
            }) => {
                // const authorized = await checkRoles(ctx.session, ["administrator"]);

                // if (!authorized) {
                //     throw new TRPCError({
                //         code: "FORBIDDEN",
                //         message: "Access denied to the requested resource",
                //     });
                // }
                await mongooseConnect();

                // Check if user with this email or nfcId already exists
                const existingUser = await User.findOne({
                    $or: [{ email: input.email }, { nfcId: input.nfcId }],
                });

                if (existingUser) {
                    throw new TRPCError({
                        code: "CONFLICT",
                        message:
                            "User with this email or NFC ID already exists",
                    });
                }

                const newUser = await User.create({
                    name: input.name,
                    email: input.email,
                    nfcId: input.nfcId,
                    roles: input.roles,
                    blocked: input.blocked,
                    groups: [],
                });

                return {
                    _id: newUser._id?.toString() ?? "",
                    name: newUser.name,
                    email: newUser.email,
                    nfcId: newUser.nfcId,
                    roles: newUser.roles,
                    blocked: newUser.blocked ?? false,
                    laptopPasswordChanged: null,
                };
            },
        ),

    // Delete multiple users
    delete: protectedProcedure
        .input(z.array(z.string()))
        .mutation(async ({ ctx, input }) => {
            const authorized = await checkRoles(ctx.session, ["administrator"]);

            if (!authorized) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "Access denied to the requested resource",
                });
            }

            if (input.length === 0) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "No users selected for deletion",
                });
            }

            // Delete users by their IDs
            const result = await User.deleteMany({
                _id: { $in: input },
            });

            return {
                deletedCount: result.deletedCount,
                message: `${result.deletedCount} felhasználó törölve`,
            };
        }),

    // Check if a user exists by email
    checkExists: publicProcedure
        .input(z.object({ email: z.string().email() }))
        .output(z.boolean())
        .query(async ({ input }) => {
            await mongooseConnect();
            const user = await User.findOne({ email: input.email });
            return !!user;
        }),
});
