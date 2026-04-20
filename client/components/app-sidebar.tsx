"use client"

import * as React from "react"
import { NavMain } from "@/components/nav-main"
import { FinancialOperations } from "@/components/nav-financialOperations"
import { NavUser } from "@/components/nav-user"
import { SidebarProfileHeader } from "@/components/SidebarProfileHeader"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { GalleryVerticalEndIcon, BookOpenIcon, LayoutDashboard, Users, BanknoteArrowUp, ScrollText, ClockFading, Wallet, HandCoins, Images, ChartNoAxesCombined, TimerReset, Blocks, NotebookPen, Workflow, ReceiptIndianRupee, Upload } from "lucide-react"
import { AuditReports } from "./nav-auditReport"
import { SystemNav } from "./nav-system"


// This is sample data.
const data = {


  teams: [
    {
      name: "BSNPM",
      logo: (
        <GalleryVerticalEndIcon
        />
      ),
      plan: "Co-Oprative Socity",
    },
  ],

  navMain: [
    {
      title: "Overview",
      url: "/admin/dashboard",
      icon: (
        <LayoutDashboard />),
      isActive: true,
    },
    {
      title: "Members Directory",
      url: "/admin/dashboard/members",
      icon: (<Users />)
    },
    {
      title: "Investments Protfolio",
      url: "/admin/dashboard/investments",
      icon: (<BookOpenIcon />)
    },


  ],

  financialOperations: [
    {
      name: "Deposite Schemes",
      url: "/admin/dashboard/deposite-schemes",
      icon: (
        <BanknoteArrowUp
        />
      ),
    },
    {
      name: "Applicaions",
      url: "/admin/dashboard/deposite-applications",
      icon: (
        <ScrollText
        />
      ),
    },
    {
      name: "Renewals",
      url: "/admin/dashboard/deposite-renewals",
      icon: (
        <ClockFading
        />
      ),
    },
    {
      name: "Withdrawal Requests",
      url: "/admin/dashboard/withdrawal-requests",
      icon: (
        <Wallet
        />
      ),
    },
    {
      name: "Loan Managment",
      url: "#",
      icon: (
        <HandCoins
        />
      ),
      items: [
        {
          title: "Schemes",
          url: "/admin/dashboard/loan",
        },
        {
          title: "EMI Schedules",
          url: "/admin/dashboard/loan/emi-schedules",
        },
        {
          title: "Loan Applicaions",
          url: "/admin/dashboard/loan/applications",
        },
        {
          title: "Overdues & Recovery",
          url: "/admin/dashboard/loan/overdues-recovery"
        },
        {
          title: " Recovery Notices",
          url: "/admin/dashboard/loan/recovery-notices"
        },

      ],
    },

  ],

  auditReports: [

    {
      name: "Payment History",
      url: "/admin/dashboard/payments-history",
      icon: (
        <TimerReset
        />
      ),
    },
    {
      name: "Dividend Distribution",
      url: "/admin/dashboard/dividend-distribution",
      icon: (
        <Blocks
        />
      ),
    },
    {
      name: "Data Entry",
      url: "/admin/dashboard/data-entry",
      icon: (
        <NotebookPen
        />
      ),
    },
    {
      name: "Trial Balance",
      url: "/admin/dashboard/trial-balance",
      icon: (
        <Workflow
        />
      ),
    },
    {
      name: "Balance Sheet",
      url: "#",
      icon: (
        <ReceiptIndianRupee
        />
      ),

    },
  ],

  systems: [
    {
      name: "Communications",
      url: "#",
      icon: (
        <BanknoteArrowUp
        />
      ),
      items: [
        {
          title: "Notice Board",
          url: "/admin/dashboard/communications/notices",
        },
        {
          title: "AGM / EGM",
          url: "/admin/dashboard/communications/agm-egm",
        },
        {
          title: "Meeting Minutes",
          url: "/admin/dashboard/communications/minutes-of-meeting",
        },
        {
          title: "Complains",
          url: "/admin/dashboard/communications/complains"
        },
        {
          title: "Helps Desk",
          url: "/admin/dashboard/communications/help-desk"
        },

      ],
    },
    {
      name: "Uploads",
      url: "/admin/dashboard/uploads",
      icon: (
        <Upload
        />
      ),
    },
    {
      name: "Gallery",
      url: "/admin/dashboard/gallery",
      icon: (
        <Images
        />
      ),
    },
    {
      name: "Analytics Hub",
      url: "/admin/dashboard/analytics",
      icon: (
        <ChartNoAxesCombined
        />
      ),
    },

  ],


}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="border-b ">
        <SidebarProfileHeader teams={data.teams} />
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={data.navMain} />
        <FinancialOperations financialOperations={data.financialOperations} />
        <AuditReports auditReports={data.auditReports} />
        <SystemNav systems={data.systems} />
      </SidebarContent>

      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />

    </Sidebar>
  )
}
