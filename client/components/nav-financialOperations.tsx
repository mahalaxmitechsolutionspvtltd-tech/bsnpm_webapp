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

type FinancialItem = {
  name: string
  url: string
  icon: React.ReactNode
  items?: {
    title: string
    url: string
  }[]
}

export function FinancialOperations({
  financialOperations,
}: {
  financialOperations: FinancialItem[]
}) {
  const pathname = usePathname()
  const currentPath = pathname;




  return (
    <SidebarGroup>
      <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">
        Financial Operations
      </SidebarGroupLabel>

      <SidebarMenu>
        {financialOperations.map((item) => {



          if (item.items?.length) {
            return (
              <Collapsible
                key={item.name}
                asChild

                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton

                      tooltip={item.name}
                    // className={currentPath == item.url ? "bg-primary rounded-sm text-primary-foreground" : ""}
                    >

                      {item.icon}
                      <span className="group-data-[collapsible=icon]:hidden">
                        {item.name}
                      </span>
                      <ChevronRightIcon className="ml-auto transition-transform duration-200 group-data-[collapsible=icon]:hidden group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>

                  <CollapsibleContent className="group-data-[collapsible=icon]:hidden">
                    <SidebarMenuSub>
                      {item.items.map((subItem) => {
                        return (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton
                              asChild
                              className={currentPath == subItem.url ? "bg-primary rounded-sm text-primary-foreground" : ""}
                            >
                              <Link href={subItem.url} className="py-3">
                                <span>{subItem.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        )
                      })}
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
                <Link href={item.url}>
                  {item.icon}
                  <span className="group-data-[collapsible=icon]:hidden">
                    {item.name}
                  </span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup >
  )
}