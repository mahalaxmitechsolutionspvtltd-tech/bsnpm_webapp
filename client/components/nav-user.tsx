"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { useAuth } from "@/providers/auth-provider"
import {
  ChevronsUpDownIcon,
  SparklesIcon,
  BadgeCheckIcon,
  CreditCardIcon,
  BellIcon,
  LogOutIcon,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react"
import { LogoutHandler } from "@/services/memberHandler"

type LogoutResult = {
  success: boolean
  message: string
}

export function NavUser() {
  const { user } = useAuth()
  const { isMobile } = useSidebar()
  const router = useRouter()

  const [openLogoutDialog, setOpenLogoutDialog] = useState(false)
  const [logoutError, setLogoutError] = useState<string>("")
  const [logoutSuccess, setLogoutSuccess] = useState(false)

  const {
    refetch: triggerLogout,
    isFetching: isLoggingOut,
  } = useQuery<LogoutResult>({
    queryKey: ["member-logout"],
    queryFn: async () => {
      const response = await LogoutHandler()
      return response ?? { success: true, message: "Logout successful" }
    },
    enabled: false,
    retry: false,
    refetchOnWindowFocus: false,
  })

  const handleLogout = async () => {
    setLogoutError("")
    setLogoutSuccess(false)
    setOpenLogoutDialog(true)

    try {
      const result = await triggerLogout()

      if (result.error) {
        const message =
          result.error instanceof Error
            ? result.error.message
            : "Logout failed. Please try again."
        setLogoutError(message)

        setTimeout(() => {
          setOpenLogoutDialog(false)
          setLogoutError("")
        }, 1800)

        return
      }

      localStorage.removeItem("bsnpm_auth_user")
      localStorage.removeItem("bsnpm_auth_token")
      sessionStorage.removeItem("bsnpm_auth_user")
      sessionStorage.removeItem("bsnpm_auth_token")

      setLogoutSuccess(true)

      setTimeout(() => {
        router.replace("/")
        router.refresh()
      }, 900)
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Logout failed. Please try again."

      setLogoutError(message)

      setTimeout(() => {
        setOpenLogoutDialog(false)
        setLogoutError("")
      }, 1800)
    }
  }

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src="" alt={user?.admin_name ?? "User"} />
                  <AvatarFallback className="rounded-full capitalize text-2xl font-bold">
                    {user?.admin_name?.slice(0, 1) ?? "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">
                    {user?.admin_name}
                  </span>
                  <span className="truncate text-xs">
                    {user?.admin_email}
                  </span>
                </div>
                <ChevronsUpDownIcon className="ml-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              className="w-(--radix-dropdown-menu-trigger-width) bg-card min-w-56 rounded-lg"
              side={isMobile ? "bottom" : "right"}
              align="end"
              sideOffset={4}
            >
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src="" alt={user?.admin_name ?? "User"} />
                    <AvatarFallback className="rounded-full capitalize text-2xl text-foreground font-bold">
                      {user?.admin_name?.slice(0, 1) ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">
                      {user?.admin_name}
                    </span>
                    <span className="truncate text-xs">
                      {user?.admin_email}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator />

              <DropdownMenuGroup>
              
                <DropdownMenuItem>
                  <BellIcon />
                  Notifications
                </DropdownMenuItem>
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={handleLogout} disabled={isLoggingOut}>
                <LogOutIcon />
                {isLoggingOut ? "Logging out..." : "Log out"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <Dialog open={openLogoutDialog}>
        <DialogContent className="sm:max-w-md [&>button]:hidden">
          <DialogHeader>
            <DialogTitle>
              {logoutError
                ? "Logout failed"
                : logoutSuccess
                  ? "Logout successful"
                  : "Logging out"}
            </DialogTitle>
            <DialogDescription>
              {logoutError
                ? logoutError
                : logoutSuccess
                  ? "You have been logged out successfully. Redirecting to home page."
                  : "Please wait while we securely log you out of your account."}
            </DialogDescription>
          </DialogHeader>

          {!logoutError && !logoutSuccess && (
            <div className="flex flex-col items-center justify-center gap-4 py-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border bg-muted">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
              <p className="text-sm text-muted-foreground">
                Logging out...
              </p>
            </div>
          )}

          {logoutSuccess && !logoutError && (
            <div className="flex flex-col items-center justify-center gap-4 py-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-green-200 bg-green-50 text-green-600">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <p className="text-sm text-muted-foreground">
                Redirecting...
              </p>
            </div>
          )}

          {logoutError && (
            <div className="py-4">
              <div className="flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{logoutError}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}