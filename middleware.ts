import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

const isDashboardRoute = createRouteMatcher(["/dashboard(.*)"])
const isDashboardApiRoute = createRouteMatcher(["/api/content-ops(.*)"])

function isClerkConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY)
}

function hasDevelopmentBypass() {
  return Boolean(process.env.CONTENT_OPS_DEV_AUTH_EMAIL)
}

export default clerkMiddleware(async (auth, req) => {
  if (!isClerkConfigured() || hasDevelopmentBypass()) {
    return NextResponse.next()
  }

  if (isDashboardApiRoute(req)) {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.next()
  }

  if (isDashboardRoute(req)) {
    const { userId } = await auth()
    if (!userId) {
      const url = new URL("/dashboard-access", req.url)
      url.searchParams.set("redirect_url", req.nextUrl.pathname)
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
}
