import { publicProcedure, router } from "../_core/trpc.js";
import { getSocialLoginStatus } from "../_core/socialAuth.js";
import { getEnterpriseSsoStatus } from "../_core/enterpriseSso.js";

export const authRouter = router({
  me: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user) return null;
    return {
      _id: String(ctx.user._id),
      name: ctx.user.name,
      email: ctx.user.email,
      plan: ctx.user.plan,
      role: ctx.user.role,
    };
  }),

  providers: publicProcedure.query(() => ({
    ...getSocialLoginStatus(),
    sso: getEnterpriseSsoStatus(),
  })),
});
