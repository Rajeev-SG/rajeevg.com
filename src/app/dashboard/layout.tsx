import { redirect } from "next/navigation"

import { getDashboardAccess } from "@/lib/content-ops/auth"

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const access = await getDashboardAccess()

  if (access.status === "signed_out") {
    redirect("/dashboard-access")
  }

  if (access.status === "forbidden") {
    redirect("/dashboard-access-denied")
  }

  if (access.status === "auth_unavailable") {
    redirect("/dashboard-access-denied?reason=auth")
  }

  return <>{children}</>
}
