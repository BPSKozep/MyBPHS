import { TRPCError } from "@trpc/server";
import type { Session } from "next-auth";
import { z } from "zod";
import { generateApiKey, maskApiKey } from "@/lib/apiKeys";
import { API_SCOPE_IDS } from "@/lib/apiKeys/scopes";
import ApiKey from "@/models/ApiKey.model";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc";
import { checkRoles } from "@/utils/authorization";

async function requireAdministrator(session: Session) {
  const authorized = await checkRoles(session, ["administrator"]);

  if (!authorized) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Access denied to the requested resource",
    });
  }
}

const scopesSchema = z.array(z.enum(API_SCOPE_IDS)).min(1);

export const apiKeyRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    await requireAdministrator(ctx.session);

    const keys = await ApiKey.find()
      .select("-secretHash")
      .sort({ createdAt: -1 })
      .lean();

    return keys.map((key) => ({
      id: key._id.toString(),
      name: key.name,
      description: key.description,
      maskedKey: maskApiKey(key.keyId),
      scopes: key.scopes,
      createdBy: key.createdBy,
      createdAt: key.createdAt,
      expiresAt: key.expiresAt,
      revokedAt: key.revokedAt,
      revokedBy: key.revokedBy,
      lastUsedAt: key.lastUsedAt,
      lastUsedIp: key.lastUsedIp,
    }));
  }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().trim().min(1).max(100),
        description: z.string().trim().max(500).optional(),
        scopes: scopesSchema,
        expiresInDays: z.int().positive().max(3650).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await requireAdministrator(ctx.session);

      const { key, keyId, secretHash } = generateApiKey();
      const now = new Date();

      await ApiKey.create({
        name: input.name,
        description: input.description || undefined,
        keyId,
        secretHash,
        scopes: input.scopes,
        createdBy: ctx.session.user.email ?? "unknown",
        createdAt: now,
        expiresAt: input.expiresInDays
          ? new Date(now.getTime() + input.expiresInDays * 86_400_000)
          : undefined,
      });

      // The full key is only ever returned here
      return { key };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().trim().min(1).max(100),
        description: z.string().trim().max(500).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await requireAdministrator(ctx.session);

      const result = await ApiKey.updateOne(
        { _id: input.id },
        input.description
          ? { $set: { name: input.name, description: input.description } }
          : { $set: { name: input.name }, $unset: { description: 1 } },
      );

      if (result.matchedCount === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "API key not found",
        });
      }
    }),

  revoke: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await requireAdministrator(ctx.session);

      const result = await ApiKey.updateOne(
        { _id: input.id, revokedAt: { $exists: false } },
        { $set: { revokedAt: new Date(), revokedBy: ctx.session.user.email } },
      );

      if (result.matchedCount === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "API key not found or already revoked",
        });
      }
    }),
});
