import { env } from "@/env/server";
import { User } from "@/models";

/**
 * Offboards users by email: deletes their AD accounts (best-effort, skipped in
 * development) and then removes their MongoDB documents.
 */
export async function offboardUsersByEmail(
  emails: string[],
): Promise<{ offboarded: string[]; errors: string[] }> {
  if (emails.length === 0) return { offboarded: [], errors: [] };

  const offboarded: string[] = [];
  const errors: string[] = [];

  if (env.NODE_ENV !== "development") {
    try {
      if (env.PU_TOKEN && env.PU_URL) {
        const response = await fetch(`${env.PU_URL}/ad/delete-users`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${env.PU_TOKEN}`,
          },
          body: JSON.stringify({ emails }),
        });

        if (!response.ok) {
          const text = await response.text().catch(() => "");
          console.error(
            `[offboarding] AD deletion failed for ${emails.join(", ")}: ${response.status} ${text}`,
          );
          errors.push(`AD deletion failed: ${response.status}`);
        }
      }
    } catch (error) {
      console.error(
        "[offboarding] AD service unavailable during offboarding:",
        error,
      );
      errors.push(
        `AD service unavailable: ${(error as Error).message ?? "unknown"}`,
      );
    }
  }

  const result = await User.deleteMany({ email: { $in: emails } });
  offboarded.push(...emails.slice(0, result.deletedCount));

  return { offboarded, errors };
}
