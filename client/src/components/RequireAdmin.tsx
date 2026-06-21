import { useEffect } from "react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { trpc } from "@/lib/trpc";
import { PageLoader } from "@/components/loading/SaasLoading";

export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const { data: me, isLoading } = trpc.auth.me.useQuery(undefined, { retry: false });

  useEffect(() => {
    if (!isLoading && me && me.role !== "admin") {
      setLocation("/dashboard");
    }
  }, [isLoading, me, setLocation]);

  if (isLoading || !me) {
    return <PageLoader label={t("common.loading")} />;
  }

  if (me.role !== "admin") {
    return null;
  }

  return <>{children}</>;
}
