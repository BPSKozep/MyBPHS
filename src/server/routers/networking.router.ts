import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { env } from "@/env/server";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc";
import { checkRoles } from "@/utils/authorization";

const GUEST_INTERFACE_ENABLED = "auth-intf-Guest";
const GUEST_INTERFACE_DISABLED = "auth-intf-Guest-disabled";

export const networkingRouter = createTRPCRouter({
  getGuestWifiStatus: protectedProcedure.query(async ({ ctx }) => {
    const isAdmin = await checkRoles(ctx.session, ["administrator"]);
    if (!isAdmin) {
      throw new TRPCError({ code: "FORBIDDEN" });
    }

    if (!env.FORTIAPI_HOST || !env.FORTIAPI_PROXY_SECRET) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "FortiGate API is not configured",
      });
    }

    const host = env.FORTIAPI_HOST!.startsWith("http")
      ? env.FORTIAPI_HOST!
      : `https://${env.FORTIAPI_HOST}`;

    const response = await fetch(`${host}/api/v2/cmdb/system/interface/Guest`, {
      method: "GET",
      headers: {
        "X-Proxy-Secret": env.FORTIAPI_PROXY_SECRET!,
      },
    });

    if (!response.ok) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `FortiGate API error: ${response.status} ${response.statusText}`,
      });
    }

    const data = (await response.json()) as {
      results: { "replacemsg-override-group": string }[];
    };

    const replacemsgGroup = data.results?.[0]?.["replacemsg-override-group"];
    return { enabled: replacemsgGroup === GUEST_INTERFACE_ENABLED };
  }),

  setGuestWifiStatus: protectedProcedure
    .input(z.boolean())
    .mutation(async ({ ctx, input: enabled }) => {
      const isAdmin = await checkRoles(ctx.session, ["administrator"]);
      if (!isAdmin) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      if (!env.FORTIAPI_HOST || !env.FORTIAPI_PROXY_SECRET) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "FortiGate API is not configured",
        });
      }

      const host = env.FORTIAPI_HOST!.startsWith("http")
        ? env.FORTIAPI_HOST!
        : `https://${env.FORTIAPI_HOST}`;

      const response = await fetch(
        `${host}/api/v2/cmdb/system/interface/Guest`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "X-Proxy-Secret": env.FORTIAPI_PROXY_SECRET!,
          },
          body: JSON.stringify({
            "replacemsg-override-group": enabled
              ? GUEST_INTERFACE_ENABLED
              : GUEST_INTERFACE_DISABLED,
          }),
        },
      );

      if (!response.ok) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `FortiGate API error: ${response.status} ${response.statusText}`,
        });
      }

      return { success: true };
    }),
});
