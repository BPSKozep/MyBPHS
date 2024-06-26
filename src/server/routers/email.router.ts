import { Resend } from "resend";
import { procedure, router } from "server/api/trpc";
import Lunch from "emails/lunch";
import { checkRoles } from "utils/authorization";
import { TRPCError } from "@trpc/server";

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
});

export default emailRouter;
