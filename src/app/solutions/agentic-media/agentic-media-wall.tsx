"use client"

/* eslint-disable @next/next/no-img-element -- posters come from the asset Worker; a plain
   <img> keeps the Cloudflare host out of next.config image allowlists. */

import Link from "next/link"
import { useCallback, useEffect, useRef, useState } from "react"

import {
  countInGroup,
  defaultMediaItemId,
  getMediaGroup,
  getMediaItem,
  mediaAssets,
  mediaGroups,
  mediaItems,
  mediaTotals,
  type MediaGroupId,
} from "@/data/agentic-media"
import styles from "./agentic-media.module.css"

type FilterId = "all" | MediaGroupId

/** Matches the breakpoint in agentic-media.module.css where the panel becomes a sheet. */
const NARROW_QUERY = "(max-width: 980px)"

function cardId(id: string) {
  return `agentic-media-card-${id}`
}

export function AgenticMediaWall() {
  const [filter, setFilter] = useState<FilterId>("all")
  const [selectedId, setSelectedId] = useState(defaultMediaItemId)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [isNarrow, setIsNarrow] = useState(false)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const query = window.matchMedia(NARROW_QUERY)
    const sync = () => setIsNarrow(query.matches)

    sync()
    query.addEventListener("change", sync)
    return () => query.removeEventListener("change", sync)
  }, [])

  const closeSheet = useCallback(() => {
    setSheetOpen(false)
    document.getElementById(cardId(selectedId))?.focus()
  }, [selectedId])

  useEffect(() => {
    if (!sheetOpen) return
    closeButtonRef.current?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeSheet()
    }

    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [sheetOpen, closeSheet])

  const selected = getMediaItem(selectedId) ?? mediaItems[0]
  const selectedGroup = getMediaGroup(selected.group)
  const selectedAssets = mediaAssets(selected.id)
  const visibleGroups = filter === "all" ? mediaGroups : mediaGroups.filter((group) => group.id === filter)
  const sheetHidden = isNarrow && !sheetOpen

  return (
    <div className={styles.wall}>
      <header className={styles.intro}>
        <div>
          <nav className={styles.crumb} aria-label="Breadcrumb">
            <Link href="/solutions">Solutions</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">Agentic media</span>
          </nav>
          <h1 className={styles.h1}>Short-form video made by agents, judged on the finished film.</h1>
        </div>
        <div>
          <p className={styles.lede}>
            Twenty-nine finished vertical videos from five experiments. Each one keeps its engine, render time,
            narration and the agent skill that built it.
          </p>
          <dl className={styles.totals}>
            <div className={styles.total}>
              <dt>finished films</dt>
              <dd>{mediaTotals.films}</dd>
            </div>
            <div className={styles.total}>
              <dt>engines and tools</dt>
              <dd>{mediaTotals.enginesAndTools}</dd>
            </div>
            <div className={styles.total}>
              <dt>experiments</dt>
              <dd>{mediaTotals.experiments}</dd>
            </div>
          </dl>
        </div>
      </header>

      <div className={styles.filters}>
        <div className={styles.filtersInner} role="group" aria-label="Experiment">
          <button
            type="button"
            aria-pressed={filter === "all"}
            aria-label={`All, ${mediaTotals.films} films`}
            onClick={() => setFilter("all")}
          >
            All
            <span className={styles.filterCount}>{mediaTotals.films}</span>
          </button>
          {mediaGroups.map((group) => (
            <button
              key={group.id}
              type="button"
              aria-pressed={filter === group.id}
              aria-label={`${group.name}, ${countInGroup(group.id)} films`}
              onClick={() => setFilter(group.id)}
            >
              {group.name}
              <span className={styles.filterCount}>{countInGroup(group.id)}</span>
            </button>
          ))}
        </div>
      </div>

      <div className={styles.layout}>
        <div>
          {visibleGroups.map((group) => (
            <section key={group.id} className={styles.group} aria-labelledby={`group-${group.id}`}>
              <header className={styles.groupHeader}>
                <h2 id={`group-${group.id}`} className={styles.groupTitle}>
                  {group.name}
                </h2>
                <span className={styles.groupMeta}>
                  {group.date} · {countInGroup(group.id)} films
                </span>
                <p className={styles.groupBlurb}>{group.blurb}</p>
              </header>
              <div className={styles.grid}>
                {mediaItems
                  .filter((item) => item.group === group.id)
                  .map((item) => (
                    <button
                      key={item.id}
                      id={cardId(item.id)}
                      type="button"
                      className={styles.card}
                      aria-current={item.id === selected.id ? "true" : "false"}
                      onClick={() => {
                        setSelectedId(item.id)
                        if (isNarrow) setSheetOpen(true)
                      }}
                    >
                      <figure className={styles.cardFigure}>
                        <img
                          className={styles.poster}
                          src={mediaAssets(item.id).poster}
                          alt=""
                          loading="lazy"
                          decoding="async"
                        />
                        {item.rank ? <span className={styles.rank}>#{item.rank}</span> : null}
                        <span className={styles.dur}>{Math.round(item.dur)}s</span>
                      </figure>
                      <b className={styles.cardTitle}>{item.title}</b>
                      <span className={styles.cardEngine}>{item.engine}</span>
                    </button>
                  ))}
              </div>
            </section>
          ))}
        </div>

        <aside
          className={`${styles.detail} ${sheetOpen ? styles.detailOpen : ""}`}
          aria-label="Film details"
          aria-live="polite"
          inert={sheetHidden}
        >
          <button ref={closeButtonRef} type="button" className={styles.close} onClick={closeSheet}>
            Close
          </button>
          <div className={styles.player}>
            <video
              key={selected.id}
              className={styles.video}
              controls
              playsInline
              preload="none"
              poster={selectedAssets.poster}
              src={selectedAssets.preview}
              aria-label={`Preview film: ${selected.title}`}
            />
          </div>
          <h3 className={styles.detailTitle}>{selected.title}</h3>
          <p className={styles.detailGroup}>
            {selectedGroup?.name}
            {selected.rank ? ` · ranked ${selected.rank} of ${countInGroup(selected.group)}` : ""}
          </p>
          <p className={styles.note}>{selected.note}</p>
          <dl className={styles.specs}>
            <dt>Engine</dt>
            <dd>{selected.engine}</dd>
            <dt>Format</dt>
            <dd>{selected.fmt} · 30 fps</dd>
            <dt>Duration</dt>
            <dd>{selected.dur.toFixed(1)} s</dd>
            <dt>Render</dt>
            <dd>{selected.render}</dd>
            <dt>Master</dt>
            <dd>{selected.size} H.264/AAC</dd>
            {selected.skill ? (
              <>
                <dt>Agent skill</dt>
                <dd>{selected.skill}</dd>
              </>
            ) : null}
          </dl>
          <div className={styles.stack}>
            {selected.stack.map((tool) => (
              <span key={tool}>{tool}</span>
            ))}
          </div>
          <div className={styles.links}>
            <a href={selectedAssets.contactSheet} target="_blank" rel="noreferrer">
              Contact sheet
            </a>
            <a href={selectedAssets.master} target="_blank" rel="noreferrer">
              Master (H.264)
            </a>
          </div>
        </aside>
      </div>
    </div>
  )
}