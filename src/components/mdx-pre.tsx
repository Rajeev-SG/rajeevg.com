"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export type MdxPreProps = React.ComponentProps<"pre">

export function MdxPre({ className, children, ...props }: MdxPreProps) {
  const preRef = React.useRef<HTMLPreElement>(null)
  const [copied, setCopied] = React.useState(false)

  const copy = async () => {
    try {
      const root = preRef.current
      if (!root) return
      const codeEl = root.querySelector("code") as HTMLElement | null
      const text = codeEl ? codeEl.innerText : root.innerText
      if (!text) return
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text)
      } else {
        // Fallback for insecure contexts
        const ta = document.createElement("textarea")
        ta.value = text
        ta.style.position = "fixed"
        ta.style.left = "-9999px"
        document.body.appendChild(ta)
        ta.focus()
        ta.select()
        document.execCommand("copy")
        document.body.removeChild(ta)
      }
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {}
  }

  return (
    <pre ref={preRef} className={cn("my-4 overflow-x-auto rounded-lg", className)} {...props}>
      {/* Copy button (styled via globals.css using rehype-pretty-copy classes) */}
      <button
        type="button"
        aria-label={copied ? "Copied" : "Copy code"}
        className={cn("rehype-pretty-copy", copied && "rehype-pretty-copied")}
        onClick={copy}
      >
        <span className="ready" aria-hidden />
        <span className="success" aria-hidden />
      </button>
      {children}
    </pre>
  )
}

