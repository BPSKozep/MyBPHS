import {
  type DefaultSession,
  getServerSession,
  type NextAuthOptions,
} from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import mongooseConnect from "@/clients/mongoose";
import { env } from "@/env/server";
import { User } from "@/models";
import { formatName } from "@/utils/personName";

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
      googleImage?: string;
      disabled?: boolean;
      // ...other properties
      // role: UserRole;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    googleImage?: string;
    disabled?: boolean;
    /** True once `name` holds the formatted name from the database instead of Google's. */
    nameFromDb?: boolean;
  }
}

// Google profile type for type-safe access to picture
interface GoogleProfile {
  picture?: string;
  email?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
}

export const authOptions: NextAuthOptions = {
  callbacks: {
    jwt: async ({ token, user, profile }) => {
      // Capture Google profile picture URL during sign-in
      const googleProfile = profile as GoogleProfile | undefined;
      if (googleProfile?.picture) {
        token.googleImage = googleProfile.picture;
      }
      // Runs on sign-in, and once for sessions created before these fields existed.
      if (user || token.disabled === undefined || !token.nameFromDb) {
        const email = token.email ?? user?.email ?? profile?.email;
        if (email) {
          token.email = email;
          await mongooseConnect();
          const dbUser = await User.findOne({ email })
            .select("disabled familyName givenName displayName")
            .lean();
          token.disabled = dbUser?.disabled ?? false;
          // Show the app's (Hungarian-formatted) name, not Google's.
          if (dbUser) {
            token.name = formatName(dbUser) || token.name;
          }
          token.nameFromDb = true;
        }
      }
      return token;
    },
    session: ({ session, token }) => ({
      ...session,
      user: {
        ...session.user,
        id: token.sub,
        googleImage: token.googleImage,
        disabled: token.disabled ?? false,
      },
    }),
    async signIn({ profile, user }) {
      await mongooseConnect();

      const email = profile?.email ?? user?.email;
      const dbUser = await User.findOne({ email });

      if (dbUser) {
        return true;
      }

      if (
        email?.endsWith("@budapest.school") ||
        email?.endsWith("@budapestschool.org")
      ) {
        // Redirect to onboarding with user info as search params
        // Name parts only when Google is sure about both; otherwise the full name as-is.
        const googleProfile = profile as GoogleProfile | undefined;
        const familyName = googleProfile?.family_name?.trim();
        const givenName = googleProfile?.given_name?.trim();
        const params = new URLSearchParams(
          familyName && givenName
            ? { familyName, givenName, email }
            : { name: profile?.name ?? user?.name ?? "", email },
        );
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
    CredentialsProvider({
      id: "kiosk",
      name: "Kiosk",
      credentials: {
        token: { label: "Kiosk Token", type: "password" },
      },
      async authorize(credentials) {
        if (
          !credentials?.token ||
          !env.KIOSK_SECRET ||
          !env.KIOSK_EMAIL ||
          credentials.token !== env.KIOSK_SECRET
        ) {
          return null;
        }

        await mongooseConnect();
        const kioskUser = await User.findOne({ email: env.KIOSK_EMAIL });
        if (!kioskUser || kioskUser.disabled) {
          return null;
        }

        return {
          id: kioskUser._id?.toString() ?? "",
          name: formatName(kioskUser),
          email: kioskUser.email,
        };
      },
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
