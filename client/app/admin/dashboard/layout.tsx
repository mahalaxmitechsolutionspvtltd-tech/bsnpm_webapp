'use client'


import { AppSidebar } from "@/components/app-sidebar";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { usePathname } from "next/navigation";


const queryClient = new QueryClient();

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const currentPath = pathname.split("/").filter(Boolean).pop() || ""



    return (
        <QueryClientProvider client={queryClient}>
            <TooltipProvider delayDuration={1}>
                <SidebarProvider>
                    <AppSidebar />
                    <SidebarInset>
                        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
                            <div className="flex items-center gap-2 px-4">
                                <SidebarTrigger className="-ml-1" />
                                <Separator
                                    orientation="vertical"
                                    className="mr-2 my-auto data-[orientation=vertical]:h-6"
                                />
                                <Breadcrumb>
                                    <BreadcrumbList>
                                        <BreadcrumbItem className="hidden md:block">
                                            <BreadcrumbLink href="#">
                                                Dashboard
                                            </BreadcrumbLink>
                                        </BreadcrumbItem>
                                        <BreadcrumbSeparator />
                                        {
                                            currentPath == "dashboard" ?
                                                <BreadcrumbItem className="hidden md:block">
                                                    <BreadcrumbLink className=" capitalize" href="#">
                                                        Overview
                                                    </BreadcrumbLink>
                                                </BreadcrumbItem>
                                                :
                                                <BreadcrumbItem className="hidden md:block">
                                                    <BreadcrumbLink className="text-blue-600 font-medium capitalize" href="./">
                                                        {currentPath}
                                                    </BreadcrumbLink>
                                                </BreadcrumbItem>
                                        }
                                    </BreadcrumbList>
                                </Breadcrumb>
                            </div>
                        </header>
                        <main className="  container mx-auto lg:max-w-8xl">
                            {children}
                        </main>
                    </SidebarInset>
                </SidebarProvider>
            </TooltipProvider>

        </QueryClientProvider>

    )

}