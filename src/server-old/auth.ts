import { NextAuthOptions, getServerSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import mongooseConnect from "clients/mongoose";
import { User } from "models";

export const authOptions: NextAuthOptions = {
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
    // pages: {
    //     signIn: "/auth/signin",
    // },
    secret: process.env.NEXTAUTH_SECRET,
};

export const getServerAuthSession = () => getServerSession(authOptions);
