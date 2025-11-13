import { useCallback } from "react";
import { api } from "@/trpc/react";

export interface KioskErrorContext {
  nfcId?: string;
  user?: {
    name?: string;
    email?: string;
    roles?: string[];
    blocked?: boolean;
  } | null;
  order?: {
    order?: string;
    orderError?: boolean;
  } | null;
  socketStatus?: {
    socketFailure?: boolean;
    socketConnected?: boolean;
  };
  componentState?: {
    isValidNfc?: boolean;
    loading?: boolean;
    profileImageURL?: string;
  };
  browserInfo?: {
    userAgent?: string;
    url?: string;
    timestamp?: string;
    isDevelopment?: boolean;
  };
}

export interface KioskErrorDetails {
  error: unknown;
  context?: KioskErrorContext;
  errorType:
    | "socket_connection"
    | "socket_disconnect"
    | "nfc_read_failure"
    | "trpc_query_error"
    | "trpc_mutation_error"
    | "user_lookup_error"
    | "order_lookup_error"
    | "order_completion_error"
    | "kiosk_save_error"
    | "unknown_error";
}

export function useKioskErrorLogger() {
  const sendDiscordWebhook = api.webhook.sendDiscordWebhook.useMutation();

  const logError = useCallback(
    async (errorDetails: KioskErrorDetails) => {
      const { error, context, errorType } = errorDetails;

      // Extract error information
      let errorMessage = "Unknown error occurred";
      let errorStack = "";

      if (error instanceof Error) {
        errorMessage = error.message;
        errorStack = error.stack ?? "";
      } else if (error && typeof error === "object" && "message" in error) {
        // Handle TRPC errors and other error objects
        errorMessage = String(error.message);
        if ("stack" in error) {
          errorStack = String(error.stack) ?? "";
        }
      } else if (typeof error === "string") {
        errorMessage = error;
      } else if (error && typeof error === "object") {
        errorMessage = JSON.stringify(error, null, 2);
      }

      // Get browser/environment information
      const browserInfo = {
        userAgent:
          typeof window !== "undefined"
            ? window.navigator.userAgent
            : "Server-side",
        url: typeof window !== "undefined" ? window.location.href : "N/A",
        timestamp: new Date().toISOString(),
        isDevelopment: process.env.NODE_ENV === "development",
        ...context?.browserInfo,
      };

      // Build comprehensive error details
      const errorTitle = `Kiosk Hiba - ${errorType.replace(/_/g, " ")}`;

      let errorBody = `**Hiba Részletei:**\n`;
      errorBody += `• **Típus:** ${errorType}\n`;
      errorBody += `• **Üzenet:** ${errorMessage}\n`;
      errorBody += `• **Környezet:** ${browserInfo.isDevelopment ? "Fejlesztői" : "Éles"}\n`;
      errorBody += `• **URL:** ${browserInfo.url}\n\n`;

      if (context?.nfcId) {
        errorBody += `**NFC Token:**\n`;
        errorBody += `• **ID:** ${context.nfcId}\n\n`;
      }

      if (context?.user) {
        errorBody += `**Felhasználó:**\n`;
        errorBody += `• **Név:** ${context.user.name ?? "N/A"}\n`;
        errorBody += `• **Email:** ${context.user.email ?? "N/A"}\n`;
        errorBody += `• **Szerepkörök:** ${context.user.roles?.join(", ") ?? "N/A"}\n`;
        errorBody += `• **Tiltva:** ${context.user.blocked ? "❌ Igen" : "✅ Nem"}\n\n`;
      }

      if (context?.order) {
        errorBody += `**Rendelés:**\n`;
        errorBody += `• **Rendelés:** ${context.order.order ?? "N/A"}\n`;
        errorBody += `• **Állapot:** ${context.order.orderError ? "❌" : "✅"}\n\n`;
      }

      if (context?.socketStatus) {
        errorBody += `**Socket Állapot:**\n`;
        errorBody += `• **Socket:** ${context.socketStatus.socketFailure ? "❌" : "✅"}\n`;
        errorBody += `• **Socket Csatlakoztatva:** ${context.socketStatus.socketConnected ? "✅" : "❌"}\n\n`;
      }

      if (context?.componentState) {
        errorBody += `**Oldal Állapot:**\n`;
        errorBody += `• **Valós NFC:** ${context.componentState.isValidNfc ? "✅" : "❌"}\n`;
        errorBody += `• **Betöltve:** ${context.componentState.loading ? "⏳" : "✅"}\n`;
        errorBody += `• **Profil Kép:** ${context.componentState.profileImageURL?.includes("no_picture") ? "Alapértelmezett" : "Egyedi"}\n\n`;
      }

      if (errorStack) {
        errorBody += `\n**Stack Trace:**\n\`\`\`\n${errorStack.substring(0, 1000)}${errorStack.length > 1000 ? "...(truncated)" : ""}\n\`\`\``;
      }

      try {
        await sendDiscordWebhook.mutateAsync({
          title: errorTitle,
          body: errorBody,
          error: true,
        });
      } catch (webhookError) {
        console.error("Failed to send error webhook:", webhookError);
        // Fallback to console logging if webhook fails
        console.error("Original Kiosk Error:", {
          errorType,
          message: errorMessage,
          context,
          stack: errorStack,
        });
      }
    },
    [sendDiscordWebhook],
  );

  return { logError };
}
