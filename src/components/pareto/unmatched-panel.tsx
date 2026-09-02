import type { UnmatchedRecord } from "@/lib/pareto/types";

export function UnmatchedPanel({ unmatched }: { unmatched: UnmatchedRecord[] }) {
  if (unmatched.length === 0) return null;
  const bySource = new Map<string, UnmatchedRecord[]>();
  for (const u of unmatched) {
    const list = bySource.get(u.source) ?? [];
    list.push(u);
    bySource.set(u.source, list);
  }
  return (
    <details className="rounded-xl border p-4">
      <summary className="cursor-pointer text-sm font-medium">
        Unmatched models ({unmatched.length}) — explicit alias map needs updating
      </summary>
      <div className="mt-3 space-y-3 text-sm">
        {[...bySource.entries()].map(([source, records]) => (
          <div key={source}>
            <p className="font-medium capitalize">{source}</p>
            <ul className="mt-1 max-h-48 list-inside list-disc overflow-y-auto text-muted-foreground">
              {records.slice(0, 50).map((u, i) => (
                <li key={`${u.sourceId}-${i}`}>{u.displayName} <span className="text-xs opacity-70">({u.reason})</span></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </details>
  );
}
