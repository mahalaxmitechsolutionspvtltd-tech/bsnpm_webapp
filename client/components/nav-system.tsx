
"use client"

import * as React from "react"
import { useEffect } from "react"
import { ChevronRightIcon } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"

type SystemItem = {
    name: string
    url: string
    icon: React.ReactNode
    items?: {
        title: string
        url: string
    }[]
}

export function SystemNav({ systems }: { systems: SystemItem[] }) {
    const pathname = usePathname()
    const router = useRouter()
    const currentPath = pathname

    useEffect(() => {
        for (const item of systems) {
            if (item.url && item.url !== pathname) {
                router.prefetch(item.url)
            }
            if (item.items?.length) {
                for (const subItem of item.items) {
                    if (subItem.url !== pathname) {
                        router.prefetch(subItem.url)
                    }
                }
            }
        }
    }, [systems, pathname, router])

    return (
        <SidebarGroup>
            <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">
                Systems
            </SidebarGroupLabel>

            <SidebarMenu>
                {systems.map((item) => {
                    if (item.items?.length) {
                        return (
                            <Collapsible key={item.name} asChild defaultOpen={false} className="group/collapsible">
                                <SidebarMenuItem>
                                    <CollapsibleTrigger asChild>
                                        <SidebarMenuButton tooltip={item.name}>
                                            {item.icon}
                                            <span className="group-data-[collapsible=icon]:hidden">{item.name}</span>
                                            <ChevronRightIcon className="ml-auto transition-transform duration-200 group-data-[collapsible=icon]:hidden group-data-[state=open]/collapsible:rotate-90" />
                                        </SidebarMenuButton>
                                    </CollapsibleTrigger>

                                    <CollapsibleContent className="group-data-[collapsible=icon]:hidden">
                                        <SidebarMenuSub>
                                            {item.items.map((subItem) => (
                                                <SidebarMenuSubItem key={subItem.title}>
                                                    <SidebarMenuSubButton
                                                        asChild
                                                        className={currentPath == subItem.url ? "bg-primary rounded-sm text-primary-foreground" : ""}
                                                    >
                                                        <Link
                                                            href={subItem.url}
                                                            prefetch
                                                            onMouseEnter={() => router.prefetch(subItem.url)}
                                                            onFocus={() => router.prefetch(subItem.url)}
                                                            onTouchStart={() => router.prefetch(subItem.url)}
                                                        >
                                                            <span>{subItem.title}</span>
                                                        </Link>
                                                    </SidebarMenuSubButton>
                                                </SidebarMenuSubItem>
                                            ))}
                                        </SidebarMenuSub>
                                    </CollapsibleContent>
                                </SidebarMenuItem>
                            </Collapsible>
                        )
                    }

                    return (
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
                    )
                })}
            </SidebarMenu>
        </SidebarGroup>
    )
}