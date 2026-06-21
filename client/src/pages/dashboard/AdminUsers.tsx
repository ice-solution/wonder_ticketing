import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { trpc } from "@/lib/trpc";
import { AdminLayout } from "./AdminLayout";
import { AdminPagination, ADMIN_DEFAULT_PAGE_SIZE } from "@/components/AdminPagination";

export function AdminUsersPage() {
  const { t } = useTranslation();
  const { data: me } = trpc.auth.me.useQuery();
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"" | "user" | "admin">("");
  const [planFilter, setPlanFilter] = useState<"" | "free" | "pro">("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(ADMIN_DEFAULT_PAGE_SIZE);
  const utils = trpc.useUtils();

  useEffect(() => {
    setPage(1);
  }, [query, roleFilter, planFilter, limit]);

  const { data, isLoading } = trpc.admin.listUsers.useQuery({
    search: query || undefined,
    role: roleFilter || undefined,
    plan: planFilter || undefined,
    page,
    limit,
  });

  const updateUser = trpc.admin.updateUser.useMutation({
    onSuccess: () => void utils.admin.listUsers.invalidate(),
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;

  return (
    <AdminLayout>
      <div className="rounded-xl border bg-white p-4">
        <h2 className="font-semibold mb-3">{t("admin.usersTitle")}</h2>
        <p className="text-sm text-slate-500 mb-4">{t("admin.usersHint")}</p>

        <div className="flex flex-wrap gap-3 mb-4">
          <form
            className="flex gap-2 flex-1 min-w-[200px]"
            onSubmit={(e) => {
              e.preventDefault();
              setQuery(search.trim());
            }}
          >
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("admin.searchUsers")}
              className="flex-1 rounded border px-3 py-2 text-sm"
            />
            <button type="submit" className="rounded-lg bg-wonder-primary px-3 py-2 text-sm text-white">
              {t("home.searchBtn")}
            </button>
          </form>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as "" | "user" | "admin")}
            className="rounded border px-2 py-2 text-sm"
          >
            <option value="">{t("admin.allRoles")}</option>
            <option value="user">{t("admin.roleUser")}</option>
            <option value="admin">{t("admin.roleAdmin")}</option>
          </select>
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value as "" | "free" | "pro")}
            className="rounded border px-2 py-2 text-sm"
          >
            <option value="">{t("admin.allPlans")}</option>
            <option value="free">Free</option>
            <option value="pro">Pro</option>
          </select>
        </div>

        {isLoading ? (
          <p className="text-sm text-slate-500">{t("common.loading")}</p>
        ) : !items.length ? (
          <p className="text-sm text-slate-500">{t("admin.noUsers")}</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-slate-500">
                    <th className="py-2 pr-3">{t("admin.colUser")}</th>
                    <th className="py-2 pr-3">{t("admin.colRole")}</th>
                    <th className="py-2 pr-3">{t("admin.colPlan")}</th>
                    <th className="py-2 pr-3">{t("admin.colEvents")}</th>
                    <th className="py-2 pr-3">{t("admin.colActions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((u) => {
                    const isSelf = me?._id === String(u._id);
                    return (
                      <tr key={String(u._id)} className="border-b last:border-0">
                        <td className="py-3 pr-3">
                          <p className="font-medium">{u.name ?? "—"}</p>
                          <p className="text-xs text-slate-400">{u.email ?? u.openId}</p>
                        </td>
                        <td className="py-3 pr-3">
                          <select
                            value={u.role ?? "user"}
                            disabled={isSelf || updateUser.isPending}
                            onChange={(e) =>
                              updateUser.mutate({
                                userId: String(u._id),
                                role: e.target.value as "user" | "admin",
                              })
                            }
                            className="rounded border px-2 py-1 text-xs"
                          >
                            <option value="user">{t("admin.roleUser")}</option>
                            <option value="admin">{t("admin.roleAdmin")}</option>
                          </select>
                        </td>
                        <td className="py-3 pr-3">
                          <select
                            value={u.plan ?? "free"}
                            disabled={updateUser.isPending}
                            onChange={(e) =>
                              updateUser.mutate({
                                userId: String(u._id),
                                plan: e.target.value as "free" | "pro",
                              })
                            }
                            className="rounded border px-2 py-1 text-xs uppercase"
                          >
                            <option value="free">Free</option>
                            <option value="pro">Pro</option>
                          </select>
                        </td>
                        <td className="py-3 pr-3 text-slate-600">{u.eventCount ?? 0}</td>
                        <td className="py-3 pr-3">
                          {isSelf && <span className="text-xs text-slate-400">{t("admin.you")}</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <AdminPagination
              page={page}
              limit={limit}
              total={total}
              onPageChange={setPage}
              onLimitChange={setLimit}
            />
          </>
        )}
        {updateUser.error && (
          <p className="mt-3 text-sm text-red-600">{updateUser.error.message}</p>
        )}
      </div>
    </AdminLayout>
  );
}
