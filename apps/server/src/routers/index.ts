import {
  publicProcedure,
  router,
} from "../lib/trpc";
import { todoRouter } from "./todo";

export const appRouter = router({
  healthCheck: publicProcedure.query(() => {
    return "OK";
  }),
  todo: todoRouter,
});
export type AppRouter = typeof appRouter;
