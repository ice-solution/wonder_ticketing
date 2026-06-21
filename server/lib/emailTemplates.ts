import { env } from "../_core/env.js";

export function clientBaseUrl(): string {
  return env.CLIENT_URL ?? "http://localhost:5173";
}

export function buildOrderConfirmationEmail(opts: {
  buyerName: string;
  eventTitle: string;
  orderNumber: string;
  ticketCodes: string[];
  eventDate?: Date;
  venue?: string;
}) {
  const orderUrl = `${clientBaseUrl()}/order/${opts.orderNumber}`;
  const ticketsUrl = `${clientBaseUrl()}/login?redirect=${encodeURIComponent("/my-tickets")}`;

  const text = [
    `您好 ${opts.buyerName}，`,
    "",
    `您已成功購買「${opts.eventTitle}」的門票。`,
    opts.eventDate ? `活動時間：${opts.eventDate.toLocaleString("zh-HK")}` : "",
    opts.venue ? `地點：${opts.venue}` : "",
    `訂單編號：${opts.orderNumber}`,
    `票券代碼：${opts.ticketCodes.join(", ")}`,
    "",
    `查看訂單：${orderUrl}`,
    `我的票券：${ticketsUrl}`,
    "",
    "請於活動當日出示 QR 碼或票券代碼入場。",
    "",
    "— Wonder Ticketing",
  ]
    .filter(Boolean)
    .join("\n");

  const ticketRows = opts.ticketCodes
    .map(
      (code) =>
        `<tr><td style="padding:8px 12px;border-bottom:1px solid #e5edf5;font-family:monospace;">${code}</td></tr>`
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="zh-Hant">
<body style="margin:0;background:#f6f9fc;font-family:-apple-system,BlinkMacSystemFont,sans-serif;color:#061b31;">
  <div style="max-width:560px;margin:24px auto;background:#fff;border:1px solid #e5edf5;border-radius:8px;overflow:hidden;">
    <div style="background:#533afd;color:#fff;padding:20px 24px;">
      <p style="margin:0;font-size:14px;opacity:0.9;">Wonder Ticketing</p>
      <h1 style="margin:8px 0 0;font-size:20px;font-weight:600;">購票確認</h1>
    </div>
    <div style="padding:24px;">
      <p style="margin:0 0 16px;">您好 ${opts.buyerName}，</p>
      <p style="margin:0 0 16px;">您已成功購買 <strong>${opts.eventTitle}</strong> 的門票。</p>
      ${
        opts.eventDate
          ? `<p style="margin:0 0 8px;color:#64748d;font-size:14px;">📅 ${opts.eventDate.toLocaleString("zh-HK")}</p>`
          : ""
      }
      ${
        opts.venue
          ? `<p style="margin:0 0 16px;color:#64748d;font-size:14px;">📍 ${opts.venue}</p>`
          : ""
      }
      <p style="margin:0 0 8px;font-size:14px;color:#64748d;">訂單編號</p>
      <p style="margin:0 0 20px;font-family:monospace;font-size:15px;">${opts.orderNumber}</p>
      <p style="margin:0 0 8px;font-size:14px;color:#64748d;">票券代碼</p>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">${ticketRows}</table>
      <a href="${orderUrl}" style="display:inline-block;background:#533afd;color:#fff;text-decoration:none;padding:12px 20px;border-radius:4px;font-size:14px;margin-right:8px;">查看訂單</a>
      <a href="${ticketsUrl}" style="display:inline-block;border:1px solid #533afd;color:#533afd;text-decoration:none;padding:11px 20px;border-radius:4px;font-size:14px;">我的票券</a>
      <p style="margin:24px 0 0;font-size:12px;color:#94a3b8;">請於活動當日出示 QR 碼或票券代碼入場。</p>
    </div>
  </div>
</body>
</html>`;

  return { text, html };
}

function applyReminderTemplate(
  template: string,
  vars: Record<string, string>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => vars[key] ?? "");
}

export function buildEventReminderEmail(opts: {
  buyerName: string;
  eventTitle: string;
  eventDate: Date;
  venue?: string;
  eventSlug: string;
  templateContent: string;
}) {
  const eventUrl = `${clientBaseUrl()}/event/${opts.eventSlug}`;
  const ticketsUrl = `${clientBaseUrl()}/login?redirect=${encodeURIComponent("/my-tickets")}`;
  const dateStr = opts.eventDate.toLocaleString("zh-HK");

  const defaultBody = [
    "您好 {{buyerName}}，",
    "",
    "提醒您即將參加「{{eventTitle}}」。",
    "活動時間：{{eventDate}}",
    opts.venue ? "地點：{{venue}}" : "",
    "",
    "活動詳情：{{eventUrl}}",
    "我的票券：{{ticketsUrl}}",
    "",
    "期待與您相見！",
    "— Wonder Ticketing",
  ]
    .filter(Boolean)
    .join("\n");

  const vars = {
    buyerName: opts.buyerName,
    eventTitle: opts.eventTitle,
    eventDate: dateStr,
    venue: opts.venue ?? "",
    eventUrl,
    ticketsUrl,
  };

  const raw = opts.templateContent.trim() || defaultBody;
  const text = applyReminderTemplate(raw, vars);

  const html = `<!DOCTYPE html>
<html lang="zh-Hant">
<body style="font-family:-apple-system,sans-serif;color:#061b31;background:#f6f9fc;margin:0;">
  <div style="max-width:520px;margin:24px auto;background:#fff;border:1px solid #e5edf5;border-radius:8px;overflow:hidden;">
    <div style="background:#533afd;color:#fff;padding:16px 20px;">
      <p style="margin:0;font-size:13px;opacity:0.9;">Wonder Ticketing</p>
      <h1 style="margin:6px 0 0;font-size:18px;">活動提醒</h1>
    </div>
    <div style="padding:20px;">
      <p style="margin:0 0 12px;">您好 ${opts.buyerName}，</p>
      <p style="margin:0 0 12px;white-space:pre-line;">${text.replace(/^您好 .+，\n\n/, "")}</p>
      <p style="margin:16px 0 8px;color:#64748d;font-size:14px;">📅 ${dateStr}</p>
      ${opts.venue ? `<p style="margin:0 0 16px;color:#64748d;font-size:14px;">📍 ${opts.venue}</p>` : ""}
      <a href="${eventUrl}" style="display:inline-block;background:#533afd;color:#fff;text-decoration:none;padding:10px 16px;border-radius:4px;font-size:14px;margin-right:8px;">活動詳情</a>
      <a href="${ticketsUrl}" style="display:inline-block;border:1px solid #533afd;color:#533afd;text-decoration:none;padding:9px 16px;border-radius:4px;font-size:14px;">我的票券</a>
    </div>
  </div>
</body>
</html>`;

  return { text, html };
}

export function buildTicketTransferEmail(opts: {
  eventTitle: string;
  ticketCode: string;
  fromEmail: string;
}) {
  const ticketsUrl = `${clientBaseUrl()}/login?redirect=${encodeURIComponent("/my-tickets")}`;
  const text = [
    "您好，",
    "",
    `${opts.fromEmail} 已將「${opts.eventTitle}」的票券轉讓給您。`,
    `票券代碼：${opts.ticketCode}`,
    "",
    `請登入查看：${ticketsUrl}`,
    "",
    "— Wonder Ticketing",
  ].join("\n");

  const html = `<!DOCTYPE html>
<html lang="zh-Hant">
<body style="font-family:-apple-system,sans-serif;color:#061b31;">
  <div style="max-width:480px;margin:24px auto;padding:24px;border:1px solid #e5edf5;border-radius:8px;">
    <h2 style="margin:0 0 16px;color:#533afd;">票券轉讓</h2>
    <p><strong>${opts.fromEmail}</strong> 已將「${opts.eventTitle}」的票券轉讓給您。</p>
    <p style="font-family:monospace;background:#f6f9fc;padding:12px;border-radius:4px;">${opts.ticketCode}</p>
    <a href="${ticketsUrl}" style="display:inline-block;margin-top:16px;background:#533afd;color:#fff;padding:10px 16px;border-radius:4px;text-decoration:none;">登入查看票券</a>
  </div>
</body>
</html>`;

  return { text, html };
}
