import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { env } from "@/env/server";
import { User } from "@/models";
import { createAdUser, updateAdUser } from "@/server/services/adUsers";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc";
import { formatName } from "@/utils/personName";

const puToken = env.PU_TOKEN;
export const adRouter = createTRPCRouter({
  getPasswordLastChanged: protectedProcedure.query(async ({ ctx }) => {
    const user = await User.findOne({
      email: ctx.session?.user?.email,
    });

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    if (!user.laptopPasswordChanged) {
      return null;
    } else {
      const dateTime = new Intl.DateTimeFormat("hu-HU", {
        dateStyle: "medium",
        timeStyle: "medium",
        timeZone: "Europe/Budapest",
      });
      return dateTime.format(user.laptopPasswordChanged);
    }
  }),
  setNewPassword: protectedProcedure
    .input(z.string().min(6))
    .mutation(async ({ ctx, input }) => {
      const user = await User.findOne({
        email: ctx.session?.user?.email,
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      const users = await fetch(`${env.PU_URL}/ad/list-users`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${puToken}`,
        },
      });

      if (!users.ok) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch AD users list",
        });
      }

      // Check if user exists in AD
      const adUsers = (await users.json()) as {
        UserPrincipalName: string;
        Name: string;
        SamAccountName: string;
        Enabled: boolean;
      }[];

      const userExistsInAD = adUsers.some(
        (adUser) => adUser.UserPrincipalName === user.email,
      );

      // If user doesn't exist in AD, create them first
      if (!userExistsInAD) {
        const createResult = await createAdUser(
          user.email ?? "",
          formatName(user),
        );
        if (!createResult.success) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: createResult.error ?? "Failed to create AD user",
          });
        }
      }

      const response = await fetch(
        `${env.PU_URL}/ad/password-reset/${encodeURIComponent(user.email ?? "")}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${puToken}`,
          },
          body: JSON.stringify({ password: input }),
        },
      );

      if (!response.ok) {
        // Read error details only when failing; avoids unnecessary body consumption.
        const errorText = await response.text().catch(() => "");
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to reset AD user password: ${response.status} ${response.statusText}${
            errorText ? ` - ${errorText}` : ""
          }`,
        });
      }

      user.laptopPasswordChanged = new Date();
      await user.save();
      return;
    }),

  listUsers: protectedProcedure.query(async () => {
    try {
      const response = await fetch(`${env.PU_URL}/ad/list-users`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${puToken}`,
        },
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch AD users list",
        });
      }

      const adUsers: unknown = await response.json();
      return adUsers as {
        UserPrincipalName: string;
        Name: string;
        SamAccountName: string;
        Enabled: boolean;
      }[];
    } catch (error) {
      console.error("Error fetching AD users:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch AD users list",
      });
    }
  }),

  createUser: protectedProcedure
    .input(
      z.object({
        email: z.string(),
        name: z.string(),
        password: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const result = await createAdUser(
        input.email,
        input.name,
        input.password,
      );
      if (!result.success) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: result.error ?? "Failed to create AD user",
        });
      }
    }),

  updateUser: protectedProcedure
    .input(
      z.object({
        email: z.string().optional(),
        name: z.string().optional(),
        enabled: z.boolean().optional(),
        newEmail: z.string().optional(),
        password: z.string().optional(),
        Name: z.string().optional(),
        DisplayName: z.string().optional(),
        UserPrincipalName: z.string().optional(),
        SamAccountName: z.string().optional(),
        Enabled: z.boolean().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const targetEmail =
        input.email ?? input.UserPrincipalName ?? input.newEmail;

      if (!targetEmail) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Missing required identifier: provide email or UserPrincipalName",
        });
      }

      const result = await updateAdUser(targetEmail, {
        name: input.name ?? input.DisplayName ?? input.Name,
        enabled: input.enabled ?? input.Enabled,
        newEmail: input.newEmail ?? input.UserPrincipalName,
        password: input.password,
        Name: input.Name,
        DisplayName: input.DisplayName,
        UserPrincipalName: input.UserPrincipalName,
        SamAccountName: input.SamAccountName,
        Enabled: input.Enabled,
      });

      if (!result.success) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: result.error ?? "Failed to update AD user",
        });
      }

      return result.data ?? { success: true };
    }),

  deleteUsers: protectedProcedure
    .input(z.array(z.email()))
    .mutation(async ({ input }) => {
      if (env.NODE_ENV === "development") {
        return { skipped: true };
      }

      const response = await fetch(`${env.PU_URL}/ad/delete-users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${puToken}`,
        },
        body: JSON.stringify({
          emails: input,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to delete AD users: ${response.status} ${response.statusText} - ${errorText}`,
        });
      }

      await response.json();
    }),
});
