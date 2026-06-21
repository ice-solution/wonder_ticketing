import QRCode from "react-qr-code";

export function TicketQrCode({ value, size = 128 }: { value: string; size?: number }) {
  return (
    <div className="inline-block rounded-lg border bg-white p-2">
      <QRCode value={value} size={size} level="M" />
    </div>
  );
}
