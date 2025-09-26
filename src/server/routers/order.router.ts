import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc";

import { Order, User, Menu } from "@/models";
import { getWeek, getWeekYear } from "@/utils/isoweek";
import { checkRoles } from "@/utils/authorization";
import { TRPCError } from "@trpc/server";
import menuCombine, { menuCombines } from "@/utils/menuCombine";
import type { IOrder } from "@/models/Order.model";

export const orderRouter = createTRPCRouter({
    get: protectedProcedure
        .input(
            z.strictObject({
                email: z.string().email().optional(),
                year: z.number().optional(),
                week: z.number().optional(),
            }),
        )
        .output(
            z
                .strictObject({ chosen: z.string(), completed: z.boolean() })
                .array(),
        )
        .query(async ({ ctx, input }) => {
            const authorized = await checkRoles(ctx.session, [
                "administrator",
                "lunch-system",
            ]);

            const email = ctx.session.user?.email ?? input.email;

            const requester = await User.findOne({
                email: ctx.session.user?.email,
            });

            if (!authorized && requester?.email !== email) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "Access denied to the requested resource",
                });
            }

            const user = await User.findOne({ email });

            if (!user) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "User not found",
                });
            }

            const date = new Date();

            const year = input.year ?? getWeekYear(date);
            const week = input.week ?? getWeek(date);

            const menu = await Menu.findOne({ year, week });

            if (!menu) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Menu not found",
                });
            }

            const order = await Order.findOne({ menu, user }).select(
                "-order._id",
            );

            if (!order) {
                return [];
            }

            return order.toObject().order;
        }),
    getAllWeek: protectedProcedure
        .input(
            z.strictObject({
                email: z.string().email().optional(),
                year: z.number().optional(),
                week: z.number().optional(),
            }),
        )
        .output(z.string().array())
        .query(async ({ ctx, input }) => {
            const authorized = await checkRoles(ctx.session, [
                "administrator",
                "lunch-system",
            ]);

            const email = ctx.session.user?.email ?? input.email;

            const requester = await User.findOne({
                email: ctx.session.user?.email,
            });

            if (!authorized && requester?.email !== email) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "Access denied to the requested resource",
                });
            }

            const user = await User.findOne({ email: input.email });

            if (!user) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "User not found",
                });
            }

            const date = new Date();

            const year = input.year ?? getWeekYear(date);
            const week = input.week ?? getWeek(date);

            const menu = await Menu.findOne({ year, week });

            if (!menu) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Menu not found",
                });
            }

            const order = await Order.findOne({ menu, user }).select(
                "-order._id",
            );

            if (!order) {
                return [];
            }

            const combinedOptions = menuCombines(menu.options);

            const orders = order.order
                .map((order, index) => combinedOptions?.[index]?.[order.chosen])
                .filter((order): order is string => order !== undefined);

            return orders;
        }),
    getOrCreateOrderByNfc: protectedProcedure
        .input(z.string())
        .query(async ({ input, ctx }) => {
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

            const year = getWeekYear(date);
            const week = getWeek(date);

            let day = date.getDay() - 1;

            // Adjust the date to Friday if today is Saturday or Sunday
            if (day === 5 || day === -1) {
                day = 4;
            }

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

            if (user.blocked) {
                user.blocked = false;
                await user.save();
            }

            let order = await Order.findOne({
                menu: menu._id,
                user: user._id,
            });
            if (!order) {
                await new Order<IOrder>({
                    order: [
                        {
                            chosen: "a-menu",
                            completed: false,
                        },
                        {
                            chosen: "a-menu",
                            completed: false,
                        },
                        {
                            chosen: "a-menu",
                            completed: false,
                        },
                        {
                            chosen: "a-menu",
                            completed: false,
                        },
                        {
                            chosen: "a-menu",
                            completed: false,
                        },
                    ],
                    menu: menu._id,
                    user: user._id,
                }).save();
            }
            order = await Order.findOne({
                menu: menu._id,
                user: user._id,
            });

            if (!order) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Order not found",
                });
            }

            const menuOptionsForDay = menu.options[day];
            if (!menuOptionsForDay) {
                return {
                    order: "Nincs menü erre a napra",
                    orderError: true,
                };
            }

            const combinedOptions = menuCombine(menuOptionsForDay);

            const orderForDay = order.order[day];
            if (!orderForDay) {
                return {
                    order: "Nincs rendelés erre a napra",
                    orderError: true,
                };
            }

            const chosen = combinedOptions[orderForDay.chosen];

            if (!chosen) {
                return {
                    order: "Hibás rendelés",
                    orderError: true,
                };
            }

            if (orderForDay.completed) {
                return {
                    order: `Ebéd már kiadva (${chosen})`,
                    orderError: true,
                };
            }

            if (orderForDay.chosen === "i_am_not_want_food") {
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
    setCompleted: protectedProcedure
        .input(
            z.strictObject({
                nfcId: z.string(),
            }),
        )
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
                user: user._id,
                menu: menu._id,
            });

            if (!order) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Order not found",
                });
            }

            let day = currentDate.getDay() - 1;
            // Adjust the date to Friday if today is Saturday or Sunday
            if (currentDate.getDay() === 6 || currentDate.getDay() === 0) {
                day = 4;
            }

            const orderForDay = order.order[day];
            if (!orderForDay) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "No order exists for this day",
                });
            }

            orderForDay.completed = true;
            await order.save();
        }),
    create: protectedProcedure
        .input(
            z.strictObject({
                week: z.number().optional(),
                year: z.number().optional(),
                chosenOptions: z.string().array(),
            }),
        )
        .mutation(async ({ ctx, input }) => {
            const date = new Date();

            const menu = await Menu.findOne({
                week: input.week ?? getWeek(date),
                year: input.year ?? getWeekYear(date),
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

            if (user.blocked) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "User is blocked",
                });
            }

            const orderExists = await Order.exists({
                menu: menu._id,
                user: user._id,
            });

            if (orderExists) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Order already exists",
                });
            }

            await new Order<IOrder>({
                menu: menu._id,
                user: user._id,
                order: input.chosenOptions.map((chosen) => {
                    return {
                        chosen: chosen,
                        completed: false,
                    };
                }),
            }).save();
        }),
    getOrderCounts: protectedProcedure
        .input(z.strictObject({ year: z.number(), week: z.number() }))
        .output(z.record(z.string(), z.number()).array())
        .query(async ({ ctx, input }) => {
            const authorized = await checkRoles(ctx.session, ["administrator"]);

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

            const aggregateResult = await Order.aggregate<{
                _id: { chosen: string; day: number };
                count: number;
            }>([
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
                const { chosen, day } = data._id;

                if (!(day in result)) result[day] = {};

                const dayResult = result[day];
                if (dayResult) {
                    dayResult[chosen] = data.count;
                }
            }

            return result;
        }),
    getOrderDocumentCount: protectedProcedure
        .input(z.strictObject({ year: z.number(), week: z.number() }))
        .output(z.number())
        .query(async ({ ctx, input }) => {
            const authorized = await checkRoles(ctx.session, ["administrator"]);

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
                return 0;
            }

            const count = await Order.countDocuments({
                menu: menu._id,
            });

            return count;
        }),
    edit: protectedProcedure
        .input(
            z.strictObject({
                week: z.number().optional(),
                year: z.number().optional(),
                chosenOptions: z.string().array(),
            }),
        )
        .mutation(async ({ ctx, input }) => {
            const date = new Date();

            const menu = await Menu.findOne({
                week: input.week ?? getWeek(date),
                year: input.year ?? getWeekYear(date),
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

            if (user.blocked) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "User is blocked",
                });
            }

            const order = await Order.findOne({
                menu: menu._id,
                user: user._id,
            });

            if (!order) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Order not found",
                });
            }

            order.order = input.chosenOptions.map((chosen) => {
                return {
                    chosen: chosen,
                    completed: false,
                };
            });

            await order.save();
        }),
});
