/* eslint-disable @next/next/no-img-element */
"use client"

import * as React from "react"

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"



export function SidebarProfileHeader({
  teams,
}: {
  teams: {
    name: string
    logo:string
    plan: string
  }[]
}) {

  const activeTeam =teams[0]; 
  if (!activeTeam) {
    return null
  }

  return (
    <SidebarMenu >
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
        >
         <div>
           <img
              alt="logo"
              src="/bsnpm.png"
              
              className="size-10 object-contain rounded-full"
            />
         </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate  font-bold text-xl">{activeTeam.name}</span>
            <span className="truncate text-xs">{activeTeam.plan}</span>
          </div>

        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
