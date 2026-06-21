import { useTranslation } from "react-i18next";

const PAGE_SIZE_OPTIONS = [10, 15, 20, 30] as const;

export function AdminPagination({
  page,
  limit,
  total,
  onPageChange,
  onLimitChange,
}: {
  page: number;
  limit: number;
  total: number;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
}) {
  const { t } = useTranslation();
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4 text-sm text-slate-600">
      <p>
        {t("admin.pagination.showing", { from, to, total })}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {onLimitChange && (
          <label className="flex items-center gap-2">
            <span className="text-xs text-slate-500">{t("admin.pagination.perPage")}</span>
            <select
              value={limit}
              onChange={(e) => {
                onLimitChange(Number(e.target.value));
                onPageChange(1);
              }}
              className="rounded border px-2 py-1 text-xs"
            >
              {PAGE_SIZE_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        )}
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="rounded border px-3 py-1 text-xs disabled:opacity-40"
        >
          {t("admin.pagination.prev")}
        </button>
        <span className="text-xs font-mono px-1">
          {page} / {totalPages}
        </span>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="rounded border px-3 py-1 text-xs disabled:opacity-40"
        >
          {t("admin.pagination.next")}
        </button>
      </div>
    </div>
  );
}

export const ADMIN_DEFAULT_PAGE_SIZE = 15;
