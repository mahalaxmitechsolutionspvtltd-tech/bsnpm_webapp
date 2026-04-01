"use client"

import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"
import Link from "next/link"
import { usePathname } from "next/navigation"

type NavMainItem = {
  title: string
  url: string
  icon: React.ReactNode
  isActive?: boolean
}

export function NavMain({ items }: { items: NavMainItem[] }) {
  const pathname = usePathname();
  const currentPath = pathname.split("/").filter(Boolean).pop() || "";



  return (
    <SidebarGroup>
      <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">
        Main
      </SidebarGroupLabel>

      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton asChild tooltip={item.title} className={`${currentPath == item.url.split("/").filter(Boolean).pop() || "" ? "rounded-sm bg-sidebar-primary text-sidebar-primary-foreground" : ""}`}>
              <Link href={item.url}>
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