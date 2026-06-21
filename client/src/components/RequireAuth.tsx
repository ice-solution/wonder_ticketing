import { useEffect } from "react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { trpc } from "@/lib/trpc";
import { PageLoader } from "@/components/loading/SaasLoading";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const [path, setLocation] = useLocation();
  const { data: me, isLoading, isError } = trpc.auth.me.useQuery(undefined, { retry: false });

  useEffect(() => {
    if (!isLoading && !me) {
      const redirect = encodeURIComponent(path || "/dashboard");
      setLocation(`/login?redirect=${redirect}`);
    }
  }, [isLoading, me, path, setLocation]);

  if (isLoading || isError || !me) {
    return <PageLoader label={t("common.loading")} />;
  }

  return <>{children}</>;
}
