import { z } from "zod";
import { procedure, router } from "../trpc";

import { User } from "models";
import { TRPCError } from "@trpc/server";
import Group, { IGroup } from "models/Group.model";
import { Document } from "mongoose";
import { IGroupOverride } from "models/GroupOverride.model";
import { checkRoles } from "utils/authorization";
import { IUser } from "models/User.model";

const userRouter = router({
    get: procedure
        .input(z.string().email())
        .output(
            z
                .object({
                    name: z.string(),
                    email: z.string(),
                    roles: z.string().array(),
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
                "-_id -__v"
            );
        }),
    getTimetable: procedure
        .input(z.string().email())
        .output(z.string().nullable().array().array())
        .query(async ({ ctx, input }) => {
            if (!ctx.session) {
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "Unauthorized",
                });
            }

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

            for (const group of user?.groups || []) {
                const groupObj: IGroupOverride = group.toObject();

                timetables.push({
                    timetable: groupObj.timetable,
                    priority: groupObj.priority,
                    override: groupObj.override,
                    isOverride: false,
                });

                for (const override of group.overrides) {
                    const overrideObj: IGroupOverride = override.toObject();

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
    batchUpdateGroups: procedure
        .input(
            z.object({
                mode: z.enum(["add", "remove", "replace"]),
                update: z
                    .object({
                        email: z.string().email(),
                        newGroups: z.string().array(),
                    })
                    .array(),
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
                        }
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
                        }
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
                        }
                    );
                }
            }
        }),
});

export default userRouter;
