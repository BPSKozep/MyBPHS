import * as trpcNext from "@trpc/server/adapters/next";
import { appRouter } from "server/routers/_app";
import mongooseConnect from "../../../clients/mongoose";
// export API handler
// @see https://trpc.io/docs/server/adapters
export default trpcNext.createNextApiHandler({
    router: appRouter,
    createContext: async () => {
        const mongooseClient = await mongooseConnect();

        return { mongooseClient };
    },
});
