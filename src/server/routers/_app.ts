import { router } from "server/trpc";

import userRouter from "./user.router";
import groupRouter from "./group.router";
import menuRouter from "./menu.router";
import orderRouter from "./order.router";
import emailRouter from "./email.router";
import webhookRouter from "./webhook.router";
import adPasswordRouter from "./adpassword.router";
import kioskRouter from "./kiosk.router";
import fcmPushRouter from "./fcmpush.router";

export const appRouter = router({
    user: userRouter,
    group: groupRouter,
    menu: menuRouter,
    order: orderRouter,
    email: emailRouter,
    webhook: webhookRouter,
    adpassword: adPasswordRouter,
    kiosk: kioskRouter,
    fcmpush: fcmPushRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
