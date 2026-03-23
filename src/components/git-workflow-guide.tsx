import * as React from "react"

import { cn } from "@/lib/utils"

type WorkflowFrameProps = {
  eyebrow?: string
  title: string
  tone?: "sunset" | "ocean" | "forest" | "ink"
  footer?: React.ReactNode
  children: React.ReactNode
}

const toneClasses: Record<NonNullable<WorkflowFrameProps["tone"]>, string> = {
  sunset:
    "border-amber-200/80 bg-[linear-gradient(160deg,rgba(255,247,237,0.96),rgba(255,255,255,0.96))] dark:border-amber-500/20 dark:bg-[linear-gradient(160deg,rgba(52,34,18,0.88),rgba(17,24,39,0.96))]",
  ocean:
    "border-sky-200/80 bg-[linear-gradient(160deg,rgba(239,246,255,0.96),rgba(255,255,255,0.96))] dark:border-sky-500/20 dark:bg-[linear-gradient(160deg,rgba(15,42,68,0.9),rgba(15,23,42,0.97))]",
  forest:
    "border-emerald-200/80 bg-[linear-gradient(160deg,rgba(236,253,245,0.96),rgba(255,255,255,0.96))] dark:border-emerald-500/20 dark:bg-[linear-gradient(160deg,rgba(15,61,47,0.9),rgba(17,24,39,0.97))]",
  ink:
    "border-slate-800/80 bg-[linear-gradient(160deg,rgba(15,23,42,0.98),rgba(30,41,59,0.98))] text-slate-100",
}

export function WorkflowFrame({
  eyebrow,
  title,
  tone = "sunset",
  footer,
  children,
}: WorkflowFrameProps) {
  const isDarkSurface = tone === "ink"

  return (
    <div
      className={cn(
        "my-8 overflow-hidden rounded-[28px] border shadow-[0_24px_60px_-32px_rgba(15,23,42,0.45)]",
        toneClasses[tone]
      )}
    >
      <div className="flex items-center justify-between gap-4 border-b border-current/10 px-5 py-4">
        <div className="flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-rose-400" />
          <span className="size-2.5 rounded-full bg-amber-400" />
          <span className="size-2.5 rounded-full bg-emerald-400" />
        </div>
        <div className="text-right">
          {eyebrow ? (
            <p
              className={cn(
                "m-0 text-[10px] font-semibold uppercase tracking-[0.26em]",
                isDarkSurface ? "text-slate-400" : "text-muted-foreground"
              )}
            >
              {eyebrow}
            </p>
          ) : null}
          <p
            className={cn(
              "m-0 text-sm font-semibold",
              isDarkSurface ? "text-slate-100" : "text-foreground"
            )}
          >
            {title}
          </p>
        </div>
      </div>
      <div className="px-5 py-5">{children}</div>
      {footer ? (
        <div
          className={cn(
            "border-t border-current/10 px-5 py-3 text-sm",
            isDarkSurface ? "text-slate-300" : "text-muted-foreground"
          )}
        >
          {footer}
        </div>
      ) : null}
    </div>
  )
}

export function TerminalLine({
  prefix = "$",
  children,
}: {
  prefix?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3 font-mono text-[13px] leading-6 sm:text-sm">
      <span className="select-none text-emerald-400">{prefix}</span>
      <span className="min-w-0 flex-1 text-slate-100">{children}</span>
    </div>
  )
}

export function TerminalNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="pl-6 font-mono text-[13px] leading-6 text-slate-400 sm:text-sm">
      {children}
    </div>
  )
}

export function ReviewPill({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode
  tone?: "neutral" | "success" | "warning"
}) {
  const tones = {
    neutral:
      "border-slate-200 bg-white/75 text-slate-700 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-200",
    success:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200",
    warning:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200",
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium",
        tones[tone]
      )}
    >
      {children}
    </span>
  )
}
