"use client"

import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"
import Link from "next/link"

type AuditItem = {
    name: string
    url: string
    icon: React.ReactNode
}

export function AuditReports({ auditReports }: { auditReports: AuditItem[] }) {
    return (
        <SidebarGroup>
            <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">
                Audit Reports
            </SidebarGroupLabel>

            <SidebarMenu>
                {auditReports.map((item) => (
                    <SidebarMenuItem key={item.name}>
                        <SidebarMenuButton asChild tooltip={item.name}>
                            <Link
                                href={item.url}>
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