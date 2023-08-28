import { z } from "zod";
import { procedure, router } from "../trpc";

import { User } from "models";
import { TRPCError } from "@trpc/server";
import { IGroup } from "models/Group.model";
import { Document } from "mongoose";
import { IGroupOverride } from "models/GroupOverride.model";
import { checkRoles } from "utils/authorization";

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

            return await User.findOne({ email: input }).select("-_id -__v");
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
            }[] = [];

            for (const group of user?.groups || []) {
                const groupObj: IGroupOverride = group.toObject();

                timetables.push({
                    timetable: groupObj.timetable,
                    priority: groupObj.priority,
                    override: false,
                });

                for (const override of group.overrides) {
                    const overrideObj: IGroupOverride = override.toObject();

                    timetables.push({
                        timetable: overrideObj.timetable,
                        priority: overrideObj.priority,
                        override: true,
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

            const compiled_timetable: (string | null)[][] = [];

            for (const timetable of timetables) {
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
});

export default userRouter;
