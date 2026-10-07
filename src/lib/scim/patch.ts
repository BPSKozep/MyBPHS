import { SCHEMA_PATCH_OP } from "./constants";
import { ScimError } from "./errors";
import { normalizeAttributePath } from "./filter";
import {
  parseBoolean,
  pickEmailFromEmails,
  type ScimUserState,
} from "./user-mapper";

type Op = "add" | "replace" | "remove";

const EMAIL_PATHS = new Set([
  "emails",
  "emails.value",
  'emails[type eq "work"].value',
  "emails[primary eq true].value",
  'emails[type eq "work"]',
  "emails[primary eq true]",
]);

function str(value: unknown, path: string): string | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value !== "string") {
    throw new ScimError(
      400,
      `Value for '${path}' must be a string`,
      "invalidValue",
    );
  }
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

function applyEmailValue(state: ScimUserState, value: unknown, path: string) {
  // `emails` array, a single email object, or a plain string (for emails.value)
  const fromArray = pickEmailFromEmails(value);
  const fromObject = pickEmailFromEmails([value]);
  const candidate = fromArray ?? fromObject ?? str(value, path)?.toLowerCase();
  if (!candidate) {
    throw new ScimError(
      400,
      `Invalid email value for '${path}'`,
      "invalidValue",
    );
  }
  state.email = candidate;
}

/**
 * Applies one attribute assignment (`replace`/`add`) to the state.
 * Unknown attributes are ignored on purpose, so extra Entra mappings do not
 * make provisioning fail.
 */
function setAttribute(state: ScimUserState, rawPath: string, value: unknown) {
  const path = normalizeAttributePath(rawPath);

  if (EMAIL_PATHS.has(path)) {
    applyEmailValue(state, value, rawPath);
    return;
  }

  switch (path) {
    case "active":
      state.active = parseBoolean(value);
      return;
    case "username":
      state.userName = str(value, rawPath);
      return;
    case "externalid":
      state.externalId = str(value, rawPath);
      return;
    case "displayname":
      state.displayName = str(value, rawPath);
      return;
    case "name":
      applyNameObject(state, value, rawPath);
      return;
    case "name.givenname":
      state.givenName = str(value, rawPath);
      return;
    case "name.familyname":
      state.familyName = str(value, rawPath);
      return;
    case "name.formatted":
      state.formatted = str(value, rawPath);
      return;
    default:
      // Unsupported attribute: ignore.
      return;
  }
}

function applyNameObject(state: ScimUserState, value: unknown, path: string) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ScimError(
      400,
      `Value for '${path}' must be an object`,
      "invalidValue",
    );
  }
  for (const [key, v] of Object.entries(value as Record<string, unknown>)) {
    setAttribute(state, `name.${key}`, v);
  }
}

/** Path-less operation: `value` is an object whose keys are attribute paths. */
function applyValueObject(state: ScimUserState, value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ScimError(
      400,
      "An operation without 'path' requires an object 'value'",
      "invalidValue",
    );
  }
  for (const [key, v] of Object.entries(value as Record<string, unknown>)) {
    setAttribute(state, key, v);
  }
}

function removeAttribute(state: ScimUserState, rawPath: string) {
  const path = normalizeAttributePath(rawPath);

  if (EMAIL_PATHS.has(path) || path === "username" || path === "active") {
    throw new ScimError(
      400,
      `Attribute '${rawPath}' is required and cannot be removed`,
      "mutability",
    );
  }

  switch (path) {
    case "externalid":
      state.externalId = undefined;
      return;
    case "displayname":
      state.displayName = undefined;
      return;
    case "name":
      state.givenName = undefined;
      state.familyName = undefined;
      state.formatted = undefined;
      return;
    case "name.givenname":
      state.givenName = undefined;
      return;
    case "name.familyname":
      state.familyName = undefined;
      return;
    case "name.formatted":
      state.formatted = undefined;
      return;
    default:
      return;
  }
}

/**
 * Applies a SCIM PatchOp request body to a flat state and returns the new
 * state (the input is not mutated).
 */
export function applyPatchOperations(
  current: ScimUserState,
  body: unknown,
): ScimUserState {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new ScimError(
      400,
      "Request body must be a JSON object",
      "invalidSyntax",
    );
  }
  const { schemas, Operations } = body as {
    schemas?: unknown;
    Operations?: unknown;
  };

  if (!Array.isArray(schemas) || !schemas.includes(SCHEMA_PATCH_OP)) {
    throw new ScimError(
      400,
      `'schemas' must include ${SCHEMA_PATCH_OP}`,
      "invalidSyntax",
    );
  }
  if (!Array.isArray(Operations) || Operations.length === 0) {
    throw new ScimError(
      400,
      "'Operations' must be a non-empty array",
      "invalidSyntax",
    );
  }

  const state: ScimUserState = { ...current };

  for (const raw of Operations) {
    if (!raw || typeof raw !== "object") {
      throw new ScimError(
        400,
        "Each operation must be an object",
        "invalidSyntax",
      );
    }
    const { op, path, value } = raw as {
      op?: unknown;
      path?: unknown;
      value?: unknown;
    };
    const opName = typeof op === "string" ? op.toLowerCase() : "";
    if (opName !== "add" && opName !== "replace" && opName !== "remove") {
      throw new ScimError(
        400,
        `Unsupported op: ${String(op)}`,
        "invalidSyntax",
      );
    }
    if (path !== undefined && typeof path !== "string") {
      throw new ScimError(400, "'path' must be a string", "invalidPath");
    }

    const operation = opName as Op;
    if (operation === "remove") {
      if (!path) {
        throw new ScimError(400, "'remove' requires a 'path'", "noTarget");
      }
      removeAttribute(state, path);
    } else if (path) {
      setAttribute(state, path, value);
    } else {
      applyValueObject(state, value);
    }
  }

  return state;
}
