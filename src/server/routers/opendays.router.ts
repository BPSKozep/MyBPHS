import { TRPCError } from "@trpc/server";
import mongoose from "mongoose";
import { Resend } from "resend";
import { z } from "zod";
import { formatOpenDayDate } from "@/components/opendays/formatters";
import OpenDayRegistrationEmail from "@/emails/openDayRegistration";
import { env as serverEnv } from "@/env/server";
import { OpenDay, OpenDayRegistration } from "@/models";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/trpc";
import { checkRoles } from "@/utils/authorization";

const resend = new Resend(serverEnv.RESEND_API_KEY);
const ALLOWED_ADMIN_ROLES = ["administrator", "openday-admin"];

export const opendaysRouter = createTRPCRouter({
  // Public query for the registration flow
  getOpenDays: publicProcedure.query(async () => {
    const openDays = await OpenDay.find({
      $or: [{ isPublished: true }, { isPublished: { $exists: false } }],
    })
      .sort({ date: 1, createdAt: 1 })
      .lean();

    if (openDays.length === 0) return [];

    const openDayIds = openDays.map((d) => d._id);

    // Fetch all registrations for these active open days
    const registrations = await OpenDayRegistration.find({
      openDayId: { $in: openDayIds },
    })
      .select("openDayId selectedClassIds")
      .lean();

    // Map classId -> count of registrations
    const classRegistrationCounts = new Map<string, number>();
    for (const reg of registrations) {
      for (const classId of reg.selectedClassIds || []) {
        classRegistrationCounts.set(
          classId,
          (classRegistrationCounts.get(classId) || 0) + 1,
        );
      }
    }

    return openDays.map((day) => ({
      id: day._id.toString(),
      date: day.date,
      classes: (day.classes || []).map((cls) => {
        const registeredCount = classRegistrationCounts.get(cls.id) || 0;
        return {
          id: cls.id,
          startTime: cls.startTime,
          endTime: cls.endTime,
          title: cls.title,
          capacity: Math.max(0, cls.capacity - registeredCount),
          totalCapacity: cls.capacity,
          registeredCount,
          description: cls.description || "",
        };
      }),
    }));
  }),

  // Admin query to get all open days including drafts
  getAdminOpenDays: protectedProcedure.query(async ({ ctx }) => {
    const authorized = await checkRoles(ctx.session, ALLOWED_ADMIN_ROLES);
    if (!authorized) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Nincs jogosultságod a művelethez.",
      });
    }

    const openDays = await OpenDay.find()
      .sort({ date: 1, createdAt: 1 })
      .lean();

    if (openDays.length === 0) return [];

    const openDayIds = openDays.map((d) => d._id);
    const registrations = await OpenDayRegistration.find({
      openDayId: { $in: openDayIds },
    })
      .select("openDayId selectedClassIds")
      .lean();

    const classRegistrationCounts = new Map<string, number>();
    const dayRegistrationCounts = new Map<string, number>();
    for (const reg of registrations) {
      const dayIdStr = reg.openDayId.toString();
      dayRegistrationCounts.set(
        dayIdStr,
        (dayRegistrationCounts.get(dayIdStr) || 0) + 1,
      );
      for (const classId of reg.selectedClassIds || []) {
        classRegistrationCounts.set(
          classId,
          (classRegistrationCounts.get(classId) || 0) + 1,
        );
      }
    }

    return openDays.map((day) => ({
      id: day._id.toString(),
      date: day.date,
      isPublished: day.isPublished ?? true,
      registrationCount: dayRegistrationCounts.get(day._id.toString()) || 0,
      classes: (day.classes || []).map((cls) => {
        const registeredCount = classRegistrationCounts.get(cls.id) || 0;
        return {
          id: cls.id,
          startTime: cls.startTime,
          endTime: cls.endTime,
          title: cls.title,
          capacity: cls.capacity,
          registeredCount,
          availableCapacity: Math.max(0, cls.capacity - registeredCount),
          description: cls.description || "",
        };
      }),
    }));
  }),

  // Admin query to get all registrations for a specific open day
  getAdminRegistrations: protectedProcedure
    .input(z.object({ openDayId: z.string() }))
    .query(async ({ ctx, input }) => {
      const authorized = await checkRoles(ctx.session, ALLOWED_ADMIN_ROLES);
      if (!authorized) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Nincs jogosultságod a művelethez.",
        });
      }

      const registrations = await OpenDayRegistration.find({
        openDayId: input.openDayId,
      })
        .sort({ createdAt: -1 })
        .lean();

      return registrations.map((r) => ({
        id: r._id.toString(),
        openDayId: r.openDayId.toString(),
        contactName: r.contactName,
        contactEmail: r.contactEmail,
        attendeeName: r.attendeeName,
        attendeeEmail: r.attendeeEmail,
        selectedClassIds: r.selectedClassIds || [],
        createdAt: r.createdAt,
      }));
    }),

  // Admin mutation to delete a registration
  deleteRegistration: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const authorized = await checkRoles(ctx.session, ALLOWED_ADMIN_ROLES);
      if (!authorized) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Nincs jogosultságod a művelethez.",
        });
      }

      await OpenDayRegistration.findByIdAndDelete(input.id);
      return { success: true };
    }),

  // Create a new open day event
  createOpenDay: protectedProcedure
    .input(
      z.object({
        date: z.date(),
        isPublished: z.boolean().default(true),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const authorized = await checkRoles(ctx.session, ALLOWED_ADMIN_ROLES);
      if (!authorized) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Nincs jogosultságod a művelethez.",
        });
      }

      const created = await OpenDay.create({
        date: input.date,
        isPublished: input.isPublished,
        classes: [],
      });

      return { id: created._id.toString() };
    }),

  // Update open day event (date, publication status)
  updateOpenDay: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        date: z.date().optional(),
        isPublished: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const authorized = await checkRoles(ctx.session, ALLOWED_ADMIN_ROLES);
      if (!authorized) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Nincs jogosultságod a művelethez.",
        });
      }

      const updateData: { date?: Date; isPublished?: boolean } = {};
      if (input.date !== undefined) updateData.date = input.date;
      if (input.isPublished !== undefined)
        updateData.isPublished = input.isPublished;

      const updated = await OpenDay.findByIdAndUpdate(
        input.id,
        { $set: updateData },
        { new: true },
      );

      if (!updated) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "A keresett nyílt nap nem található.",
        });
      }

      return { success: true };
    }),

  // Delete an open day event
  deleteOpenDay: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const authorized = await checkRoles(ctx.session, ALLOWED_ADMIN_ROLES);
      if (!authorized) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Nincs jogosultságod a művelethez.",
        });
      }

      await OpenDay.findByIdAndDelete(input.id);
      return { success: true };
    }),

  // Add a class to an open day
  addClass: protectedProcedure
    .input(
      z.object({
        openDayId: z.string(),
        title: z.string().min(1, "A cím megadása kötelező"),
        startTime: z.date(),
        endTime: z.date(),
        capacity: z
          .number()
          .int()
          .positive("A férőhelynek legalább 1-nek kell lennie"),
        description: z.string().default(""),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const authorized = await checkRoles(ctx.session, ALLOWED_ADMIN_ROLES);
      if (!authorized) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Nincs jogosultságod a művelethez.",
        });
      }

      const newClassId = new mongoose.Types.ObjectId().toString();
      const newClass = {
        id: newClassId,
        title: input.title.trim(),
        startTime: input.startTime,
        endTime: input.endTime,
        capacity: input.capacity,
        description: input.description.trim(),
      };

      const result = await OpenDay.findByIdAndUpdate(
        input.openDayId,
        { $push: { classes: newClass } },
        { new: true },
      );

      if (!result) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "A keresett nyílt nap nem található.",
        });
      }

      return { id: newClassId };
    }),

  // Update an existing class in an open day
  updateClass: protectedProcedure
    .input(
      z.object({
        openDayId: z.string(),
        classId: z.string(),
        title: z.string().min(1, "A cím megadása kötelező"),
        startTime: z.date(),
        endTime: z.date(),
        capacity: z
          .number()
          .int()
          .positive("A férőhelynek legalább 1-nek kell lennie"),
        description: z.string().default(""),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const authorized = await checkRoles(ctx.session, ALLOWED_ADMIN_ROLES);
      if (!authorized) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Nincs jogosultságod a művelethez.",
        });
      }

      const result = await OpenDay.updateOne(
        { _id: input.openDayId, "classes.id": input.classId },
        {
          $set: {
            "classes.$.title": input.title.trim(),
            "classes.$.startTime": input.startTime,
            "classes.$.endTime": input.endTime,
            "classes.$.capacity": input.capacity,
            "classes.$.description": input.description.trim(),
          },
        },
      );

      if (result.matchedCount === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "A megadott óra vagy nyílt nap nem található.",
        });
      }

      return { success: true };
    }),

  // Delete a class from an open day
  deleteClass: protectedProcedure
    .input(
      z.object({
        openDayId: z.string(),
        classId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const authorized = await checkRoles(ctx.session, ALLOWED_ADMIN_ROLES);
      if (!authorized) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Nincs jogosultságod a művelethez.",
        });
      }

      const result = await OpenDay.findByIdAndUpdate(
        input.openDayId,
        { $pull: { classes: { id: input.classId } } },
        { new: true },
      );

      if (!result) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "A keresett nyílt nap nem található.",
        });
      }

      return { success: true };
    }),

  // Register for an open day and selected classes
  register: publicProcedure
    .input(
      z.object({
        openDayId: z.string().min(1, "A nyílt nap kiválasztása kötelező"),
        contactName: z
          .string()
          .trim()
          .min(1, "A kapcsolattartó nevének megadása kötelező"),
        contactEmail: z.email("Érvénytelen kapcsolattartó email cím"),
        attendeeName: z
          .string()
          .trim()
          .min(1, "A diák nevének megadása kötelező"),
        attendeeEmail: z.email("Érvénytelen diák email cím"),
        selectedClassIds: z
          .array(z.string())
          .min(1, "Legalább egy óra kiválasztása kötelező a jelentkezéshez"),
        turnstileToken: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      if (process.env.TURNSTILE_SECRET_KEY) {
        if (!input.turnstileToken) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "A biztonsági ellenőrzés (Turnstile) kötelező.",
          });
        }

        try {
          const params = new URLSearchParams();
          params.append("secret", process.env.TURNSTILE_SECRET_KEY);
          params.append("response", input.turnstileToken);

          const verifyRes = await fetch(
            "https://challenges.cloudflare.com/turnstile/v0/siteverify",
            {
              method: "POST",
              body: params,
            },
          );

          const verifyData = (await verifyRes.json()) as { success: boolean };
          if (!verifyData.success) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message:
                "A biztonsági ellenőrzés sikertelen volt. Kérjük, próbáld újra!",
            });
          }
        } catch (error) {
          if (error instanceof TRPCError) throw error;
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Hiba történt a biztonsági ellenőrzés során.",
          });
        }
      }

      const openDay = await OpenDay.findById(input.openDayId);
      if (!openDay || openDay.isPublished === false) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "A kiválasztott nyílt nap nem található vagy már nem aktív.",
        });
      }

      if (input.selectedClassIds.length > 0) {
        const classMap = new Map((openDay.classes || []).map((c) => [c.id, c]));

        // Check if all selected classes belong to this open day
        for (const clsId of input.selectedClassIds) {
          if (!classMap.has(clsId)) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `A megadott óra nem található a nyílt napon.`,
            });
          }
        }

        // Check capacity for each selected class
        const existingRegistrations = await OpenDayRegistration.find({
          openDayId: openDay._id,
          selectedClassIds: { $in: input.selectedClassIds },
        })
          .select("selectedClassIds")
          .lean();

        for (const clsId of input.selectedClassIds) {
          const cls = classMap.get(clsId);
          if (!cls) continue;

          const currentCount = existingRegistrations.filter((r) =>
            (r.selectedClassIds || []).includes(clsId),
          ).length;

          if (currentCount >= cls.capacity) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `A(z) "${cls.title}" órára már minden férőhely betelt.`,
            });
          }
        }
      }

      const created = await OpenDayRegistration.create({
        openDayId: openDay._id,
        contactName: input.contactName.trim(),
        contactEmail: input.contactEmail.trim().toLowerCase(),
        attendeeName: input.attendeeName.trim(),
        attendeeEmail: input.attendeeEmail.trim().toLowerCase(),
        selectedClassIds: input.selectedClassIds,
      });

      // Send confirmation email to both parent and student
      const selectedClasses = (openDay.classes || []).filter((c) =>
        input.selectedClassIds.includes(c.id),
      );

      const contactEmail = input.contactEmail.trim().toLowerCase();
      const attendeeEmail = input.attendeeEmail.trim().toLowerCase();
      const recipients = Array.from(new Set([contactEmail, attendeeEmail]));

      if (serverEnv.RESEND_API_KEY && recipients.length > 0) {
        try {
          await resend.emails.send({
            from: "BPS JPP Nyílt Nap <my@bphs.hu>",
            to: recipients,
            subject: `BPS JPP Nyílt Nap Regisztráció (${formatOpenDayDate(openDay.date)})`,
            react: OpenDayRegistrationEmail({
              contactName: input.contactName.trim(),
              contactEmail,
              attendeeName: input.attendeeName.trim(),
              attendeeEmail,
              openDayDate: openDay.date,
              classes: selectedClasses.map((cls) => ({
                id: cls.id,
                title: cls.title,
                startTime: cls.startTime,
                endTime: cls.endTime,
                description: cls.description || "",
              })),
            }),
          });
        } catch (emailError) {
          console.error(
            "Nem sikerült kiküldeni a megerősítő emailt a nyílt nap regisztrációról:",
            emailError,
          );
        }
      }

      return {
        success: true,
        id: created._id.toString(),
      };
    }),
});
