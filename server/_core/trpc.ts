import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { Context } from "./context.js";
import { isActivePro } from "../../shared/access.js";
import type { FeatureKey } from "../../shared/features.js";
import { FEATURES } from "../../shared/features.js";

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "請先登入" });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "需要管理員權限" });
  }
  return next({ ctx });
});

export const proProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!isActivePro(ctx.user)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "此功能僅限 Pro 用戶使用",
    });
  }
  return next({ ctx });
});

export function requireFeature(plan: "free" | "pro", feature: FeatureKey): void {
  if (!FEATURES[feature][plan]) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "此功能需要 Pro 方案。升級後即可使用。",
    });
  }
}
