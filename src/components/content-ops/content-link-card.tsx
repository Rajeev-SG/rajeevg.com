import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { ContentInventoryRecord } from "@/lib/content-ops/types"

type ContentLinkCardProps = {
  record: ContentInventoryRecord
}

export function ContentLinkCard({ record }: ContentLinkCardProps) {
  const href = record.url
  const external = href.startsWith("http")

  return (
    <Card className="h-full min-w-0 border-border/70">
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="max-w-full whitespace-normal break-words text-left">
            {record.pageClass}
          </Badge>
          <Badge variant="outline" className="max-w-full whitespace-normal break-words text-left">
            {record.workflowStatus}
          </Badge>
        </div>
        <CardTitle className="min-w-0 break-words text-xl">
          {external ? (
            <a href={href} target="_blank" rel="noreferrer" className="break-words hover:underline">
              {record.title}
            </a>
          ) : (
            <Link href={href} className="break-words hover:underline">
              {record.title}
            </Link>
          )}
        </CardTitle>
        <CardDescription className="break-words">{record.pillar}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="break-words text-sm text-muted-foreground">{record.notes}</p>
        <div className="flex flex-wrap gap-2">
          {record.tags.slice(0, 4).map((tag) => (
            <Badge key={tag} variant="outline" className="max-w-full whitespace-normal break-words text-left">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
