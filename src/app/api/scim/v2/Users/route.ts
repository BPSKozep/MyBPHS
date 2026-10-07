import {
  DEFAULT_COUNT,
  MAX_COUNT,
  SCHEMA_LIST_RESPONSE,
} from "@/lib/scim/constants";
import { parseFilter } from "@/lib/scim/filter";
import {
  getBaseUrl,
  readJsonBody,
  scimResponse,
  withScim,
} from "@/lib/scim/http";
import { parseScimUser, toScimUser } from "@/lib/scim/user-mapper";
import { listUsers, provisionUser } from "@/server/services/scimUsers";

export const dynamic = "force-dynamic";

function intParam(value: string | null, fallback: number): number {
  if (value === null || value.trim() === "") return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

export const GET = withScim(async (request) => {
  const params = request.nextUrl.searchParams;
  const filter = parseFilter(params.get("filter"));
  const startIndex = Math.max(1, intParam(params.get("startIndex"), 1));
  const count = Math.min(
    MAX_COUNT,
    Math.max(0, intParam(params.get("count"), DEFAULT_COUNT)),
  );

  const { total, users } = await listUsers(filter, startIndex, count);
  const baseUrl = getBaseUrl(request);

  return scimResponse({
    schemas: [SCHEMA_LIST_RESPONSE],
    totalResults: total,
    startIndex,
    itemsPerPage: users.length,
    Resources: users.map((user) => toScimUser(user, baseUrl)),
  });
});

export const POST = withScim(async (request) => {
  const state = parseScimUser(await readJsonBody(request));
  const { user, created } = await provisionUser(state);

  const resource = toScimUser(user, getBaseUrl(request));
  return scimResponse(resource, created ? 201 : 200, {
    Location: resource.meta.location,
  });
});
