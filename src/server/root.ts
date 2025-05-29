import { createCallerFactory, createTRPCRouter } from "@/server/trpc";

import { userRouter } from "@/server/routers/user.router";
import { groupRouter } from "@/server/routers/group.router";
import { menuRouter } from "@/server/routers/menu.router";
import { orderRouter } from "@/server/routers/order.router";
import { emailRouter } from "@/server/routers/email.router";
import { webhookRouter } from "@/server/routers/webhook.router";
import { adPasswordRouter } from "@/server/routers/adpassword.router";
import { kioskRouter } from "@/server/routers/kiosk.router";
import { paymentsRouter } from "@/server/routers/payments.router";

export const appRouter = createTRPCRouter({
    user: userRouter,
    group: groupRouter,
    menu: menuRouter,
    order: orderRouter,
    email: emailRouter,
    webhook: webhookRouter,
    adpassword: adPasswordRouter,
    kiosk: kioskRouter,
    payments: paymentsRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
