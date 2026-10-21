/**
 * Renames `users.name` to `displayName`, moves `scim.givenName` / `scim.familyName`
 * to the top level and drops the unused `scim.displayName`.
 */

import type { Connection } from "mongoose";

export async function up(connection: Connection): Promise<void> {
  const users = connection.collection("users");

  const renamed = await users.updateMany(
    { name: { $exists: true }, displayName: { $exists: false } },
    { $rename: { name: "displayName" } },
  );
  // Documents that somehow already have displayName keep it; drop the stale copy.
  await users.updateMany({ name: { $exists: true } }, { $unset: { name: "" } });

  const given = await users.updateMany(
    { "scim.givenName": { $exists: true } },
    { $rename: { "scim.givenName": "givenName" } },
  );
  const family = await users.updateMany(
    { "scim.familyName": { $exists: true } },
    { $rename: { "scim.familyName": "familyName" } },
  );
  const dropped = await users.updateMany(
    { "scim.displayName": { $exists: true } },
    { $unset: { "scim.displayName": "" } },
  );

  console.log(
    `name→displayName: ${renamed.modifiedCount}, givenName: ${given.modifiedCount}, familyName: ${family.modifiedCount}, scim.displayName removed: ${dropped.modifiedCount}`,
  );
}

export async function down(connection: Connection): Promise<void> {
  const users = connection.collection("users");

  await users.updateMany(
    { displayName: { $exists: true }, name: { $exists: false } },
    { $rename: { displayName: "name" } },
  );
  // scim.displayName is not restored: it was never read and its old value is gone.
  await users.updateMany(
    { givenName: { $exists: true }, scim: { $type: "object" } },
    { $rename: { givenName: "scim.givenName" } },
  );
  await users.updateMany(
    { familyName: { $exists: true }, scim: { $type: "object" } },
    { $rename: { familyName: "scim.familyName" } },
  );
}
