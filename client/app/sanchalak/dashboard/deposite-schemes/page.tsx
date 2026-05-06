"use client"

import {
    ColumnDef,
    ColumnFiltersState,
    FilterFn,
    PaginationState,
    RowData,
    SortingState,
    flexRender,
    getCoreRowModel,
    getFacetedMinMaxValues,
    getFacetedRowModel,
    getFacetedUniqueValues,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
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
import Filter from "@/components/ui/filter"
import { getDepositeSchemesHandler } from "@/services/depositeHandler"
import { DepositScheme } from "@/types/depositeTypes"
import { Button } from "@/components/ui/button"
import { AddSchemes } from "./AddSchemes"
import { UpdateSchemes } from "./UpdateSchemes"
import { Skeleton } from "@/components/ui/skeleton"

declare module "@tanstack/react-table" {
    interface ColumnMeta<TData extends RowData, TValue> {
        filterVariant?: "text" | "range" | "select"
    }
}

const normalizeValue = (value: unknown) => String(value ?? "").trim().toLowerCase()

const schemeSearchFilter: FilterFn<DepositScheme> = (row, _columnId, filterValue) => {
    const search = normalizeValue(filterValue)

    if (!search) return true

    const schemeName = normalizeValue(row.original.scheme_name)
    const schemeDetails = normalizeValue(row.original.scheme_details)
    const interestRate = normalizeValue(row.original.interest_rate)
    const termNotes = normalizeValue(row.original.term_notes)
    const investmentTerms = normalizeValue(row.original.investment_terms)

    return (
        schemeName.includes(search) ||
        schemeDetails.includes(search) ||
        interestRate.includes(search) ||
        termNotes.includes(search) ||
        investmentTerms.includes(search)
    )
}

const exactSelectFilter: FilterFn<DepositScheme> = (row, columnId, filterValue) => {
    const selected = normalizeValue(filterValue)

    if (!selected) return true

    const cellValue = normalizeValue(row.getValue(columnId))

    return cellValue === selected
}

export default function DepositeSchemes() {
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const [sorting, setSorting] = useState<SortingState>([
        { id: "scheme_name", desc: false },
    ])
    const [pagination, setPagination] = useState<PaginationState>({
        pageIndex: 0,
        pageSize: 10,
    })

    const { data: schemes = [], isLoading, isError } = useQuery<DepositScheme[]>({
        queryKey: ["deposite-schemes"],
        queryFn: getDepositeSchemesHandler,
    })

    const columns: ColumnDef<DepositScheme>[] = useMemo(() => [
        {
            header: "Scheme Name",
            accessorKey: "scheme_name",
            filterFn: schemeSearchFilter,
            cell: ({ row }) => (
                <div className="font-medium whitespace-normal wrap-break-word">
                    {String(row.getValue("scheme_name") ?? "-")}
                </div>
            ),
            meta: {
                filterVariant: "text",
            },
        },
        {
            header: "Scheme Details",
            accessorKey: "scheme_details",
            cell: ({ row }) => (
                <div className="max-w-[320px] whitespace-normal wrap-break-word leading-6">
                    {String(row.getValue("scheme_details") ?? "-")}
                </div>
            ),
            meta: {
                filterVariant: "text",
            },
        },
        {
            header: "Interest Rate",
            accessorKey: "interest_rate",
            cell: ({ row }) => (
                <div className="whitespace-normal wrap-break-word">
                    {String(row.getValue("interest_rate") ?? "-")} %
                </div>
            ),
            meta: {
                filterVariant: "text",
            },
        },
        {
            header: "Term Notes",
            accessorKey: "term_notes",
            cell: ({ row }) => (
                <div className="max-w-65 whitespace-normal wrap-break-word leading-6">
                    {String(row.getValue("term_notes") ?? "-")}
                </div>
            ),
            meta: {
                filterVariant: "text",
            },
        },
        {
            header: "Investment Terms",
            accessorKey: "investment_terms",
            filterFn: exactSelectFilter,
            cell: ({ row }) => (
                <div className="max-w-65 whitespace-normal wrap-break-word leading-6">
                    {String(row.getValue("investment_terms") ?? "-")}
                </div>
            ),
            meta: {
                filterVariant: "select",
            },
        },
        {
            header: "Actions",
            cell: ({ row }) => {

                return (
                    <div className="font-medium whitespace-normal wrap-break-word">
                        <UpdateSchemes scheme={row.original} />
                    </div>
                )
            }
        }
    ],
        []
    )

    const table = useReactTable({
        data: schemes,
        columns,
        state: {
            sorting,
            columnFilters,
            pagination,
        },
        onColumnFiltersChange: setColumnFilters,
        onSortingChange: setSorting,
        onPaginationChange: setPagination,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
        getFacetedMinMaxValues: getFacetedMinMaxValues(),
        enableSortingRemoval: false,
    })

    if (isLoading) {
        return (
            <div className="w-full">
                <div className="rounded-md ">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50">
                                <TableHead className="h-10 border-t">
                                    <Skeleton className="h-4 w-24" />
                                </TableHead>
                                <TableHead className="h-10 border-t">
                                    <Skeleton className="h-4 w-28" />
                                </TableHead>
                                <TableHead className="h-10 border-t">
                                    <Skeleton className="h-4 w-24" />
                                </TableHead>
                                <TableHead className="h-10 border-t">
                                    <Skeleton className="h-4 w-32" />
                                </TableHead>
                                <TableHead className="h-10 border-t">
                                    <Skeleton className="h-4 w-24" />
                                </TableHead>
                                <TableHead className="h-10 border-t">
                                    <Skeleton className="h-4 w-24" />
                                </TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {Array.from({ length: 6 }).map((_, index) => (
                                <TableRow key={index}>
                                    <TableCell>
                                        <Skeleton className="h-4 w-28" />
                                    </TableCell>
                                    <TableCell>
                                        <Skeleton className="h-4 w-full max-w-55" />
                                    </TableCell>
                                    <TableCell>
                                        <Skeleton className="h-6 w-16 rounded-full" />
                                    </TableCell>
                                    <TableCell>
                                        <Skeleton className="h-4 w-24" />
                                    </TableCell>
                                    <TableCell>
                                        <Skeleton className="h-4 w-28" />
                                    </TableCell>
                                    <TableCell>
                                        <Skeleton className="h-4 w-24" />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        )
    }


    return (
        <div className="overflow-hidden rounded-md">
            <div className="flex justify-between gap-3 px-2 py-6">
                <div className="my-auto flex gap-3">
                    <div className="w-100">
                        <Filter column={table.getColumn("scheme_name")!} />
                    </div>
                    <div className="w-56">
                        <Filter column={table.getColumn("investment_terms")!} />
                    </div>
                </div>
                <div className="my-auto">
                    <AddSchemes />
                </div>
            </div>

            <div className="rounded-lg border border-border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id} className="align-middle">
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(header.column.columnDef.header, header.getContext())}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>

                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    Loading...
                                </TableCell>
                            </TableRow>
                        ) : isError ? (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    Failed to load deposit schemes.
                                </TableCell>
                            </TableRow>
                        ) : table.getRowModel().rows.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow key={row.id} className="align-top">
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id} className="align-top whitespace-normal wrap-break-word">
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {!isLoading && !isError && table.getFilteredRowModel().rows.length > 0 ? (
                <div className="flex items-center justify-between px-2 py-4">
                    <div className="text-sm text-muted-foreground">
                        Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{" "}
                        {Math.min(
                            (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                            table.getFilteredRowModel().rows.length
                        )}{" "}
                        of {table.getFilteredRowModel().rows.length} records
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                        >
                            Previous
                        </Button>

                        <div className="text-sm font-medium">
                            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1}
                        </div>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            ) : null}
        </div>
    )
}