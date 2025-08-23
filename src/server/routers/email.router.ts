import { Resend } from "resend";
import {
    createTRPCRouter,
    protectedProcedure,
    publicProcedure,
} from "@/server/trpc";
import Lunch from "@/emails/lunch";
import General from "@/emails/general";
import Update from "@/emails/update";
import Important from "@/emails/important";
import GeneralUser from "@/emails/generalUser";
import ImportantUser from "@/emails/importantUser";
import Verification from "@/emails/verification";
import Welcome from "@/emails/welcome";
import { checkRoles } from "@/utils/authorization";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { env as clientEnv } from "@/env/client";
import { env as serverEnv } from "@/env/server";
import { getVerificationService } from "@/clients/redis";

const resend = new Resend(serverEnv.RESEND_API_KEY);

// Function to generate a 6-digit verification code
function generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

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

    sendVerificationCode: publicProcedure
        .input(
            z.object({
                email: z.string().email(),
                name: z.string(),
            }),
        )
        .mutation(async ({ input }) => {
            // Generate new verification code
            const code = generateVerificationCode();
            const expiry = Date.now() + 10 * 60 * 1000; // 10 minutes from now

            // Get verification service
            const verificationService = await getVerificationService();

            // Store the code in Redis
            await verificationService.setCode(input.email, {
                code,
                expiry,
                name: input.name,
            });

            // Send the email
            await resend.emails.send({
                from: "MyBPHS <my@bphs.hu>",
                to: input.email,
                subject: "MyBPHS Email Verifikáció",
                react: Verification({
                    name: input.name,
                    code: code,
                }),
            });

            return { success: true };
        }),

    verifyAndDeleteCode: publicProcedure
        .input(
            z.object({
                email: z.string().email(),
                code: z.string().length(6),
            }),
        )
        .mutation(async ({ input }) => {
            // Get verification service
            const verificationService = await getVerificationService();

            // Verify and delete the code in one operation
            const isValid = await verificationService.verifyAndDeleteCode(
                input.email,
                input.code,
            );

            if (!isValid) {
                // Check if there was a code at all
                const storedData = await verificationService.getCode(
                    input.email,
                );

                if (!storedData) {
                    throw new TRPCError({
                        code: "NOT_FOUND",
                        message:
                            "No verification code found for this email. Please request a new code.",
                    });
                } else {
                    throw new TRPCError({
                        code: "BAD_REQUEST",
                        message: "Invalid verification code.",
                    });
                }
            }

            return { success: true };
        }),

    verifyCode: publicProcedure
        .input(
            z.object({
                email: z.string().email(),
                code: z.string().length(6),
            }),
        )
        .mutation(async ({ input }) => {
            // Get verification service
            const verificationService = await getVerificationService();

            // Verify the code without deleting it
            const isValid = await verificationService.verifyCode(
                input.email,
                input.code,
            );

            if (!isValid) {
                // Check if there was a code at all
                const storedData = await verificationService.getCode(
                    input.email,
                );

                if (!storedData) {
                    throw new TRPCError({
                        code: "NOT_FOUND",
                        message:
                            "No verification code found for this email. Please request a new code.",
                    });
                } else {
                    throw new TRPCError({
                        code: "BAD_REQUEST",
                        message: "Hibás kód.",
                    });
                }
            }

            return { success: true };
        }),

    sendWelcome: publicProcedure
        .input(
            z.object({
                name: z.string(),
                email: z.string().email(),
                isOnboarding: z.boolean().default(false),
            }),
        )
        .mutation(async ({ input }) => {
            // Send the welcome email
            await resend.emails.send({
                from: "MyBPHS <my@bphs.hu>",
                to: input.email,
                subject: "Üdvözlünk a MyBPHS rendszerben!",
                react: Welcome({
                    name: input.name,
                    isOnboarding: input.isOnboarding,
                }),
            });

            return { success: true };
        }),
});
