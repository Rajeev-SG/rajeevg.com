type GuideNode = {
  label: string
  detail: string
  tone: "violet" | "cyan" | "emerald" | "amber"
}

const lanes: Array<{ title: string; subtitle: string; nodes: GuideNode[] }> = [
  {
    title: "01 / steer",
    subtitle: "review before execution",
    nodes: [
      { label: "Sol", detail: "plan + review + judgement", tone: "violet" },
      { label: "packet", detail: "scope / risk / evidence", tone: "amber" },
    ],
  },
  {
    title: "02 / execute",
    subtitle: "high-throughput worker",
    nodes: [
      { label: "Go Luna", detail: "bounded implementation", tone: "cyan" },
      { label: "skills", detail: "registry -> route -> runbook", tone: "emerald" },
    ],
  },
  {
    title: "03 / prove",
    subtitle: "state and evidence",
    nodes: [
      { label: "queue", detail: "lease / checkpoint / resume", tone: "amber" },
      { label: "dashboard", detail: "OTel -> Langfuse -> local", tone: "violet" },
    ],
  },
]

const toneClasses = {
  violet: "border-violet-400/50 bg-violet-400/10 text-violet-100",
  cyan: "border-cyan-400/50 bg-cyan-400/10 text-cyan-100",
  emerald: "border-emerald-400/50 bg-emerald-400/10 text-emerald-100",
  amber: "border-amber-400/50 bg-amber-400/10 text-amber-100",
}

export function GoArchitectureGuide() {
  return (
    <figure
      className="not-prose my-12 overflow-hidden rounded-2xl border border-slate-800 bg-[#0b1020] text-slate-100 shadow-2xl shadow-slate-950/20 dark:border-slate-700"
      aria-labelledby="go-architecture-guide-title"
    >
      <figcaption className="border-b border-slate-800 px-4 py-4 sm:px-6">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 font-mono text-[11px] uppercase tracking-[0.18em] text-slate-400">
          <span className="text-emerald-300">architecture.map</span>
          <span aria-hidden="true">/</span>
          <span>sol-go loop</span>
          <span className="ml-auto rounded-full border border-emerald-400/30 px-2 py-1 text-[10px] text-emerald-300">
            review gate: on
          </span>
        </div>
        <h2 id="go-architecture-guide-title" className="mt-3 text-lg font-semibold tracking-tight text-white">
          A small control plane around a fast worker
        </h2>
        <p className="mt-2 max-w-2xl font-mono text-xs leading-5 text-slate-400">
          The model is not the system. The packet, state transitions, fallbacks, and evidence are.
        </p>
      </figcaption>

      <div className="grid gap-px bg-slate-800 md:grid-cols-3">
        {lanes.map((lane, laneIndex) => (
          <section key={lane.title} className="min-w-0 bg-[#0b1020] p-4 sm:p-5" aria-labelledby={`guide-lane-${laneIndex}`}>
            <div className="flex items-baseline justify-between gap-3 font-mono">
              <h3 id={`guide-lane-${laneIndex}`} className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-200">
                {lane.title}
              </h3>
              <span className="text-[10px] text-slate-500">{lane.subtitle}</span>
            </div>
            <div className="mt-4 grid gap-3">
              {lane.nodes.map((node, nodeIndex) => (
                <div key={node.label} className={`min-w-0 rounded-lg border p-3 font-mono ${toneClasses[node.tone]}`}>
                  <div className="flex min-w-0 items-center gap-2 text-sm font-semibold">
                    <span className="shrink-0 text-slate-500">{String(nodeIndex + 1).padStart(2, "0")}</span>
                    <span className="min-w-0 break-words">{node.label}</span>
                  </div>
                  <p className="mt-2 break-words text-[11px] leading-5 text-slate-300">{node.detail}</p>
                </div>
              ))}
            </div>
            {laneIndex < lanes.length - 1 ? (
              <div className="mt-3 hidden text-center font-mono text-xs text-slate-600 md:block" aria-hidden="true">
                -&gt;
              </div>
            ) : null}
          </section>
        ))}
      </div>

      <div className="grid gap-3 border-t border-slate-800 px-4 py-4 font-mono text-[11px] leading-5 text-slate-400 sm:grid-cols-3 sm:px-6">
        <p><span className="text-amber-300">if quota:</span> health-check OpenRouter, then fallback</p>
        <p><span className="text-cyan-300">if recovered:</span> route back to Go, do not drift</p>
        <p><span className="text-emerald-300">always:</span> checkpoint before the next action</p>
      </div>
    </figure>
  )
}
