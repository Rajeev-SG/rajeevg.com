export type SiteOverviewMetrics = {
  screenPageViews: number
  sessions: number
  activeUsers: number
  userEngagementDuration: number
  blogScreenPageViews: number
  projectScreenPageViews: number
}

export type SitePagePerformanceRow = {
  pagePath: string
  pageTitle: string
  screenPageViews: number
  activeUsers: number
  userEngagementDuration: number
}

export type SiteDeviceMixRow = {
  deviceCategory: string
  activeUsers: number
  screenPageViews: number
  userEngagementDuration: number
}

export type SiteKeyEventRow = {
  eventName: string
  eventCount: number
  keyEvents: number
}

export type SiteRealtimeEventRow = {
  eventName: string
  eventCount: number
}

export type SiteAnalyticsDashboard = {
  dataSource: "live" | "fallback"
  generatedAt: string
  propertyId: string
  streamId: string
  siteHostname: string
  historicalWindow: string
  realtimeWindow: string
  notes: string[]
  overview: SiteOverviewMetrics
  topContent: SitePagePerformanceRow[]
  topBlogPosts: SitePagePerformanceRow[]
  deviceMix: SiteDeviceMixRow[]
  keyEvents: SiteKeyEventRow[]
  realtimeCustomEvents: SiteRealtimeEventRow[]
  trackedCustomEvents: string[]
  promotedDimensions: string[]
  promotedMetrics: string[]
  portfolioKeyEvents: string[]
}
