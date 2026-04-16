import mongooseConnect from "@/clients/mongoose";
import { env } from "@/env/server";
import { GoogleGroup } from "@/models";
import { reconcileGoogleGroupSnapshot } from "@/server/services/googleSync";

type UserMember = {
  name: string;
  email: string;
  joinDate?: string;
};

type UsersPayload = {
  group: string;
  members: UserMember[];
};

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

function isUsersPayload(value: unknown): value is UsersPayload {
  if (!value || typeof value !== "object") {
    return false;
  }

  const payload = value as Partial<UsersPayload>;
  if (typeof payload.group !== "string") {
    return false;
  }

  if (!Array.isArray(payload.members)) {
    return false;
  }

  return payload.members.every((member) => {
    if (!member || typeof member !== "object") {
      return false;
    }

    const typedMember = member as Partial<UserMember>;
    return (
      typeof typedMember.name === "string" &&
      typeof typedMember.email === "string" &&
      (typedMember.joinDate === undefined ||
        typeof typedMember.joinDate === "string")
    );
  });
}

async function parseBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    const text = await request.text();
    if (!text) return null;
    return JSON.parse(text);
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export async function POST(request: Request) {
  if (!env.GOOGLE_APPSCRIPT_SECRET) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: "Webhook secret is not configured",
      }),
      {
        status: 500,
        headers: CORS_HEADERS,
      },
    );
  }

  const authHeader = request.headers.get("authorization") ?? "";
  const providedSecret = authHeader.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length).trim()
    : "";

  if (!providedSecret || providedSecret !== env.GOOGLE_APPSCRIPT_SECRET) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: "Unauthorized",
      }),
      {
        status: 401,
        headers: CORS_HEADERS,
      },
    );
  }

  try {
    const body = await parseBody(request);

    if (!isUsersPayload(body)) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: "Invalid payload shape",
        }),
        {
          status: 400,
          headers: CORS_HEADERS,
        },
      );
    }

    await mongooseConnect();
    const snapshot = await GoogleGroup.create({
      group: body.group,
      receivedAt: new Date(),
      memberCount: body.members.length,
      members: body.members,
    });

    // Reconcile the snapshot against the User collection (remote wins)
    try {
      await reconcileGoogleGroupSnapshot(snapshot._id.toString());
    } catch (reconcileError) {
      console.error(
        "[api/users] Reconciliation failed (snapshot stored successfully):",
        reconcileError,
      );
    }

    return new Response(
      JSON.stringify({
        ok: true,
        message: "Payload received and reconciled",
        received: {
          group: body.group,
          membersCount: body.members.length,
        },
      }),
      {
        status: 200,
        headers: CORS_HEADERS,
      },
    );
  } catch (error) {
    console.error("[api/users] Failed to process payload", error);

    return new Response(
      JSON.stringify({
        ok: false,
        error: "Invalid JSON body",
      }),
      {
        status: 400,
        headers: CORS_HEADERS,
      },
    );
  }
}
