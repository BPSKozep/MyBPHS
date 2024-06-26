import { z } from "zod";
import { procedure, router } from "server/trpc";
import { Menu } from "models";
import { IMenu } from "models/Menu.model";
import { TRPCError } from "@trpc/server";
import { getWeek, getWeekYear } from "utils/isoweek";
import { checkRoles } from "utils/authorization";

const menuRouter = router({
    get: procedure
        .input(z.strictObject({ week: z.number(), year: z.number() }))
        .output(
            z.strictObject({
                options: z.record(z.string()).array(),
                isOpenForOrders: z.boolean(),
            })
        )
        .query(async ({ ctx, input }) => {
            if (!ctx.session) {
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "Unauthorized",
                });
            }

            const menu = await Menu.findOne({
                week: input.week,
                year: input.year,
            });

            if (!menu) return { options: [], isOpenForOrders: true };

            return {
                options: menu.options,
                isOpenForOrders: menu.isOpenForOrders,
            };
        }),
    create: procedure
        .input(
            z.strictObject({
                week: z.number().optional(),
                year: z.number().optional(),
                options: z.record(z.string()).array(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            if (!ctx.session) {
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "Unauthorized",
                });
            }

            const authorized = await checkRoles(ctx.session, ["administrator"]);

            if (!authorized) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "Access denied to the requested resource",
                });
            }

            const date = new Date();

            const week = input.week || getWeek(date);
            const year = input.year || getWeekYear(date);

            const menu = await Menu.exists({
                week,
                year,
            });

            if (menu) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Menu already exists for specified week.",
                });
            }

            await new Menu<IMenu>({
                week,
                year,
                options: input.options,
                isOpenForOrders: true,
            }).save();
        }),
    setIsopen: procedure
        .input(
            z.strictObject({
                week: z.number(),
                year: z.number(),
                isOpen: z.boolean(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            if (!ctx.session) {
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "Unauthorized",
                });
            }

            const authorized = await checkRoles(ctx.session, ["administrator"]);

            if (!authorized) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "Access denied to the requested resource",
                });
            }

            const date = new Date();

            const week = input.week || getWeek(date);
            const year = input.year || getWeekYear(date);

            const menu = await Menu.findOne({
                week,
                year,
            });

            if (!menu) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Menu not found for specified week.",
                });
            }

            menu.isOpenForOrders = input.isOpen;

            await menu.save();
        }),
});

export default menuRouter;
