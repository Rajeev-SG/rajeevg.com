export type Representation = "html" | "markdown"

type MediaRange = {
  type: string
  subtype: string
  quality: number
  order: number
}

export type Negotiation = {
  representation: Representation | null
  htmlQuality: number
  markdownQuality: number
}

type Match = {
  quality: number
  specificity: number
  order: number
}

const mediaTypes = {
  html: { type: "text", subtype: "html" },
  markdown: { type: "text", subtype: "markdown" },
} as const

function splitHeaderValues(value: string) {
  const values: string[] = []
  let start = 0
  let quote = false

  for (let index = 0; index < value.length; index += 1) {
    if (value[index] === '"' && value[index - 1] !== "\\") quote = !quote
    if (value[index] === "," && !quote) {
      values.push(value.slice(start, index))
      start = index + 1
    }
  }

  values.push(value.slice(start))
  return values
}

function parseQuality(value: string | undefined) {
  if (value === undefined) return 1
  const normalized = value.trim()
  if (!/^(?:0(?:\.\d{0,3})?|1(?:\.0{0,3})?)$/.test(normalized)) return null
  return Number(normalized)
}

function parseAccept(header: string | null): MediaRange[] {
  if (!header?.trim()) {
    return [{ type: "*", subtype: "*", quality: 1, order: 0 }]
  }

  return splitHeaderValues(header).flatMap((value, order) => {
    const parts = value.split(";")
    const mediaType = parts.shift()?.trim().toLowerCase() || ""
    const [type, subtype] = mediaType.split("/")
    if (
      !type ||
      !subtype ||
      ![type, subtype].every((part) => /^(?:\*|[a-z0-9!#$&^_.+-]+)$/.test(part)) ||
      (type === "*" && subtype !== "*")
    ) {
      return []
    }

    const qualityParameter = parts.find((part) => part.trim().toLowerCase().startsWith("q="))
    const quality = parseQuality(qualityParameter?.slice(qualityParameter.indexOf("=") + 1))
    if (quality === null) return []

    return [{ type, subtype, quality, order }]
  })
}

function specificity(range: MediaRange) {
  if (range.type === "*" && range.subtype === "*") return 0
  if (range.subtype === "*") return 1
  return 2
}

function qualityFor(header: string | null, mediaType: { type: string; subtype: string }) {
  const matchingRanges = parseAccept(header).filter((range) =>
    (range.type === "*" || range.type === mediaType.type) &&
    (range.subtype === "*" || range.subtype === mediaType.subtype),
  )

  if (matchingRanges.length === 0) return { quality: 0, specificity: -1, order: Number.POSITIVE_INFINITY }

  const mostSpecific = Math.max(...matchingRanges.map(specificity))
  const match = matchingRanges.find((range) => specificity(range) === mostSpecific)
  return {
    quality: match?.quality ?? 0,
    specificity: mostSpecific,
    order: match?.order ?? Number.POSITIVE_INFINITY,
  } satisfies Match
}

export function negotiateAccept(header: string | null): Negotiation {
  const html = qualityFor(header, mediaTypes.html)
  const markdown = qualityFor(header, mediaTypes.markdown)
  const htmlQuality = html.quality
  const markdownQuality = markdown.quality

  let representation: Representation | null = null
  if (htmlQuality > 0 || markdownQuality > 0) {
    if (markdownQuality !== htmlQuality) {
      representation = markdownQuality > htmlQuality ? "markdown" : "html"
    } else if (markdown.specificity !== html.specificity) {
      representation = markdown.specificity > html.specificity ? "markdown" : "html"
    } else if (markdown.order !== html.order) {
      representation = markdown.order < html.order ? "markdown" : "html"
    } else {
      representation = "html"
    }
  }

  return { representation, htmlQuality, markdownQuality }
}

export function addVaryValue(headers: Headers, value: string) {
  const existing = headers.get("Vary")
  if (existing === "*") return

  const values = existing?.split(",").map((item) => item.trim()).filter(Boolean) ?? []
  if (!values.some((item) => item.toLowerCase() === value.toLowerCase())) values.push(value)
  headers.set("Vary", values.join(", "))
}
