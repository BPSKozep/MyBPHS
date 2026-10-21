export interface PersonName {
  familyName?: string | null;
  givenName?: string | null;
  /** Full name as received, kept only when the family and given names are not both known. */
  displayName?: string | null;
}

/**
 * The name to show for a person. Uses Hungarian order ("Family Given", e.g.
 * "Gyóni Márk") only when both parts are known; otherwise the stored full name
 * as-is, never split or reordered.
 */
export function formatName(person: PersonName): string {
  const family = person.familyName?.trim();
  const given = person.givenName?.trim();
  if (family && given) return `${family} ${given}`;
  return person.displayName?.trim() || family || given || "";
}

/** The name used to greet a single person (e.g. "Kedves Márk!"). */
export function firstName(person: PersonName): string {
  return person.givenName?.trim() || formatName(person);
}
