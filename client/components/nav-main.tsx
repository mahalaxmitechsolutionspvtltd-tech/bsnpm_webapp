
"use client"

import type React from "react"
import { useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"

type NavMainItem = {
  title: string
  url: string
  icon: React.ReactNode
  isActive?: boolean
}

export function NavMain({ items }: { items: NavMainItem[] }) {
  const pathname = usePathname()
  const router = useRouter()
  const currentPath = pathname.split("/").filter(Boolean).pop() || ""

  useEffect(() => {
    for (const item of items) {
      if (item.url !== pathname) {
        router.prefetch(item.url)
      }
    }
  }, [items, pathname, router])

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">
        Main
      </SidebarGroupLabel>

      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton
              asChild
              tooltip={item.title}
              className={`${currentPath == item.url.split("/").filter(Boolean).pop() || "" ? "rounded-sm bg-sidebar-primary text-sidebar-primary-foreground" : ""}`}
            >
              <Link
                href={item.url}
                prefetch
                onMouseEnter={() => router.prefetch(item.url)}
                onFocus={() => router.prefetch(item.url)}
                onTouchStart={() => router.prefetch(item.url)}
              >
                {item.icon}
                <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}