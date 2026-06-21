import { useTranslation } from "react-i18next";
import "@/styles/saas-loading.css";

type LineProps = {
  className?: string;
  tall?: boolean;
};

function Line({ className = "w60", tall }: LineProps) {
  return (
    <div
      className={`saas-skeleton-line saas-shimmer ${tall ? "tall" : ""} ${className}`}
      aria-hidden
    />
  );
}

export function PageLoader({ label }: { label?: string }) {
  const { t } = useTranslation();
  return (
    <div className="saas-page-loader" role="status" aria-live="polite">
      <div className="saas-spinner" aria-hidden />
      <span className="saas-page-loader-label">{label ?? t("common.loading")}</span>
    </div>
  );
}

export function CheckoutSkeleton() {
  return (
    <div className="mx-auto max-w-2xl animate-pulse" aria-hidden>
      <div className="saas-skeleton-line saas-shimmer w40 mb-6 h-7 rounded-md" />
      <div className="saas-skeleton-line saas-shimmer w60 mb-6 h-4" />
      <div className="saas-skeleton-card mb-6">
        <div className="saas-skeleton-stack">
          <Line className="w40" />
          <Line className="w80" />
          <Line className="w60" />
        </div>
      </div>
      <div className="saas-skeleton-card">
        <div className="saas-skeleton-stack">
          <Line className="w40" />
          <Line className="w80" />
          <Line className="w80" />
          <Line className="w80" />
          <div className="saas-skeleton-line saas-shimmer w-full h-11 rounded-lg mt-2" />
        </div>
      </div>
    </div>
  );
}

export function OrderSkeleton() {
  return (
    <div className="mx-auto max-w-lg saas-skeleton-card animate-pulse" aria-hidden>
      <div className="saas-skeleton-stack">
        <Line className="w60" />
        <Line className="w40" />
        <div className="rounded-lg bg-slate-50 p-3 mt-2">
          <div className="saas-skeleton-stack">
            <Line className="w80" />
            <Line className="w60" />
            <Line className="w40" />
          </div>
        </div>
        <Line className="w40" />
        <Line className="w20" />
        <div className="flex gap-4 mt-2">
          <div className="saas-skeleton-line saas-shimmer tall w-28 rounded-lg" />
          <div className="saas-skeleton-stack flex-1">
            <Line className="w80" />
            <Line className="w40" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function TicketListSkeleton() {
  return (
    <div className="space-y-3 animate-pulse" aria-hidden>
      <div className="saas-skeleton-line saas-shimmer w40 h-7 rounded-md mb-6" />
      {[1, 2].map((i) => (
        <div key={i} className="saas-skeleton-card">
          <div className="saas-skeleton-stack">
            <Line className="w60" />
            <Line className="w40" />
            <div className="flex gap-4 mt-2">
              <div className="saas-skeleton-line saas-shimmer tall w-28 rounded-lg" />
              <div className="saas-skeleton-stack flex-1">
                <Line className="w80" />
                <Line className="w40" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function OrderListSkeleton() {
  return (
    <ul className="space-y-2 animate-pulse" aria-hidden>
      {[1, 2, 3, 4].map((i) => (
        <li key={i} className="rounded border bg-white p-3">
          <div className="saas-skeleton-line saas-shimmer w80 h-4" />
        </li>
      ))}
    </ul>
  );
}
