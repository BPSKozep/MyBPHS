import mongooseConnect from "clients/mongoose";
import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { User } from "models";

export const authOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_ID as string,
            clientSecret: process.env.GOOGLE_SECRET as string,
        }),
    ],
    callbacks: {
        async signIn({ profile }) {
            await mongooseConnect();

            const user = await User.findOne({ email: profile?.email });

            if (user) return true;

            return "/forbidden";
        },
    },
} as NextAuthOptions;

export default NextAuth(authOptions);
