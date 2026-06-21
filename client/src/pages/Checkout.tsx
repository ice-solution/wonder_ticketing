import { useEffect, useMemo, useState } from "react";
import { useSearch } from "wouter";
import { useTranslation } from "react-i18next";
import { trpc } from "@/lib/trpc";
import { SeatMapPicker } from "@/components/SeatMapPicker";
import { assignSeatsToCart, cartTicketCount, parseCart, type CartLine } from "@/lib/cart";
import { computeCartSummary } from "@/lib/cartSummary";
import { formatMoney } from "@/lib/eventText";
import { CheckoutCustomQuestions } from "@/components/CustomQuestionManager";
import { getEventInvite } from "@/lib/eventInvite";
import { CheckoutSkeleton } from "@/components/loading/SaasLoading";

type Attendee = { name: string; email?: string; phone?: string };

function buildAttendeesForCart(
  cart: CartLine[],
  buyer: Attendee,
  groupAttendees: Record<string, Attendee[]>
): CartLine[] {
  return cart.map((line) => {
    const extra = groupAttendees[line.ticketTypeId];
    if (!extra?.length || line.quantity <= 1) return line;
    return { ...line, attendees: extra.slice(0, line.quantity) };
  });
}

export function Checkout() {
  const search = useSearch();
  const { t, i18n } = useTranslation();

  const slug = window.location.pathname.split("/checkout/")[1]?.split("?")[0] ?? "";
  const inviteToken = slug ? getEventInvite(slug) : undefined;
  const {
    data: event,
    isLoading: eventLoading,
    error: eventError,
    isFetched: eventFetched,
  } = trpc.event.getBySlug.useQuery({ slug, inviteToken }, { enabled: !!slug });
  const cart = useMemo(() => parseCart(search.startsWith("?") ? search : `?${search}`), [search]);
  const ticketCount = cartTicketCount(cart);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [discountCode, setDiscountCode] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"fps" | "payme" | "wechat" | "alipay" | "card">(
    "fps"
  );
  const { data: types } = trpc.event.getTicketTypes.useQuery(
    { eventId: String(event?._id), inviteToken },
    { enabled: !!event?._id }
  );

  const [groupAttendees, setGroupAttendees] = useState<Record<string, Attendee[]>>({});
  const [customAnswers, setCustomAnswers] = useState<Record<string, string>>({});
  const [reservation, setReservation] = useState<{
    reservationId: string;
    seatNumbers: string[];
    expiresAt: Date;
  } | null>(null);

  const checkout = trpc.order.checkout.useMutation({
    onSuccess: (res) => {
      window.location.href = res.paymentUrl;
    },
  });

  const release = trpc.seat.release.useMutation();

  useEffect(() => {
    return () => {
      if (reservation?.reservationId) {
        release.mutate({ reservationId: reservation.reservationId });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const validateDiscount = trpc.discount.validate.useQuery(
    { code: discountCode, eventId: String(event?._id) },
    { enabled: !!event?._id && discountCode.length >= 2 }
  );

  useEffect(() => {
    const params = new URLSearchParams(search.startsWith("?") ? search : `?${search}`);
    const ref = params.get("ref");
    if (ref) setReferralCode(ref.toUpperCase());
  }, [search]);

  const summary = useMemo(() => {
    if (!types) return null;
    const discount = validateDiscount.data?.valid ? validateDiscount.data.discount : null;
    return computeCartSummary(cart, types, discount);
  }, [cart, types, validateDiscount.data]);

  const afterDiscountSubtotal = summary ? Math.max(0, summary.subtotal - summary.discountAmount) : 0;

  const validatePeer = trpc.referral.validatePeerCode.useQuery(
    {
      code: referralCode,
      eventId: String(event?._id ?? ""),
      subtotal: afterDiscountSubtotal,
    },
    { enabled: !!event?._id && referralCode.length >= 2 && afterDiscountSubtotal > 0 }
  );

  const peerDiscount =
    validatePeer.data?.valid && validatePeer.data.discountAmount > 0
      ? validatePeer.data.discountAmount
      : 0;

  const checkoutTotal = summary ? Math.max(0, summary.total - peerDiscount) : 0;

  if (eventError && eventFetched) {
    return (
      <div className="mx-auto max-w-lg rounded-xl border bg-amber-50 p-6 text-amber-900">
        <p>{eventError.message}</p>
        <a href={`/event/${slug}`} className="mt-4 inline-block text-wonder-primary underline">
          {t("common.back")}
        </a>
      </div>
    );
  }

  if (eventLoading || !event) return <CheckoutSkeleton />;

  if (!cart.length) {
    return (
      <div className="mx-auto max-w-lg rounded-xl border bg-white p-6 text-center">
        <p className="text-slate-600">{t("checkout.emptyCart")}</p>
        <a href={`/event/${slug}`} className="mt-4 inline-block text-wonder-primary underline">
          {t("common.back")}
        </a>
      </div>
    );
  }

  const needsSeats = !!event.enableSeating && ticketCount > 0;
  const seatsReady = !needsSeats || !!reservation;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const baseItems = needsSeats && reservation
      ? assignSeatsToCart(cart, reservation.seatNumbers)
      : cart;
    const items = buildAttendeesForCart(baseItems, { name, email, phone }, groupAttendees);

    checkout.mutate({
      eventId: String(event._id),
      buyerName: name,
      buyerEmail: email,
      buyerPhone: phone,
      items,
      discountCode: validateDiscount.data?.valid ? discountCode : undefined,
      referralCode: validatePeer.data?.valid ? referralCode : undefined,
      paymentMethod,
      origin: window.location.origin,
      locale: (localStorage.getItem("locale") === "en" ? "en" : "zh-TW") as "zh-TW" | "en",
      reservationId: reservation?.reservationId,
      customAnswers: Object.entries(customAnswers)
        .filter(([, v]) => v.trim())
        .map(([questionId, answer]) => ({ questionId, answer })),
      inviteToken,
    });
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold">{t("checkout.title")}</h1>
      <p className="mb-4 text-slate-600">{event.title}</p>

      {summary && (
        <div className="mb-6 rounded-xl border bg-slate-50 p-4 text-sm">
          <h2 className="mb-3 font-semibold">{t("checkout.summary")}</h2>
          <ul className="space-y-2">
            {summary.lines.map((line) => (
              <li key={line.ticketTypeId} className="flex justify-between gap-2">
                <span>
                  {line.name} × {line.quantity}
                </span>
                <span>{formatMoney(line.subtotal, "HKD", i18n.language)}</span>
              </li>
            ))}
          </ul>
          {summary.discountAmount > 0 && (
            <p className="mt-2 flex justify-between text-green-700">
              <span>{t("checkout.discount")}</span>
              <span>-{formatMoney(summary.discountAmount, "HKD", i18n.language)}</span>
            </p>
          )}
          {peerDiscount > 0 && (
            <p className="mt-2 flex justify-between text-green-700">
              <span>{t("checkout.peerReferral")}</span>
              <span>-{formatMoney(peerDiscount, "HKD", i18n.language)}</span>
            </p>
          )}
          <p className="mt-3 flex justify-between border-t pt-3 font-semibold">
            <span>{t("checkout.total")}</span>
            <span className="text-wonder-primary">
              {formatMoney(checkoutTotal, "HKD", i18n.language)}
            </span>
          </p>
        </div>
      )}

      {needsSeats && (
        <div className="mb-6">
          <SeatMapPicker
            eventId={String(event._id)}
            requiredCount={ticketCount}
            onReserved={setReservation}
          />
          {reservation && (
            <p className="mt-2 text-sm text-slate-500">
              {t("seat.holdUntil")}: {reservation.expiresAt.toLocaleTimeString()}
              {" · "}
              {reservation.seatNumbers.join(", ")}
            </p>
          )}
        </div>
      )}

      <form onSubmit={submit} className="space-y-4 rounded-xl border bg-white p-6">
        <label className="block">
          <span className="text-sm text-slate-600">{t("checkout.name")}</span>
          <input required value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded border px-3 py-2" />
        </label>
        <label className="block">
          <span className="text-sm text-slate-600">{t("checkout.email")}</span>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded border px-3 py-2" />
        </label>
        <label className="block">
          <span className="text-sm text-slate-600">{t("checkout.phone")}</span>
          <input required value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 w-full rounded border px-3 py-2" />
        </label>

        {cart
          .filter((line) => line.quantity > 1)
          .map((line) => {
            const typeName =
              types?.find((tt) => String(tt._id) === line.ticketTypeId)?.name ?? line.ticketTypeId;
            const rows = groupAttendees[line.ticketTypeId] ?? Array.from({ length: line.quantity }, () => ({
              name: "",
              email: "",
              phone: "",
            }));
            return (
              <fieldset key={line.ticketTypeId} className="rounded border p-3 space-y-2">
                <legend className="text-sm font-medium px-1">
                  {t("checkout.groupAttendees", { name: typeName, count: line.quantity })}
                </legend>
                {Array.from({ length: line.quantity }, (_, i) => (
                  <div key={i} className="grid gap-2 sm:grid-cols-3">
                    <input
                      required
                      placeholder={`${t("checkout.attendee")} ${i + 1} · ${t("checkout.name")}`}
                      value={rows[i]?.name ?? ""}
                      onChange={(e) => {
                        const next = [...rows];
                        next[i] = { ...next[i], name: e.target.value };
                        setGroupAttendees((g) => ({ ...g, [line.ticketTypeId]: next }));
                      }}
                      className="rounded border px-2 py-1.5 text-sm"
                    />
                    <input
                      type="email"
                      placeholder={t("checkout.email")}
                      value={rows[i]?.email ?? ""}
                      onChange={(e) => {
                        const next = [...rows];
                        next[i] = { ...next[i], email: e.target.value };
                        setGroupAttendees((g) => ({ ...g, [line.ticketTypeId]: next }));
                      }}
                      className="rounded border px-2 py-1.5 text-sm"
                    />
                    <input
                      placeholder={t("checkout.phone")}
                      value={rows[i]?.phone ?? ""}
                      onChange={(e) => {
                        const next = [...rows];
                        next[i] = { ...next[i], phone: e.target.value };
                        setGroupAttendees((g) => ({ ...g, [line.ticketTypeId]: next }));
                      }}
                      className="rounded border px-2 py-1.5 text-sm"
                    />
                  </div>
                ))}
              </fieldset>
            );
          })}

        <CheckoutCustomQuestions
          eventId={String(event._id)}
          answers={customAnswers}
          onChange={setCustomAnswers}
        />

        <label className="block">
          <span className="text-sm text-slate-600">{t("checkout.peerReferral")}</span>
          <input
            value={referralCode}
            onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
            placeholder={t("checkout.peerReferralPlaceholder")}
            className="mt-1 w-full rounded border px-3 py-2 font-mono"
          />
          {validatePeer.data?.valid && (
            <span className="text-xs text-green-600">
              ✓ {validatePeer.data.label}
            </span>
          )}
        </label>
        <label className="block">
          <span className="text-sm text-slate-600">{t("checkout.discount")}</span>
          <input value={discountCode} onChange={(e) => setDiscountCode(e.target.value)} className="mt-1 w-full rounded border px-3 py-2" />
          {validateDiscount.data?.valid && (
            <span className="text-xs text-green-600">✓ {t("checkout.apply")}</span>
          )}
        </label>
        <label className="block">
          <span className="text-sm text-slate-600">{t("checkout.paymentMethod")}</span>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as typeof paymentMethod)}
            className="mt-1 w-full rounded border px-3 py-2"
          >
            <option value="fps">FPS</option>
            <option value="payme">PayMe</option>
            <option value="wechat">WeChat Pay</option>
            <option value="alipay">Alipay</option>
            <option value="card">Card</option>
          </select>
        </label>
        {checkout.error && (
          <p className="text-sm text-red-600">{checkout.error.message}</p>
        )}
        <button
          type="submit"
          disabled={checkout.isPending || !cart.length || !seatsReady}
          className="w-full rounded-lg bg-wonder-primary py-3 text-white disabled:opacity-50"
        >
          {t("checkout.pay")}
        </button>
      </form>
    </div>
  );
}
