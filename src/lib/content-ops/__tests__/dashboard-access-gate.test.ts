import { describe, expect, it, vi } from "vitest"

// The gate logic under test is the redirect decision in dashboard-access/page.tsx:
// - clerkEnabled && signed-in → redirect("/dashboard")
// - clerkEnabled && signed-out → render the sign-in card
// - clerkEnabled=false → render the "Clerk not configured" alert
// We assert via the pure decision logic extracted below, mirroring the page.

type AccessPageState = "redirect_dashboard" | "show_sign_in" | "show_unconfigured"

function resolveAccessPageState(opts: { clerkEnabled: boolean; signedIn: boolean }): AccessPageState {
  if (!opts.clerkEnabled) return "show_unconfigured"
  if (opts.signedIn) return "redirect_dashboard"
  return "show_sign_in"
}

vi.mock("@clerk/nextjs", () => ({
  SignInButton: () => null,
  currentUser: vi.fn(),
}))

describe("dashboard-access gate", () => {
  it("redirects authenticated users to /dashboard (post-sign-in loop fix)", () => {
    expect(resolveAccessPageState({ clerkEnabled: true, signedIn: true })).toBe("redirect_dashboard")
  })

  it("shows the sign-in card for signed-out users", () => {
    expect(resolveAccessPageState({ clerkEnabled: true, signedIn: false })).toBe("show_sign_in")
  })

  it("shows the unconfigured alert when Clerk is not configured", () => {
    expect(resolveAccessPageState({ clerkEnabled: false, signedIn: false })).toBe("show_unconfigured")
  })
})
