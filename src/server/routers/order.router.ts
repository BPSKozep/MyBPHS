import { z } from "zod";
import { procedure, router } from "../trpc";

import { Order, User, Menu } from "models";
import { getWeek, getWeekYear } from "utils/isoweek";
import { checkRoles } from "utils/authorization";
import { TRPCError } from "@trpc/server";
import menuCombine from "utils/menuCombine";
import { IOrder } from "models/Order.model";

const orderRouter = router({
    getOrder: procedure.input(z.string()).query(async ({ input, ctx }) => {
        if (!ctx.session) {
            throw new TRPCError({
                code: "UNAUTHORIZED",
                message: "Unauthorized",
            });
        }

        const authorized = await checkRoles(ctx.session, [
            "administrator",
            "lunch-system",
        ]);

        const requester = await User.findOne({
            email: ctx.session.user?.email,
        });

        if (!authorized && requester?.nfcId !== input) {
            throw new TRPCError({
                code: "FORBIDDEN",
                message: "Access denied to the requested resource",
            });
        }

        const currentDate = new Date();

        const year = getWeekYear(currentDate);
        const week = getWeek(currentDate);

        const day = currentDate.getDay() - 1;

        const menu = await Menu.findOne({
            week,
            year,
        });

        if (!menu) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "Menu not found",
            });
        }

        const user = await User.findOne({ nfcId: input });

        if (!user) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "User not found",
            });
        }

        let order = await Order.findOne({
            menu: menu.id,
            user: user.id,
        });

        if (!order) {
            order = await new Order<IOrder>({
                order: [
                    {
                        chosen: menu.options[0]["a-menu"],
                        completed: false,
                    },
                    {
                        chosen: menu.options[1]["a-menu"],
                        completed: false,
                    },
                    {
                        chosen: menu.options[2]["a-menu"],
                        completed: false,
                    },
                    {
                        chosen: menu.options[3]["a-menu"],
                        completed: false,
                    },
                    {
                        chosen: menu.options[4]["a-menu"],
                        completed: false,
                    },
                ],
                menu: menu.id,
                user: user.id,
            }).save();
        }

        const combinedOptions = menuCombine(menu.options[day]);

        const chosen = combinedOptions[order.order[day].chosen];

        if (order.order[day].completed) {
            return {
                order: `Ebéd már kiadva (${chosen})`,
                orderError: true,
            };
        }

        if (order.order[day].chosen === "i_am_not_want_food") {
            return {
                order: "Nincs rendelés",
                orderError: true,
            };
        }

        return {
            order: chosen,
            orderError: false,
        };
    }),
    setCompleted: procedure
        .input(
            z.strictObject({
                nfcId: z.string(),
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
                "lunch-system",
            ]);

            if (!authorized) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "Access denied to the requested resource",
                });
            }

            const currentDate = new Date();

            const year = getWeekYear(currentDate);
            const week = getWeek(currentDate);

            const menu = await Menu.findOne({
                week,
                year,
            });

            if (!menu) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Menu not found",
                });
            }

            const user = await User.findOne({ nfcId: input.nfcId });

            if (!user) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "User not found",
                });
            }

            const order = await Order.findOne({
                user: user.id,
                menu: menu.id,
            });

            if (!order) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Order not found",
                });
            }

            order.order[currentDate.getDay() - 1].completed = true;
            await order.save();
        }),
    create: procedure
        .input(z.string().array())
        .mutation(async ({ ctx, input }) => {
            const date = new Date();

            const menu = await Menu.findOne({
                week: getWeek(date),
                year: getWeekYear(date),
            });

            if (!menu) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Menu not found",
                });
            }

            const user = await User.findOne({
                email: ctx.session?.user?.email,
            });

            if (!user) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "User not found",
                });
            }

            const orderExists = await Order.exists({
                menu: menu.id,
                user: user.id,
            });

            if (orderExists) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Order already exists",
                });
            }

            await new Order<IOrder>({
                menu: menu.id,
                user: user.id,
                order: input.map((chosen) => {
                    return {
                        chosen: chosen,
                        completed: false,
                    };
                }),
            }).save();
        }),
    getOrderCounts: procedure
        .input(z.strictObject({ year: z.number(), week: z.number() }))
        .output(z.record(z.string(), z.number()).array())
        .query(async ({ ctx, input }) => {
            if (!ctx.session) {
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "Unauthorized",
                });
            }

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

            const menu = await Menu.findOne({
                year: input.year,
                week: input.week,
            });

            if (!menu) {
                return [];
            }

            const aggregateResult = await Order.aggregate([
                {
                    $unwind: {
                        path: "$order",
                        includeArrayIndex: "day",
                    },
                },
                {
                    $match: {
                        menu: menu._id,
                    },
                },
                {
                    $group: {
                        _id: {
                            chosen: "$order.chosen",
                            day: "$day",
                        },
                        count: {
                            $sum: 1,
                        },
                    },
                },
                {
                    $sort: {
                        "_id.chosen": 1,
                    },
                },
            ]);

            const result: Record<string, number>[] = [];

            for (const data of aggregateResult) {
                const { chosen, day }: { chosen: string; day: number } =
                    data._id;

                if (!(day in result)) result[day] = {};

                result[day][chosen] = data.count;
            }

            return result;
        }),
});

export default orderRouter;
