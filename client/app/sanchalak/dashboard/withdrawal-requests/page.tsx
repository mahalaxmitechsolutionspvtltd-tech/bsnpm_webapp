'use client'

import { useMemo, useState } from 'react'

import { useQuery } from '@tanstack/react-query'
import type { Column, ColumnDef, ColumnFiltersState, RowData, SortingState } from '@tanstack/react-table'
import {
    flexRender,
    getCoreRowModel,
    getFacetedMinMaxValues,
    getFacetedRowModel,
    getFacetedUniqueValues,
    getFilteredRowModel,
    getSortedRowModel,
    useReactTable
} from '@tanstack/react-table'

import { Badge } from '@/components/ui/badge'
import Filter from '@/components/ui/filter'
import { Skeleton } from '@/components/ui/skeleton'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table'
import { formatApiDate } from '@/lib/formateApiDate'
import { getWithdrawalRequestsHandler } from '@/services/depositeWithdrawalHandler'
import { DepositWithdrawalItem, WithdrawalStatus } from '@/types/depositeWithdrawalRequest'
import DepositWithdrawalDetailsDialog from './DepositWithdrawalDetailsDialog.'
import WithdrawalDetailsDialog from './DepositWithdrawalDetailsDialog.'


declare module '@tanstack/react-table' {
    interface ColumnMeta<TData extends RowData, TValue> {
        filterVariant?: 'text' | 'range' | 'select'
    }
}

const statusBadgeClassMap: Record<WithdrawalStatus, string> = {
    PENDING: 'bg-amber-500/10 text-amber-600 hover:bg-amber-500/10',
    APPROVED: 'bg-green-500/10 text-green-600 hover:bg-green-500/10',
    REJECTED: 'bg-red-500/10 text-red-600 hover:bg-red-500/10'
}

const formatCurrency = (value: string | number) => {
    const numberValue = typeof value === 'number' ? value : Number(value)
    return Number.isFinite(numberValue)
        ? new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(numberValue)
        : '₹0.00'
}

const TableSkeleton = ({ columnsCount = 9, rowsCount = 6 }: { columnsCount?: number; rowsCount?: number }) => {
    return (
        <TableBody>
            {Array.from({ length: rowsCount }).map((_, rowIndex) => (
                <TableRow key={`skeleton-row-${rowIndex}`}>
                    {Array.from({ length: columnsCount }).map((__, colIndex) => (
                        <TableCell key={`skeleton-cell-${rowIndex}-${colIndex}`}>
                            <Skeleton className='h-5 w-full rounded-md' />
                        </TableCell>
                    ))}
                </TableRow>
            ))}
        </TableBody>
    )
}

const DepositWithdrawalRequest = () => {
    const [page, setPage] = useState(1)
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const [sorting, setSorting] = useState<SortingState>([
        {
            id: 'id',
            desc: true
        }
    ])
    const [selectedRow, setSelectedRow] = useState<DepositWithdrawalItem | null>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    const { data, isLoading, isFetching } = useQuery({
        queryKey: ['withdrawal-requests', page],
        queryFn: () =>
            getWithdrawalRequestsHandler({
                page,
                per_page: 10
            })
    })

    const tableData = useMemo(() => data?.data?.data ?? [], [data])

    const openDetailsDialog = (row: DepositWithdrawalItem) => {
        setSelectedRow(row)
        setIsDialogOpen(true)
    }

    const columns = useMemo<ColumnDef<DepositWithdrawalItem>[]>(
        () => [
            {
                id: 'search',
                accessorFn: row =>
                    [
                        row.member_id,
                        row.application_no,
                        row.scheme_name,
                        row.status,
                        row.id
                    ]
                        .filter(Boolean)
                        .join(' ')
                        .toLowerCase(),
                header: 'Search',
                cell: () => null,
                enableSorting: false,
                enableHiding: true,
                meta: {
                    filterVariant: 'text'
                }
            },
            {
                accessorKey: 'id',
                header: 'ID',
                cell: ({ row }) => (
                    <button
                        type='button'
                        onClick={() => openDetailsDialog(row.original)}
                        className='font-medium text-left hover:text-primary'
                    >
                        {row.original.id}
                    </button>
                )
            },
            {
                accessorKey: 'member_id',
                header: 'Member ID',
                cell: ({ row }) => (
                    <button
                        type='button'
                        onClick={() => openDetailsDialog(row.original)}
                        className='text-left hover:text-primary'
                    >
                        {row.original.member_id}
                    </button>
                )
            },
            {
                accessorKey: 'application_no',
                header: 'Application No',
                cell: ({ row }) => (
                    <button
                        type='button'
                        onClick={() => openDetailsDialog(row.original)}
                        className='text-left hover:text-primary'
                    >
                        {row.original.application_no}
                    </button>
                )
            },
            {
                accessorKey: 'scheme_name',
                header: 'Scheme Name',
                cell: ({ row }) => (
                    <button
                        type='button'
                        onClick={() => openDetailsDialog(row.original)}
                        className='text-left hover:text-primary'
                    >
                        {row.original.scheme_name}
                    </button>
                )
            },
            {
                accessorKey: 'total_installments_paid',
                header: 'Installments Paid',
                cell: ({ row }) => (
                    <button
                        type='button'
                        onClick={() => openDetailsDialog(row.original)}
                        className='text-left hover:text-primary'
                    >
                        {row.original.total_installments_paid}
                    </button>
                ),
                meta: {
                    filterVariant: 'range'
                }
            },
            {
                accessorKey: 'total_amount_paid',
                header: 'Total Paid',
                cell: ({ row }) => (
                    <button
                        type='button'
                        onClick={() => openDetailsDialog(row.original)}
                        className='text-left hover:text-primary'
                    >
                        {formatCurrency(row.original.total_amount_paid)}
                    </button>
                )
            },
            {
                accessorKey: 'requested_amount',
                header: 'Requested Amount',
                cell: ({ row }) => (
                    <button
                        type='button'
                        onClick={() => openDetailsDialog(row.original)}
                        className='text-left hover:text-primary'
                    >
                        {formatCurrency(row.original.requested_amount)}
                    </button>
                )
            },
            {
                accessorKey: 'status',
                header: 'Status',
                cell: ({ row }) => (
                    <button
                        type='button'
                        onClick={() => openDetailsDialog(row.original)}
                        className='text-left'
                    >
                        <Badge className={`border-0 ${statusBadgeClassMap[row.original.status]}`}>
                            {row.original.status}
                        </Badge>
                    </button>
                ),
                meta: {
                    filterVariant: 'select'
                }
            },
            {
                accessorKey: 'created_at',
                header: 'Created At',
                cell: ({ row }) => (
                    <button
                        type='button'
                        onClick={() => openDetailsDialog(row.original)}
                        className='text-left hover:text-primary'
                    >
                        {formatApiDate(row.original.created_at)}
                    </button>
                )
            }
        ],
        []
    )

    const table = useReactTable({
        data: tableData,
        columns,
        state: {
            sorting,
            columnFilters
        },
        onColumnFiltersChange: filters => {
            setColumnFilters(filters)
            setPage(1)
        },
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
        getFacetedMinMaxValues: getFacetedMinMaxValues(),
        enableSortingRemoval: false
    })

    const totalPages = data?.data?.last_page ?? 1
    const currentPage = data?.data?.current_page ?? 1

    return (
        <>
            <div className='w-full space-y-4 mt-5'>
                <div className='flex w-full flex-col gap-3 md:flex-row md:items-end md:justify-between'>
                    <div className='flex w-full flex-col gap-3 sm:flex-row'>
                        <div className='w-full sm:max-w-md'>
                            <Filter column={table.getColumn('search') as Column<DepositWithdrawalItem, unknown>} />
                        </div>
                        <div className='w-full sm:w-52'>
                            <Filter column={table.getColumn('status') as Column<DepositWithdrawalItem, unknown>} />
                        </div>
                    </div>
                    <div className='text-sm text-muted-foreground'>
                        {isFetching && !isLoading ? 'Refreshing...' : `Total: ${data?.data?.total ?? 0}`}
                    </div>
                </div>

                <div className='w-full rounded-xl border'>
                    <div className='w-full overflow-x-auto'>
                        <Table className='w-full min-w-full table-auto'>
                            <TableHeader>
                                {table.getHeaderGroups().map(headerGroup => (
                                    <TableRow key={headerGroup.id} className='bg-muted/50'>
                                        {headerGroup.headers.map(header => {
                                            if (header.column.id === 'search') {
                                                return null
                                            }

                                            return (
                                                <TableHead
                                                    key={header.id}
                                                    className='cursor-pointer select-none whitespace-nowrap'
                                                    onClick={header.column.getCanSort() ? header.column.getToggleSortingHandler() : undefined}
                                                >
                                                    {header.isPlaceholder ? null : (
                                                        <div className='flex items-center gap-2'>
                                                            {flexRender(header.column.columnDef.header, header.getContext())}
                                                        </div>
                                                    )}
                                                </TableHead>
                                            )
                                        })}
                                    </TableRow>
                                ))}
                            </TableHeader>

                            {isLoading ? (
                                <TableSkeleton columnsCount={9} rowsCount={8} />
                            ) : (
                                <TableBody>
                                    {table.getRowModel().rows.length ? (
                                        table.getRowModel().rows.map(row => (
                                            <TableRow
                                                key={row.id}
                                                className='cursor-pointer transition-colors hover:bg-muted/40'
                                                onClick={() => openDetailsDialog(row.original)}
                                            >
                                                {row.getVisibleCells().map(cell => {
                                                    if (cell.column.id === 'search') {
                                                        return null
                                                    }

                                                    return (
                                                        <TableCell key={cell.id} className='whitespace-nowrap'>
                                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                        </TableCell>
                                                    )
                                                })}
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={9} className='h-24 text-center'>
                                                No results.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            )}
                        </Table>
                    </div>
                </div>

                <div className='flex w-full items-center justify-between'>
                    <div className='text-sm text-muted-foreground'>
                        Page {currentPage} of {totalPages}
                    </div>

                    <div className='flex items-center gap-2'>
                        <button
                            type='button'
                            onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage <= 1 || isLoading}
                            className='inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50'
                        >
                            Previous
                        </button>
                        <button
                            type='button'
                            onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage >= totalPages || isLoading}
                            className='inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50'
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>

            <WithdrawalDetailsDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                data={selectedRow}
            />
        </>
    )
}

export default DepositWithdrawalRequest