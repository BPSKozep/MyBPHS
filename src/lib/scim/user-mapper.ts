import { formatName } from "@/utils/personName";
import { SCHEMA_USER } from "./constants";
import { ScimError } from "./errors";

/** Flat, DB-agnostic representation of the SCIM attributes we care about. */
export interface ScimUserState {
  userName?: string;
  externalId?: string;
  email?: string;
  givenName?: string;
  familyName?: string;
  formatted?: string;
  displayName?: string;
  active?: boolean;
}

/** Name fields as stored on a user; `undefined` clears a field on save. */
export interface StoredName {
  familyName: string | undefined;
  givenName: string | undefined;
  displayName: string | undefined;
}

/** The subset of a stored user that is needed to serialize a SCIM resource. */
export interface ScimSerializableUser {
  _id?: { toString(): string; getTimestamp?: () => Date } | null;
  familyName?: string;
  givenName?: string;
  displayName?: string;
  email: string;
  disabled?: boolean;
  scim?: {
    externalId?: string;
    userName?: string;
    lastSyncedAt?: Date;
  };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isEmailLike(value: unknown): value is string {
  return typeof value === "string" && EMAIL_RE.test(value.trim());
}

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

/**
 * Entra sends booleans as real booleans or (by default) as the strings
 * "True" / "False". Anything else is rejected.
 */
export function parseBoolean(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const lower = value.trim().toLowerCase();
    if (lower === "true") return true;
    if (lower === "false") return false;
  }
  throw new ScimError(
    400,
    `Expected a boolean value but received: ${JSON.stringify(value)}`,
    "invalidValue",
  );
}

/**
 * Picks the email from an `emails` array:
 * primary → type "work" → first entry. Returns undefined if nothing usable.
 */
export function pickEmailFromEmails(emails: unknown): string | undefined {
  if (!Array.isArray(emails)) return undefined;
  const entries = emails
    .map((e) => (typeof e === "string" ? { value: e } : asRecord(e)))
    .filter((e): e is Record<string, unknown> => e !== null);

  const isPrimary = (e: Record<string, unknown>) =>
    e.primary === true ||
    (typeof e.primary === "string" && e.primary.toLowerCase() === "true");
  const isWork = (e: Record<string, unknown>) =>
    typeof e.type === "string" && e.type.toLowerCase() === "work";

  const chosen =
    entries.find((e) => isPrimary(e) && asString(e.value)) ??
    entries.find((e) => isWork(e) && asString(e.value)) ??
    entries.find((e) => asString(e.value));

  const value = chosen ? asString(chosen.value) : undefined;
  return value ? normalizeEmail(value) : undefined;
}

/** Email resolution precedence: emails array, then userName if email-shaped. */
export function resolveEmail(state: {
  email?: string;
  userName?: string;
}): string | undefined {
  if (state.email) return normalizeEmail(state.email);
  if (isEmailLike(state.userName)) return normalizeEmail(state.userName);
  return undefined;
}

/** Validates and flattens a SCIM Core User payload (POST body). */
export function parseScimUser(body: unknown): ScimUserState {
  const obj = asRecord(body);
  if (!obj) {
    throw new ScimError(
      400,
      "Request body must be a JSON object",
      "invalidSyntax",
    );
  }

  const schemas = Array.isArray(obj.schemas) ? obj.schemas : [];
  if (!schemas.some((s) => s === SCHEMA_USER)) {
    throw new ScimError(
      400,
      `'schemas' must include ${SCHEMA_USER}`,
      "invalidSyntax",
    );
  }

  const name = asRecord(obj.name);
  const state: ScimUserState = {
    userName: asString(obj.userName),
    externalId: asString(obj.externalId),
    email: pickEmailFromEmails(obj.emails),
    givenName: asString(name?.givenName),
    familyName: asString(name?.familyName),
    formatted: asString(name?.formatted),
    displayName: asString(obj.displayName),
  };
  if (obj.active !== undefined && obj.active !== null) {
    state.active = parseBoolean(obj.active);
  }
  return state;
}

/**
 * Resolves the name fields to store from SCIM attributes. With both familyName
 * and givenName, the full name is dropped (it is formatted from the parts).
 * Otherwise displayName / name.formatted is kept as-is, never split.
 * Every key is present so a save also clears stale fields. Returns null when
 * no name attribute is present.
 */
export function resolveNameParts(state: ScimUserState): StoredName | null {
  const familyName = state.familyName?.trim() || undefined;
  const givenName = state.givenName?.trim() || undefined;
  if (familyName && givenName) {
    return { familyName, givenName, displayName: undefined };
  }

  const displayName =
    state.displayName?.trim() || state.formatted?.trim() || undefined;
  if (!familyName && !givenName && !displayName) return null;
  return { familyName, givenName, displayName };
}

/** Serializes a stored user as a SCIM User resource. */
export function toScimUser(user: ScimSerializableUser, baseUrl: string) {
  const id = user._id?.toString() ?? "";
  const created = user._id?.getTimestamp?.() ?? new Date(0);
  const lastModified = user.scim?.lastSyncedAt ?? created;

  return {
    schemas: [SCHEMA_USER],
    id,
    ...(user.scim?.externalId ? { externalId: user.scim.externalId } : {}),
    userName: user.scim?.userName ?? user.email,
    name: {
      formatted: formatName(user),
      ...(user.givenName ? { givenName: user.givenName } : {}),
      ...(user.familyName ? { familyName: user.familyName } : {}),
    },
    displayName: formatName(user),
    emails: [{ value: user.email, type: "work", primary: true }],
    active: !user.disabled,
    meta: {
      resourceType: "User",
      created: created.toISOString(),
      lastModified: lastModified.toISOString(),
      location: `${baseUrl}/api/scim/v2/Users/${id}`,
    },
  };
}
