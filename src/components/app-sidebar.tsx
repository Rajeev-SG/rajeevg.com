"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import { HoverScrollText } from "@/components/hover-scroll-text"
import { getPortfolioProjects } from "@/lib/portfolio-projects"
import { getSortedVisiblePosts } from "@/lib/posts"

// Build nav from site links and Velite posts
const postsList = getSortedVisiblePosts().map((post) => ({
  title: post.title,
  url: `/blog/${post.slug}`,
}))

const projectsList = getPortfolioProjects().map((project) => ({
  title: project.title,
  url: `/projects#${project.slug}`,
}))

const data = {
  navMain: [
    {
      title: "Home",
      url: "/",
      items: [
        { title: "About", url: "/about" },
        { title: "Projects", url: "/projects" },
      ],
    },
    {
      title: "Projects",
      url: "/projects",
      items: projectsList,
    },
    {
      title: "Posts",
      url: "/blog",
      items: postsList,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const { isMobile, setOpenMobile } = useSidebar()
  const handleNav = React.useCallback(() => {
    if (isMobile) setOpenMobile(false)
  }, [isMobile, setOpenMobile])

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
              <Link
                href="/"
                prefetch={false}
                onClick={handleNav}
                data-analytics-event="navigation_click"
                data-analytics-section="sidebar_header"
                data-analytics-item-type="home_link"
                data-analytics-item-name="Rajeev G."
              >
                {/* <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <GalleryVerticalEnd className="size-4" />
                </div> */}
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-medium">Rajeev G.</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {data.navMain.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild isActive={pathname === item.url}>
                  <Link
                    href={item.url}
                    prefetch={false}
                    onClick={handleNav}
                    className="font-medium"
                    data-analytics-event="navigation_click"
                    data-analytics-section="sidebar_primary"
                    data-analytics-item-type="navigation_link"
                    data-analytics-item-name={item.title}
                  >
                    {item.title}
                  </Link>
                </SidebarMenuButton>
                {item.items?.length ? (
                  <SidebarMenuSub>
                    {item.items.map((sub) => (
                      <SidebarMenuSubItem key={sub.title}>
                        <SidebarMenuSubButton asChild isActive={pathname === sub.url || (pathname === "/projects" && sub.url.startsWith("/projects#"))}>
                          <Link
                            href={sub.url}
                            prefetch={false}
                            onClick={handleNav}
                            className="min-w-0 w-full"
                            data-analytics-event={sub.url.startsWith("/blog/") ? "post_click" : "navigation_click"}
                            data-analytics-section="sidebar_subnav"
                            data-analytics-item-type={sub.url.startsWith("/blog/") ? "post_link" : "navigation_link"}
                            data-analytics-item-name={sub.title}
                            data-analytics-item-id={sub.url.replace(/^\/blog\//, "").replace(/^\/projects#/, "")}
                          >
                            <HoverScrollText text={sub.title} />
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                ) : null}
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter />
      <SidebarRail />
    </Sidebar>
  )
}
