import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Html5Qrcode } from "html5-qrcode";

export function QrScanner({ onScan }: { onScan: (code: string) => void }) {
  const { t } = useTranslation();
  const [error, setError] = useState("");
  const [active, setActive] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const regionId = "wonder-qr-scanner";

  useEffect(() => {
    if (!active) return;

    let cancelled = false;
    const scanner = new Html5Qrcode(regionId);
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (decoded) => {
          if (cancelled) return;
          onScan(decoded.trim().toUpperCase());
        },
        () => {}
      )
      .catch(() => {
        if (!cancelled) setError(t("checkin.cameraError"));
      });

    return () => {
      cancelled = true;
      void scanner.stop().then(() => scanner.clear()).catch(() => {});
      scannerRef.current = null;
    };
  }, [active, onScan, t]);

  return (
    <div className="space-y-3">
      {!active ? (
        <button
          type="button"
          onClick={() => {
            setError("");
            setActive(true);
          }}
          className="rounded-lg border px-4 py-2 text-sm text-wonder-primary"
        >
          {t("checkin.startCamera")}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setActive(false)}
          className="rounded-lg border px-4 py-2 text-sm text-slate-600"
        >
          {t("checkin.stopCamera")}
        </button>
      )}
      <div id={regionId} className="max-w-sm overflow-hidden rounded-lg" />
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
