import { ScimError } from "@/lib/scim/errors";
import {
  getBaseUrl,
  readJsonBody,
  scimEmpty,
  scimResponse,
  withScim,
} from "@/lib/scim/http";
import { toScimUser } from "@/lib/scim/user-mapper";
import {
  deleteUser,
  findUserByScimId,
  patchUser,
} from "@/server/services/scimUsers";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export const GET = withScim<Context>(async (request, { params }) => {
  const { id } = await params;
  const user = await findUserByScimId(id);
  if (!user) {
    throw new ScimError(404, `User ${id} not found`, "noTarget");
  }
  return scimResponse(toScimUser(user, getBaseUrl(request)));
});

export const PATCH = withScim<Context>(async (request, { params }) => {
  const { id } = await params;
  const body = await readJsonBody(request);
  const user = await patchUser(id, body);
  return scimResponse(toScimUser(user, getBaseUrl(request)));
});

export const DELETE = withScim<Context>(async (_request, { params }) => {
  const { id } = await params;
  await deleteUser(id);
  return scimEmpty(204);
});
