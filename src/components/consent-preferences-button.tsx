"use client"

import { Button } from "@/components/ui/button"

type ConsentPreferencesButtonProps = {
  className?: string
}

export function ConsentPreferencesButton({ className }: ConsentPreferencesButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={className}
      onClick={() => window.dispatchEvent(new Event("analytics-consent:open"))}
    >
      Privacy settings
    </Button>
  )
}
