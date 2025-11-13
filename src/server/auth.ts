import {
  type DefaultSession,
  getServerSession,
  type NextAuthOptions,
} from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import mongooseConnect from "@/clients/mongoose";
import { env } from "@/env/server";
import { User } from "@/models";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      // ...other properties
      // role: UserRole;
    } & DefaultSession["user"];
  }
}

export const authOptions: NextAuthOptions = {
  callbacks: {
    session: ({ session, token }) => ({
      ...session,
      user: {
        ...session.user,
        id: token.sub,
      },
    }),
    async signIn({ profile }) {
      await mongooseConnect();

      const user = await User.findOne({ email: profile?.email });

      if (user) return true;

      const email = profile?.email;
      if (
        email?.endsWith("@budapest.school") ||
        email?.endsWith("@budapestschool.org")
      ) {
        // Redirect to onboarding with user info as search params
        const params = new URLSearchParams({
          name: profile?.name ?? "",
          email: email,
        });
        return `/onboarding?${params.toString()}`;
      }

      return "/forbidden";
    },
  },
  providers: [
    GoogleProvider({
      clientId: env.GOOGLE_ID,
      clientSecret: env.GOOGLE_SECRET,
    }),
  ],
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
};

/**
 * Wrapper for `getServerSession` so that you don't need to import the `authOptions` in every file.
 *
 * @see https://next-auth.js.org/configuration/nextjs
 */
export const getServerAuthSession = () => getServerSession(authOptions);
