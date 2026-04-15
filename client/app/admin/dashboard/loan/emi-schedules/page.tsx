"use client"

import {
    ColumnDef,
    ColumnFiltersState,
    FilterFn,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    useReactTable,
} from "@tanstack/react-table"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import View from "./View"
import { getLoanEmiSchedulesHandler } from "@/services/loanHandler"
import Filter from "@/components/ui/filter"

export type EMISchedules = {
    "emi date": string
    "emi amount": number
    "principal amount": number
    "interest amount": number
    "outstanding balance": number
    status: string
}[]

export type LoanEmi = {
    id: number
    application_no: string
    member_id: string
    member_name: string
    loan_amount: number | string | null
    start_date: string | null
    end_date: string | null
    emi_schedule: EMISchedules
    created_by: string | null
    created_at: string | null
}

const formatDate = (value: unknown) => {
    if (!value) return "-"
    const stringValue = String(value)
    if (stringValue.includes("T")) {
        return stringValue.split("T")[0]
    }
    return stringValue
}

const formatCurrency = (value: unknown) => {
    const amount =
        typeof value === "number"
            ? value
            : typeof value === "string"
                ? Number(value)
                : 0

    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(Number.isFinite(amount) ? amount : 0)
}

const combinedSearchFilter: FilterFn<LoanEmi> = (row, _columnId, filterValue) => {
    const query = String(filterValue ?? "").trim().toLowerCase()

    if (!query) return true

    const applicationNo = String(row.original.application_no ?? "").toLowerCase()
    const memberId = String(row.original.member_id ?? "").toLowerCase()
    const memberName = String(row.original.member_name ?? "").toLowerCase()

    return (
        applicationNo.includes(query) ||
        memberId.includes(query) ||
        memberName.includes(query)
    )
}

export default function LoanEmiSchedulesPage() {
    const [selectedApplication, setSelectedApplication] = useState<LoanEmi | null>(null)
    const [viewOpen, setViewOpen] = useState(false)
    const [page, setPage] = useState(1)
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const perPage = 10

    const { data, isLoading, isError, isFetching } = useQuery({
        queryKey: ["loan-emi-schedules", page, perPage],
        queryFn: () => getLoanEmiSchedulesHandler("", page, perPage),
    })

    const applications = data?.data?.data ?? []
    const currentPage = data?.data?.current_page ?? 1
    const lastPage = data?.data?.last_page ?? 1

    const handleOpenView = (application: LoanEmi) => {
        setSelectedApplication(application)
        setViewOpen(true)
    }

    const columns: ColumnDef<LoanEmi>[] = useMemo(
        () => [
            {
                header: "Search",
                accessorKey: "application_no",
                filterFn: combinedSearchFilter,
                meta: {
                    filterVariant: "text",
                },
                cell: ({ row }) => (
                    <div className="font-medium">
                        {String(row.original.application_no ?? "-")}
                    </div>
                ),
            },
            {
                header: "Member ID",
                accessorKey: "member_id",
                cell: ({ row }) => <div>{String(row.original.member_id ?? "-")}</div>,
            },
            {
                header: "Member Name",
                accessorKey: "member_name",
                cell: ({ row }) => <div>{String(row.original.member_name ?? "-")}</div>,
            },
            {
                header: "Loan Amount",
                accessorKey: "loan_amount",
                cell: ({ row }) => (
                    <div>{formatCurrency(row.original.loan_amount ?? 0)}</div>
                ),
            },
            {
                header: "Start Date",
                accessorKey: "start_date",
                cell: ({ row }) => {
                    const startDate = row.original.start_date
                    const hasStartDate =
                        startDate !== null && startDate !== undefined && startDate !== ""

                    if (!hasStartDate) {
                        return <span className="text-sm font-medium opacity-50">pending</span>
                    }

                    return <Badge>{formatDate(startDate)}</Badge>
                },
            },
            {
                header: "End Date",
                accessorKey: "end_date",
                cell: ({ row }) => {
                    const endDate = row.original.end_date
                    const hasEndDate =
                        endDate !== null && endDate !== undefined && endDate !== ""

                    if (!hasEndDate) {
                        return <span className="text-sm font-medium opacity-50">pending</span>
                    }

                    return <Badge>{formatDate(endDate)}</Badge>
                },
            },
            {
                header: "Total EMI",
                id: "total_emi",
                cell: ({ row }) => (
                    <div>
                        {Array.isArray(row.original.emi_schedule)
                            ? row.original.emi_schedule.length
                            : 0}
                    </div>
                ),
            },
            {
                header: "Latest Status",
                id: "latest_status",
                cell: ({ row }) => {
                    const firstItem = Array.isArray(row.original.emi_schedule)
                        ? row.original.emi_schedule[0]
                        : null

                    return (
                        <Badge variant="outline" className="capitalize">
                            {firstItem?.status ?? "pending"}
                        </Badge>
                    )
                },
            },
        ],
        []
    )

    const table = useReactTable({
        data: Array.isArray(applications) ? applications : [],
        columns,
        state: {
            columnFilters,
        },
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
    })

    const searchColumn = table.getColumn("application_no")

    if (isLoading) {
        return (
            <div className="w-full">
                <div className="rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50">
                                {Array.from({ length: 8 }).map((_, index) => (
                                    <TableHead key={index} className="h-10 border-t">
                                        <Skeleton className="h-4 w-24" />
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {Array.from({ length: 6 }).map((_, index) => (
                                <TableRow key={index}>
                                    {Array.from({ length: 8 }).map((__, cellIndex) => (
                                        <TableCell key={cellIndex}>
                                            <Skeleton className="h-4 w-full max-w-24" />
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        )
    }

    if (isError) {
        return <div className="p-4 text-red-500">Failed to fetch loan EMI schedules.</div>
    }

    return (
        <div className="overflow-hidden rounded-md">
            <View open={viewOpen} onOpenChange={setViewOpen} data={selectedApplication} />

            <div className="flex flex-col justify-between gap-3 py-6 md:flex-row md:items-end">
                <div className="w-full max-w-md">
                    {searchColumn ? <Filter column={searchColumn} /> : null}
                </div>
            </div>

            <div className="rounded-lg border border-border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id}>
                                        {header.isPlaceholder
                                            ? null
                                            : header.column.id === "application_no"
                                                ? "Application No"
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
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    className="cursor-pointer"
                                    onClick={() => handleOpenView(row.original)}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    No EMI schedules found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="flex flex-col gap-3 px-2 py-5 md:flex-row md:items-center md:justify-between">
                <div className="text-sm text-muted-foreground">
                    Page {currentPage} of {lastPage}
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                        disabled={currentPage <= 1 || isFetching}
                    >
                        Previous
                    </Button>

                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setPage((prev) => prev + 1)}
                        disabled={currentPage >= lastPage || isFetching}
                    >
                        Next
                    </Button>
                </div>
            </div>
        </div>
    )
}