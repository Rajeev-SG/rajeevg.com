import { SignInButton } from "@clerk/nextjs"
import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { isClerkConfigured } from "@/lib/content-ops/auth"

export default async function DashboardAccessPage() {
  const clerkEnabled = isClerkConfigured()

  // A user who reaches this page while already authenticated should never be
  // stranded here — send them to the dashboard (fixes the post-sign-in loop).
  if (clerkEnabled) {
    const user = await currentUser()
    if (user) {
      redirect("/dashboard")
    }
  }

  return (
    <section className="mx-auto flex min-h-[60vh] max-w-2xl items-center">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Dashboard access required</CardTitle>
          <CardDescription>
            The content operations workspace is private. Sign in with the allowed account to continue.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              Only the allowlisted dashboard account can open editorial workflows, uploads, publishing actions, and
              content strategy data.
            </AlertDescription>
          </Alert>
          {clerkEnabled ? (
            <SignInButton mode="redirect" forceRedirectUrl="/dashboard" fallbackRedirectUrl="/dashboard">
              <Button>Sign in to continue</Button>
            </SignInButton>
          ) : (
            <Alert>
              <AlertDescription>
                Clerk is not configured in this environment yet. Add the Clerk publishable and secret keys to enable
                protected dashboard access.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </section>
  )
}
