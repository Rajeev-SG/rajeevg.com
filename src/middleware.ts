import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

import { addVaryValue, negotiateAccept } from "@/lib/accept-markdown"

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
    return negotiatePublicRequest(req)
  }

  if (isDashboardApiRoute(req)) {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return negotiatePublicRequest(req)
  }

  if (isDashboardRoute(req)) {
    const { userId } = await auth()
    if (!userId) {
      const url = new URL("/dashboard-access", req.url)
      url.searchParams.set("redirect_url", req.nextUrl.pathname)
      return NextResponse.redirect(url)
    }
  }

  return negotiatePublicRequest(req)
}

function isNegotiablePublicPath(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  if (
    pathname === "/markdown-content" ||
    pathname.startsWith("/_next/") ||
    pathname === "/api" ||
    pathname.startsWith("/api/") ||
    pathname === "/trpc" ||
    pathname.startsWith("/trpc/") ||
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/") ||
    pathname.includes(".")
  ) {
    return false
  }

  return true
}

function negotiatePublicRequest(request: NextRequest) {
  if (!isNegotiablePublicPath(request)) return NextResponse.next()

  const negotiation = negotiateAccept(request.headers.get("accept"))
  if (!negotiation.representation) {
    const response = new NextResponse("Not Acceptable", {
      status: 406,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    })
    addVaryValue(response.headers, "Accept")
    return response
  }

  if (negotiation.representation === "markdown") {
    const url = request.nextUrl.clone()
    url.pathname = "/markdown-content"
    url.search = ""
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set("x-markdown-path", request.nextUrl.pathname)
    const response = NextResponse.rewrite(url, { request: { headers: requestHeaders } })
    addVaryValue(response.headers, "Accept")
    return response
  }

  const response = NextResponse.next()
  addVaryValue(response.headers, "Accept")
  return response
}

const developmentFallbackMiddleware = (request: NextRequest) => {
  return negotiatePublicRequest(request)
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
