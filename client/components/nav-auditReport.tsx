"use client"

import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"
import Link from "next/link"
import { usePathname } from "next/navigation"

type AuditItem = {
    name: string
    url: string
    icon: React.ReactNode
}

export function AuditReports({ auditReports }: { auditReports: AuditItem[] }) {
    const pathname = usePathname()
    const currentPath = pathname;

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