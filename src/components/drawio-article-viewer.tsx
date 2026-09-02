import { ExternalLink, FileDown } from "lucide-react"

type DrawioArticleViewerProps = {
  title: string
  viewerSrc: string
  fallbackSrc: string
  downloadSrc: string
}

export function DrawioArticleViewer({
  title,
  viewerSrc,
  fallbackSrc,
  downloadSrc,
}: DrawioArticleViewerProps) {
  return (
    <figure className="not-prose my-10 overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
      <div className="flex flex-col gap-3 border-b bg-muted/35 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Interactive diagrams.net viewer
          </p>
          <p className="mt-1 text-sm font-semibold text-foreground">{title}</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-medium">
          <a
            href={viewerSrc}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-md border bg-background px-3 text-foreground no-underline hover:bg-muted"
          >
            Open full screen <ExternalLink className="size-3.5" aria-hidden />
          </a>
          <a
            href={downloadSrc}
            download
            className="inline-flex min-h-11 items-center gap-1.5 rounded-md border bg-background px-3 text-foreground no-underline hover:bg-muted"
          >
            Download draw.io <FileDown className="size-3.5" aria-hidden />
          </a>
        </div>
      </div>
      <iframe
        src={viewerSrc}
        title={title}
        loading="lazy"
        className="h-[70vh] min-h-[34rem] w-full bg-white"
      />
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={fallbackSrc} alt={title} className="w-full bg-white object-contain" />
      </noscript>
      <figcaption className="border-t bg-card px-4 py-3 text-sm leading-6 text-muted-foreground">
        Use the page control in the viewer to move through all nine pages. The editable source is available above; the static overview is the fallback when embedded scripts are unavailable.
      </figcaption>
    </figure>
  )
}
