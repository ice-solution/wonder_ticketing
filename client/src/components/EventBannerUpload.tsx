import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { trpc } from "@/lib/trpc";

const ACCEPT = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
type AcceptMime = (typeof ACCEPT)[number];

function readFileAsBase64(file: File): Promise<{ mimeType: AcceptMime; dataBase64: string }> {
  return new Promise((resolve, reject) => {
    if (!ACCEPT.includes(file.type as AcceptMime)) {
      reject(new Error("INVALID_TYPE"));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      reject(new Error("TOO_LARGE"));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const comma = result.indexOf(",");
      if (comma === -1) {
        reject(new Error("READ_FAILED"));
        return;
      }
      resolve({
        mimeType: file.type as AcceptMime,
        dataBase64: result.slice(comma + 1),
      });
    };
    reader.onerror = () => reject(new Error("READ_FAILED"));
    reader.readAsDataURL(file);
  });
}

export function EventBannerUpload({
  eventId,
  bannerUrl,
  onUpdated,
}: {
  eventId: string;
  bannerUrl?: string | null;
  onUpdated: (url: string | null) => void;
}) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");

  const upload = trpc.event.uploadBanner.useMutation({
    onSuccess: (res) => {
      setError("");
      onUpdated(res.bannerUrl);
    },
    onError: (err) => setError(err.message),
  });

  const remove = trpc.event.removeBanner.useMutation({
    onSuccess: () => {
      setError("");
      onUpdated(null);
    },
    onError: (err) => setError(err.message),
  });

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError("");
    try {
      const { mimeType, dataBase64 } = await readFileAsBase64(file);
      upload.mutate({ eventId, mimeType, dataBase64 });
    } catch (err) {
      const code = (err as Error).message;
      if (code === "TOO_LARGE") setError(t("eventEdit.bannerTooLarge"));
      else if (code === "INVALID_TYPE") setError(t("eventEdit.bannerInvalidType"));
      else setError(t("common.error"));
    }
  };

  const busy = upload.isPending || remove.isPending;

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">{t("eventEdit.banner")}</p>
      {bannerUrl ? (
        <div className="relative overflow-hidden rounded-lg border bg-slate-50">
          <img
            src={bannerUrl}
            alt=""
            className="max-h-48 w-full object-cover"
          />
        </div>
      ) : (
        <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-400">
          {t("eventEdit.bannerEmpty")}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT.join(",")}
          className="hidden"
          onChange={onFileChange}
        />
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="rounded-lg border px-3 py-1.5 text-sm text-wonder-primary disabled:opacity-50"
        >
          {bannerUrl ? t("eventEdit.bannerReplace") : t("eventEdit.bannerUpload")}
        </button>
        {bannerUrl && (
          <button
            type="button"
            disabled={busy}
            onClick={() => remove.mutate({ eventId })}
            className="rounded-lg border px-3 py-1.5 text-sm text-red-600 disabled:opacity-50"
          >
            {t("eventEdit.bannerRemove")}
          </button>
        )}
      </div>
      <p className="text-xs text-slate-400">{t("eventEdit.bannerHint")}</p>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {busy && <p className="text-sm text-slate-500">{t("common.loading")}</p>}
    </div>
  );
}
