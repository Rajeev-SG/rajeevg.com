import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function DashboardAccessDeniedPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>
}) {
  const { reason } = await searchParams

  return (
    <section className="mx-auto flex min-h-[60vh] max-w-2xl items-center">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Dashboard access denied</CardTitle>
          <CardDescription>
            This workspace is restricted to the rajeevg.com editorial account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              {reason === "auth"
                ? "Dashboard auth is not configured in this environment, so the content OS stays blocked rather than exposing private editorial data."
                : "The signed-in account is not allowlisted for this dashboard. Access is limited to rajeev.sgill@gmail.com."}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </section>
  )
}
