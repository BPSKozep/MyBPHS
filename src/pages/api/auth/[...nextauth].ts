import mongooseConnect from "clients/mongoose";
import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { User } from "models";
import { NextApiRequest, NextApiResponse } from "next";

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
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    pages: {
        signIn: "/auth/signin",
    },
} as NextAuthOptions;

export default async function auth(req: NextApiRequest, res: NextApiResponse) {
    return await NextAuth(req, res, authOptions);
}
