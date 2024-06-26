import { inferAsyncReturnType } from "@trpc/server";
import { CreateNextContextOptions } from "@trpc/server/adapters/next";
import mongooseConnect from "clients/mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "pages-old/api/auth/[...nextauth]";

export async function createContext(ctx: CreateNextContextOptions) {
    const { req, res } = ctx;

    const mongooseClient = await mongooseConnect();
    const session = await getServerSession(req, res, authOptions);

    return { req, res, mongooseClient, session };
}

export type Context = inferAsyncReturnType<typeof createContext>;
