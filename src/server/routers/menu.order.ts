import { z } from "zod";
import { procedure, router } from "../trpc";
import { Menu } from "models";
import { IMenu } from "models/Menu.model";
import { TRPCError } from "@trpc/server";

const menuRouter = router({
    get: procedure
        .input(z.strictObject({ week: z.number(), year: z.number() }))
        .output(z.record(z.string()).array())
        .query(async ({ input }) => {
            const menu = await Menu.findOne({
                week: input.week,
                year: input.year,
            });

            if (!menu)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Menu does not exist.",
                });

            return menu.options;
        }),
    create: procedure
        .input(
            z.strictObject({
                week: z.number(),
                year: z.number(),
                options: z.record(z.string()).array(),
            })
        )
        .mutation(async ({ input }) => {
            const menu = await Menu.exists({
                week: input.week,
                year: input.year,
            });

            if (menu) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Menu already exists for specified week.",
                });
            }

            await new Menu<IMenu>({
                week: input.week,
                year: input.year,
                options: input.options,
            }).save();
        }),
});

export default menuRouter;
