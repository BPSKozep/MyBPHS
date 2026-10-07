import {
  MAX_COUNT,
  SCHEMA_RESOURCE_TYPE,
  SCHEMA_SCHEMA,
  SCHEMA_SERVICE_PROVIDER_CONFIG,
  SCHEMA_USER,
} from "./constants";

export function serviceProviderConfig(baseUrl: string) {
  return {
    schemas: [SCHEMA_SERVICE_PROVIDER_CONFIG],
    documentationUri: "https://datatracker.ietf.org/doc/html/rfc7644",
    patch: { supported: true },
    bulk: { supported: false, maxOperations: 0, maxPayloadSize: 0 },
    filter: { supported: true, maxResults: MAX_COUNT },
    changePassword: { supported: false },
    sort: { supported: false },
    etag: { supported: false },
    authenticationSchemes: [
      {
        type: "oauthbearertoken",
        name: "OAuth Bearer Token",
        description: "Authentication scheme using a static bearer token",
        specUri: "https://datatracker.ietf.org/doc/html/rfc6750",
        primary: true,
      },
    ],
    meta: {
      resourceType: "ServiceProviderConfig",
      location: `${baseUrl}/api/scim/v2/ServiceProviderConfig`,
    },
  };
}

export function userResourceType(baseUrl: string) {
  return {
    schemas: [SCHEMA_RESOURCE_TYPE],
    id: "User",
    name: "User",
    endpoint: "/Users",
    description: "User Account",
    schema: SCHEMA_USER,
    meta: {
      resourceType: "ResourceType",
      location: `${baseUrl}/api/scim/v2/ResourceTypes/User`,
    },
  };
}

function attr(name: string, type: string, extra: Record<string, unknown> = {}) {
  return {
    name,
    type,
    multiValued: false,
    required: false,
    caseExact: false,
    mutability: "readWrite",
    returned: "default",
    uniqueness: "none",
    ...extra,
  };
}

export function userSchemaDefinition(baseUrl: string) {
  return {
    schemas: [SCHEMA_SCHEMA],
    id: SCHEMA_USER,
    name: "User",
    description: "User Account",
    attributes: [
      attr("userName", "string", { required: true, uniqueness: "server" }),
      attr("externalId", "string", { caseExact: true }),
      attr("displayName", "string"),
      attr("active", "boolean"),
      attr("name", "complex", {
        subAttributes: [
          attr("formatted", "string"),
          attr("givenName", "string"),
          attr("familyName", "string"),
        ],
      }),
      attr("emails", "complex", {
        multiValued: true,
        subAttributes: [
          attr("value", "string"),
          attr("type", "string"),
          attr("primary", "boolean"),
        ],
      }),
    ],
    meta: {
      resourceType: "Schema",
      location: `${baseUrl}/api/scim/v2/Schemas/${SCHEMA_USER}`,
    },
  };
}
