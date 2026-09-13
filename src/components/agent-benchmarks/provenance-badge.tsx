import type { EvidenceQuality, SourceType } from "@/lib/agent-benchmarks/types";

const SOURCE_LABEL: Record<SourceType, string> = {
  benchmark_machine_readable: "Official data",
  benchmark_repo: "Official",
  benchmark_paper: "Paper",
  vendor_official: "Vendor",
  independent_reproduction: "Independent",
};

const SOURCE_CLASS: Record<SourceType, string> = {
  benchmark_machine_readable: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  benchmark_repo: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  benchmark_paper: "bg-sky-500/10 text-sky-700 dark:text-sky-400",
  independent_reproduction: "bg-violet-500/10 text-violet-700 dark:text-violet-400",
  vendor_official: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
};

const EVIDENCE_LABEL: Record<EvidenceQuality, string> = {
  high: "high confidence",
  medium: "medium confidence",
  low: "lower confidence",
};

export function ProvenanceBadge({ sourceType, evidenceQuality, title }: { sourceType: SourceType; evidenceQuality: EvidenceQuality; title?: string }) {
  return (
    <span
      title={title ?? `${SOURCE_LABEL[sourceType]} source · ${EVIDENCE_LABEL[evidenceQuality]}`}
      className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium leading-none ${SOURCE_CLASS[sourceType]}`}
    >
      {SOURCE_LABEL[sourceType]}
    </span>
  );
}

export function sourceLabel(sourceType: SourceType): string {
  return SOURCE_LABEL[sourceType];
}

export function evidenceLabel(evidenceQuality: EvidenceQuality): string {
  return EVIDENCE_LABEL[evidenceQuality];
}
