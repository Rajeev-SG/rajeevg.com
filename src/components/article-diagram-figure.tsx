import { cn } from "@/lib/utils"

type ArticleDiagramFigureProps = {
  src: string
  alt: string
  caption: string
  slug?: string
  date?: string
  className?: string
}

export function ArticleDiagramFigure({
  src,
  alt,
  caption,
  slug,
  date,
  className,
}: ArticleDiagramFigureProps) {
  return (
    <figure className={cn("my-10 overflow-hidden rounded-2xl border bg-card shadow-sm", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        className="w-full bg-background object-contain"
      />
      <figcaption className="border-t bg-card px-4 py-3 text-sm leading-6 text-muted-foreground">
        {caption}
        {date ? <span className="text-xs"> Evidence date: {date}.</span> : null}
        {slug ? (
          <>
            {" "}
            <a className="font-medium underline underline-offset-4" href={`/downloads/${slug}.excalidraw`}>
              Download the editable Excalidraw source
            </a>
            .
          </>
        ) : null}
      </figcaption>
    </figure>
  )
}
