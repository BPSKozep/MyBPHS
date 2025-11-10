import { TRPCError } from "@trpc/server";
import { Resend } from "resend";
import { z } from "zod";
import { getVerificationService } from "@/clients/redis";
import General from "@/emails/general";
import GeneralUser from "@/emails/generalUser";
import Important from "@/emails/important";
import ImportantUser from "@/emails/importantUser";
import Lunch from "@/emails/lunch";
import Update from "@/emails/update";
import Verification from "@/emails/verification";
import Welcome from "@/emails/welcome";
import { env as clientEnv } from "@/env/client";
import { env as serverEnv } from "@/env/server";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/trpc";
import { checkRoles } from "@/utils/authorization";

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
  sendAdminEmail: protectedProcedure
    .input(
      z.object({
        emailFormat: z.enum(["general", "update", "important"]),
        emailTo: z.union([
          z
            .string()
            .email(), // Single email for user emails
          z.enum([
            // Group emails
            "bphs-sysadmins@budapest.school",
            "jpp-students@budapestschool.org",
            "jpp-students-only@budapestschool.org",
            "jpp-teachers@budapestschool.org",
          ]),
        ]),
        emailSubject: z.string(),
        emailHtml: z.string(),
        buttonLink: z.string().optional(),
        buttonText: z.string().optional(),
        user: z.string().optional(), // User name for individual emails
        isGroupEmail: z.boolean(),
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
          ? input.emailSubject +
            (input.isGroupEmail ? " | MyBPHS hírlevél" : " | MyBPHS üzenet")
          : `FONTOS MyBPHS üzenet | ${input.emailSubject}`;

      let emailComponent: React.ReactNode;

      if (input.isGroupEmail) {
        // Group email logic
        const recipients =
          typeof input.emailTo === "string" && input.emailTo.includes("@")
            ? input.emailTo === "bphs-sysadmins@budapest.school"
              ? "Kedves Rendszergazdák!"
              : input.emailTo === "jpp-students@budapestschool.org"
                ? "Kedves diákok és tanárok!"
                : input.emailTo === "jpp-students-only@budapestschool.org"
                  ? "Kedves diákok!"
                  : "Kedves tanárok!"
            : ""; // fallback

        emailComponent =
          input.emailFormat === "general"
            ? General({ html: input.emailHtml, recipients })
            : input.emailFormat === "update"
              ? Update({
                  html: input.emailHtml,
                  link: input.buttonLink,
                  buttonText: input.buttonText,
                })
              : Important({ html: input.emailHtml, recipients });
      } else {
        // User email logic
        const userName = input.user ?? "Felhasználó";

        emailComponent =
          input.emailFormat === "general"
            ? GeneralUser({ html: input.emailHtml, user: userName })
            : ImportantUser({
                html: input.emailHtml,
                user: userName,
              });
      }

      await resend.emails.send({
        from: "MyBPHS <my@bphs.hu>",
        to: input.emailTo,
        subject,
        react: emailComponent,
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
        const storedData = await verificationService.getCode(input.email);

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
        const storedData = await verificationService.getCode(input.email);

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
