import mongooseConnect from "@/clients/mongoose";
import { env } from "@/env/server";
import { GoogleGroup, User } from "@/models";
import type { IGoogleGroup } from "@/models/GoogleGroup.model";
import { sendSlackNotification } from "./slack";

async function offboardUsersByEmail(
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
            `[googleSync] AD deletion failed for ${emails.join(", ")}: ${response.status} ${text}`,
          );
          errors.push(`AD deletion failed: ${response.status}`);
        }
      }
    } catch (error) {
      console.error(
        "[googleSync] AD service unavailable during offboarding:",
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

function inferRoleFromEmail(email: string): string {
  if (email.endsWith("@budapestschool.org")) return "staff";
  return "student";
}

export async function reconcileGoogleGroupSnapshot(
  snapshotId: string,
): Promise<void> {
  await mongooseConnect();

  const snapshot = await GoogleGroup.findById(snapshotId).lean<
    IGoogleGroup & { _id: unknown }
  >();

  if (!snapshot) {
    console.error(`[googleSync] Snapshot ${snapshotId} not found`);
    return;
  }

  const canonicalMembers = snapshot.members.map((m) => ({
    name: m.name,
    email: m.email.toLowerCase().trim(),
    joinDate: m.joinDate,
  }));

  const remoteEmailSet = new Set(canonicalMembers.map((m) => m.email));

  let updatedCount = 0;
  let createdCount = 0;
  const errors: string[] = [];
  const createdEmails: string[] = [];
  const updatedEmails: string[] = [];

  // Upsert each remote member (update name + joinDate for existing; create new)
  for (const member of canonicalMembers) {
    try {
      const joinDateParsed = member.joinDate
        ? new Date(member.joinDate)
        : undefined;
      const validJoinDate =
        joinDateParsed && !Number.isNaN(joinDateParsed.getTime())
          ? joinDateParsed
          : undefined;

      const existing = await User.findOne({ email: member.email });

      if (existing) {
        const nameChanged = existing.name !== member.name;
        const joinDateChanged =
          validJoinDate &&
          existing.joinDate?.getTime() !== validJoinDate.getTime();

        if (nameChanged || joinDateChanged) {
          existing.name = member.name;
          if (validJoinDate) {
            existing.joinDate = validJoinDate;
          }
          await existing.save();
          updatedEmails.push(member.email);
        }
        updatedCount++;
      } else {
        await User.create({
          name: member.name,
          email: member.email,
          roles: [inferRoleFromEmail(member.email)],
          groups: [],
          blocked: false,
          ...(validJoinDate ? { joinDate: validJoinDate } : {}),
        });
        createdEmails.push(member.email);
        createdCount++;
      }
    } catch (error) {
      const msg = `Failed to upsert ${member.email}: ${(error as Error).message ?? "unknown"}`;
      console.error(`[googleSync] ${msg}`);
      errors.push(msg);
    }
  }

  // Determine which Google-managed users should be offboarded.
  // A user is eligible if their email has appeared in any prior snapshot for
  // this group, but is absent from the current (latest) snapshot.
  const allGroupSnapshots = await GoogleGroup.find({
    group: snapshot.group,
  }).lean<IGoogleGroup[]>();

  const everSeenEmails = new Set<string>();
  for (const s of allGroupSnapshots) {
    for (const m of s.members) {
      everSeenEmails.add(m.email.toLowerCase().trim());
    }
  }

  // Only offboard users that still exist in MongoDB (avoids double-offboarding)
  const candidateEmails = [...everSeenEmails].filter(
    (e) => !remoteEmailSet.has(e),
  );

  let offboardedCount = 0;

  if (candidateEmails.length > 0) {
    const existingUsers = await User.find({
      email: { $in: candidateEmails },
    })
      .select("email")
      .lean<{ email: string }[]>();

    const toOffboardEmails = existingUsers.map((u) => u.email);

    if (toOffboardEmails.length > 0) {
      const { offboarded, errors: offboardErrors } =
        await offboardUsersByEmail(toOffboardEmails);
      offboardedCount = offboarded.length;
      errors.push(...offboardErrors);

      if (offboardErrors.length > 0) {
        await sendSlackNotification({
          title: "Google Sync: Offboarding hiba",
          body: `Hibák az offboarding során (csoport: "${snapshot.group}"):\n${offboardErrors.join("\n")}`,
          color: "danger",
        });
      }
    }
  }

  const totalApplied = updatedCount + createdCount;

  // Update the snapshot document with reconciliation metadata
  await GoogleGroup.findByIdAndUpdate(snapshotId, {
    $set: {
      appliedAt: new Date(),
      appliedCount: totalApplied,
      ...(errors.length > 0
        ? { applyError: errors.slice(0, 3).join("; ") }
        : { applyError: null }),
    },
  });

  const group = snapshot.group;

  console.log(
    `[googleSync] Reconciliation complete — group: "${group}" | updated: ${updatedCount}, created: ${createdCount}, offboarded: ${offboardedCount}`,
  );

  // Notify for new users
  if (createdEmails.length > 0) {
    await sendSlackNotification({
      title: "Google Sync: Új felhasználók létrehozva",
      body: `${createdEmails.length} új felhasználó lett létrehozva a(z) "${group}" csoportból:\n${createdEmails.join(", ")}`,
      color: "good",
    });
  }

  // Notify for changed users (name or joinDate updated)
  if (updatedEmails.length > 0) {
    await sendSlackNotification({
      title: "Google Sync: Felhasználók frissítve",
      body: `${updatedEmails.length} felhasználó adatai frissültek a(z) "${group}" csoportból:\n${updatedEmails.join(", ")}`,
      color: "good",
    });
  }

  // Notify for errors
  if (errors.length > 0) {
    console.error("[googleSync] Reconciliation completed with errors:", errors);
    await sendSlackNotification({
      title: "Google Sync: Szinkronizálási hiba",
      body: `Csoport: "${group}"\nHibák: ${errors.slice(0, 3).join("; ")}`,
      color: "danger",
    });
  }
}

export async function backfillJoinDatesFromGoogleHistory(): Promise<{
  updated: number;
  missing: string[];
}> {
  await mongooseConnect();

  const allSnapshots = await GoogleGroup.find().lean<IGoogleGroup[]>();

  // Build map: email -> earliest joinDate across all snapshots
  const joinDateMap = new Map<string, Date>();
  for (const snapshot of allSnapshots) {
    for (const member of snapshot.members) {
      if (!member.joinDate) continue;
      const email = member.email.toLowerCase().trim();
      const parsed = new Date(member.joinDate);
      if (Number.isNaN(parsed.getTime())) continue;
      const existing = joinDateMap.get(email);
      if (!existing || parsed < existing) {
        joinDateMap.set(email, parsed);
      }
    }
  }

  const usersWithoutJoinDate = await User.find({
    joinDate: { $exists: false },
  }).exec();

  let updated = 0;
  const missing: string[] = [];

  for (const user of usersWithoutJoinDate) {
    const joinDate = joinDateMap.get(user.email.toLowerCase());
    if (joinDate) {
      user.joinDate = joinDate;
      await user.save();
      updated++;
    } else {
      missing.push(user.email);
    }
  }

  if (missing.length > 0) {
    await sendSlackNotification({
      title: "Google Sync: Hiányzó csatlakozási dátumok",
      body: `${missing.length} felhasználónak nincs csatlakozási dátuma a Google előzményekben sem:\n${missing.slice(0, 20).join(", ")}${missing.length > 20 ? ` és még ${missing.length - 20} másik` : ""}`,
      color: "warning",
    });
  }

  return { updated, missing };
}
