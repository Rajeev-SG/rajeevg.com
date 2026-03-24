"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { ConsentPreferencesButton } from "@/components/consent-preferences-button"

export function HeaderPrivacyActions() {
  const pathname = usePathname()
  const isArticlePage = pathname?.startsWith("/blog/") ?? false

  if (!isArticlePage) return null

  return (
    <div className="ml-auto flex items-center gap-1">
      <Link
        href="/privacy"
        className="hidden text-xs text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
        data-analytics-event="navigation_click"
        data-analytics-section="header"
        data-analytics-item-type="privacy_policy_link"
        data-analytics-item-name="Privacy policy"
      >
        Privacy
      </Link>
      <ConsentPreferencesButton
        label="Privacy settings"
        variant="outline"
        size="sm"
        className="h-8 border-border/70 text-xs"
      />
    </div>
  )
}
