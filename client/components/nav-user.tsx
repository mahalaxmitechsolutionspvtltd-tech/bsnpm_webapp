"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "@/components/ui/sidebar"
import { useAuth } from "@/Context/AuthProvider"
import {
    BellIcon,
    ChevronsUpDownIcon,
    Loader2,
    LogOutIcon,
} from "lucide-react"

type AdminUser = {
    id: number
    admin_id: string
    admin_name: string
    admin_email: string
    admin_mobile: string
    profile_photo: string | null
    status: string
}

type SanchalakUser = {
    id: number
    sanchalak_id: string
    sanchalak_name: string
    sanchalak_email: string
    sanchalak_mobile: string
    profile_photo: string | null
    status: string
}

type NavAuthUser = AdminUser | SanchalakUser | null

type NavUserDetails = {
    name: string
    email: string
    mobile: string
    profilePhoto: string
    role: string
    fallback: string
}

const isAdminUser = (user: NavAuthUser): user is AdminUser => {
    return Boolean(user && "admin_name" in user)
}

const isSanchalakUser = (user: NavAuthUser): user is SanchalakUser => {
    return Boolean(user && "sanchalak_name" in user)
}

export function NavUser() {
    const { user, logout } = useAuth()
    const { isMobile } = useSidebar()
    const router = useRouter()
    const [isLoggingOut, setIsLoggingOut] = useState(false)

    const navUser = useMemo<NavUserDetails | null>(() => {
        const authUser = user as NavAuthUser

        if (isAdminUser(authUser)) {
            const name = authUser.admin_name?.trim() ?? ""
            const email = authUser.admin_email?.trim() ?? ""
            const mobile = authUser.admin_mobile?.trim() ?? ""
            const fallbackSource = name || email || mobile

            if (!fallbackSource) {
                return null
            }

            return {
                name,
                email,
                mobile,
                profilePhoto: authUser.profile_photo || "",
                role: "Admin",
                fallback: fallbackSource.slice(0, 1).toUpperCase(),
            }
        }

        if (isSanchalakUser(authUser)) {
            const name = authUser.sanchalak_name?.trim() ?? ""
            const email = authUser.sanchalak_email?.trim() ?? ""
            const mobile = authUser.sanchalak_mobile?.trim() ?? ""
            const fallbackSource = name || email || mobile

            if (!fallbackSource) {
                return null
            }

            return {
                name,
                email,
                mobile,
                profilePhoto: authUser.profile_photo || "",
                role: "Sanchalak",
                fallback: fallbackSource.slice(0, 1).toUpperCase(),
            }
        }

        return null
    }, [user])

    const handleLogout = async () => {
        if (isLoggingOut) return

        setIsLoggingOut(true)

        try {
            await logout()
            router.replace("/")
            router.refresh()
        } catch {
            router.replace("/")
            router.refresh()
        } finally {
            setIsLoggingOut(false)
        }
    }

    if (!navUser) {
        return (
            <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton
                        size="lg"
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="justify-start"
                    >
                        {isLoggingOut ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <LogOutIcon className="h-4 w-4" />
                        )}
                        <span>{isLoggingOut ? "Logging out..." : "Log out"}</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
        )
    }

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size="lg"
                            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                        >
                            <Avatar className="h-8 w-8 rounded-lg">
                                <AvatarImage src={navUser.profilePhoto} alt={navUser.name} />
                                <AvatarFallback className="rounded-full text-lg font-bold uppercase">
                                    {navUser.fallback}
                                </AvatarFallback>
                            </Avatar>

                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-medium">
                                    {navUser.name}
                                </span>
                                <span className="truncate text-xs text-muted-foreground">
                                    {navUser.email || navUser.role}
                                </span>
                            </div>

                            <ChevronsUpDownIcon className="ml-auto size-4" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent
                        className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg bg-card"
                        side={isMobile ? "bottom" : "right"}
                        align="end"
                        sideOffset={4}
                    >
                        <DropdownMenuLabel className="p-0 font-normal">
                            <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                                <Avatar className="h-8 w-8 rounded-lg">
                                    <AvatarImage src={navUser.profilePhoto} alt={navUser.name} />
                                    <AvatarFallback className="rounded-full text-lg font-bold uppercase text-foreground">
                                        {navUser.fallback}
                                    </AvatarFallback>
                                </Avatar>

                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-medium">
                                        {navUser.name}
                                    </span>
                                    <span className="truncate text-xs text-muted-foreground">
                                        {navUser.email || navUser.role}
                                    </span>
                                </div>
                            </div>
                        </DropdownMenuLabel>

                        <DropdownMenuSeparator />

                        <DropdownMenuGroup>
                            <DropdownMenuItem>
                                <BellIcon className="h-4 w-4" />
                                Notifications
                            </DropdownMenuItem>
                        </DropdownMenuGroup>

                        <DropdownMenuSeparator />

                        <DropdownMenuItem onClick={handleLogout} disabled={isLoggingOut}>
                            {isLoggingOut ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <LogOutIcon className="h-4 w-4" />
                            )}
                            {isLoggingOut ? "Logging out..." : "Log out"}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    )
}