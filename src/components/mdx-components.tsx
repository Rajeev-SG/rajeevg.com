import * as React from "react"
import Link from "next/link"

import { cn } from "@/lib/utils"
import { MdxPre } from "@/components/mdx-pre"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
  TableCaption,
} from "@/components/ui/table"

// Headings
const H1 = (props: React.ComponentProps<"h1">) => (
  <h1
    className={cn(
      "scroll-m-20 text-4xl font-extrabold tracking-tight text-balance",
      props.className
    )}
    {...props}
  />
)
const H2 = (props: React.ComponentProps<"h2">) => (
  <h2
    className={cn(
      "mt-10 scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0",
      props.className
    )}
    {...props}
  />
)
const H3 = (props: React.ComponentProps<"h3">) => (
  <h3
    className={cn(
      "mt-8 scroll-m-20 text-2xl font-semibold tracking-tight",
      props.className
    )}
    {...props}
  />
)
const H4 = (props: React.ComponentProps<"h4">) => (
  <h4
    className={cn(
      "mt-6 scroll-m-20 text-xl font-semibold tracking-tight",
      props.className
    )}
    {...props}
  />
)
const H5 = (props: React.ComponentProps<"h5">) => (
  <h5
    className={cn("mt-6 text-lg font-semibold", props.className)}
    {...props}
  />
)
const H6 = (props: React.ComponentProps<"h6">) => (
  <h6
    className={cn("mt-6 text-base font-semibold", props.className)}
    {...props}
  />
)

// Paragraph
const P = (props: React.ComponentProps<"p">) => (
  <p className={cn("leading-7 [&:not(:first-child)]:mt-6", props.className)} {...props} />
)

// Inline code
const InlineCode = (props: React.ComponentProps<"code">) => (
  <code
    className={cn(
      "relative rounded bg-muted px-1.5 py-0.5 font-mono text-sm",
      props.className
    )}
    {...props}
  />
)

// Pre/code blocks with working copy button
const Pre = ({ className, ...props }: React.ComponentProps<"pre">) => (
  <MdxPre className={className} {...props} />
)

// Images: lazy + async decoding by default
const Img = ({
  loading = "lazy",
  decoding = "async",
  alt = "",
  ...props
}: React.ComponentProps<"img">) => (
  // eslint-disable-next-line @next/next/no-img-element
  <img loading={loading} decoding={decoding} alt={alt} {...props} />
)

// Links (internal vs external) with special handling for SVG anchors (e.g., Mermaid output)
const A = (
  // Support possible SVG props like xlinkHref/xlink:href that rehype-mermaid may emit
  { href = "", children, className, ...rest }: (React.ComponentProps<"a"> & { [key: string]: unknown })
) => {
  const getStr = (v: unknown): string | undefined => (typeof v === "string" ? v : undefined)
  const restObj = rest as Record<string, unknown>
  // Prefer xlinkHref/xlink:href when present (SVG anchors), otherwise fall back to href
  const xlinkHref = getStr(restObj.xlinkHref) ?? getStr(restObj["xlink:href"]) // SVG namespace attribute
  const rawHref: string = xlinkHref ?? href

  // Heuristic: if xlinkHref is present or children are SVG-ish, treat as SVG anchor
  const hasSvgLikeChild = React.Children.toArray(children).some(
    (child) => React.isValidElement(child) && typeof child.type === "string" && (child.type === "g" || child.type === "svg" || child.type === "foreignObject")
  )
  const isSvgAnchor = Boolean(xlinkHref) || hasSvgLikeChild

  if (isSvgAnchor) {
    // Do not wrap with Next.js Link or add external icon; just preserve attributes and href
    return (
      <a href={rawHref} {...(rest as React.ComponentProps<"a">)}>
        {children}
      </a>
    )
  }

  const isExternal = /^(https?:)?\/\//.test(rawHref)
  const classes = cn("text-primary underline-offset-4 hover:underline", className)
  if (isExternal) {
    return (
      <a href={rawHref} className={classes} rel="noreferrer noopener" target="_blank" {...rest}>
        {children}
        <svg aria-hidden className="ml-1 inline-block size-3 align-[-1px] opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 3h7v7" />
          <path d="M10 14 21 3" />
          <path d="M21 14v7h-7" />
          <path d="M3 10v11h11" />
        </svg>
      </a>
    )
  }
  return (
    <Link href={rawHref} className={classes}>
      {children}
    </Link>
  )
}

// Blockquote → Alert
const Blockquote = ({ children, className }: React.HTMLAttributes<HTMLDivElement>) => (
  <Alert className={cn("my-6", className)}>
    <AlertDescription>{children}</AlertDescription>
  </Alert>
)

// Lists
const UL = (props: React.ComponentProps<"ul">) => (
  <ul className={cn("my-6 ml-6 list-disc [&>li]:mt-2", props.className)} {...props} />
)
const OL = (props: React.ComponentProps<"ol">) => (
  <ol className={cn("my-6 ml-6 list-decimal [&>li]:mt-2", props.className)} {...props} />
)
const LI = (props: React.ComponentProps<"li">) => (
  <li className={cn("leading-7", props.className)} {...props} />
)

// Horizontal rule
const HR = (props: React.ComponentProps<"hr">) => (
  <Separator className={cn("my-8", props.className)} />
)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const mdxComponents: Record<string, React.ComponentType<any>> = {
  h1: H1,
  h2: H2,
  h3: H3,
  h4: H4,
  h5: H5,
  h6: H6,
  p: P,
  a: A,
  blockquote: Blockquote,
  code: InlineCode,
  pre: Pre,
  img: Img,
  hr: HR,
  ul: UL,
  ol: OL,
  li: LI,
  table: Table,
  thead: TableHeader,
  tbody: TableBody,
  tr: TableRow,
  th: TableHead,
  td: TableCell,
  tfoot: TableFooter,
  caption: TableCaption,
}

