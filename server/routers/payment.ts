import { router, publicProcedure, protectedProcedure } from "../_core/trpc.js";
import { getPaymentStatus, testWonderConnection } from "../services/paymentConfig.js";

export const paymentRouter = router({
  status: publicProcedure.query(() => getPaymentStatus()),

  testConnection: protectedProcedure.query(async () => {
    if (process.env.NODE_ENV === "production") {
      return { ok: getPaymentStatus().configured, message: "Production 不執行 echo 測試" };
    }
    return testWonderConnection();
  }),
});
