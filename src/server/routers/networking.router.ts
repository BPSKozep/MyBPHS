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

    const host = env.FORTIAPI_HOST.startsWith("http")
      ? env.FORTIAPI_HOST
      : `https://${env.FORTIAPI_HOST}`;

    const fetchHeaders = { "X-Proxy-Secret": env.FORTIAPI_PROXY_SECRET };

    const [interfaceResponse, userFirewallResponse] = await Promise.all([
      fetch(`${host}/api/v2/cmdb/system/interface/Guest`, {
        method: "GET",
        headers: fetchHeaders,
      }),
      fetch(`${host}/api/v2/monitor/user/firewall`, {
        method: "GET",
        headers: fetchHeaders,
      }),
    ]);

    if (!interfaceResponse.ok) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `FortiGate API error: ${interfaceResponse.status} ${interfaceResponse.statusText}`,
      });
    }

    const interfaceData = (await interfaceResponse.json()) as {
      results: { "replacemsg-override-group": string }[];
    };

    let connectedUsers = 0;
    if (userFirewallResponse.ok) {
      const userFirewallData = (await userFirewallResponse.json()) as {
        results: unknown[];
      };
      connectedUsers = userFirewallData.results?.length ?? 0;
    }

    const replacemsgGroup =
      interfaceData.results?.[0]?.["replacemsg-override-group"];
    return {
      enabled: replacemsgGroup === GUEST_INTERFACE_ENABLED,
      connectedUsers,
    };
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

      const host = env.FORTIAPI_HOST.startsWith("http")
        ? env.FORTIAPI_HOST
        : `https://${env.FORTIAPI_HOST}`;

      const headers = {
        "Content-Type": "application/json",
        "X-Proxy-Secret": env.FORTIAPI_PROXY_SECRET,
      };

      const [captivePortalResponse, firewallPolicyResponse] = await Promise.all(
        [
          fetch(`${host}/api/v2/cmdb/system/interface/Guest`, {
            method: "PUT",
            headers,
            body: JSON.stringify({
              "replacemsg-override-group": enabled
                ? GUEST_INTERFACE_ENABLED
                : GUEST_INTERFACE_DISABLED,
            }),
          }),
          fetch(`${host}/api/v2/cmdb/firewall/policy/15`, {
            method: "PUT",
            headers,
            body: JSON.stringify({ status: enabled ? "enable" : "disable" }),
          }),
        ],
      );

      if (!captivePortalResponse.ok) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `FortiGate API error (captive portal): ${captivePortalResponse.status} ${captivePortalResponse.statusText}`,
        });
      }

      if (!firewallPolicyResponse.ok) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `FortiGate API error (firewall policy): ${firewallPolicyResponse.status} ${firewallPolicyResponse.statusText}`,
        });
      }

      return { success: true };
    }),
});
