import { env } from "@/env/server";

export interface UpdateAdUserInput {
  name?: string;
  enabled?: boolean;
  newEmail?: string;
  password?: string;
  Name?: string;
  DisplayName?: string;
  UserPrincipalName?: string;
  SamAccountName?: string;
  Enabled?: boolean;
}

export interface AdOperationResult {
  success: boolean;
  skipped?: boolean;
  error?: string;
  data?: Record<string, unknown>;
}

/**
 * Creates an Active Directory user account via PowerShell Universal.
 * Best-effort: skipped in development or when PU is not configured.
 */
export async function createAdUser(
  email: string,
  name: string,
  password?: string,
): Promise<AdOperationResult> {
  if (env.NODE_ENV === "development") {
    return { success: true, skipped: true };
  }

  if (!env.PU_TOKEN || !env.PU_URL) {
    return {
      success: false,
      error: "PowerShell Universal is not configured (PU_TOKEN/PU_URL missing)",
    };
  }

  try {
    const payload: { name: string; password?: string } = { name };
    if (password) {
      payload.password = password;
    }

    const response = await fetch(
      `${env.PU_URL}/ad/create-user/${encodeURIComponent(email)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.PU_TOKEN}`,
        },
        body: JSON.stringify(payload),
      },
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      return {
        success: false,
        error: `Failed to create AD user (${response.status}): ${errorText}`,
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: `AD service unavailable: ${(error as Error).message ?? "unknown"}`,
    };
  }
}

/**
 * Updates an Active Directory user account via PowerShell Universal.
 * Best-effort: skipped in development or when PU is not configured.
 */
export async function updateAdUser(
  email: string,
  updates: UpdateAdUserInput,
): Promise<AdOperationResult> {
  if (env.NODE_ENV === "development") {
    return { success: true, skipped: true };
  }

  if (!env.PU_TOKEN || !env.PU_URL) {
    return {
      success: false,
      error: "PowerShell Universal is not configured (PU_TOKEN/PU_URL missing)",
    };
  }

  try {
    const payload: Record<string, unknown> = {};

    const nameValue = updates.DisplayName ?? updates.Name ?? updates.name;
    if (nameValue !== undefined) {
      payload.DisplayName = nameValue;
    }

    const enabledValue =
      updates.Enabled !== undefined ? updates.Enabled : updates.enabled;
    if (enabledValue !== undefined) {
      payload.Enabled = enabledValue;
    }

    const emailValue = updates.UserPrincipalName ?? updates.newEmail;
    if (emailValue !== undefined) {
      payload.UserPrincipalName = emailValue;
    }

    if (updates.SamAccountName !== undefined) {
      payload.SamAccountName = updates.SamAccountName;
    }

    if (updates.password !== undefined) {
      payload.password = updates.password;
    }

    const response = await fetch(
      `${env.PU_URL}/ad/update-user/${encodeURIComponent(email)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.PU_TOKEN}`,
        },
        body: JSON.stringify(payload),
      },
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      return {
        success: false,
        error: `Failed to update AD user (${response.status}): ${errorText}`,
      };
    }

    const data = (await response.json().catch(() => undefined)) as
      | Record<string, unknown>
      | undefined;
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: `AD service unavailable: ${(error as Error).message ?? "unknown"}`,
    };
  }
}

/**
 * Ensures an AD user account exists in Active Directory.
 * Tries creation first; if the user already exists, updates their properties.
 * If creation succeeds and `enabled` is false, disables the account.
 */
export async function ensureAdUser(
  email: string,
  name: string,
  enabled?: boolean,
  password?: string,
): Promise<AdOperationResult> {
  const createResult = await createAdUser(email, name, password);
  if (createResult.success || createResult.skipped) {
    if (enabled === false) {
      return updateAdUser(email, { enabled: false });
    }
    return createResult;
  }

  const errorMsg = createResult.error?.toLowerCase() ?? "";
  if (errorMsg.includes("already exists")) {
    return updateAdUser(email, { name, enabled });
  }

  return createResult;
}

/**
 * Syncs user properties with Active Directory.
 * Tries updating first; if the account does not exist in AD, creates it.
 */
export async function syncAdUser(
  email: string,
  updates: { name: string; enabled?: boolean; newEmail?: string },
): Promise<AdOperationResult> {
  const updateResult = await updateAdUser(email, updates);
  if (updateResult.success || updateResult.skipped) {
    return updateResult;
  }

  // If user does not exist in AD, fall back to creating the account
  const errorMsg = updateResult.error?.toLowerCase() ?? "";
  if (
    errorMsg.includes("not exist") ||
    errorMsg.includes("not found") ||
    errorMsg.includes("404")
  ) {
    const createTargetEmail = updates.newEmail ?? email;
    const createResult = await createAdUser(createTargetEmail, updates.name);
    if (!createResult.success && !createResult.skipped) {
      return createResult;
    }
    if (updates.enabled === false) {
      return updateAdUser(createTargetEmail, { enabled: false });
    }
    return { success: true };
  }

  return updateResult;
}
