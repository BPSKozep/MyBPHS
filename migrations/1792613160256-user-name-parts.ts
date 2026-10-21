/**
 * Drops `users.displayName` where both `familyName` and `givenName` are known;
 * the app formats those names in Hungarian order from the parts. Users without
 * both parts keep their displayName as-is: names are never split.
 */

import type { Connection } from "mongoose";

interface UserNameDoc {
  _id: unknown;
  displayName?: string;
  familyName?: string;
  givenName?: string;
}

const HAS_BOTH_PARTS = {
  familyName: { $type: "string", $ne: "" },
  givenName: { $type: "string", $ne: "" },
} as const;

export async function up(connection: Connection): Promise<void> {
  const users = connection.collection<UserNameDoc>("users");

  const dropped = await users.updateMany(
    { ...HAS_BOTH_PARTS, displayName: { $exists: true } },
    { $unset: { displayName: "" } },
  );
  const kept = await users.countDocuments({
    displayName: { $exists: true },
  });

  console.log(
    `displayName removed: ${dropped.modifiedCount}, kept (no name parts): ${kept}`,
  );
}

export async function down(connection: Connection): Promise<void> {
  const users = connection.collection<UserNameDoc>("users");

  // Restores displayName in Western order ("Given Family"), as it was stored before.
  const withParts = await users
    .find({ ...HAS_BOTH_PARTS, displayName: { $exists: false } })
    .toArray();
  if (withParts.length === 0) return;

  await users.bulkWrite(
    withParts.map((user) => ({
      updateOne: {
        filter: { _id: user._id },
        update: {
          $set: { displayName: `${user.givenName} ${user.familyName}` },
        },
      },
    })),
  );
}
