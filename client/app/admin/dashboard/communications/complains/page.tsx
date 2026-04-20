"use client"
"use no memo"

import { useMemo, useState } from "react"
import {
    ColumnDef,
    ColumnFiltersState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    useReactTable,
} from "@tanstack/react-table"
import { useQuery } from "@tanstack/react-query"
import { format } from "date-fns"
import { SquareArrowOutUpRight } from "lucide-react"
import {
    getComplaintsHandler,
} from "@/services/complaintHandler"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import Filter from "@/components/ui/filter"
import ComplaintDetailsDialog from "./ComplaintDetailsDialog"
import { ComplaintItem } from "@/types/complainsTypes"

declare module "@tanstack/react-table" {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface ColumnMeta<TData, TValue> {
        filterVariant?: "text" | "range" | "select"
    }
}

function formatDateTime(value?: string | null) {
    if (!value) return "-"
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return "-"
    return format(date, "yyyy-MM-dd HH:mm")
}

function getStatusBadgeClass(status: string) {
    const value = status.trim().toLowerCase()

    if (["closed", "resolved"].includes(value)) {
        return "border-emerald-200 bg-emerald-50 text-emerald-700"
    }

    if (["pending", "in progress", "inprogress"].includes(value)) {
        return "border-amber-200 bg-amber-50 text-amber-700"
    }

    if (["replied"].includes(value)) {
        return "border-indigo-200 bg-indigo-50 text-indigo-700"
    }

    return "border-slate-200 bg-slate-50 text-slate-700"
}

export default function ComplaintsPage() {
    const [selectedComplaintId, setSelectedComplaintId] = useState<number | null>(null)
    const [detailsOpen, setDetailsOpen] = useState(false)
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

    const { data, isLoading } = useQuery({
        queryKey: ["complaints"],
        queryFn: () =>
            getComplaintsHandler({
                per_page: 100,
            }),
    })

    const complaints = useMemo<ComplaintItem[]>(() => {
        return data?.data ?? []
    }, [data])

    const openComplaint = (complaintId: number) => {
        setSelectedComplaintId(complaintId)
        setDetailsOpen(true)
    }

    const columns: ColumnDef<ComplaintItem>[] = [
        {
            id: "search",
            accessorFn: (row) =>
                [
                    row.member_name ?? "",
                    row.member_id ?? "",
                    row.subject ?? "",
                ].join(" "),
            header: "SEARCH",
            cell: () => null,
            meta: {
                filterVariant: "text",
            },
        },
        {
            accessorKey: "member_id",
            header: "Member id",
            cell: ({ row }) => (
                <div className="font-semibold text-foreground">
                    {row.original.member_id}
                </div>
            ),
        },
        {
            id: "member",
            header: "Member Name",
            cell: ({ row }) => (
                <div className="space-y-1">
                    <p className="font-medium text-foreground">
                        {row.original.member_name || `Member ID: ${row.original.member_id || "-"}`}
                    </p>
                </div>
            ),
        },
        {
            accessorKey: "subject",
            header: "Subject",
            cell: ({ row }) => (
                <div className="font-medium text-foreground">
                    {row.original.subject || "-"}
                </div>
            ),
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => (
                <Badge
                    variant="outline"
                    className={`rounded-full ${getStatusBadgeClass(row.original.status || "")}`}
                >
                    {row.original.status || "-"}
                </Badge>
            ),
            meta: {
                filterVariant: "select",
            },
        },
        {
            accessorKey: "created_at",
            header: "Created",
            cell: ({ row }) => (
                <div className="text-foreground">
                    {formatDateTime(row.original.created_at)}
                </div>
            ),
        },
       
    ]

    // eslint-disable-next-line react-hooks/incompatible-library
    const table = useReactTable({
        data: complaints,
        columns,
        state: {
            columnFilters,
            columnVisibility: {
                search: false,
            },
        },
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        initialState: {
            pagination: {
                pageSize: 10,
            },
        },
    })

    return (
        <div className="space-y-6 mt-5">
            <div className="">
                <div className="grid w-full gap-4 md:grid-cols-2 lg:max-w-2xl">
                    <div className="space-y-2">      
                        <Filter column={table.getColumn("search")!} />
                    </div>

                    <div className="space-y-2">
                        <Filter column={table.getColumn("status")!} />
                    </div>
                </div>
            </div>

            <div className="overflow-hidden rounded-2xl border bg-background">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id} className="bg-slate-50/70">
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
                            Array.from({ length: 10 }).map((_, index) => (
                                <TableRow key={index}>
                                    <TableCell><Skeleton className="h-5 w-10 rounded-md" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-full rounded-md" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-full rounded-md" /></TableCell>
                                    <TableCell><Skeleton className="h-8 w-28 rounded-md" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-32 rounded-md" /></TableCell>
                                    <TableCell><Skeleton className="ml-auto h-9 w-24 rounded-md" /></TableCell>
                                </TableRow>
                            ))
                        ) : table.getRowModel().rows.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    className="cursor-pointer"
                                    onClick={() => openComplaint(row.original.id)}
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
                                <TableCell colSpan={columns.length - 1} className="h-28 text-center">
                                    <div className="flex items-center justify-center text-muted-foreground">
                                        No complaints found.
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>

                {!isLoading && complaints.length ? (
                    <div className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="text-sm text-muted-foreground">
                            Showing{" "}
                            {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}
                            {" "}to{" "}
                            {Math.min(
                                (table.getState().pagination.pageIndex + 1) *
                                    table.getState().pagination.pageSize,
                                table.getFilteredRowModel().rows.length
                            )}
                            {" "}of {table.getFilteredRowModel().rows.length}
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="rounded-xl"
                                onClick={() => table.previousPage()}
                                disabled={!table.getCanPreviousPage()}
                            >
                                Previous
                            </Button>

                            <div className="text-sm font-medium text-foreground">
                                Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                            </div>

                            <Button
                                variant="outline"
                                size="sm"
                                className="rounded-xl"
                                onClick={() => table.nextPage()}
                                disabled={!table.getCanNextPage()}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                ) : null}
            </div>

            <ComplaintDetailsDialog
                complaintId={selectedComplaintId}
                open={detailsOpen}
                onOpenChange={(open) => {
                    setDetailsOpen(open)
                    if (!open) {
                        setSelectedComplaintId(null)
                    }
                }}
            />
        </div>
    )
}