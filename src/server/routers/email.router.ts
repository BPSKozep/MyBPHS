import { Resend } from "resend";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc";
import Lunch from "@/emails/lunch";
import General from "@/emails/general";
import Update from "@/emails/update";
import Important from "@/emails/important";
import GeneralUser from "@/emails/generalUser";
import ImportantUser from "@/emails/importantUser";
import { checkRoles } from "@/utils/authorization";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { env as clientEnv } from "@/env/client";
import { env as serverEnv } from "@/env/server";

const resend = new Resend(serverEnv.RESEND_API_KEY);

export const emailRouter = createTRPCRouter({
    sendLunchEmail: protectedProcedure.mutation(async ({ ctx }) => {
        const authorized = await checkRoles(ctx.session, ["administrator"]);

        if (!authorized) {
            throw new TRPCError({
                code: "FORBIDDEN",
                message: "Access denied to the requested resource",
            });
        }

        await resend.emails.send({
            from: "MyBPHS Ebéd <ebed@bphs.hu>",
            to: clientEnv.NEXT_PUBLIC_TO_EMAILS?.split(",") ?? [],
            subject: "Elérhető a jövő heti menü!",
            react: Lunch(),
        });
    }),
    sendAdminGroupEmail: protectedProcedure
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

            const recipients =
                input.emailTo === "bphs-sysadmins@budapest.school"
                    ? "Kedves Rendszergazdák!"
                    : input.emailTo === "jpp-students@budapestschool.org"
                      ? "Kedves diákok és tanárok!"
                      : input.emailTo === "jpp-students-only@budapestschool.org"
                        ? "Kedves diákok!"
                        : "Kedves tanárok!";

            await resend.emails.send({
                from: "MyBPHS <my@bphs.hu>",
                to: input.emailTo,
                subject,
                react:
                    input.emailFormat === "general"
                        ? General({ text: input.emailText, recipients })
                        : input.emailFormat === "update"
                          ? Update({
                                text: input.emailText,
                                link: input.buttonLink,
                                buttonText: input.buttonText,
                            })
                          : Important({
                                text: input.emailText,
                                recipients,
                            }),
            });
        }),
    sendAdminUserEmail: protectedProcedure
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

            await resend.emails.send({
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
            });
        }),
});
