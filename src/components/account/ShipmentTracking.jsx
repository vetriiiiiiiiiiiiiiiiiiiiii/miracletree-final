/**
 * The courier's view of a parcel for the shopper: courier, tracking number,
 * current status, expected delivery and the scans so far, newest first.
 * Used on the guest tracking page and the account order page.
 */
function titleCase(text) {
  return String(text ?? "")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** "2026-11-22 18:00:00" or "Nov 22, 2026" → "22 Nov, 6:00 pm" / "22 Nov". */
function prettyDate(raw) {
  if (!raw) return "";
  const text = String(raw).trim();
  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?/);
  const date = iso
    ? new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]), Number(iso[4] ?? 0), Number(iso[5] ?? 0))
    : new Date(text);
  if (Number.isNaN(date.getTime())) return text;
  const day = date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  if (!iso || iso[4] === undefined || (iso[4] === "00" && iso[5] === "00")) return day;
  return `${day}, ${date.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}`;
}

export function ShipmentTracking({ courierName, trackingNumber, trackingUrl, shipmentStatus, shipmentEta, activities = [] }) {
  if (!trackingNumber) return null;
  const scans = Array.isArray(activities) ? activities.slice(0, 12) : [];
  return (
    <div className="border border-gold-400/30 bg-gold-400/5 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow text-gold-400">Tracking</p>
          <p className="mt-2 text-cream-50">
            {courierName ? `${courierName} · ` : ""}
            <span className="tabular-nums">{trackingNumber}</span>
          </p>
          {shipmentStatus ? (
            <p className="mt-1 text-sm text-leaf-300">{titleCase(shipmentStatus)}</p>
          ) : null}
          {shipmentEta && shipmentStatus !== "DELIVERED" ? (
            <p className="mt-1 text-sm text-cream-300">Expected by {prettyDate(shipmentEta)}</p>
          ) : null}
        </div>
        {trackingUrl ? (
          <a
            href={trackingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gold-300 underline underline-offset-4"
          >
            Track with the courier
          </a>
        ) : null}
      </div>
      {scans.length ? (
        <ol className="mt-5 grid gap-4 border-t border-gold-400/20 pt-5">
          {scans.map((scan, i) => (
            <li key={`${scan.date}-${i}`} className="flex gap-3">
              <span
                aria-hidden
                className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${i === 0 ? "bg-emerald-400" : "bg-cream-400/40"}`}
              />
              <div>
                <p className={`text-sm ${i === 0 ? "text-cream-50" : "text-cream-200"}`}>{scan.activity}</p>
                <p className="mt-0.5 text-xs text-cream-400">
                  {prettyDate(scan.date)}
                  {scan.location ? ` · ${scan.location}` : ""}
                </p>
              </div>
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  );
}
