import { SignInButton } from "@clerk/nextjs"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { isClerkConfigured } from "@/lib/content-ops/auth"

export default function DashboardAccessPage() {
  const clerkEnabled = isClerkConfigured()

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
            <SignInButton mode="redirect">
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
