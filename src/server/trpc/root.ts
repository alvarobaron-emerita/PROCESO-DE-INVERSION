import {
  createCallerFactory,
  createTRPCRouter,
} from "~/server/trpc/main";
import { tool1Router } from "./routers/tool1";
import { tool2Router } from "./routers/tool2";

export const appRouter = createTRPCRouter({
  tool1: tool1Router,
  tool2: tool2Router,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
