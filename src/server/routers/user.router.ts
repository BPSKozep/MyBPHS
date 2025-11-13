import { TRPCError } from "@trpc/server";
import type { Document } from "mongoose";
import { Resend } from "resend";
import { z } from "zod";
import mongooseConnect from "@/clients/mongoose";
import { getVerificationService } from "@/clients/redis";
import Welcome from "@/emails/welcome";
import { env } from "@/env/server";
import { User } from "@/models";
import type { IGroup } from "@/models/Group.model";
import Group from "@/models/Group.model";
import type { IGroupOverride } from "@/models/GroupOverride.model";
import type { IUser } from "@/models/User.model";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/trpc";
import { checkRoles } from "@/utils/authorization";
import { sortByPropertyHungarian } from "@/utils/hungarianCollator";

const resend = new Resend(env.RESEND_API_KEY);

export const userRouter = createTRPCRouter({
  get: protectedProcedure
    .input(z.string().email())
    .output(
      z
        .object({
          name: z.string(),
          email: z.string(),
          roles: z.string().array(),
          blocked: z.boolean().optional(),
        })
        .nullable(),
    )
    .query(async ({ ctx, input }) => {
      const authorized = await checkRoles(ctx.session, ["administrator"]);

      const requester = await User.findOne({
        email: ctx.session.user?.email,
      });

      if (!authorized && requester?.email !== input) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Access denied to the requested resource",
        });
      }

      return await User.findOne({ email: input }).select<IUser>("-_id -__v");
    }),
  getUserByNfcId: protectedProcedure
    .input(z.string())
    .output(
      z
        .object({
          name: z.string(),
          email: z.string(),
          roles: z.string().array(),
          blocked: z.boolean().optional(),
        })
        .nullable(),
    )
    .query(async ({ ctx, input }) => {
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

      return await User.findOne({ nfcId: input }).select<IUser>("-_id -__v");
    }),
  getTimetable: protectedProcedure
    .input(z.string().email())
    .output(z.string().nullable().array().array())
    .query(async ({ ctx, input }) => {
      const authorized = await checkRoles(ctx.session, ["administrator"]);

      const requester = await User.findOne({
        email: ctx.session.user?.email,
      });

      if (!authorized && requester?.email !== input) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Access denied to the requested resource",
        });
      }

      const user = await User.findOne({ email: input }).populate<{
        groups: (Document &
          IGroup & { overrides: (Document & IGroupOverride)[] })[];
      }>({ path: "groups", populate: { path: "overrides" } });

      const timetables: {
        timetable: (string | null)[][];
        priority: number;
        override: boolean;
        isOverride: boolean;
      }[] = [];

      for (const group of user?.groups ?? []) {
        const groupObj = group.toObject() as IGroupOverride;

        timetables.push({
          timetable: groupObj.timetable,
          priority: groupObj.priority,
          override: groupObj.override,
          isOverride: false,
        });

        for (const override of group.overrides) {
          const overrideObj = override.toObject() as IGroupOverride;

          timetables.push({
            timetable: overrideObj.timetable,
            priority: overrideObj.priority,
            override: overrideObj.override,
            isOverride: true,
          });
        }
      }

      timetables.sort((a, b) => {
        if (a.priority > b.priority) {
          return 1;
        }

        if (a.priority < b.priority) {
          return -1;
        }

        if (a.override && !b.override) {
          return 1;
        }

        if (!a.override && b.override) {
          return -1;
        }

        return 0;
      });

      let compiled_timetable: (string | null)[][] = [];

      for (const timetable of timetables) {
        if (timetable.override) {
          compiled_timetable = timetable.timetable;
          continue;
        }

        for (const [i, day] of timetable.timetable.entries()) {
          if (compiled_timetable[i] === undefined) {
            compiled_timetable.push([]);
          }

          for (const [j, lesson] of day.entries()) {
            // Ensure the day array exists and has the required index
            compiled_timetable[i] ??= [];

            if (
              lesson ||
              !compiled_timetable[i][j] ||
              compiled_timetable[i][j] === undefined
            )
              compiled_timetable[i][j] = lesson;
          }
        }
      }

      return compiled_timetable;
    }),
  batchUpdateGroups: protectedProcedure
    .input(
      z.strictObject({
        mode: z.enum(["add", "remove", "replace"]),
        update: z
          .object({
            email: z.string().email(),
            newGroups: z.string().array(),
          })
          .array(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const authorized = await checkRoles(ctx.session, [
        "administrator",
        "staff",
      ]);

      if (!authorized) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Access denied to the requested resource",
        });
      }

      if (input.mode === "replace") {
        for (const request of input.update) {
          await User.findOneAndUpdate(
            { email: request.email },
            {
              $set: {
                groups: await Group.find({
                  name: { $in: request.newGroups },
                }),
              },
            },
          );
        }
      } else if (input.mode === "add") {
        for (const request of input.update) {
          await User.findOneAndUpdate(
            { email: request.email },
            {
              $push: {
                groups: {
                  $each: await Group.find({
                    name: { $in: request.newGroups },
                  }),
                },
              },
            },
          );
        }
      } else if (input.mode === "remove") {
        for (const request of input.update) {
          await User.findOneAndUpdate(
            { email: request.email },
            {
              $pullAll: {
                groups: await Group.find({
                  name: { $in: request.newGroups },
                }),
              },
            },
          );
        }
      }
    }),
  list: protectedProcedure
    .input(z.enum(["all", "student", "staff", "administrator"]))
    .output(
      z.array(
        z.object({
          _id: z.string(),
          email: z.string(),
          name: z.string(),
          blocked: z.boolean(),
        }),
      ),
    )
    .query(async ({ ctx, input }) => {
      const authorized = await checkRoles(ctx.session, ["administrator"]);

      if (!authorized) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Access denied to the requested resource",
        });
      }

      let roleFilter = {};
      if (input === "student") {
        roleFilter = { roles: "student" };
      } else if (input === "staff") {
        roleFilter = { roles: "staff" };
      } else if (input === "administrator") {
        roleFilter = { roles: "administrator" };
      }

      const users = await User.find(roleFilter).select(
        "_id email name blocked",
      );

      return users.map((user) => ({
        _id: user._id?.toString(),
        email: user.email,
        name: user.name,
        blocked: user.blocked ?? false,
      }));
    }),
  getNfcId: protectedProcedure
    .input(z.string().email())
    .output(z.string())
    .query(async ({ input }) => {
      const user = await User.findOne({ email: input });

      return user?.nfcId ?? "";
    }),

  toggleBlocked: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      const authorized = await checkRoles(ctx.session, ["administrator"]);

      if (!authorized) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Access denied to the requested resource",
        });
      }

      const user = await User.findOne({
        email: input,
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      user.blocked = !user.blocked;

      await user.save();

      return "OK";
    }),

  update: protectedProcedure
    .input(
      z.object({
        _id: z.string(),
        name: z.string(),
        email: z.string().email(),
        nfcId: z.string(),
        roles: z.array(z.string()),
        blocked: z.boolean(),
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

      const { _id, ...updateData } = input;

      const updatedUser = await User.findByIdAndUpdate(_id, updateData, {
        new: true,
      }).exec();

      if (!updatedUser) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      return {
        _id: updatedUser._id?.toString() ?? "",
        name: updatedUser.name,
        email: updatedUser.email,
        nfcId: updatedUser.nfcId,
        roles: updatedUser.roles,
        blocked: updatedUser.blocked ?? false,
      };
    }),

  // Get all users
  getAll: protectedProcedure
    .output(
      z.array(
        z.object({
          _id: z.string(),
          name: z.string(),
          email: z.string(),
          nfcId: z.string(),
          laptopPasswordChanged: z.date().nullable(),
          roles: z.array(z.string()),
          blocked: z.boolean(),
          hasADAccount: z.boolean(),
        }),
      ),
    )
    .query(async ({ ctx }) => {
      const authorized = await checkRoles(ctx.session, ["administrator"]);

      if (!authorized) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Access denied to the requested resource",
        });
      }

      // Get all users, without server-side sorting (will be sorted client-side with Hungarian collation)
      const users = await User.find().exec();

      // Fetch AD users list with graceful error handling
      let adUserEmails = new Set<string>();
      try {
        const puToken = env.PU_TOKEN;
        if (puToken && env.PU_URL) {
          const response = await fetch(`${env.PU_URL}/ad/list-users`, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${puToken}`,
            },
          });

          if (response.ok) {
            const adUsers: unknown = await response.json();
            const typedAdUsers = adUsers as {
              UserPrincipalName: string;
              Name: string;
              SamAccountName: string;
              Enabled: boolean;
            }[];
            adUserEmails = new Set(
              typedAdUsers.map((adUser) => adUser.UserPrincipalName),
            );
          }
        }
      } catch (error) {
        // Silently continue without AD data if service is unavailable
        console.warn(
          "AD service unavailable, continuing without AD status:",
          error,
        );
      }

      // Map users to the response format
      const mappedUsers = users.map((user) => {
        return {
          _id: user._id?.toString() ?? "",
          name: user.name,
          email: user.email,
          nfcId: user.nfcId,
          laptopPasswordChanged: user.laptopPasswordChanged ?? null,
          roles: user.roles,
          blocked: user.blocked ?? false,
          hasADAccount: adUserEmails.has(user.email),
        };
      });

      // Sort by name using Hungarian collation
      return sortByPropertyHungarian(mappedUsers, (user) => user.name);
    }),

  // Create a single user
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        email: z.string().email(),
        nfcId: z.string().min(1),
        roles: z.array(z.string()).min(1),
        blocked: z.boolean().default(false),
        sendWelcomeEmail: z.boolean().default(true),
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
      await mongooseConnect();

      // Check if user with this email or nfcId already exists
      const existingUser = await User.findOne({
        $or: [{ email: input.email }, { nfcId: input.nfcId }],
      });

      if (existingUser) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "User with this email or NFC ID already exists",
        });
      }

      const newUser = await User.create({
        name: input.name,
        email: input.email,
        nfcId: input.nfcId.toLowerCase().trim(),
        roles: input.roles,
        blocked: input.blocked,
        groups: [],
      });

      // Send welcome email for manually created users
      if (input.sendWelcomeEmail) {
        try {
          await resend.emails.send({
            from: "MyBPHS <my@bphs.hu>",
            to: newUser.email,
            subject: "Üdvözlünk a MyBPHS rendszerben!",
            react: Welcome({
              name: newUser.name,
              isOnboarding: false,
            }),
          });
        } catch (error) {
          // Log email error but don't fail the user creation process
          console.error(
            "Failed to send welcome email during manual user creation:",
            error,
          );
        }
      }

      return {
        _id: newUser._id?.toString() ?? "",
        name: newUser.name,
        email: newUser.email,
        nfcId: newUser.nfcId,
        roles: newUser.roles,
        blocked: newUser.blocked ?? false,
        laptopPasswordChanged: newUser.laptopPasswordChanged ?? null,
      };
    }),

  // Delete multiple users
  delete: protectedProcedure
    .input(z.array(z.string()))
    .mutation(async ({ ctx, input }) => {
      const authorized = await checkRoles(ctx.session, ["administrator"]);

      if (!authorized) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Access denied to the requested resource",
        });
      }

      if (input.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No users selected for deletion",
        });
      }

      // Delete users by their IDs
      const result = await User.deleteMany({
        _id: { $in: input },
      });

      return {
        deletedCount: result.deletedCount,
        message: `${result.deletedCount} felhasználó törölve`,
      };
    }),

  // Check if a user exists by email
  checkExists: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .output(z.boolean())
    .query(async ({ input }) => {
      await mongooseConnect();
      const user = await User.findOne({ email: input.email });
      return !!user;
    }),

  onboard: publicProcedure
    .input(
      z.object({
        name: z.string(),
        email: z.string().email(),
        password: z.string(),
        nfcId: z.string(),
        verificationCode: z.string().length(6),
      }),
    )
    .mutation(async ({ input }) => {
      await mongooseConnect();

      // Verify the email verification code first
      const verificationService = await getVerificationService();

      // Verify and delete the code in one operation (final verification)
      const isValid = await verificationService.verifyAndDeleteCode(
        input.email,
        input.verificationCode,
      );

      if (!isValid) {
        // Check if there was a code at all to provide better error message
        const storedData = await verificationService.getCode(input.email);

        if (!storedData) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message:
              "Verification code expired or not found. Please go back and request a new code.",
          });
        } else {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "Invalid verification code. Please check your code and try again.",
          });
        }
      }

      // Check if email is allowed for onboarding
      if (
        !input.email.endsWith("@budapestschool.org") &&
        !input.email.endsWith("@budapest.school")
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Email is not allowed for onboarding",
        });
      }

      // Check if user with this email or nfcId already exists
      const existingUser = await User.findOne({
        $or: [{ email: input.email }, { nfcId: input.nfcId }],
      });

      if (existingUser) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "User with this email or NFC ID already exists",
        });
      }

      const role = input.email.endsWith("@budapestschool.org")
        ? "staff"
        : "student";

      const newUser = await User.create({
        name: input.name,
        email: input.email,
        nfcId: input.nfcId.toLowerCase().trim(),
        roles: [role],
        blocked: false,
        groups: [],
      });

      try {
        const puToken = env.PU_TOKEN;
        const request = await fetch(
          `${env.PU_URL}/ad/create-user/${input.email}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${puToken}`,
            },
            body: JSON.stringify({
              password: input.password,
              name: input.name,
            }),
          },
        );

        if (request.status !== 200) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Failed to create AD user: ${request.statusText}`,
          });
        }

        newUser.laptopPasswordChanged = new Date();
        await newUser.save();
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to create AD user: ${(error as Error).message}`,
        });
      }

      // Send welcome email for onboarding
      try {
        await resend.emails.send({
          from: "MyBPHS <my@bphs.hu>",
          to: newUser.email,
          subject: "Üdvözlünk a MyBPHS rendszerben!",
          react: Welcome({
            name: newUser.name,
            isOnboarding: true,
          }),
        });
      } catch (error) {
        // Log email error but don't fail the onboarding process
        console.error("Failed to send welcome email during onboarding:", error);
      }

      return {
        _id: newUser._id?.toString() ?? "",
        name: newUser.name,
        email: newUser.email,
        nfcId: newUser.nfcId,
      };
    }),
});
