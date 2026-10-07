import { SCHEMA_LIST_RESPONSE } from "@/lib/scim/constants";
import { userSchemaDefinition } from "@/lib/scim/discovery";
import { getBaseUrl, scimResponse, withScim } from "@/lib/scim/http";

export const dynamic = "force-dynamic";

export const GET = withScim(async (request) =>
  scimResponse({
    schemas: [SCHEMA_LIST_RESPONSE],
    totalResults: 1,
    startIndex: 1,
    itemsPerPage: 1,
    Resources: [userSchemaDefinition(getBaseUrl(request))],
  }),
);
