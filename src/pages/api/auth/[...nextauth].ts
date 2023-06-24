import NextAuth, { CallbacksOptions, NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_ID as string,
            clientSecret: process.env.GOOGLE_SECRET as string,
        }),
    ],
    callbacks: {
        signIn({ profile }) {
            if (
                profile?.email &&
                process.env.ALLOWED_DOMAINS?.split(",").includes(
                    profile.email.split("@")[1]
                )
            )
                return true;

            return "/forbidden";
        },
    } as CallbacksOptions,
} as NextAuthOptions;

export default NextAuth(authOptions);
