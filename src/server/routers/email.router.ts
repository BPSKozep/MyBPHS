import { Resend } from "resend";
import { procedure, router } from "server/trpc";
import Lunch from "emails/lunch";
import General from "emails/general";
import Update from "emails/update";
import Important from "emails/important";
import GeneralUser from "emails/generalUser";
import ImportantUser from "emails/importantUser";
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
    sendAdminGroupEmail: procedure
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
                buttonLink: z.string().optional(),
                buttonText: z.string().optional(),
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

            const subject =
                input.emailFormat !== "important"
                    ? input.emailSubject + " | MyBPHS hírlevél"
                    : "FONTOS MyBPHS üzenet | " + input.emailSubject;

            input.emailTo &&
                (await resend.emails.send({
                    from: "MyBPHS <my@bphs.hu>",
                    to: input.emailTo,
                    subject,
                    react:
                        input.emailFormat === "general"
                            ? General({ text: input.emailText })
                            : input.emailFormat === "update"
                              ? Update({
                                    text: input.emailText,
                                    link: input.buttonLink,
                                    buttonText: input.buttonText,
                                })
                              : Important({
                                    text: input.emailText,
                                }),
                }));
        }),
    sendAdminUserEmail: procedure
        .input(
            z.object({
                emailFormat: z.enum(["general", "update", "important"]),
                emailTo: z.string(),
                emailSubject: z.string(),
                emailText: z.string(),
                buttonLink: z.string().optional(),
                buttonText: z.string().optional(),
                user: z.string(),
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

            const subject =
                input.emailFormat !== "important"
                    ? input.emailSubject + " | MyBPHS üzenet"
                    : "FONTOS MyBPHS üzenet | " + input.emailSubject;

            input.emailTo &&
                (await resend.emails.send({
                    from: "MyBPHS <my@bphs.hu>",
                    to: input.emailTo,
                    subject,
                    react:
                        input.emailFormat === "general"
                            ? GeneralUser({
                                  text: input.emailText,
                                  user: input.user,
                              })
                            : input.emailFormat === "update"
                              ? Update({
                                    text: input.emailText,
                                    link: input.buttonLink,
                                    buttonText: input.buttonText,
                                })
                              : ImportantUser({
                                    text: input.emailText,
                                    user: input.user,
                                }),
                }));
        }),
});

export default emailRouter;
