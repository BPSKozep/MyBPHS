import { TRPCError } from "@trpc/server";
import { Resend } from "resend";
import { z } from "zod";
import TokenRequestEmail from "@/emails/tokenRequest";
import { env } from "@/env/server";
import { calculateLunchTokenUsage } from "@/lib/lunchTokenUsage";
import { Menu, Order, TokenRequest, User } from "@/models";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc";
import { checkRoles } from "@/utils/authorization";
import { firstName, formatName } from "@/utils/personName";

const resend = new Resend(env.RESEND_API_KEY);

const REMINDER_SNOOZE_MS = 14 * 24 * 60 * 60 * 1000;

async function requireAdmin(session: Parameters<typeof checkRoles>[0]) {
  const authorized = await checkRoles(session, [
    "administrator",
    "lunch-system",
  ]);
  if (!authorized) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Access denied to the requested resource",
    });
  }
}

async function getCurrentUser(email: string | null | undefined) {
  const user = await User.findOne({ email }).lean();
  if (!user) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Felhasználó nem található",
    });
  }
  return user;
}

type CurrentUser = Awaited<ReturnType<typeof getCurrentUser>>;

// Creates a pending request and emails the user.
// Does nothing if the user already has a pending request.
async function createTokenRequest(user: CurrentUser) {
  const alreadyPending = await TokenRequest.exists({
    user: user._id,
    status: "PENDING",
  });
  if (alreadyPending) return;

  const price = env.TOKEN_REPLACEMENT_PRICE_HUF;
  await TokenRequest.create({ user: user._id, price });

  try {
    await resend.emails.send({
      from: "MyBPHS <my@bphs.hu>",
      to: user.email,
      cc: "jpp-tech@budapestschool.org",
      subject: "Megkaptuk az új token igénylésedet",
      react: TokenRequestEmail({ name: firstName(user) }),
    });
  } catch (error) {
    // The request is already saved; a failed email must not fail it.
    console.error("Failed to send token request email:", error);
  }
}

export const tokenRouter = createTRPCRouter({
  // Whether the "do you still have your token?" dialog should be shown
  // before the current user places an order.
  shouldShowReminder: protectedProcedure.query(async ({ ctx }) => {
    const user = await getCurrentUser(ctx.session.user?.email);
    const price = env.TOKEN_REPLACEMENT_PRICE_HUF;

    if (
      user.tokenReminderAnsweredAt &&
      Date.now() - user.tokenReminderAnsweredAt.getTime() < REMINDER_SNOOZE_MS
    ) {
      return { show: false, price };
    }

    const pending = await TokenRequest.exists({
      user: user._id,
      status: "PENDING",
    });
    if (pending) return { show: false, price };

    const menus = await Menu.find().select("_id year week options").lean();
    const orders = await Order.find({ user: user._id })
      .select("_id user menu order")
      .lean();
    const [stats] = calculateLunchTokenUsage([user], menus, orders);

    return { show: !!stats?.isNonCompliant, price };
  }),

  answerReminder: protectedProcedure
    .input(z.strictObject({ answer: z.enum(["HAS_TOKEN", "REQUEST_NEW"]) }))
    .mutation(async ({ ctx, input }) => {
      const user = await getCurrentUser(ctx.session.user?.email);

      await User.updateOne(
        { _id: user._id },
        { tokenReminderAnsweredAt: new Date() },
      );

      if (input.answer === "HAS_TOKEN") return { requested: false };

      await createTokenRequest(user);
      return { requested: true };
    }),

  // Manual request from the profile panel.
  requestNew: protectedProcedure.mutation(async ({ ctx }) => {
    const user = await getCurrentUser(ctx.session.user?.email);
    await createTokenRequest(user);
    return { requested: true };
  }),

  // Price and whether the current user already has an open request.
  myRequestStatus: protectedProcedure.query(async ({ ctx }) => {
    const user = await getCurrentUser(ctx.session.user?.email);
    const hasPending = !!(await TokenRequest.exists({
      user: user._id,
      status: "PENDING",
    }));
    return { price: env.TOKEN_REPLACEMENT_PRICE_HUF, hasPending };
  }),

  listRequests: protectedProcedure
    .input(z.strictObject({ includeCompleted: z.boolean() }))
    .query(async ({ ctx, input }) => {
      await requireAdmin(ctx.session);

      const requests = await TokenRequest.find(
        input.includeCompleted ? {} : { status: "PENDING" },
      )
        .sort({ createdAt: -1 })
        .populate<{
          user: {
            familyName?: string;
            givenName?: string;
            displayName?: string;
            email: string;
          } | null;
        }>("user", "familyName givenName displayName email")
        .lean();

      return requests.map((r) => ({
        id: String(r._id),
        userName: r.user ? formatName(r.user) : "Ismeretlen felhasználó",
        userEmail: r.user?.email ?? "",
        status: r.status,
        price: r.price,
        createdAt: r.createdAt,
        completedAt: r.completedAt ?? null,
      }));
    }),

  setRequestStatus: protectedProcedure
    .input(
      z.strictObject({
        id: z.string(),
        status: z.enum(["PENDING", "COMPLETED"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await requireAdmin(ctx.session);

      const result = await TokenRequest.updateOne(
        { _id: input.id },
        input.status === "COMPLETED"
          ? { status: "COMPLETED", completedAt: new Date() }
          : { status: "PENDING", $unset: { completedAt: "" } },
      );
      if (result.matchedCount === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "A kérés nem található",
        });
      }
    }),

  deleteRequest: protectedProcedure
    .input(z.strictObject({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await requireAdmin(ctx.session);
      await TokenRequest.deleteOne({ _id: input.id });
    }),
});
