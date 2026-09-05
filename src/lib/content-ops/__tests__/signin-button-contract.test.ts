import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"

describe("SignInButton auth-loop contract (gh-110)", () => {
  it("uses explicit forceRedirectUrl/fallbackRedirectUrl to /dashboard", () => {
    const src = readFileSync("src/app/dashboard-access/page.tsx", "utf8")
    expect(src).toContain('forceRedirectUrl="/dashboard"')
    expect(src).toContain('fallbackRedirectUrl="/dashboard"')
  })

  it("checks currentUser server-side and redirects to /dashboard", () => {
    const src = readFileSync("src/app/dashboard-access/page.tsx", "utf8")
    expect(src).toContain("currentUser()")
    expect(src).toContain('redirect("/dashboard")')
  })
})
