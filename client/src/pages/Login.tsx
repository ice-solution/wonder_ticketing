import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { trpc } from "@/lib/trpc";
import { PageLoader } from "@/components/loading/SaasLoading";

function loginRedirectPath(): string {
  const params = new URLSearchParams(window.location.search);
  const raw = params.get("redirect");
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/dashboard";
  return raw;
}

export function Login() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const providers = trpc.auth.providers.useQuery();
  const [email, setEmail] = useState("organizer@wonder.hk");
  const [name, setName] = useState("Demo Organizer");
  const [error, setError] = useState("");

  useEffect(() => {
    const authError = new URLSearchParams(window.location.search).get("auth_error");
    if (authError === "sso_domain") setError(t("login.ssoDomainError"));
    else if (authError) setError(t("login.failed"));
  }, [t]);

  const redirectAfterLogin = encodeURIComponent(window.location.origin + loginRedirectPath());

  const devLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch("/api/dev/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, name: name || undefined }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError((body as { error?: string }).error ?? t("login.failed"));
        return;
      }
      await utils.auth.me.invalidate();
      setLocation(loginRedirectPath());
    } catch {
      setError(t("login.networkError"));
    }
  };

  if (providers.isLoading) {
    return (
      <div className="mx-auto max-w-md">
        <PageLoader />
      </div>
    );
  }

  return (
    <div className="dash-login-card">
      <h1>{t("login.title")}</h1>
      <p className="text-sm text-wonder-muted mb-6">{t("appName")}</p>

      <div className="space-y-3 mb-6">
        {providers.data?.sso?.enabled && (
          <a
            href={`/api/auth/sso?redirect=${redirectAfterLogin}`}
            className="flex items-center justify-center gap-2 w-full rounded-lg border-2 border-wonder-primary/20 bg-wonder-primary/5 py-2.5 text-sm font-medium text-wonder-primary hover:bg-wonder-primary/10"
          >
            {providers.data.sso.label}
          </a>
        )}
        {providers.data?.google && (
          <a
            href={`/api/auth/google?redirect=${redirectAfterLogin}`}
            className="flex items-center justify-center gap-2 w-full rounded-lg border py-2.5 text-sm font-medium hover:bg-slate-50"
          >
            {t("login.google")}
          </a>
        )}
        {providers.data?.facebook && (
          <a
            href={`/api/auth/facebook?redirect=${redirectAfterLogin}`}
            className="flex items-center justify-center gap-2 w-full rounded-lg border py-2.5 text-sm font-medium hover:bg-slate-50"
          >
            {t("login.facebook")}
          </a>
        )}
      </div>

      {providers.data?.devLogin && (
        <>
          <p className="text-center text-xs text-slate-400 mb-4">{t("login.orDev")}</p>
          <form onSubmit={devLogin} className="space-y-3 rounded-xl border bg-white p-4">
            <label className="block text-sm">
              Email
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded border px-3 py-2"
              />
            </label>
            <label className="block text-sm">
              {t("checkout.name")} ({t("common.optional")})
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded border px-3 py-2"
              />
            </label>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button type="submit" className="w-full rounded-lg bg-wonder-primary py-2 text-white">
              {t("login.devSubmit")}
            </button>
          </form>
        </>
      )}

      {providers.isFetched &&
        !providers.data?.sso?.enabled &&
        !providers.data?.google &&
        !providers.data?.facebook &&
        !providers.data?.devLogin && (
          <p className="text-slate-500 text-sm">{t("login.notConfigured")}</p>
        )}

      <p className="mt-6 text-center text-sm">
        <Link href="/" className="text-wonder-primary underline">
          {t("common.back")}
        </Link>
      </p>
    </div>
  );
}
