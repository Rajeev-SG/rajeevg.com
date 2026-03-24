"use client"

import { useCallback, useEffect, useState } from "react"
import { Analytics } from "@vercel/analytics/next"
import { usePathname } from "next/navigation"

import { pushDataLayerEvent, beginAnalyticsPageView, getPageAnalyticsContext } from "@/lib/analytics"
import {
  applyGoogleConsentState,
  createConsentState,
  hasAnalyticsConsent,
  persistConsentState,
  readStoredConsentState,
  type ConsentChoice,
  type ConsentState,
  type ConsentSource,
} from "@/lib/consent"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card"

function createPageContextPayload() {
  const searchString = window.location.search
  const queryParamCount = searchString ? new URLSearchParams(searchString).size : 0

  return {
    query_param_count: queryParamCount,
    consent_rehydrated: true,
  }
}

export function ConsentManager() {
  const pathname = usePathname()
  const [consentState, setConsentState] = useState<ConsentState | null>(null)
  const [isBannerOpen, setIsBannerOpen] = useState(false)
  const isArticlePage = pathname?.startsWith("/blog/") ?? false

  useEffect(() => {
    const storedConsentState = readStoredConsentState()

    if (storedConsentState) {
      applyGoogleConsentState(storedConsentState)
      setConsentState(storedConsentState)
      return
    }

    const defaultState = createConsentState({
      analyticsStorage: "denied",
      source: "default",
    })

    applyGoogleConsentState(defaultState)
    setConsentState(defaultState)
    setIsBannerOpen(true)
  }, [])

  const updateConsent = (analyticsStorage: ConsentChoice, source: ConsentSource) => {
    const nextConsentState = createConsentState({ analyticsStorage, source })

    persistConsentState(nextConsentState)
    applyGoogleConsentState(nextConsentState)
    setConsentState(nextConsentState)
    setIsBannerOpen(false)

    pushDataLayerEvent("consent_state_updated", {
      consent_source: source,
      consent_preference: analyticsStorage,
      consent_updated_at: nextConsentState.updated_at,
      analytics_storage: nextConsentState.analytics_storage,
      ad_storage: nextConsentState.ad_storage,
      ad_user_data: nextConsentState.ad_user_data,
      ad_personalization: nextConsentState.ad_personalization,
      functionality_storage: nextConsentState.functionality_storage,
      security_storage: nextConsentState.security_storage,
    })

    if (nextConsentState.analytics_storage === "granted") {
      pushDataLayerEvent(
        "page_context",
        createPageContextPayload(),
        {
          context: {
            ...beginAnalyticsPageView(pathname),
            ...getPageAnalyticsContext(pathname),
          },
        }
      )
    }
  }

  const openPreferences = useCallback(() => {
    setIsBannerOpen(true)
    pushDataLayerEvent("consent_preferences_open", {
      consent_preference: consentState?.analytics_storage ?? "denied",
    })
  }, [consentState?.analytics_storage])

  useEffect(() => {
    const handleOpenPreferences = () => {
      openPreferences()
    }

    window.addEventListener("analytics-consent:open", handleOpenPreferences)

    return () => {
      window.removeEventListener("analytics-consent:open", handleOpenPreferences)
    }
  }, [openPreferences])

  const shouldLoadAnalytics = hasAnalyticsConsent(consentState)

  return (
    <>
      {isBannerOpen ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 px-4">
          <Card className="pointer-events-auto mx-auto max-w-2xl border-border/80 bg-background/95 shadow-lg backdrop-blur">
            <CardContent className="flex flex-col gap-4 p-5 sm:p-6">
              <div className="space-y-2">
                <CardTitle className="text-base sm:text-lg">Analytics preferences</CardTitle>
                <CardDescription className="max-w-xl text-sm leading-6">
                  This site uses Google Tag Manager and GA4 to understand what people read,
                  click, search, and engage with. We always keep advertising-related consent
                  denied, and only enable analytics storage if you explicitly allow it.
                </CardDescription>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => updateConsent("denied", "banner_decline")}
                >
                  Necessary only
                </Button>
                <Button
                  type="button"
                  onClick={() => updateConsent("granted", "banner_accept")}
                >
                  Allow analytics
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {consentState && consentState.source !== "default" && !isArticlePage ? (
        <div
          className="fixed bottom-4 left-4 z-40"
        >
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={openPreferences}
            aria-label="Privacy settings"
            title="Privacy settings"
          >
            Privacy settings
          </Button>
        </div>
      ) : null}

      {shouldLoadAnalytics ? <Analytics /> : null}
    </>
  )
}
