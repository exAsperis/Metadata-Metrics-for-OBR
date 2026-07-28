import { DOCUMENTED_ROOM_METADATA_LIMIT_BYTES } from "../constants";
import { formatBytes } from "../metadata/analyzeMetadata";

interface UsagePanelProps {
  totalBytes: number;
  keyCount: number;
  updatedAt: Date | null;
  refreshing: boolean;
  onRefresh: () => void;
}

function threshold(percent: number) {
  if (percent >= 100) return { className: "critical", label: "Critical" };
  if (percent >= 90) return { className: "warning", label: "Warning" };
  if (percent >= 75) return { className: "caution", label: "Caution" };
  return { className: "normal", label: "Normal" };
}

export function UsagePanel({
  totalBytes,
  keyCount,
  updatedAt,
  refreshing,
  onRefresh,
}: UsagePanelProps) {
  const percent = (totalBytes / DOCUMENTED_ROOM_METADATA_LIMIT_BYTES) * 100;
  const state = threshold(percent);

  return (
    <section className="usage-card" aria-labelledby="room-metadata-heading">
      <div className="title-row">
        <div>
          <span className="eyebrow">Metadata Metrics</span>
          <h1 id="room-metadata-heading">Room Metadata</h1>
        </div>
        <button
          className="secondary-button"
          onClick={onRefresh}
          disabled={refreshing}
        >
          {refreshing ? "Refreshing…" : "Refresh"}
        </button>
      </div>
      <div className="usage-line">
        <strong title={`${totalBytes.toLocaleString()} bytes`}>
          {formatBytes(totalBytes)}
        </strong>
        <span>/ 16 kB</span>
        <span className={`threshold ${state.className}`}>
          {state.label} · {percent.toFixed(1)}%
        </span>
      </div>
      <div
        className="quota-track"
        role="progressbar"
        aria-label="Room metadata quota used"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.min(100, Math.round(percent))}
      >
        <div
          className={`quota-fill ${state.className}`}
          style={{ width: `${Math.min(100, percent)}%` }}
        />
      </div>
      <div className="usage-facts">
        <span><b>{totalBytes.toLocaleString()}</b> exact bytes</span>
        <span><b>{keyCount}</b> {keyCount === 1 ? "key" : "keys"}</span>
        <span>
          Updated <b>{updatedAt?.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }) ?? "—"}</b>
        </span>
      </div>
    </section>
  );
}
