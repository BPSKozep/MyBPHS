import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { env } from "@/env/server";
import { User } from "@/models";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc";

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
      return;
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
        const createUserResponse = await fetch(
          `${env.PU_URL}/ad/create-user/${user.email}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${puToken}`,
            },
            body: JSON.stringify({
              password: "xr6CjrFz@mMD",
              name: user.name,
            }),
          },
        );

        if (!createUserResponse.ok) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create AD user",
          });
        }
      }

      await fetch(`${env.PU_URL}/ad/password-reset/${user.email}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${puToken}`,
        },
        body: JSON.stringify({ password: input }),
      });

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
      }),
    )
    .mutation(async ({ input }) => {
      const response = await fetch(
        `${env.PU_URL}/ad/create-user/${input.email}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${puToken}`,
          },
          body: JSON.stringify({
            password: "xr6CjrFz@mMD",
            name: input.name,
          }),
        },
      );

      if (!response.ok) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create AD user",
        });
      }
    }),

  deleteUsers: protectedProcedure
    .input(z.array(z.string().email()))
    .mutation(async ({ input }) => {
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
