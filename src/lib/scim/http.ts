import type { NextRequest } from "next/server";
import { verifyApiKeyRequest } from "@/lib/apiKeys";
import { SCIM_CONTENT_TYPE } from "./constants";
import { ScimError, scimErrorBody } from "./errors";

export function scimResponse(
  body: unknown,
  status = 200,
  headers: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": SCIM_CONTENT_TYPE, ...headers },
  });
}

export function scimEmpty(status = 204): Response {
  return new Response(null, { status });
}

/** Public base URL (scheme + host) used for `meta.location`. */
export function getBaseUrl(request: Request): string {
  const url = new URL(request.url);
  const proto =
    request.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "");
  const host =
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    url.host;
  return `${proto}://${host}`;
}

export async function readJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new ScimError(400, "Request body is not valid JSON", "invalidSyntax");
  }
}

type Handler<C> = (request: NextRequest, context: C) => Promise<Response>;

/** Wraps a handler with bearer auth and SCIM error mapping. */
export function withScim<C>(handler: Handler<C>): Handler<C> {
  return async (request, context) => {
    if (!(await verifyApiKeyRequest(request, "scim"))) {
      return scimResponse(
        scimErrorBody(401, "Invalid or missing bearer token"),
        401,
        { "WWW-Authenticate": 'Bearer realm="scim"' },
      );
    }

    try {
      return await handler(request, context);
    } catch (error) {
      if (error instanceof ScimError) {
        return scimResponse(
          scimErrorBody(error.status, error.message, error.scimType),
          error.status,
        );
      }
      console.error("[scim] Unhandled error", error);
      return scimResponse(scimErrorBody(500, "Internal server error"), 500);
    }
  };
}
