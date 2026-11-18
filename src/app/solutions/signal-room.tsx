"use client"

import { useEffect, useRef, useState } from "react"
import { ArrowDown, ArrowRight, Check, ChevronRight, Crosshair, Pause, Play, RotateCcw, SkipBack, SkipForward } from "lucide-react"
import { cases, causes, signals, times } from "./signal-room-cases"
import styles from "./signal-room.module.css"

const firstFrame = 0
const lastFrame = times.length - 1
const plotWidth = 720
const plotHeight = 168
const traceColors = ["#c2b5a6", "#8cc5b4", "#ffaf69"]
const drawOrder = [0, 1, 2] as const
const referenceLines = [110, 100, 80, 60, 50]
const timeTicks = [0, 2, 4, 6, 8]

function x(frame: number) {
  return 6 + (frame / lastFrame) * (plotWidth - 12)
}

function y(value: number) {
  return 6 + ((110 - value) / 60) * (plotHeight - 12)
}

function delta(value: number) {
  const change = value - 100
  return change === 0 ? "0%" : `${change < 0 ? "−" : "+"}${Math.abs(change)}%`
}

export default function SignalRoom() {
  const [caseIndex, setCaseIndex] = useState(0)
  const [frame, setFrame] = useState(lastFrame)
  const [playing, setPlaying] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const consoleRef = useRef<HTMLDivElement>(null)
  const [signal, setSignal] = useState(2)
  const [answer, setAnswer] = useState<number | null>(null)
  const [solved, setSolved] = useState<number[]>([])
  const incident = cases[caseIndex]
  const correct = answer === incident.cause
  const incidentFrame = times.indexOf(incident.time)
  const hasIncidentStarted = frame >= incidentFrame
  const atEnd = frame === lastFrame
  const replayLabel = reducedMotion
    ? atEnd ? "Jump to timeline start" : "Jump to timeline end"
    : playing ? "Pause timeline replay" : "Play timeline replay"
  const ReplayIcon = reducedMotion
    ? atEnd ? SkipBack : SkipForward
    : playing ? Pause : atEnd ? RotateCcw : Play

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)")
    const syncPreference = () => {
      setReducedMotion(query.matches)
      if (query.matches) setPlaying(false)
    }

    syncPreference()
    query.addEventListener("change", syncPreference)
    return () => query.removeEventListener("change", syncPreference)
  }, [])

  useEffect(() => {
    if (!playing) return

    const timer = window.setTimeout(() => {
      const next = frame + 1
      setFrame(next)
      if (next === lastFrame) setPlaying(false)
    }, 540)

    return () => window.clearTimeout(timer)
  }, [frame, playing])

  function chooseCase(index: number) {
    setCaseIndex(index)
    setFrame(lastFrame)
    setSignal(2)
    setPlaying(false)
    setAnswer(null)
  }

  function toggleReplay() {
    if (playing) {
      setPlaying(false)
      return
    }

    if (reducedMotion) {
      setFrame(atEnd ? firstFrame : lastFrame)
      return
    }

    if (atEnd) setFrame(firstFrame)
    setPlaying(true)
  }

  function diagnose(index: number) {
    setAnswer(index)
    if (index === incident.cause) {
      setSolved((previous) => previous.includes(caseIndex) ? previous : [...previous, caseIndex])
    }
  }

  return (
    <section id="signal-room" className={styles.exhibit} aria-labelledby="signal-room-title">
      <div className={styles.hero}>
        <div className={styles.heroArt} aria-hidden="true" />
        <div className={styles.heroContent}>
          <div className={styles.kicker}><Crosshair size={17} aria-hidden="true" /> Interactive case lab</div>
          <h2 id="signal-room-title" className={styles.title}>Signal Room<span>.</span></h2>
          <p className={styles.premise}>Conversions fell 38%.<br />Can you find out why?</p>
          <a className={styles.launch} href="#signal-room-investigate">
            Open the case <ArrowDown size={16} aria-hidden="true" />
          </a>
        </div>
        <p className={styles.heroCaption}>Three simulated incidents<span aria-hidden="true"> / </span><span>One identical drop</span></p>
      </div>

      <div ref={consoleRef} id="signal-room-investigate" className={styles.console} tabIndex={-1}>
        <div className={styles.caseBar}>
          <div className={styles.caseBarHeading}>
            <span className={styles.eyebrow}>Case files</span>
            <span className={styles.progress}>{solved.length} / {cases.length} solved</span>
          </div>
          <div className={styles.caseChoices} role="group" aria-label="Choose an incident">
            {cases.map((item, index) => (
              <button key={item.name} type="button" aria-pressed={caseIndex === index} onClick={() => chooseCase(index)}>
                <span className={styles.caseNumber} aria-hidden="true">
                  {solved.includes(index) ? <Check size={14} /> : `0${index + 1}`}
                </span>
                {item.name}
                {solved.includes(index) && <span className="sr-only">, solved</span>}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.workspace}>
          <div className={styles.trace}>
            <div className={styles.traceHeading}>
              <div>
                <p className={styles.eyebrow}>Incident timeline</p>
                <h3>Follow the signal</h3>
              </div>
              <div className={styles.timelineControls}>
                <div className={styles.clock}><span aria-hidden="true" />{times[frame]}</div>
                <button className={styles.play} type="button" onClick={toggleReplay} aria-label={replayLabel} title={replayLabel}>
                  <ReplayIcon size={16} aria-hidden="true" />
                </button>
              </div>
            </div>

            <p className={styles.chartLabel}>
              <span>Index · 08:00 = 100</span>
              <span className={styles.incidentLabel}>Incident · {incident.time}</span>
            </p>
            <div className={styles.chart}>
              <div className={styles.yLabels} aria-hidden="true">
                {referenceLines.slice(0, -1).map((value) => (
                  <span key={value} style={{ top: `${y(value) / plotHeight * 100}%` }}>{value}</span>
                ))}
              </div>
              <div className={styles.plot}>
                <svg viewBox={`0 0 ${plotWidth} ${plotHeight}`} preserveAspectRatio="none" aria-hidden="true">
                  <defs>
                    <linearGradient id="signal-room-chart-fill" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor={traceColors[signal]} stopOpacity=".2" />
                      <stop offset="100%" stopColor={traceColors[signal]} stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {referenceLines.map((value) => (
                    <line key={value} x1="0" x2={plotWidth} y1={y(value)} y2={y(value)} className={styles.gridLine} data-baseline={value === 100} />
                  ))}
                  <rect x={x(incidentFrame)} y="0" width={plotWidth - x(incidentFrame)} height={plotHeight} className={styles.incidentWindow} />
                  <line x1={x(incidentFrame)} x2={x(incidentFrame)} y1="0" y2={plotHeight} className={styles.incidentLine} />
                  <polygon
                    fill="url(#signal-room-chart-fill)"
                    points={` ${x(firstFrame)},${plotHeight} ${incident.values[signal].slice(0, frame + 1).map((value, index) => `${x(index)},${y(value)}`).join(" ")} ${x(frame)},${plotHeight}`}
                  />
                  {[...drawOrder.filter((index) => index !== signal), signal].map((index) => (
                    <g key={index} color={traceColors[index]} opacity={signal === index ? 1 : .68}>
                      <polyline points={incident.values[index].map((value, sample) => `${x(sample)},${y(value)}`).join(" ")} className={styles.futureLine} />
                      <polyline points={incident.values[index].slice(0, frame + 1).map((value, sample) => `${x(sample)},${y(value)}`).join(" ")} className={styles.traceLine} />
                    </g>
                  ))}
                </svg>
                <div className={styles.playhead} style={{ left: `${x(frame) / plotWidth * 100}%` }} aria-hidden="true" />
                {drawOrder.map((index) => (
                  <span
                    key={index} className={styles.marker} data-selected={signal === index}
                    style={{ left: `${x(frame) / plotWidth * 100}%`, top: `${y(incident.values[index][frame]) / plotHeight * 100}%`, color: traceColors[index] }}
                    aria-hidden="true"
                  />
                ))}
              </div>
              <div className={styles.timeLabels} aria-hidden="true">
                {timeTicks.map((index) => (
                  <span key={index} style={{ left: `${x(index) / plotWidth * 100}%` }}>{times[index]}</span>
                ))}
              </div>
            </div>

            <div className={styles.scrubber}>
              <input
                aria-label="Incident time" aria-valuetext={times[frame]} type="range"
                min={firstFrame} max={lastFrame} value={frame}
                onChange={(event) => {
                  setPlaying(false)
                  setFrame(Number(event.target.value))
                }}
              />
            </div>
          </div>

          <div className={styles.evidence}>
            <p className={styles.eyebrow}>Evidence channels</p>
            <div className={styles.signalChoices} role="group" aria-label="Inspect a signal">
              {signals.map((item, index) => (
                <button key={item.label} type="button" aria-pressed={signal === index} onClick={() => setSignal(index)}>
                  <span className={styles.signalDot} style={{ color: traceColors[index] }} aria-hidden="true" />
                  <span className={styles.signalLabel}><small>{item.source}</small>{item.label}</span>
                  <span className={styles.signalValue}>{delta(incident.values[index][frame])}</span>
                </button>
              ))}
            </div>
            <div className={styles.note} aria-live="polite" aria-atomic="true">
              <div key={`${caseIndex}-${signal}-${hasIncidentStarted}`}>
                <p className={styles.eyebrow}><span aria-hidden="true">↳ </span>{hasIncidentStarted ? "Evidence note" : "Before the incident"}</p>
                <p>{hasIncidentStarted ? incident.clues[signal] : signals[signal].description}</p>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.verdict}>
          <div className={styles.verdictHeading}>
            <p className={styles.eyebrow}>Your call</p>
            <h3>Where did it break?</h3>
          </div>
          <div className={styles.answers} role="group" aria-label="Choose a diagnosis">
            {causes.map((cause, index) => (
              <button type="button" key={cause} aria-pressed={answer === index} data-correct={correct && answer === index} onClick={() => diagnose(index)}>
                {cause}
                {correct && answer === index ? <Check size={16} aria-hidden="true" /> : <ChevronRight size={16} aria-hidden="true" />}
              </button>
            ))}
          </div>
          <div className={styles.result} role="status" data-correct={correct}>
            {answer === null ? <p>Compare the three channels, then pick a diagnosis.</p> : correct ? (
              <div>
                <p><strong>Case solved.</strong> {incident.summary}</p>
                <p className={styles.action}><strong>Next move</strong> {incident.action}</p>
              </div>
            ) : <p><strong>Try another lead.</strong> Check which signal moved first and which ones stayed steady.</p>}
          </div>
          {correct && caseIndex < cases.length - 1 && (
            <button className={styles.next} type="button" onClick={() => {
              chooseCase(caseIndex + 1)
              consoleRef.current?.focus({ preventScroll: true })
              consoleRef.current?.scrollIntoView({ block: "start" })
            }}>
              Next case <ArrowRight size={16} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </section>
  )
}
