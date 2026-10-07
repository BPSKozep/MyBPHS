import { serviceProviderConfig } from "@/lib/scim/discovery";
import { getBaseUrl, scimResponse, withScim } from "@/lib/scim/http";

export const dynamic = "force-dynamic";

export const GET = withScim(async (request) =>
  scimResponse(serviceProviderConfig(getBaseUrl(request))),
);
