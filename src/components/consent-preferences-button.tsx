"use client"

import { type ComponentProps } from "react"

import { Button } from "@/components/ui/button"

type ConsentPreferencesButtonProps = {
  className?: string
  label?: string
  variant?: ComponentProps<typeof Button>["variant"]
  size?: ComponentProps<typeof Button>["size"]
}

export function ConsentPreferencesButton({
  className,
  label = "Privacy settings",
  variant = "ghost",
  size = "sm",
}: ConsentPreferencesButtonProps) {
  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      aria-label={label}
      title={label}
      onClick={() => window.dispatchEvent(new Event("analytics-consent:open"))}
    >
      {label}
    </Button>
  )
}
