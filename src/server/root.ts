import { adRouter } from "@/server/routers/ad.router";
import { emailRouter } from "@/server/routers/email.router";
import { groupRouter } from "@/server/routers/group.router";
import { kioskRouter } from "@/server/routers/kiosk.router";
import { laptopRouter } from "@/server/routers/laptop.router";
import { menuRouter } from "@/server/routers/menu.router";
import { orderRouter } from "@/server/routers/order.router";
import { paymentsRouter } from "@/server/routers/payments.router";
import { userRouter } from "@/server/routers/user.router";
import { webhookRouter } from "@/server/routers/webhook.router";
import { createCallerFactory, createTRPCRouter } from "@/server/trpc";

export const appRouter = createTRPCRouter({
  user: userRouter,
  group: groupRouter,
  menu: menuRouter,
  order: orderRouter,
  email: emailRouter,
  webhook: webhookRouter,
  ad: adRouter,
  kiosk: kioskRouter,
  payments: paymentsRouter,
  laptop: laptopRouter,
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
