import { useState, useMemo } from "react";
import { Link, useParams, useSearch } from "wouter";
import { useTranslation } from "react-i18next";
import { trpc } from "@/lib/trpc";
import { eventDescription, eventTitle, formatEventDate, formatMoney } from "@/lib/eventText";
import { EventBanner } from "@/components/EventBanner";
import { WaitlistJoin } from "@/components/WaitlistJoin";
import { DonationWidget } from "@/components/DonationWidget";
import { EventChat } from "@/components/EventChat";
import { TrackingPixels } from "@/components/TrackingPixels";
import { syncInviteFromSearch, getEventInvite } from "@/lib/eventInvite";
import { PageLoader } from "@/components/loading/SaasLoading";
import { NumberInput } from "@/components/NumberInput";

export function EventPage() {
  const { slug } = useParams<{ slug: string }>();
  const search = useSearch();
  const { t, i18n } = useTranslation();

  const inviteToken = useMemo(() => {
    if (!slug) return undefined;
    return syncInviteFromSearch(slug, search) ?? getEventInvite(slug);
  }, [slug, search]);

  const { data: event, error, isLoading, isFetched, isError } = trpc.event.getBySlug.useQuery(
    { slug: slug!, inviteToken },
    { enabled: !!slug }
  );
  const { data: types } = trpc.event.getTicketTypes.useQuery(
    { eventId: String(event?._id), inviteToken },
    { enabled: !!event?._id }
  );
  const { data: checkoutQuestions } = trpc.question.listForCheckout.useQuery(
    { eventId: String(event?._id) },
    { enabled: !!event?._id }
  );

  const [qty, setQty] = useState<Record<string, number>>({});

  if (error && (isError || isFetched)) {
    const isPrivate = error.message.includes("私人");
    const isMembersOnly = error.message.includes("Pro") || error.message.includes("會員");
    return (
      <div className="rounded-xl bg-amber-50 p-6 text-amber-900">
        <p>{isPrivate ? t("event.privateOnly") : isMembersOnly ? t("event.membersOnly") : error.message}</p>
        {isPrivate && (
          <p className="mt-2 text-sm text-amber-800">{t("invite.needLink")}</p>
        )}
        {!isPrivate && (
          <div className="mt-3 flex flex-wrap gap-3 text-sm">
            <Link href="/login" className="text-wonder-primary underline">
              {t("nav.login")}
            </Link>
            <Link href="/dashboard/subscription" className="text-wonder-primary underline">
              {t("subscription.upgrade", { price: 460 })}
            </Link>
          </div>
        )}
        <Link href="/events" className="mt-4 inline-block text-slate-600 underline">
          {t("common.back")}
        </Link>
      </div>
    );
  }

  if (isLoading) return <PageLoader />;

  if (isFetched && !event) {
    return (
      <div className="rounded-xl bg-slate-50 p-6 text-center">
        <p className="text-slate-600">{t("event.notFound")}</p>
        <Link href="/events" className="mt-2 inline-block text-wonder-primary underline">
          {t("nav.home")}
        </Link>
      </div>
    );
  }

  if (!event) return null;

  const ticketTypes = types ?? [];
  const availableTypes = ticketTypes.filter((tt) => tt.quantity - (tt.sold ?? 0) > 0);
  const allSoldOut = ticketTypes.length > 0 && availableTypes.length === 0;
  const noTicketTypes = ticketTypes.length === 0;

  const cartPayload = availableTypes
    .filter((tt) => (qty[String(tt._id)] ?? 0) > 0)
    .map((tt) => ({ ticketTypeId: String(tt._id), quantity: qty[String(tt._id)] ?? 0 }));

  const refFromUrl = new URLSearchParams(search.startsWith("?") ? search : `?${search}`).get("ref");
  const checkoutHref =
    cartPayload.length > 0
      ? `/checkout/${event.slug}?cart=${encodeURIComponent(JSON.stringify(cartPayload))}${
          refFromUrl ? `&ref=${encodeURIComponent(refFromUrl)}` : ""
        }`
      : "#";

  return (
    <div>
      <EventBanner
        url={event.bannerUrl}
        title={eventTitle(event, i18n.language)}
        variant="hero"
      />
      <div className="grid gap-8 lg:grid-cols-5">
      <TrackingPixels metaPixelId={event.metaPixelId} googleAnalyticsId={event.googleAnalyticsId} />
      <div className="lg:col-span-3">
        <h1 className="text-3xl font-bold">{eventTitle(event, i18n.language)}</h1>
        {event.status === "draft" && (
          <p className="mt-2 rounded bg-amber-50 px-3 py-1 text-sm text-amber-800 inline-block">
            {t("eventEdit.statusDraft")} — {t("eventEdit.preview")}
          </p>
        )}
        <p className="mt-2 text-slate-600">
          {t("event.date")}: {formatEventDate(event.eventDate, i18n.language)}
        </p>
        <p className="text-slate-600">
          {t("event.venue")}: {event.venue}
        </p>
        <div
          className="prose prose-slate mt-4 max-w-none text-sm"
          dangerouslySetInnerHTML={{
            __html: (eventDescription(event, i18n.language) || "").replace(/\n/g, "<br/>"),
          }}
        />
        {event.enableDonation && (
          <DonationWidget eventId={String(event._id)} eventTitle={event.title} />
        )}
        <EventChat eventId={String(event._id)} />
      </div>
      <div className="lg:col-span-2">
        <div className="sticky top-24 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-4 font-semibold">{t("event.buy")}</h2>
          {(checkoutQuestions?.length ?? 0) > 0 && (
            <p className="mb-3 text-xs text-slate-500 rounded-lg bg-slate-50 px-3 py-2">
              {t("event.checkoutQuestionsHint", { count: checkoutQuestions!.length })}
            </p>
          )}
          {noTicketTypes ? (
            <p className="text-slate-500">{t("event.noTickets")}</p>
          ) : allSoldOut ? (
            <WaitlistJoin eventId={String(event._id)} />
          ) : (
            <ul className="space-y-3">
              {availableTypes.map((tt) => {
                const id = String(tt._id);
                const available = tt.quantity - (tt.sold ?? 0);
                return (
                  <li key={id} className="flex items-center justify-between gap-2 border-b pb-3">
                    <div>
                      <p className="font-medium">{tt.name}</p>
                      <p className="text-sm text-wonder-primary">
                        {formatMoney(tt.price, "HKD", i18n.language)}
                      </p>
                    </div>
                    <NumberInput
                      min={0}
                      max={Math.min(10, available)}
                      value={qty[id] ?? 0}
                      onChange={(n) =>
                        setQty((prev) => ({ ...prev, [id]: n }))
                      }
                      className="w-16 rounded border px-2 py-1 text-center"
                    />
                  </li>
                );
              })}
            </ul>
          )}
          {cartPayload.length > 0 ? (
            <Link
              href={checkoutHref}
              className="mt-4 block w-full rounded-lg bg-wonder-primary py-3 text-center font-medium text-white"
            >
              {t("event.buy")} ({cartPayload.reduce((s, l) => s + l.quantity, 0)})
            </Link>
          ) : availableTypes.length > 0 ? (
            <p className="mt-4 text-center text-sm text-slate-400">{t("event.selectQty")}</p>
          ) : null}
        </div>
      </div>
      </div>
    </div>
  );
}
