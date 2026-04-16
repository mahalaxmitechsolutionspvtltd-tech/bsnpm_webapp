"use client"

import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
    Bell,
    FileText,
    Filter,
    Loader2,
    Megaphone,
    Pencil,
    Plus,
    Search,
    Trash2,
    TriangleAlert,
    Users,
} from "lucide-react"
import { format } from "date-fns"
import { deleteHandler, getNoticeHandler } from "@/services/noticHandler"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardHeader,
} from "@/components/ui/card"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Avatar,
    AvatarFallback,
} from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { NoticeItem } from "@/types/noticesType"
import EditNoticeDialog from "./EditNotice"

type AudienceOption = "ALL" | string

type DeleteNoticeError = {
    message?: string
    errors?: Record<string, string[] | string>
}

function formatDateTime(value?: string | null) {
    if (!value) return "—"
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return "—"
    return format(date, "dd-MM-yyyy hh:mm a")
}

function getAudienceIcon(audience?: string) {
    const normalized = (audience || "").toUpperCase()
    if (normalized.includes("TEAM")) return Users
    if (normalized.includes("GENERAL")) return Megaphone
    if (normalized.includes("SANCHALAK")) return Users
    if (normalized.includes("ADMIN")) return Users
    if (normalized.includes("MEMBER")) return Users
    return FileText
}

function getAudienceStyles(audience?: string) {
    const normalized = (audience || "").toUpperCase()
    if (normalized.includes("TEAM")) {
        return {
            wrapper: "bg-violet-50 text-violet-700 ring-violet-200",
            icon: "bg-violet-500 text-white",
            badge: "border-violet-200 bg-violet-50 text-violet-700",
        }
    }
    if (normalized.includes("GENERAL")) {
        return {
            wrapper: "bg-amber-50 text-amber-700 ring-amber-200",
            icon: "bg-amber-500 text-white",
            badge: "border-amber-200 bg-amber-50 text-amber-700",
        }
    }
    if (normalized.includes("SANCHALAK")) {
        return {
            wrapper: "bg-emerald-50 text-emerald-700 ring-emerald-200",
            icon: "bg-emerald-500 text-white",
            badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
        }
    }
    if (normalized.includes("ADMIN")) {
        return {
            wrapper: "bg-blue-50 text-blue-700 ring-blue-200",
            icon: "bg-blue-500 text-white",
            badge: "border-blue-200 bg-blue-50 text-blue-700",
        }
    }
    if (normalized.includes("MEMBER")) {
        return {
            wrapper: "bg-orange-50 text-orange-700 ring-orange-200",
            icon: "bg-orange-500 text-white",
            badge: "border-orange-200 bg-orange-50 text-orange-700",
        }
    }
    return {
        wrapper: "bg-blue-50 text-blue-700 ring-blue-200",
        icon: "bg-blue-500 text-white",
        badge: "border-blue-200 bg-blue-50 text-blue-700",
    }
}

function buildAudienceOptions(items: NoticeItem[]) {
    const unique = Array.from(
        new Set(
            items
                .map((item) => (item.audience || "").trim())
                .filter(Boolean)
                .map((item) => item.toUpperCase())
        )
    )
    return ["ALL", ...unique]
}

function NoticeRow({
    notice,
    onEdit,
    onDelete,
}: {
    notice: NoticeItem
    onEdit: (notice: NoticeItem) => void
    onDelete: (notice: NoticeItem) => void
}) {
    const Icon = getAudienceIcon(notice.audience)
    const styles = getAudienceStyles(notice.audience)
    const publishAt = formatDateTime(notice.publish_at)
    const expireAt = formatDateTime(notice.expire_at)

    return (
        <div className="rounded-xl border bg-background px-4 py-3 transition-all duration-200 hover:bg-muted/30">
            <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 flex-1 items-start gap-3">
                    <Avatar className={cn("mt-0.5 h-10 w-10 ring-2", styles.wrapper)}>
                        <AvatarFallback className={cn("font-semibold", styles.icon)}>
                            <Icon className="h-4 w-4" />
                        </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="min-w-0">
                            <h3 className="truncate text-sm font-semibold text-foreground">
                                {notice.title || "Untitled Notice"}
                            </h3>
                            <p className="mt-0.5 break-words whitespace-pre-line text-[13px] leading-5 text-muted-foreground">
                                {notice.message || "No message available"}
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                            <Badge variant="outline" className={cn("h-7 rounded-full px-2.5 text-xs font-medium", styles.badge)}>
                                {notice.audience || "GENERAL"}
                            </Badge>

                            <Badge variant="secondary" className="h-7 rounded-full px-2.5 text-xs font-medium">
                                Published: {publishAt}
                            </Badge>

                            <Badge variant="secondary" className="h-7 rounded-full px-2.5 text-xs font-medium">
                                Expires: {expireAt}
                            </Badge>
                        </div>
                    </div>
                </div>

                <div className="my-auto flex shrink-0 items-center gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 rounded-lg p-0"
                        onClick={() => onEdit(notice)}
                    >
                        <Pencil className="h-3.5 w-3.5" />
                    </Button>

                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 rounded-lg p-0 text-destructive hover:text-destructive"
                        onClick={() => onDelete(notice)}
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                </div>
            </div>
        </div>
    )
}

function NoticeRowSkeleton() {
    return (
        <div className="rounded-xl border bg-background px-4 py-3">
            <div className="flex items-start justify-between gap-3">
                <div className="flex flex-1 items-start gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-56" />
                        <Skeleton className="h-3.5 w-full" />
                        <Skeleton className="h-3.5 w-[80%]" />
                        <div className="flex gap-2">
                            <Skeleton className="h-7 w-24 rounded-full" />
                            <Skeleton className="h-7 w-32 rounded-full" />
                            <Skeleton className="h-7 w-32 rounded-full" />
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Skeleton className="h-8 w-8 rounded-lg" />
                    <Skeleton className="h-8 w-8 rounded-lg" />
                </div>
            </div>
        </div>
    )
}

export default function NoticesPage() {
    const queryClient = useQueryClient()
    const [searchInput, setSearchInput] = React.useState("")
    const [search, setSearch] = React.useState("")
    const [audience, setAudience] = React.useState<AudienceOption>("ALL")
    const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false)
    const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false)
    const [selectedNotice, setSelectedNotice] = React.useState<NoticeItem | null>(null)
    const [deleteError, setDeleteError] = React.useState<DeleteNoticeError | null>(null)

    React.useEffect(() => {
        const timer = window.setTimeout(() => {
            setSearch(searchInput.trim())
        }, 400)

        return () => window.clearTimeout(timer)
    }, [searchInput])

    const noticeQuery = useQuery({
        queryKey: ["notices", { search, audience }],
        queryFn: async () => {
            const response = await getNoticeHandler({
                search: search || undefined,
                audience: audience !== "ALL" ? audience : undefined,
            })
            return response.data ?? []
        },
    })

    const deleteNoticeMutation = useMutation({
        mutationFn: async () => {
            if (!selectedNotice?.id) {
                throw {
                    message: "Notice id is required",
                    errors: {},
                }
            }
            return await deleteHandler(selectedNotice.id)
        },
        onSuccess: async () => {
            setDeleteError(null)
            setIsDeleteDialogOpen(false)
            setSelectedNotice(null)
            await queryClient.invalidateQueries({ queryKey: ["notices"] })
        },
        onError: (error: DeleteNoticeError) => {
            setDeleteError(error)
        },
    })

    const notices = noticeQuery.data ?? []
    const audienceOptions = buildAudienceOptions(notices)

    const handleEditOpen = (notice: NoticeItem) => {
        setSelectedNotice(notice)
        setIsEditDialogOpen(true)
    }

    const handleDeleteOpen = (notice: NoticeItem) => {
        setSelectedNotice(notice)
        setDeleteError(null)
        setIsDeleteDialogOpen(true)
    }

    const handleEditDialogChange = (open: boolean) => {
        setIsEditDialogOpen(open)
        if (!open) {
            setSelectedNotice(null)
        }
    }

    const handleDeleteDialogChange = (open: boolean) => {
        setIsDeleteDialogOpen(open)
        if (!open) {
            setSelectedNotice(null)
            setDeleteError(null)
            deleteNoticeMutation.reset()
        }
    }

    const handleDeleteConfirm = () => {
        setDeleteError(null)
        deleteNoticeMutation.mutate()
    }

    return (
        <>
            <div className="w-full px-3 py-3 md:px-5 lg:px-6">
                <div className="mx-auto w-full max-w-[1600px] space-y-4">
                    <Card className="overflow-hidden">
                        <CardHeader className="space-y-4 border-b bg-muted/20 px-4 py-4 md:px-5">
                            <div className="grid grid-cols-1 gap-2 md:grid-cols-[minmax(0,1fr)_180px_42px_auto]">
                                <div className="relative">
                                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        value={searchInput}
                                        onChange={(e) => setSearchInput(e.target.value)}
                                        placeholder="Search notifications..."
                                        className="h-9 rounded-lg pl-9 text-sm"
                                    />
                                </div>

                                <Select value={audience} onValueChange={(value) => setAudience(value)}>
                                    <SelectTrigger className="h-9 rounded-lg text-sm">
                                        <SelectValue placeholder="Audience" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {audienceOptions.map((option) => (
                                            <SelectItem key={option} value={option}>
                                                {option === "ALL" ? "All Audience" : option}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Button
                                    type="button"
                                    variant="outline"
                                    className="h-9 rounded-lg px-0"
                                    onClick={() => {
                                        setSearchInput("")
                                        setSearch("")
                                        setAudience("ALL")
                                    }}
                                >
                                    <Filter className="h-4 w-4" />
                                </Button>

                                <Button
                                    type="button"
                                    className="h-9 rounded-lg px-3 text-sm"
                                    onClick={() => setIsAddDialogOpen(true)}
                                >
                                    <Plus className="mr-1.5 h-4 w-4" />
                                    Add Notice
                                </Button>
                            </div>
                        </CardHeader>

                        <CardContent className="p-0">
                            {noticeQuery.isLoading ? (
                                <div className="space-y-3 p-4">
                                    {Array.from({ length: 6 }).map((_, index) => (
                                        <NoticeRowSkeleton key={index} />
                                    ))}
                                </div>
                            ) : noticeQuery.isError ? (
                                <div className="flex min-h-75 flex-col items-center justify-center px-5 py-10 text-center">
                                    <div className="mb-3 rounded-full bg-destructive/10 p-3 text-destructive">
                                        <Bell className="h-6 w-6" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-foreground">Failed to load notices</h3>
                                    <p className="mt-1.5 max-w-xl text-sm leading-6 text-muted-foreground">
                                        {(noticeQuery.error as { message?: string })?.message || "Something went wrong while fetching the notice list."}
                                    </p>
                                </div>
                            ) : notices.length === 0 ? (
                                <div className="flex min-h-75 flex-col items-center justify-center px-5 py-10 text-center">
                                    <div className="mb-3 rounded-full bg-muted p-3">
                                        <Bell className="h-6 w-6 text-muted-foreground" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-foreground">No notices found</h3>
                                    <p className="mt-1.5 max-w-xl text-sm leading-6 text-muted-foreground">
                                        No published notice matched your current search or audience filter.
                                    </p>
                                </div>
                            ) : (
                                <ScrollArea className="w-full">
                                    <div className="min-w-full space-y-3 p-4">
                                        {notices.map((notice) => (
                                            <NoticeRow
                                                key={String(notice.id)}
                                                notice={notice}
                                                onEdit={handleEditOpen}
                                                onDelete={handleDeleteOpen}
                                            />
                                        ))}
                                    </div>
                                </ScrollArea>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            <EditNoticeDialog
                open={isAddDialogOpen}
                onOpenChange={setIsAddDialogOpen}
                mode="add"
                notice={null}
            />

            <EditNoticeDialog
                open={isEditDialogOpen}
                onOpenChange={handleEditDialogChange}
                mode="edit"
                notice={selectedNotice}
            />

            <Dialog open={isDeleteDialogOpen} onOpenChange={handleDeleteDialogChange}>
                <DialogContent className="w-[95vw] max-w-md gap-0 overflow-hidden rounded-lg p-0">
                    <DialogHeader className="border-b px-5 py-4">
                        <DialogTitle className="text-xl font-semibold text-foreground">
                            Delete Notice
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-5 px-5 py-5">
                        <div className="flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-4">
                            <div className="mt-0.5 rounded-full bg-destructive/10 p-2 text-destructive">
                                <TriangleAlert className="h-5 w-5" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-foreground">
                                    Do you whant to delete this notice?
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {selectedNotice?.title
                                        ? `This notice will be removed permanently: ${selectedNotice.title}`
                                        : "This action cannot be undone."}
                                </p>
                            </div>
                        </div>

                        {deleteError?.message ? (
                            <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                                {deleteError.message}
                            </div>
                        ) : null}

                        <div className="flex items-center justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                className="h-10 rounded-lg px-4"
                                onClick={() => handleDeleteDialogChange(false)}
                                disabled={deleteNoticeMutation.isPending}
                            >
                                Cancel
                            </Button>

                            <Button
                                type="button"
                                variant="destructive"
                                className="h-10 rounded-lg px-4"
                                onClick={handleDeleteConfirm}
                                disabled={deleteNoticeMutation.isPending}
                            >
                                {deleteNoticeMutation.isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Deleting...
                                    </>
                                ) : (
                                    "Delete Notice"
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}