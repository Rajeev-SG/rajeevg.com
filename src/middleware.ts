import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

const isDashboardRoute = createRouteMatcher(["/dashboard", "/dashboard/(.*)"])
const isDashboardApiRoute = createRouteMatcher(["/api/content-ops(.*)"])

function isClerkConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY)
}

function hasDevelopmentBypass() {
  return Boolean(process.env.CONTENT_OPS_DEV_AUTH_EMAIL)
}

async function handleProtectedRoutes(
  auth: () => Promise<{ userId: string | null }>,
  req: NextRequest,
) {
  if (hasDevelopmentBypass()) {
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
}

const developmentFallbackMiddleware = (request: NextRequest) => {
  void request.nextUrl
  return NextResponse.next()
}

const middleware = isClerkConfigured()
  ? clerkMiddleware(handleProtectedRoutes)
  : developmentFallbackMiddleware

export default middleware

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
}
