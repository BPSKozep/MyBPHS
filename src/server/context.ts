import { inferAsyncReturnType } from "@trpc/server";
import { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import mongooseConnect from "clients/mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "server/auth";

export async function createContext(ctx: FetchCreateContextFnOptions) {
    const { req } = ctx;

    const mongooseClient = await mongooseConnect();
    const session = await getServerSession(authOptions);

    return { req, mongooseClient, session };
}

export type Context = inferAsyncReturnType<typeof createContext>;
