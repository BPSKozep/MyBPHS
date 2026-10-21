import type { HydratedDocument } from "mongoose";
import mongooseConnect from "@/clients/mongoose";
import { ScimError } from "@/lib/scim/errors";
import type { ScimFilter } from "@/lib/scim/filter";
import { applyPatchOperations } from "@/lib/scim/patch";
import {
  composeName,
  normalizeEmail,
  resolveEmail,
  type ScimUserState,
} from "@/lib/scim/user-mapper";
import { sendSlackNotification } from "@/lib/slack";
import { User } from "@/models";
import type { IUser } from "@/models/User.model";
import { inferRoleFromEmail } from "@/utils/inferRole";
import { ensureAdUser, syncAdUser } from "./adUsers";
import { offboardUsersByEmail } from "./offboarding";

type UserDoc = HydratedDocument<IUser>;

/** Case-insensitive collation used for every SCIM lookup. */
const CI = { locale: "en", strength: 2 } as const;
const OBJECT_ID_RE = /^[a-f\d]{24}$/i;

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: number }).code === 11000
  );
}

function stateFromUser(user: UserDoc): ScimUserState {
  return {
    userName: user.scim?.userName ?? user.email,
    externalId: user.scim?.externalId,
    email: user.email,
    givenName: user.givenName,
    familyName: user.familyName,
    displayName: user.displayName,
    active: !user.disabled,
  };
}

/**
 * Resolves the target AD account enabled state:
 * - If user is disabled in Entra/MongoDB -> false (disable in AD).
 * - If user is active but has never set a laptop password -> undefined (leave as-is in AD to prevent password policy errors).
 * - If user is active and has set a laptop password -> true (enable in AD).
 */
function resolveAdEnabled(user: UserDoc): boolean | undefined {
  if (user.disabled) {
    return false;
  }
  if (!user.laptopPasswordChanged) {
    return undefined;
  }
  return true;
}

/**
 * Writes the SCIM state onto a user document. Application-owned fields
 * (roles, groups, nfcId, joinDate, laptopPasswordChanged) are never touched.
 */
async function saveScimState(user: UserDoc, state: ScimUserState) {
  const email = resolveEmail(state);
  if (!email) {
    throw new ScimError(400, "A valid email is required", "invalidValue");
  }

  // Keep the stored casing when it only differs by case.
  if (user.email.toLowerCase() !== email) {
    user.email = email;
  }

  user.displayName = composeName(state) || user.displayName;
  user.givenName = state.givenName;
  user.familyName = state.familyName;
  if (state.active !== undefined) {
    user.disabled = !state.active;
  }

  user.scim = {
    externalId: state.externalId,
    userName: state.userName,
    lastSyncedAt: new Date(),
  };

  try {
    await user.save();
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      throw new ScimError(
        409,
        "A user with this email or externalId already exists",
        "uniqueness",
      );
    }
    throw error;
  }
  return user;
}

export async function findUserByScimId(id: string): Promise<UserDoc | null> {
  await mongooseConnect();
  if (OBJECT_ID_RE.test(id)) {
    const byId = await User.findById(id);
    if (byId) return byId;
  }
  return User.findOne({ "scim.externalId": id });
}

async function requireUser(id: string): Promise<UserDoc> {
  const user = await findUserByScimId(id);
  if (!user) {
    throw new ScimError(404, `User ${id} not found`, "noTarget");
  }
  return user;
}

function buildQuery(filter: ScimFilter | null): Record<string, unknown> | null {
  if (!filter) return {};
  switch (filter.attribute) {
    case "userName":
      return {
        $or: [{ "scim.userName": filter.value }, { email: filter.value }],
      };
    case "externalId":
      return { "scim.externalId": filter.value };
    case "email":
      return { email: filter.value };
    case "id":
      return OBJECT_ID_RE.test(filter.value) ? { _id: filter.value } : null;
  }
}

export async function listUsers(
  filter: ScimFilter | null,
  startIndex: number,
  count: number,
): Promise<{ total: number; users: UserDoc[] }> {
  await mongooseConnect();
  const query = buildQuery(filter);
  if (query === null) return { total: 0, users: [] };

  const total = await User.countDocuments(query).collation(CI);
  if (count === 0) return { total, users: [] };

  const users = await User.find(query)
    .collation(CI)
    .sort({ _id: 1 })
    .skip(startIndex - 1)
    .limit(count);
  return { total, users };
}

async function findExisting(
  email: string,
  externalId?: string,
): Promise<UserDoc | null> {
  if (externalId) {
    const byExternal = await User.findOne({ "scim.externalId": externalId });
    if (byExternal) return byExternal;
  }
  return User.findOne({ email }).collation(CI);
}

/**
 * Email reconciliation: link + update an existing user (matched by externalId,
 * then case-insensitive email) or create a new one.
 */
export async function provisionUser(
  state: ScimUserState,
): Promise<{ user: UserDoc; created: boolean }> {
  await mongooseConnect();

  const email = resolveEmail(state);
  if (!email) {
    throw new ScimError(
      400,
      "No email found in emails[] or userName",
      "invalidValue",
    );
  }
  const normalized: ScimUserState = { ...state, email };

  const existing = await findExisting(email, state.externalId);
  if (existing) {
    const user = await saveScimState(existing, normalized);
    const adResult = await syncAdUser(user.email, {
      name: user.displayName,
      enabled: resolveAdEnabled(user),
    });
    if (!adResult.success && !adResult.skipped) {
      console.error(`[scim] AD sync failed for ${user.email}:`, adResult.error);
      await sendSlackNotification({
        title: "SCIM: AD felhasználó frissítési hiba",
        body: `Hiba a(z) ${user.email} AD fiókjának frissítésekor:\n${adResult.error}`,
        color: "danger",
      });
    }
    return { user, created: false };
  }

  try {
    const user = await User.create({
      displayName:
        composeName(normalized) || normalizeEmail(email).split("@")[0],
      givenName: normalized.givenName,
      familyName: normalized.familyName,
      email,
      roles: [inferRoleFromEmail(email)],
      groups: [],
      disabled: normalized.active === false,
      joinDate: new Date(),
      // User sets their school/laptop password themselves on the portal; remains unset on SCIM provisioning
      laptopPasswordChanged: undefined,
      scim: {
        externalId: normalized.externalId,
        userName: normalized.userName,
        lastSyncedAt: new Date(),
      },
    });

    const adResult = await ensureAdUser(
      user.email,
      user.displayName,
      resolveAdEnabled(user),
    );
    if (!adResult.success && !adResult.skipped) {
      console.error(
        `[scim] AD creation failed for ${user.email}:`,
        adResult.error,
      );
      await sendSlackNotification({
        title: "SCIM: AD felhasználó létrehozási hiba",
        body: `Hiba a(z) ${user.email} AD fiókjának létrehozásakor:\n${adResult.error}`,
        color: "danger",
      });
    }

    return { user, created: true };
  } catch (error) {
    if (!isDuplicateKeyError(error)) throw error;

    // Lost a race with a concurrent request: update the winner instead.
    const winner = await findExisting(email, state.externalId);
    if (!winner) {
      throw new ScimError(
        409,
        "A user with this email or externalId already exists",
        "uniqueness",
      );
    }
    const user = await saveScimState(winner, normalized);
    const adResult = await syncAdUser(user.email, {
      name: user.displayName,
      enabled: resolveAdEnabled(user),
    });
    if (!adResult.success && !adResult.skipped) {
      console.error(`[scim] AD sync failed for ${user.email}:`, adResult.error);
      await sendSlackNotification({
        title: "SCIM: AD felhasználó frissítési hiba",
        body: `Hiba a(z) ${user.email} AD fiókjának frissítésekor:\n${adResult.error}`,
        color: "danger",
      });
    }
    return { user, created: false };
  }
}

export async function patchUser(id: string, body: unknown): Promise<UserDoc> {
  const user = await requireUser(id);
  const oldEmail = user.email;
  const next = applyPatchOperations(stateFromUser(user), body);
  const updatedUser = await saveScimState(user, next);

  const adResult = await syncAdUser(oldEmail, {
    name: updatedUser.displayName,
    enabled: resolveAdEnabled(updatedUser),
    ...(updatedUser.email.toLowerCase() !== oldEmail.toLowerCase()
      ? { newEmail: updatedUser.email }
      : {}),
  });

  if (!adResult.success && !adResult.skipped) {
    console.error(
      `[scim] AD patch failed for ${updatedUser.email}:`,
      adResult.error,
    );
    await sendSlackNotification({
      title: "SCIM: AD felhasználó frissítési hiba",
      body: `Hiba a(z) ${updatedUser.email} AD fiókjának frissítésekor:\n${adResult.error}`,
      color: "danger",
    });
  }

  return updatedUser;
}

/** Hard delete: removes the AD account (best-effort) and the user document. */
export async function deleteUser(id: string): Promise<void> {
  const user = await requireUser(id);
  const { errors } = await offboardUsersByEmail([user.email]);

  if (errors.length > 0) {
    await sendSlackNotification({
      title: "SCIM: Offboarding hiba",
      body: `Hibák a(z) ${user.email} törlésekor:\n${errors.join("\n")}`,
      color: "danger",
    });
  }
}
