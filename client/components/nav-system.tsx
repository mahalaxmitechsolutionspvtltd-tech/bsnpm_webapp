"use client"

import * as React from "react"
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
import { usePathname } from "next/navigation"

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
    const currentPath = pathname;

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
                                                    <SidebarMenuSubButton asChild
                                                        className={currentPath == subItem.url ? "bg-primary rounded-sm text-primary-foreground" : ""}
                                                    >
                                                        <Link href={subItem.url}>
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
                            <SidebarMenuButton asChild tooltip={item.name}
                                className={currentPath == item.url ? "bg-primary rounded-sm text-primary-foreground" : ""}
                            >
                                <a href={item.url}>
                                    {item.icon}
                                    <span className="group-data-[collapsible=icon]:hidden">{item.name}</span>
                                </a>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    )
                })}
            </SidebarMenu>
        </SidebarGroup>
    )
}