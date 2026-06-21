import { useEffect, useState } from "react";
import { Link, useParams } from "wouter";
import { useTranslation } from "react-i18next";
import { trpc } from "@/lib/trpc";
import { DashboardLayout } from "./DashboardLayout";
import { TicketTypeManager } from "@/components/TicketTypeManager";
import { CohostManager } from "@/components/CohostManager";
import { DiscountManager } from "@/components/DiscountManager";
import { PeerReferralManager } from "@/components/PeerReferralManager";
import { SeatMapEditor } from "@/components/SeatMapEditor";
import { WaitlistManager } from "@/components/WaitlistManager";
import { SurveyManager } from "@/components/SurveyManager";
import { EventBannerUpload } from "@/components/EventBannerUpload";
import { CustomQuestionManager } from "@/components/CustomQuestionManager";
import { PrivateInvitePanel } from "@/components/PrivateInvitePanel";
import { EventReminderManager } from "@/components/EventReminderManager";
import { EventResponsesPanel } from "@/components/EventResponsesPanel";

function toLocalDatetime(d: Date | string) {
  const date = new Date(d);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function EventEdit() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const utils = trpc.useUtils();
  const { data: event, isLoading, error, isFetched } = trpc.event.getById.useQuery({ id: id! }, { enabled: !!id });

  const update = trpc.event.update.useMutation({
    onSuccess: () => utils.event.getById.invalidate({ id: id! }),
  });
  const duplicate = trpc.event.duplicate.useMutation();

  const [title, setTitle] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [description, setDescription] = useState("");
  const [venue, setVenue] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private" | "members_only">("public");
  const [enableDonation, setEnableDonation] = useState(false);
  const [metaPixelId, setMetaPixelId] = useState("");
  const [googleAnalyticsId, setGoogleAnalyticsId] = useState("");
  const [enableEmbedWidget, setEnableEmbedWidget] = useState(true);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);

  const generateCopy = trpc.ai.generateEventCopy.useMutation({
    onSuccess: (copy) => {
      setDescription(copy.description);
      utils.event.getById.invalidate({ id: id! });
    },
  });

  useEffect(() => {
    if (!event) return;
    setTitle(event.title);
    setTitleEn(event.titleEn ?? "");
    setDescription(event.description ?? "");
    setVenue(event.venue);
    setEventDate(toLocalDatetime(event.eventDate));
    setVisibility(event.visibility as typeof visibility);
    setEnableDonation(!!event.enableDonation);
    setMetaPixelId(event.metaPixelId ?? "");
    setGoogleAnalyticsId(event.googleAnalyticsId ?? "");
    setEnableEmbedWidget(event.enableEmbedWidget !== false);
    setBannerUrl(event.bannerUrl ?? null);
  }, [event]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <p>{t("common.loading")}</p>
      </DashboardLayout>
    );
  }

  if (error || (isFetched && !event)) {
    return (
      <DashboardLayout>
        <p className="text-red-600">{t("event.notFound")}</p>
        <Link href="/dashboard" className="mt-2 inline-block text-wonder-primary underline">
          {t("common.back")}
        </Link>
      </DashboardLayout>
    );
  }

  if (!event) return null;

  const publish = () => update.mutate({ id: id!, status: "published" });

  return (
    <DashboardLayout>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h1 className="text-2xl font-bold">{t("eventEdit.title")}</h1>
        <div className="flex gap-2">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm">{event.status}</span>
          {event.status === "draft" && (
            <button type="button" onClick={publish} className="rounded-lg bg-green-600 px-3 py-1 text-sm text-white">
              {t("eventEdit.publish")}
            </button>
          )}
          <Link href={`/event/${event.slug}`} className="text-sm text-wonder-primary underline">
            {t("eventEdit.preview")}
          </Link>
        </div>
      </div>

      <div className="max-w-2xl mb-6 rounded-xl border bg-white p-6">
        <EventBannerUpload
          eventId={id!}
          bannerUrl={bannerUrl}
          onUpdated={(url) => {
            setBannerUrl(url);
            utils.event.getById.invalidate({ id: id! });
          }}
        />
      </div>

      <form
        className="max-w-2xl space-y-4 rounded-xl border bg-white p-6"
        onSubmit={(e) => {
          e.preventDefault();
          update.mutate({
            id: id!,
            title,
            titleEn: titleEn || undefined,
            description,
            venue,
            eventDate: new Date(eventDate),
            visibility,
            enableDonation,
            metaPixelId: metaPixelId || undefined,
            googleAnalyticsId: googleAnalyticsId || undefined,
            enableEmbedWidget,
          });
        }}
      >
        <div className="flex flex-wrap gap-2 mb-2">
          <button
            type="button"
            onClick={() => generateCopy.mutate({ eventId: id!, locale: "zh-TW" })}
            disabled={generateCopy.isPending}
            className="text-sm rounded border px-3 py-1 text-wonder-primary"
          >
            {t("ai.generate")}
          </button>
          {event.enableEmbedWidget !== false && (
            <a
              href={`/embed/${event.slug}`}
              target="_blank"
              rel="noreferrer"
              className="text-sm rounded border px-3 py-1 text-slate-600"
            >
              {t("embed.preview")}
            </a>
          )}
        </div>
        <label className="block text-sm">
          標題（中）
          <input required value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 w-full border rounded px-3 py-2" />
        </label>
        <label className="block text-sm">
          Title (EN)
          <input value={titleEn} onChange={(e) => setTitleEn(e.target.value)} className="mt-1 w-full border rounded px-3 py-2" />
        </label>
        <label className="block text-sm">
          {t("eventEdit.description")}
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="mt-1 w-full border rounded px-3 py-2" />
        </label>
        <label className="block text-sm">
          {t("event.venue")}
          <input required value={venue} onChange={(e) => setVenue(e.target.value)} className="mt-1 w-full border rounded px-3 py-2" />
        </label>
        <label className="block text-sm">
          {t("event.date")}
          <input type="datetime-local" required value={eventDate} onChange={(e) => setEventDate(e.target.value)} className="mt-1 w-full border rounded px-3 py-2" />
        </label>
        <label className="block text-sm">
          {t("eventEdit.visibility")}
          <select value={visibility} onChange={(e) => setVisibility(e.target.value as typeof visibility)} className="mt-1 w-full border rounded px-3 py-2">
            <option value="public">Public</option>
            <option value="private">Private</option>
            <option value="members_only">Members only (Pro)</option>
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={enableDonation} onChange={(e) => setEnableDonation(e.target.checked)} />
          {t("eventEdit.enableDonation")}
        </label>
        <fieldset className="rounded border p-3 space-y-2 text-sm">
          <legend className="px-1 font-medium">{t("tracking.title")}</legend>
          <label className="block">
            Meta Pixel ID
            <input value={metaPixelId} onChange={(e) => setMetaPixelId(e.target.value)} className="mt-1 w-full border rounded px-2 py-1.5" />
          </label>
          <label className="block">
            Google Analytics ID
            <input value={googleAnalyticsId} onChange={(e) => setGoogleAnalyticsId(e.target.value)} className="mt-1 w-full border rounded px-2 py-1.5" />
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={enableEmbedWidget} onChange={(e) => setEnableEmbedWidget(e.target.checked)} />
            {t("embed.enable")}
          </label>
        </fieldset>
        <button type="submit" disabled={update.isPending} className="rounded-lg bg-wonder-primary px-4 py-2 text-white">
          {update.isPending ? t("common.loading") : t("common.save")}
        </button>
        {update.isSuccess && <p className="text-sm text-green-700">{t("eventEdit.saved")}</p>}
        {update.error && <p className="text-sm text-red-600">{update.error.message}</p>}
      </form>

      <PrivateInvitePanel
        eventId={id!}
        visibility={visibility}
        inviteUrl={(event as { inviteUrl?: string }).inviteUrl}
      />

      <TicketTypeManager eventId={id!} />
      <SeatMapEditor eventId={id!} />
      <CustomQuestionManager eventId={id!} />
      <DiscountManager eventId={id!} />
      <PeerReferralManager eventId={id!} eventSlug={event.slug} />
      <WaitlistManager eventId={id!} />
      <SurveyManager eventId={id!} />
      <EventResponsesPanel eventId={id!} />
      <EventReminderManager eventId={id!} />
      <CohostManager eventId={id!} />

      <button
        type="button"
        className="mt-4 text-sm text-slate-500 underline"
        onClick={() => duplicate.mutate({ id: id! })}
      >
        {t("eventEdit.duplicate")}
      </button>
    </DashboardLayout>
  );
}
