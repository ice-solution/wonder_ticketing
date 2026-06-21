import { useState } from "react";
import { useTranslation } from "react-i18next";
import { trpc } from "@/lib/trpc";

export function EventChat({ eventId }: { eventId: string }) {
  const { t } = useTranslation();
  const [body, setBody] = useState("");
  const { data, refetch } = trpc.chat.list.useQuery(
    { eventId },
    { refetchInterval: 10_000 }
  );
  const send = trpc.chat.send.useMutation({
    onSuccess: () => {
      setBody("");
      void refetch();
    },
  });

  const messages = [...(data ?? [])].reverse();

  return (
    <div className="rounded-xl border bg-white p-4 mt-6">
      <h3 className="font-semibold mb-3">{t("chat.title")}</h3>
      <ul className="max-h-48 overflow-y-auto space-y-2 mb-3 text-sm">
        {messages.map((m) => (
          <li key={String(m._id)} className="rounded bg-slate-50 px-3 py-2">
            <p>{m.body}</p>
            <p className="text-xs text-slate-400 mt-1">
              {new Date(m.createdAt).toLocaleString()}
            </p>
          </li>
        ))}
        {!messages.length && <p className="text-slate-400 text-sm">{t("chat.empty")}</p>}
      </ul>
      <div className="flex gap-2">
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={t("chat.placeholder")}
          className="flex-1 border rounded px-3 py-2 text-sm"
        />
        <button
          type="button"
          disabled={!body.trim() || send.isPending}
          onClick={() => send.mutate({ eventId, body })}
          className="rounded-lg bg-wonder-primary px-4 text-white text-sm"
        >
          {t("chat.send")}
        </button>
      </div>
    </div>
  );
}
