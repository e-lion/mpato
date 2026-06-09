export function relativeTime(iso: string): string {
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const m = Math.floor(diffMs / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hr ago`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;
  const w = Math.floor(days / 7);
  if (w < 5) return `${w} week${w > 1 ? "s" : ""} ago`;
  return d.toLocaleDateString("en-KE", { day: "2-digit", month: "short", year: "numeric" });
}
