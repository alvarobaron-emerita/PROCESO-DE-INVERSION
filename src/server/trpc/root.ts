import {
  createCallerFactory,
  createTRPCRouter,
} from "~/server/trpc/main";
import { tool1Router } from "./routers/tool1";

export const appRouter = createTRPCRouter({
  tool1: tool1Router,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
