export function formatDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return `${new Date(iso).toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
      timeZone: "UTC",
    })} UTC`;
  } catch {
    return iso;
  }
}
