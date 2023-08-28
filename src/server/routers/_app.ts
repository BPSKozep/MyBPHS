import { router } from "server/trpc";

import userRouter from "./user.router";
import groupRouter from "./group.router";

export const appRouter = router({
    user: userRouter,
    group: groupRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
