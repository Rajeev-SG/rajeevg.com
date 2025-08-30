"use client"
import { useEffect } from "react"
import mermaid from "mermaid"

export default function MermaidInit() {
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: true,
      securityLevel: "loose",
      theme: "base",
      themeVariables: {
        primaryColor: "var(--card)",
        primaryTextColor: "var(--foreground)",
        lineColor: "var(--border)",
        background: "transparent",
      },
    })
  }, [])
  return null
}
