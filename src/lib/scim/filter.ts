import { SCHEMA_USER } from "./constants";
import { ScimError } from "./errors";

export type ScimFilterAttribute = "userName" | "externalId" | "id" | "email";

export interface ScimFilter {
  attribute: ScimFilterAttribute;
  value: string;
}

/** Strips the optional core schema URN prefix and lowercases. */
export function normalizeAttributePath(path: string): string {
  const trimmed = path.trim();
  const prefix = `${SCHEMA_USER}:`;
  const withoutUrn = trimmed.toLowerCase().startsWith(prefix.toLowerCase())
    ? trimmed.slice(prefix.length)
    : trimmed;
  return withoutUrn.toLowerCase();
}

const FILTER_RE =
  /^\s*([^\s]+(?:\[[^\]]*\][^\s]*)?)\s+eq\s+"((?:[^"\\]|\\.)*)"\s*$/i;

const ATTRIBUTE_MAP: Record<string, ScimFilterAttribute> = {
  username: "userName",
  externalid: "externalId",
  id: "id",
  "emails.value": "email",
  'emails[type eq "work"].value': "email",
  "emails[primary eq true].value": "email",
};

/**
 * Parses the single-comparison `eq` filters that Entra ID sends, e.g.
 * `userName eq "a@b.hu"` or `externalId eq "…"`.
 *
 * Returns `null` for an empty / missing filter (= list everything).
 * Anything unsupported throws `ScimError(400, …, "invalidFilter")`.
 */
export function parseFilter(raw: string | null | undefined): ScimFilter | null {
  if (raw === null || raw === undefined || raw.trim() === "") return null;

  const match = FILTER_RE.exec(raw);
  if (!match) {
    throw new ScimError(
      400,
      `Unsupported filter expression: ${raw}. Only '<attribute> eq "<value>"' is supported.`,
      "invalidFilter",
    );
  }

  const [, rawAttribute, rawValue] = match as unknown as [
    string,
    string,
    string,
  ];
  const attribute = ATTRIBUTE_MAP[normalizeAttributePath(rawAttribute)];
  if (!attribute) {
    throw new ScimError(
      400,
      `Filtering on '${rawAttribute}' is not supported.`,
      "invalidFilter",
    );
  }

  const value = rawValue.replace(/\\(.)/g, "$1");
  return { attribute, value };
}
