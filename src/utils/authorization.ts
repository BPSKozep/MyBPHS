import type { Session } from "next-auth";
import { User } from "@/models";

export async function checkRoles(session: Session, allowedRoles: string[]) {
  const requester = await User.findOne({
    email: session.user?.email,
  });

  return allowedRoles.some((role) => requester?.roles.includes(role));
}
