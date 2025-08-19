import { createTRPCRouter, protectedProcedure } from "@/server/trpc";
import { TRPCError } from "@trpc/server";
import { env } from "@/env/server";
import { z } from "zod";
import { checkRoles } from "@/utils/authorization";

const deploymentDataSchema = z.object({
    Name: z.string(),
    PercentComplete: z.number().nullable(),
    Settings: z.unknown(),
    Warnings: z.number(),
    Errors: z.number(),
    DeploymentStatus: z.number(),
    StartTime: z.string(),
    EndTime: z.string().nullable(),
    ID: z.number(),
    UniqueID: z.string(),
    CurrentStep: z.number().nullable(),
    TotalSteps: z.number().nullable(),
    StepName: z.string(),
    LastTime: z.string(),
    DartIP: z.string().nullable(),
    DartPort: z.number().nullable(),
    DartTicket: z.string().nullable(),
    VMHost: z.string().nullable(),
    VMName: z.string().nullable(),
    ComputerIdentities: z.array(z.unknown()),
});

export type DeploymentData = z.infer<typeof deploymentDataSchema>;

export const laptopRouter = createTRPCRouter({
    getDeployments: protectedProcedure
        .output(z.array(deploymentDataSchema))
        .query(async ({ ctx }) => {
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

            const response = await fetch(`${env.PU_URL}/mdt-deployments`, {
                headers: {
                    Authorization: `Bearer ${env.PU_TOKEN}`,
                },
            });

            if (!response.ok) {
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message:
                        "Failed to fetch deployments from the external service.",
                });
            }

            const data: unknown = await response.json();
            return z.array(deploymentDataSchema).parse(data);
        }),
    deleteDeployment: protectedProcedure
        .input(z.object({ id: z.string() }))
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

            const response = await fetch(
                `${env.PU_URL}/mdt-deployments/delete/${input.id}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${env.PU_TOKEN}`,
                    },
                },
            );

            if (!response.ok) {
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Failed to delete deployment",
                });
            }

            return {
                success: true,
                message: "Deployment deleted successfully",
            };
        }),
});
