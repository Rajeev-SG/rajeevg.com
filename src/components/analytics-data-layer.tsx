"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

import {
  type AnalyticsPayload,
  beginAnalyticsPageView,
  getAnalyticsAttributes,
  getPageAnalyticsContext,
  getLinkAnalyticsDetails,
  pushDataLayerEvent,
  sanitizeAnalyticsText,
} from "@/lib/analytics"

const PAGE_SCROLL_MILESTONES = [25, 50, 75, 90]
const ARTICLE_PROGRESS_MILESTONES = [25, 50, 75, 100]
const ENGAGEMENT_MILESTONES = [15, 30, 60]

function getClickEventName(element: HTMLElement, anchor: HTMLAnchorElement | null) {
  if (element.dataset.analyticsEvent) return element.dataset.analyticsEvent

  if (anchor) {
    if (anchor.href.startsWith("mailto:") || anchor.href.startsWith("tel:")) {
      return "contact_click"
    }

    try {
      const url = new URL(anchor.href, window.location.href)
      return url.origin === window.location.origin ? "link_click" : "outbound_click"
    } catch {
      return "link_click"
    }
  }

  if (element.dataset.analyticsSection || element.dataset.analyticsItemType) {
    return undefined
  }

  return element.tagName.toLowerCase() === "button" ? "button_click" : undefined
}

export function AnalyticsDataLayer() {
  const pathname = usePathname()

  useEffect(() => {
    const pageViewContext = beginAnalyticsPageView(pathname)
    const pageContext = getPageAnalyticsContext(pathname)
    const baseEventContext: AnalyticsPayload = {
      ...pageViewContext,
      ...pageContext,
    }

    const searchString = window.location.search
    const queryParamCount = searchString ? new URLSearchParams(searchString).size : 0
    let maxPageScrollPercent = 0
    let maxArticleProgressPercent = 0
    let interactionCount = 0
    let summarySent = false
    let visibleStartAt = document.visibilityState === "visible" ? Date.now() : null
    let totalVisibleMs = 0

    pushDataLayerEvent("page_context", {
      query_param_count: queryParamCount,
    }, { context: baseEventContext })

    const pageScrollSeen = new Set<number>()
    const articleProgressSeen = new Set<number>()
    const sectionSeen = new Set<string>()
    const timers = ENGAGEMENT_MILESTONES.map((seconds) =>
      window.setTimeout(() => {
        if (document.visibilityState === "visible") {
          pushDataLayerEvent("engaged_time", { engaged_seconds: seconds })
        }
      }, seconds * 1000)
    )

    const handleClick = (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof Element)) return

      const element = target.closest<HTMLElement>("[data-analytics-event], a, button, [role='button']")
      if (!element) return

      const anchor = (element.closest("a") as HTMLAnchorElement | null) ?? null
      const eventName = getClickEventName(element, anchor)
      if (!eventName) return

      interactionCount += 1

      pushDataLayerEvent(eventName, {
        interaction_sequence: interactionCount,
        element_tag: element.tagName.toLowerCase(),
        element_text: sanitizeAnalyticsText(element.textContent),
        element_label: element.getAttribute("aria-label") || undefined,
        ...getAnalyticsAttributes(element),
        ...getLinkAnalyticsDetails(anchor?.href),
      })
    }

    const handleScroll = () => {
      const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight
      const pageProgress =
        scrollableHeight > 0 ? Math.round((window.scrollY / scrollableHeight) * 100) : 100
      maxPageScrollPercent = Math.max(maxPageScrollPercent, pageProgress)

      for (const milestone of PAGE_SCROLL_MILESTONES) {
        if (pageProgress >= milestone && !pageScrollSeen.has(milestone)) {
          pageScrollSeen.add(milestone)
          pushDataLayerEvent("scroll_depth", { scroll_depth_percent: milestone })
        }
      }

      const article = document.getElementById("article-content")
      if (!article) return

      const articleStart = article.getBoundingClientRect().top + window.scrollY
      const articleViewed =
        ((window.scrollY + window.innerHeight - articleStart) / article.scrollHeight) * 100
      const articleProgress = Math.max(0, Math.min(100, Math.round(articleViewed)))
      maxArticleProgressPercent = Math.max(maxArticleProgressPercent, articleProgress)

      for (const milestone of ARTICLE_PROGRESS_MILESTONES) {
        if (articleProgress >= milestone && !articleProgressSeen.has(milestone)) {
          articleProgressSeen.add(milestone)
          pushDataLayerEvent(milestone === 100 ? "article_complete" : "article_progress", {
            article_progress_percent: milestone,
          })
        }
      }
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting || !(entry.target instanceof HTMLElement)) continue

          const sectionName = entry.target.dataset.analyticsSection
          if (!sectionName || sectionSeen.has(sectionName)) continue

          sectionSeen.add(sectionName)
          pushDataLayerEvent("section_view", {
            section_name: sectionName,
            ...getAnalyticsAttributes(entry.target),
          })
        }
      },
      { threshold: 0.6 }
    )

    const flushVisibleTime = () => {
      if (visibleStartAt === null) return
      totalVisibleMs += Date.now() - visibleStartAt
      visibleStartAt = null
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        flushVisibleTime()
        return
      }

      if (visibleStartAt === null) {
        visibleStartAt = Date.now()
      }
    }

    const sendPageSummary = () => {
      if (summarySent) return

      flushVisibleTime()
      summarySent = true

      pushDataLayerEvent("page_engagement_summary", {
        engaged_seconds_total: Math.round(totalVisibleMs / 1000),
        interaction_count: interactionCount,
        section_views_count: sectionSeen.size,
        max_scroll_depth_percent: Math.min(100, Math.round(maxPageScrollPercent)),
        max_article_progress_percent: maxArticleProgressPercent
          ? Math.min(100, Math.round(maxArticleProgressPercent))
          : undefined,
      }, { context: baseEventContext })
    }

    document.querySelectorAll<HTMLElement>("[data-analytics-section]").forEach((element) => {
      if (["A", "BUTTON", "INPUT"].includes(element.tagName)) return
      observer.observe(element)
    })

    document.addEventListener("click", handleClick, true)
    document.addEventListener("visibilitychange", handleVisibilityChange)
    window.addEventListener("scroll", handleScroll, { passive: true })
    window.addEventListener("pagehide", sendPageSummary)
    handleScroll()

    return () => {
      sendPageSummary()
      document.removeEventListener("click", handleClick, true)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("scroll", handleScroll)
      window.removeEventListener("pagehide", sendPageSummary)
      observer.disconnect()
      timers.forEach((timer) => window.clearTimeout(timer))
    }
  }, [pathname])

  return null
}
