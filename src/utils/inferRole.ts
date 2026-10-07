export function inferRoleFromEmail(email: string): string {
  if (email.endsWith("@budapestschool.org")) return "staff";
  return "student";
}
