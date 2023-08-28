import { User } from "models";
import { Session } from "next-auth";

export async function checkRoles(session: Session, allowedRoles: string[]) {
    const requester = await User.findOne({
        email: session.user?.email,
    });

    return allowedRoles.some(
        (role) => requester && requester.roles.indexOf(role) !== -1
    );
}
