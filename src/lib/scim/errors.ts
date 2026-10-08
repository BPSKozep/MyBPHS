import { SCHEMA_ERROR } from "./constants";

export type ScimErrorType =
  | "invalidFilter"
  | "tooMany"
  | "uniqueness"
  | "mutability"
  | "invalidSyntax"
  | "invalidPath"
  | "noTarget"
  | "invalidValue"
  | "invalidVers"
  | "sensitive";

export class ScimError extends Error {
  readonly status: number;
  readonly scimType?: ScimErrorType;

  constructor(status: number, detail: string, scimType?: ScimErrorType) {
    super(detail);
    this.name = "ScimError";
    this.status = status;
    this.scimType = scimType;
  }
}

/** RFC 7644 §3.12 error body. Note that `status` is a string. */
export function scimErrorBody(
  status: number,
  detail: string,
  scimType?: ScimErrorType,
) {
  return {
    schemas: [SCHEMA_ERROR],
    status: String(status),
    ...(scimType ? { scimType } : {}),
    detail,
  };
}
