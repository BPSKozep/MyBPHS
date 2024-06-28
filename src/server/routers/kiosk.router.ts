import { z } from "zod";
import { procedure, router } from "server/trpc";
import { TRPCError } from "@trpc/server";
import { checkRoles } from "utils/authorization";
import { Kiosk } from "models";
import { IKiosk } from "models/Kiosk.model";

const kioskRouter = router({
    save: procedure.input(z.string()).mutation(async ({ ctx, input }) => {
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

        const date = new Date();
        date.setUTCHours(0, 0, 0, 0);

        let kiosk = await Kiosk.findOne({
            date,
        });

        if (!kiosk) {
            // create the entry
            kiosk = await new Kiosk<IKiosk>({
                date,
                options: new Map<string, number>(),
            }).save();
        }

        // add data
        kiosk.options.set(input, (kiosk.options.get(input) || 0) + 1);
        await kiosk.save();
    }),
    get: procedure
        .output(z.array(z.tuple([z.string(), z.number()])))
        .query(async ({ ctx }) => {
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

            const date = new Date();
            date.setUTCHours(0, 0, 0, 0);

            const kiosk = await Kiosk.findOne({
                date,
            });

            if (!kiosk) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "No kiosk data found",
                });
            }

            // get data
            console.log(kiosk.options.entries());
            return Array.from(kiosk.options.entries());
        }),
});

export default kioskRouter;
