import { Resend } from "resend";
import { procedure, router } from "server/trpc";
import Lunch from "emails/lunch";
import { checkRoles } from "utils/authorization";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

const resend = new Resend(process.env.RESEND_API_KEY);

const emailRouter = router({
    sendLunchEmail: procedure.mutation(async ({ ctx }) => {
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

        await resend.emails.send({
            from: "MyBPHS Ebéd <ebed@bphs.hu>",
            to: process.env.NEXT_PUBLIC_TO_EMAILS?.split(",") || [],
            subject: "Elérhető a jövő heti menü!",
            react: Lunch(),
        });
    }),
    sendAdminEmail: procedure
        .input(
            z.object({
                emailFormat: z.enum(["general", "update", "important"]),
                emailTo: z.enum([
                    "bphs-sysadmins@budapest.school",
                    "jpp-students@budapestschool.org",
                    "jpp-students-only@budapestschool.org",
                    "jpp-teachers@budapestschool.org",
                ]),
                emailSubject: z.string(),
                emailText: z.string(),
            }),
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

            await resend.emails.send({
                from: "MyBPHS <my@bphs.hu>",
                to: input.emailTo,
                subject: input.emailSubject + " | MyBPHS hírlevél",
                react: Lunch(),
            });
        }),
});

export default emailRouter;
