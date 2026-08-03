"use client"

import Link from "next/link"
import { Menu, X } from "lucide-react"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

import { AppSidebar } from "@/components/app-sidebar"
import { ConsentPreferencesButton } from "@/components/consent-preferences-button"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"

const publicNavigation = [
  { href: "/", label: "Home" },
  { href: "/projects", label: "Projects" },
  { href: "/blog", label: "Writing" },
  { href: "/about", label: "About" },
]

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/"
  return pathname === href || pathname.startsWith(`${href}/`)
}

function PublicChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => setMenuOpen(false), [pathname])

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/92 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-6 px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="text-base font-semibold tracking-tight"
            data-analytics-event="navigation_click"
            data-analytics-section="public_header"
            data-analytics-item-name="Rajeev Gill"
          >
            Rajeev Gill
          </Link>

          <nav className="ml-auto hidden items-center gap-1 sm:flex" aria-label="Primary navigation">
            {publicNavigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(pathname, item.href) ? "page" : undefined}
                className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground aria-[current=page]:text-foreground"
                data-analytics-event="navigation_click"
                data-analytics-section="public_header"
                data-analytics-item-name={item.label}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <ThemeToggle />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="sm:hidden"
            aria-label={menuOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>

        {menuOpen ? (
          <nav className="border-t border-border/70 px-4 py-3 sm:hidden" aria-label="Mobile navigation">
            <div className="mx-auto grid max-w-6xl gap-1">
              {publicNavigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive(pathname, item.href) ? "page" : undefined}
                  className="rounded-md px-3 py-3 text-sm text-muted-foreground hover:bg-muted hover:text-foreground aria-[current=page]:bg-muted aria-[current=page]:text-foreground"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>
        ) : null}
      </header>

      <main className="min-w-0">
        <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
          {children}
        </div>
      </main>

      <footer className="border-t border-border/70">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} Rajeev Gill</p>
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/privacy" className="transition-colors hover:text-foreground">
              Privacy
            </Link>
            <ConsentPreferencesButton
              className="h-auto px-0 text-sm text-muted-foreground hover:text-foreground"
              label="Privacy settings"
              variant="link"
              size="sm"
            />
          </div>
        </div>
      </footer>
    </div>
  )
}

function DashboardChrome({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-30 border-b border-border bg-background">
          <div className="flex h-12 items-center gap-2 px-4 sm:px-6">
            <SidebarTrigger />
            <div className="ml-auto">
              <ThemeToggle />
            </div>
          </div>
        </header>
        <main className="min-w-0 p-4 sm:p-6 lg:p-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isDashboard = pathname === "/dashboard" || pathname.startsWith("/dashboard/")

  return isDashboard ? <DashboardChrome>{children}</DashboardChrome> : <PublicChrome>{children}</PublicChrome>
}
