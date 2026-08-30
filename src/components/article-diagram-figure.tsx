import { cn } from "@/lib/utils"

type ArticleDiagramFigureProps = {
  src: string
  alt: string
  caption: string
  slug?: string
  date?: string
  className?: string
  /** Optional wrapper styling for wide diagrams that need horizontal inspection on small screens. */
  imgClassName?: string
}

export function ArticleDiagramFigure({
  src,
  alt,
  caption,
  slug,
  date,
  className,
  imgClassName,
}: ArticleDiagramFigureProps) {
  return (
    <figure className={cn("my-10 overflow-hidden rounded-2xl border bg-card shadow-sm", className)}>
      <div className="overflow-x-auto">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          className={cn("w-full min-w-[720px] bg-background object-contain", imgClassName)}
        />
      </div>
      <figcaption className="border-t bg-card px-4 py-3 text-sm leading-6 text-muted-foreground">
        <span className="block sm:hidden">Swipe sideways to inspect the full diagram. </span>
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
