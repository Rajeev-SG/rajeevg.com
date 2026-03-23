import { cn } from "@/lib/utils"

type ArticleFigureProps = {
  src: string
  alt: string
  caption: string
  title?: string
  eyebrow?: string
  className?: string
}

export function ArticleFigure({
  src,
  alt,
  caption,
  title,
  eyebrow,
  className,
}: ArticleFigureProps) {
  return (
    <figure className={cn("my-10 overflow-hidden rounded-2xl border bg-card shadow-sm", className)}>
      <div className="border-b bg-muted/40 px-4 py-3">
        {eyebrow ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            {eyebrow}
          </p>
        ) : null}
        {title ? <p className="mt-1 text-sm font-semibold text-foreground">{title}</p> : null}
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        className="w-full bg-background object-cover"
      />
      <figcaption className="border-t bg-card px-4 py-3 text-sm leading-6 text-muted-foreground">
        {caption}
      </figcaption>
    </figure>
  )
}
