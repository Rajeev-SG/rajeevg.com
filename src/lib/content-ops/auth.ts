import "server-only"

import { auth, currentUser } from "@clerk/nextjs/server"
import { cookies } from "next/headers"

const DEFAULT_ALLOWED_EMAIL = "rajeev.sgill@gmail.com"

export type DashboardAccessResult =
  | {
      status: "authorized"
      email: string
      source: "clerk" | "development"
    }
  | {
      status: "signed_out" | "forbidden" | "auth_unavailable"
      email?: string
      reason: string
    }

export function isClerkConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY)
}

export function getAllowedDashboardEmails() {
  return (process.env.CONTENT_OPS_ALLOWED_EMAILS || DEFAULT_ALLOWED_EMAIL)
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean)
}

async function getDevelopmentAuthEmail() {
  const cookieStore = await cookies()
  const cookieEmail = cookieStore.get("content_ops_dev_email")?.value?.trim().toLowerCase()
  if (cookieEmail) return cookieEmail

  const email = process.env.CONTENT_OPS_DEV_AUTH_EMAIL?.trim().toLowerCase()
  return email || null
}

export async function getDashboardAccess(): Promise<DashboardAccessResult> {
  const allowedEmails = getAllowedDashboardEmails()
  const developmentEmail = await getDevelopmentAuthEmail()

  if (developmentEmail) {
    return allowedEmails.includes(developmentEmail)
      ? { status: "authorized", email: developmentEmail, source: "development" }
      : {
          status: "forbidden",
          email: developmentEmail,
          reason: "CONTENT_OPS_DEV_AUTH_EMAIL is set but is not in the dashboard allowlist.",
        }
  }

  if (!isClerkConfigured()) {
    return {
      status: "auth_unavailable",
      reason:
        "Clerk is not configured in this environment. Set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY to enable dashboard auth.",
    }
  }

  const authState = await auth()
  if (!authState.userId) {
    return {
      status: "signed_out",
      reason: "Sign in with the allowed Google account to access the dashboard.",
    }
  }

  const user = await currentUser()
  const primaryEmail =
    user?.primaryEmailAddress?.emailAddress ||
    user?.emailAddresses.find((address) => address.id === user.primaryEmailAddressId)?.emailAddress ||
    user?.emailAddresses[0]?.emailAddress ||
    ""

  const normalizedEmail = primaryEmail.trim().toLowerCase()

  if (!normalizedEmail || !allowedEmails.includes(normalizedEmail)) {
    return {
      status: "forbidden",
      email: normalizedEmail || undefined,
      reason: "This signed-in account is not allowed to access the rajeevg.com content dashboard.",
    }
  }

  return {
    status: "authorized",
    email: normalizedEmail,
    source: "clerk",
  }
}
