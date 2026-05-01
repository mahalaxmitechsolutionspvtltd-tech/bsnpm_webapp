
"use client"

import type React from "react"
import { useEffect } from "react"
import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"

type AuditItem = {
    name: string
    url: string
    icon: React.ReactNode
}

export function AuditReports({ auditReports }: { auditReports: AuditItem[] }) {
    const pathname = usePathname()
    const router = useRouter()
    const currentPath = pathname

    useEffect(() => {
        for (const item of auditReports) {
            if (item.url !== pathname) {
                router.prefetch(item.url)
            }
        }
    }, [auditReports, pathname, router])

    return (
        <SidebarGroup>
            <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">
                Audit Reports
            </SidebarGroupLabel>

            <SidebarMenu>
                {auditReports.map((item) => (
                    <SidebarMenuItem key={item.name}>
                        <SidebarMenuButton
                            asChild
                            tooltip={item.name}
                            className={currentPath == item.url ? "bg-primary rounded-sm text-primary-foreground" : ""}
                        >
                            <Link
                                href={item.url}
                                prefetch
                                onMouseEnter={() => router.prefetch(item.url)}
                                onFocus={() => router.prefetch(item.url)}
                                onTouchStart={() => router.prefetch(item.url)}
                            >
                                {item.icon}
                                <span className="group-data-[collapsible=icon]:hidden">{item.name}</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarGroup>
    )
}