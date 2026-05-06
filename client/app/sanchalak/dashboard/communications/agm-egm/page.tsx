"use client"
"use no memo"

import {
    ColumnDef,
    ColumnFiltersState,
    FilterFn,
    SortingState,
    flexRender,
    getCoreRowModel,
    getFacetedMinMaxValues,
    getFacetedRowModel,
    getFacetedUniqueValues,
    getFilteredRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table"
import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import {
    Bell,
    CalendarDays,
    Megaphone,
    Send,
    Trash2,
} from "lucide-react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import Filter from "@/components/ui/filter"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "sonner"
import { useAuth } from "@/Context/AuthProvider"
import {
    AgmEgmNoticeItem,
    createAgmEgmNoticeHandler,
    deleteAgmEgmNoticeHandler,
    getAgmEgmNoticesHandler,
    publishAgmEgmNoticeHandler,
} from "@/services/agmEgmNoticeHandler"
import AddAgmNoticeDialog, { AddNoticeFormValues } from "./AddAgmNoticeDialog"
import ViewAgmNoticeDialog from "./ViewAgmNoticeDialog"

type HandlerErrorShape = {
    message?: string
    response?: {
        data?: {
            message?: string
        }
    }
}

const normalizeValue = (value: unknown) => String(value ?? "").trim().toLowerCase()

const noticeSearchFilter: FilterFn<AgmEgmNoticeItem> = (row, _columnId, filterValue) => {
    const search = normalizeValue(filterValue)

    if (!search) return true

    const type = normalizeValue(row.original.type)
    const audience = normalizeValue(row.original.audience)
    const title = normalizeValue(row.original.title)
    const createdBy = normalizeValue(row.original.created_by)

    return (
        type.includes(search) ||
        audience.includes(search) ||
        title.includes(search) ||
        createdBy.includes(search)
    )
}

const exactSelectFilter: FilterFn<AgmEgmNoticeItem> = (row, columnId, filterValue) => {
    const selected = normalizeValue(filterValue)

    if (!selected) return true

    const cellValue = normalizeValue(row.getValue(columnId))

    return cellValue === selected
}

function getErrorMessage(error: unknown, fallback: string) {
    const typedError = error as HandlerErrorShape
    return typedError?.response?.data?.message || typedError?.message || fallback
}

function formatDateTime(value?: string | null) {
    if (!value) return "-"
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return "-"
    return format(date, "dd-MM-yyyy hh:mm a")
}

function PublishNoticeAction({ notice }: { notice: AgmEgmNoticeItem }) {
    const queryClient = useQueryClient()
    const { user } = useAuth()

    const publishMutation = useMutation({
        mutationFn: () =>
            publishAgmEgmNoticeHandler(notice.id, {
                updated_by: user?.admin_name ? String(user.admin_name) : undefined,
            }),
        onSuccess: async () => {
            toast.success("Notice published successfully")
            await queryClient.invalidateQueries({ queryKey: ["agm-egm-notices"] })
        },
        onError: (error: unknown) => {
            toast.error(getErrorMessage(error, "Failed to publish notice"))
        },
    })

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button
                    size="sm"
                    variant="outline"
                    className="h-9 rounded-xl border-border bg-background px-3 shadow-sm hover:bg-muted"
                    disabled={Boolean(notice.is_published)}
                    onClick={(event) => event.stopPropagation()}
                >
                    {notice.is_published ? (
                        "Published"
                    ) : (
                        <Send size={14} />
                    )}
                </Button>
            </DialogTrigger>

            <DialogContent className="overflow-hidden rounded-xl border-0 p-0 shadow-2xl sm:max-w-lg">
                <div className="border-b bg-linear-to-r from-slate-50 to-zinc-50 px-6 py-5">
                    <DialogHeader className="space-y-3">
                        <div className="flex items-start gap-3">
                            <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                <Megaphone size={20} />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-semibold text-foreground">
                                    Publish Notice
                                </DialogTitle>
                                <DialogDescription className="mt-1 text-sm text-muted-foreground">
                                    This will make the notice live for the selected audience.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                </div>

                <div className="space-y-4 p-6">
                    <div className="rounded-xl border bg-background p-4">
                        <p className="text-sm text-muted-foreground">Title</p>
                        <p className="mt-1 font-semibold text-foreground">{notice.title || "-"}</p>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="rounded-xl border bg-background p-4">
                            <p className="text-sm text-muted-foreground">Type</p>
                            <p className="mt-1 font-semibold text-foreground">{notice.type || "-"}</p>
                        </div>

                        <div className="rounded-xl border bg-background p-4">
                            <p className="text-sm text-muted-foreground">Audience</p>
                            <p className="mt-1 font-semibold capitalize text-foreground">
                                {notice.audience || "-"}
                            </p>
                        </div>
                    </div>
                </div>

                <DialogFooter className="gap-2 border-t bg-muted/20 px-6 py-4 sm:justify-end">
                    <DialogClose asChild>
                        <Button variant="outline" className="rounded-xl">
                            Cancel
                        </Button>
                    </DialogClose>

                    <Button
                        className="rounded-xl"
                        onClick={() => publishMutation.mutate()}
                        disabled={publishMutation.isPending || Boolean(notice.is_published)}
                    >
                        {publishMutation.isPending ? <Spinner /> : <Send size={14} />}
                        Publish
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
function DeleteNoticeAction({ notice }: { notice: AgmEgmNoticeItem }) {
    const queryClient = useQueryClient()
    const { user } = useAuth()

    const deleteMutation = useMutation({
        mutationFn: () =>
            deleteAgmEgmNoticeHandler(
                notice.id,
                user?.admin_name ? String(user.admin_name) : undefined
            ),
        onSuccess: async () => {
            toast.success("Notice deleted successfully")
            await queryClient.invalidateQueries({ queryKey: ["agm-egm-notices"] })
        },
        onError: (error: unknown) => {
            toast.error(getErrorMessage(error, "Failed to delete notice"))
        },
    })

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button
                    size="sm"
                    variant="outline"
                    className="h-9 rounded-xl border-destructive/20 bg-background px-3 text-destructive shadow-sm hover:bg-destructive/5"
                    onClick={(event) => event.stopPropagation()}
                >
                    <Trash2 size={14} />
                    Delete
                </Button>
            </DialogTrigger>

            <DialogContent className="overflow-hidden rounded-xl border-0 p-0 shadow-2xl sm:max-w-lg">
                <div className="border-b bg-linear-to-r from-rose-50 to-white px-6 py-5">
                    <DialogHeader className="space-y-3">
                        <div className="flex items-start gap-3">
                            <div className="flex size-11 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                                <Trash2 size={20} />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-semibold text-foreground">
                                    Delete Notice
                                </DialogTitle>
                                <DialogDescription className="mt-1 text-sm text-muted-foreground">
                                    This action will remove the notice from the active listing.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                </div>

                <div className="space-y-4 p-6">
                    <div className="rounded-xl border bg-background p-4">
                        <p className="text-sm text-muted-foreground">Notice</p>
                        <p className="mt-1 font-semibold text-foreground">{notice.title || "-"}</p>
                    </div>
                </div>

                <DialogFooter className="gap-2 border-t bg-muted/20 px-6 py-4 sm:justify-end">
                    <DialogClose asChild>
                        <Button variant="outline" className="rounded-xl">
                            Cancel
                        </Button>
                    </DialogClose>

                    <Button
                        variant="destructive"
                        className="rounded-xl"
                        onClick={() => deleteMutation.mutate()}
                        disabled={deleteMutation.isPending}
                    >
                        {deleteMutation.isPending ? <Spinner /> : <Trash2 size={14} />}
                        Delete
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default function AGMNotices() {
    const queryClient = useQueryClient()
    const { user } = useAuth()
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const [sorting, setSorting] = useState<SortingState>([
        { id: "meeting_at", desc: true },
    ])
    const [selectedNotice, setSelectedNotice] = useState<AgmEgmNoticeItem | null>(null)
    const [viewOpen, setViewOpen] = useState(false)

    const { data, isLoading } = useQuery({
        queryKey: ["agm-egm-notices"],
        queryFn: () => getAgmEgmNoticesHandler({ per_page: 100 }),
    })

    const createNoticeMutation = useMutation({
        mutationFn: async (values: AddNoticeFormValues) => {
            return createAgmEgmNoticeHandler({
                type: values.type,
                audience: values.audience,
                title: values.title,
                meeting_at: values.meeting_at,
                is_published: values.is_published,
                is_drafted: values.is_drafted,
                publish_date: values.publish_date,
                attachment_file: values.attachment_file,
                created_by: user?.admin_name ? String(user.admin_name) : undefined,
            })
        },
        onSuccess: async () => {
            toast.success("Notice added successfully")
            await queryClient.invalidateQueries({ queryKey: ["agm-egm-notices"] })
        },
        onError: (error: unknown) => {
            toast.error(getErrorMessage(error, "Failed to add notice"))
        },
    })

    const notices = data?.data ?? []

    const columns: ColumnDef<AgmEgmNoticeItem>[] = [
        {
            header: "Type",
            accessorKey: "type",
            filterFn: exactSelectFilter,
            cell: ({ row }) => {
                const type = String(row.getValue("type") ?? "-")
                return (
                    <Badge
                        variant="outline"
                        className={
                            type === "AGM"
                                ? "rounded-full border-blue-200 bg-blue-50 text-blue-700"
                                : "rounded-full border-violet-200 bg-violet-50 text-violet-700"
                        }
                    >
                        {type}
                    </Badge>
                )
            },
            meta: {
                filterVariant: "select",
            },
        },
        {
            header: "Audience",
            accessorKey: "audience",
            filterFn: exactSelectFilter,
            cell: ({ row }) => (
                <div className="capitalize">{String(row.getValue("audience") ?? "-")}</div>
            ),
            meta: {
                filterVariant: "select",
            },
        },
        {
            header: "Title",
            accessorKey: "title",
            filterFn: noticeSearchFilter,
            cell: ({ row }) => (
                <div className="min-w-[260px] font-medium text-foreground">
                    {String(row.getValue("title") ?? "-")}
                </div>
            ),
            meta: {
                filterVariant: "text",
            },
        },
        {
            header: "Meeting At",
            accessorKey: "meeting_at",
            cell: ({ row }) => (
                <div className="whitespace-nowrap">
                    {formatDateTime(String(row.getValue("meeting_at") ?? ""))}
                </div>
            ),
        },
        {
            header: "Status",
            accessorKey: "is_published",
            filterFn: exactSelectFilter,
            cell: ({ row }) => {
                const isPublished = Boolean(row.original.is_published)
                const isDrafted = Boolean(row.original.is_drafted)

                if (isPublished) {
                    return (
                        <Badge className="rounded-full bg-emerald-600 text-white hover:bg-emerald-600">
                            Published
                        </Badge>
                    )
                }

                if (isDrafted) {
                    return (
                        <Badge
                            variant="outline"
                            className="rounded-full border-amber-200 bg-amber-50 text-amber-700"
                        >
                            Draft
                        </Badge>
                    )
                }

                return (
                    <Badge
                        variant="outline"
                        className="rounded-full border-slate-200 bg-slate-50 text-slate-700"
                    >
                        Pending
                    </Badge>
                )
            },
            meta: {
                filterVariant: "select",
            },
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => {
                const notice = row.original

                return (
                    <div
                        className="flex items-center gap-2"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <PublishNoticeAction notice={notice} />
                        <DeleteNoticeAction notice={notice} />
                    </div>
                )
            },
        },
    ]

    const table = useReactTable({
        data: notices,
        columns,
        state: {
            sorting,
            columnFilters,
        },
        onColumnFiltersChange: setColumnFilters,
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
        getFacetedMinMaxValues: getFacetedMinMaxValues(),
        enableSortingRemoval: false,
    })

    const skeletonRows = Array.from({ length: 6 })

    return (
        <div className="overflow-hidden rounded-md">
          

            <div className="flex flex-col justify-between gap-3 px-2 py-4 lg:flex-row lg:items-center">
                <div className="flex flex-col gap-3 sm:flex-row">
                    <div className="w-full sm:w-80">
                        <Filter column={table.getColumn("title")!} />
                    </div>
                    <div className="w-full sm:w-40">
                        <Filter column={table.getColumn("type")!} />
                    </div>
                    <div className="w-full sm:w-44">
                        <Filter column={table.getColumn("audience")!} />
                    </div>
                    <div className="w-full sm:w-40">
                        <Filter column={table.getColumn("is_published")!} />
                    </div>
                </div>

                <div className="my-auto">
                    <AddAgmNoticeDialog
                        onSubmit={async (values) => {
                            await createNoticeMutation.mutateAsync(values)
                        }}
                        isPending={createNoticeMutation.isPending}
                    />
                </div>
            </div>

            <div className="rounded-lg border border-border bg-background">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id}>
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                  header.column.columnDef.header,
                                                  header.getContext()
                                              )}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>

                    <TableBody>
                        {isLoading ? (
                            skeletonRows.map((_, rowIndex) => (
                                <TableRow key={`skeleton-row-${rowIndex}`}>
                                    {columns.map((column, columnIndex) => (
                                        <TableCell key={`skeleton-cell-${rowIndex}-${columnIndex}`}>
                                            <Skeleton className="h-5 w-full rounded-md" />
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                    className="cursor-pointer"
                                    onClick={() => {
                                        setSelectedNotice(row.original)
                                        setViewOpen(true)
                                    }}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-28 text-center">
                                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                                        <CalendarDays size={18} />
                                        <span>No notices found.</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {selectedNotice ? (
                <ViewAgmNoticeDialog
                    notice={selectedNotice}
                    open={viewOpen}
                    onOpenChange={(nextOpen) => {
                        setViewOpen(nextOpen)
                        if (!nextOpen) {
                            setSelectedNotice(null)
                        }
                    }}
                />
            ) : null}
        </div>
    )
}