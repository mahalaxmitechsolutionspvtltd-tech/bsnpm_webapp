'use client'

import * as React from 'react'
import type { Column, ColumnDef, ColumnFiltersState, RowData } from '@tanstack/react-table'
import {
    flexRender,
    getCoreRowModel,
    getFacetedMinMaxValues,
    getFacetedRowModel,
    getFacetedUniqueValues,
    getFilteredRowModel,
    getSortedRowModel,
    useReactTable,
} from '@tanstack/react-table'
import { useQuery } from '@tanstack/react-query'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import FilterBase from '@/components/ui/filter'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'

import { PaymentHistoryTableItem } from '@/types/paymentsTypes'
import { getPaymentHistoryHandler } from '@/services/paymentHistoryHandler'
import View from './View'

declare module '@tanstack/react-table' {
    interface ColumnMeta<TData extends RowData, TValue> {
        filterVariant?: 'text' | 'range' | 'select'
    }
}

type FilterProps = {
    column: Column<PaymentHistoryTableItem, unknown>
}

const Filter = FilterBase as React.ComponentType<FilterProps>

const PAGE_SIZE = 10

const formatCurrency = (value: unknown) => {
    const numberValue = Number(value)
    if (Number.isNaN(numberValue)) return String(value ?? '-')

    return new Intl.NumberFormat('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(numberValue)
}

const formatDateOnly = (value: unknown) => {
    if (!value) return '-'

    const raw = String(value).trim()
    if (!raw) return '-'

    const date = new Date(raw)
    if (Number.isNaN(date.getTime())) {
        if (raw.includes(' ')) return raw.split(' ')[0]
        if (raw.includes('T')) return raw.split('T')[0]
        return raw
    }

    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
}

const formatTimeOnly = (value: unknown) => {
    if (!value) return '-'

    const raw = String(value).trim()
    if (!raw) return '-'

    const date = new Date(raw)
    if (Number.isNaN(date.getTime())) {
        if (raw.includes(' ')) return raw.split(' ')[1] ?? '-'
        if (raw.includes('T')) {
            const timePart = raw.split('T')[1] ?? ''
            return timePart.split('.')[0] || '-'
        }
        return '-'
    }

    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')

    return `${hours}:${minutes}:${seconds}`
}

const getSubmittedDateValue = (row: PaymentHistoryTableItem) => {
    return (
        (row as any)?.submitted_on ??
        (row as any)?.date_of_payment ??
        (row as any)?.date_paid ??
        (row as any)?.created_at ??
        null
    )
}

const getSubmittedTimeValue = (row: PaymentHistoryTableItem) => {
    return (
        (row as any)?.submitted_time ??
        (row as any)?.created_at ??
        null
    )
}

const getApplicationNoValue = (row: PaymentHistoryTableItem) => {
    return (
        row?.application_no ??
        (row as any)?.application_number ??
        (row as any)?.application_details?.application_no ??
        (row as any)?.raw?.application_no ??
        (row as any)?.raw?.['application no'] ??
        '-'
    )
}

const getReferenceValue = (row: PaymentHistoryTableItem) => {
    return (
        row?.reference_trn ??
        (row as any)?.utr ??
        (row as any)?.reference ??
        (row as any)?.ref ??
        (row as any)?.raw?.reference_trn ??
        (row as any)?.raw?.utr ??
        '-'
    )
}

const getAmountValue = (row: PaymentHistoryTableItem) => {
    return (
        row?.amount ??
        (row as any)?.application_details?.amount ??
        (row as any)?.total_amount ??
        '-'
    )
}

const getPaymentModeValue = (row: PaymentHistoryTableItem) => {
    return (
        (row as any)?.payment_mode ??
        (row as any)?.raw?.payment_mode ??
        (row as any)?.application_details?.payment_mode ??
        '-'
    )
}

const getStatusValue = (row: PaymentHistoryTableItem) => {
    return row?.status ?? (row as any)?.raw?.status ?? '-'
}

const getSearchValue = (row: PaymentHistoryTableItem) => {
    return [
        row?.member_name,
        row?.member_id,
        getApplicationNoValue(row),
        getReferenceValue(row),
    ]
        .map((value) => String(value ?? '').trim())
        .filter(Boolean)
        .join(' ')
}

const getStatusTone = (status: string | null | undefined) => {
    const value = String(status ?? '').toLowerCase()

    if (value === 'approved' || value === 'paid') {
        return 'border-emerald-200 bg-emerald-50 text-emerald-700'
    }

    if (value === 'pending' || value === 'processing') {
        return 'border-amber-200 bg-amber-50 text-amber-700'
    }

    if (value === 'rejected' || value === 'failed' || value === 'cancelled') {
        return 'border-rose-200 bg-rose-50 text-rose-700'
    }

    if (value === 'partial') {
        return 'border-sky-200 bg-sky-50 text-sky-700'
    }

    if (value === 'completed') {
        return 'border-violet-200 bg-violet-50 text-violet-700'
    }

    return 'border-slate-200 bg-slate-100 text-slate-700'
}

const columns: ColumnDef<PaymentHistoryTableItem>[] = [
    {
        id: 'search',
        header: 'Search',
        accessorFn: (row) => getSearchValue(row),
        filterFn: 'includesString',
        meta: {
            filterVariant: 'text',
        },
    },
    {
        header: 'Submitted On',
        id: 'submitted_on',
        cell: ({ row }) => {
            const dateValue = getSubmittedDateValue(row.original)
            const timeValue = getSubmittedTimeValue(row.original)

            return (
                <div className='flex min-w-0 flex-col'>
                    <span className='font-medium text-slate-900'>
                        {formatDateOnly(dateValue)}
                    </span>
                   
                </div>
            )
        },
    },
    {
        header: 'Application No',
        id: 'application_no',
        accessorFn: (row) => getApplicationNoValue(row),
        cell: ({ row }) => {
            const value = getApplicationNoValue(row.original)
            return <div className='font-medium text-slate-800'>{String(value ?? '-')}</div>
        },
    },
    {
        header: 'Member',
        id: 'member_name',
        accessorFn: (row) => row.member_name ?? '-',
        cell: ({ row }) => {
            const memberName = row.original.member_name
            const memberId = row.original.member_id

            return (
                <div className='flex min-w-0 flex-col'>
                    <span className='truncate font-medium text-slate-900'>
                        {String(memberName ?? '-')}
                    </span>
                    <span className='text-xs text-slate-500'>
                        {String(memberId ?? '-')}
                    </span>
                </div>
            )
        },
    },
    {
        header: 'Amount',
        id: 'amount',
        accessorFn: (row) => getAmountValue(row),
        cell: ({ row }) => {
            const value = getAmountValue(row.original)
            return <div className='font-semibold text-slate-900'>₹ {formatCurrency(value)}</div>
        },
    },
    {
        header: 'Status',
        id: 'status',
        accessorFn: (row) => getStatusValue(row),
        cell: ({ row }) => {
            const status = getStatusValue(row.original)

            return (
                <Badge
                    className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${getStatusTone(
                        String(status ?? '')
                    )}`}
                >
                    {String(status ?? '-')}
                </Badge>
            )
        },
        meta: {
            filterVariant: 'select',
        },
    },
    {
        header: 'Reference',
        id: 'reference_trn',
        accessorFn: (row) => getReferenceValue(row),
        cell: ({ row }) => {
            const value = getReferenceValue(row.original)
            return <div className='text-slate-700'>{String(value ?? '-')}</div>
        },
    },
    {
        header: 'Payment Mode',
        id: 'payment_mode',
        accessorFn: (row) => getPaymentModeValue(row),
        cell: ({ row }) => {
            const value = getPaymentModeValue(row.original)
            return (
                <div className='capitalize text-slate-700'>
                    {String(value ?? '-').replace(/_/g, ' ')}
                </div>
            )
        },
        meta: {
            filterVariant: 'select',
        },
    },
]

const PaymentHistoryTableSkeleton = ({ rows = 8 }: { rows?: number }) => {
    return (
        <div className='rounded-md border border-slate-200 bg-white'>
            <Table>
                <TableHeader>
                    <TableRow className='bg-slate-50/70 hover:bg-slate-50/70'>
                        <TableHead>Submitted On</TableHead>
                        <TableHead>Application No</TableHead>
                        <TableHead>Member</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Reference</TableHead>
                        <TableHead>Payment Mode</TableHead>
                    </TableRow>
                </TableHeader>

                <TableBody>
                    {Array.from({ length: rows }).map((_, index) => (
                        <TableRow key={index}>
                            <TableCell>
                                <div className='space-y-2'>
                                    <Skeleton className='h-4 w-24 rounded-md' />
                                    <Skeleton className='h-3 w-16 rounded-md' />
                                </div>
                            </TableCell>
                            <TableCell>
                                <Skeleton className='h-4 w-32 rounded-md' />
                            </TableCell>
                            <TableCell>
                                <div className='space-y-2'>
                                    <Skeleton className='h-4 w-40 rounded-md' />
                                    <Skeleton className='h-3 w-20 rounded-md' />
                                </div>
                            </TableCell>
                            <TableCell>
                                <Skeleton className='h-4 w-24 rounded-md' />
                            </TableCell>
                            <TableCell>
                                <Skeleton className='h-6 w-24 rounded-full' />
                            </TableCell>
                            <TableCell>
                                <Skeleton className='h-4 w-24 rounded-md' />
                            </TableCell>
                            <TableCell>
                                <Skeleton className='h-4 w-24 rounded-md' />
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}

const PaymentHistory = () => {
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
    const [selectedRow, setSelectedRow] = React.useState<PaymentHistoryTableItem | null>(null)
    const [viewOpen, setViewOpen] = React.useState(false)
    const [currentPage, setCurrentPage] = React.useState(1)

    const { data, isLoading, isFetching, isError, error } = useQuery({
        queryKey: ['payment-history'],
        queryFn: getPaymentHistoryHandler,
    })

    const items = React.useMemo<PaymentHistoryTableItem[]>(() => {
        return Array.isArray(data) ? data : []
    }, [data])

    const table = useReactTable({
        data: items,
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
        getSortedRowModel: getSortedRowModel(),
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
        getFacetedMinMaxValues: getFacetedMinMaxValues(),
        enableSortingRemoval: false,
    })

    const handleOpenView = (row: PaymentHistoryTableItem) => {
        setSelectedRow(row)
        setViewOpen(true)
    }

    const filteredRows = table.getRowModel().rows

    const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE))

    React.useEffect(() => {
        setCurrentPage(1)
    }, [columnFilters])

    React.useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages)
        }
    }, [currentPage, totalPages])

    const paginatedRows = React.useMemo(() => {
        const startIndex = (currentPage - 1) * PAGE_SIZE
        const endIndex = startIndex + PAGE_SIZE
        return filteredRows.slice(startIndex, endIndex)
    }, [filteredRows, currentPage])

    const pageNumbers = React.useMemo(() => {
        return Array.from({ length: totalPages }, (_, index) => index + 1)
    }, [totalPages])

    if (isLoading) {
        return <PaymentHistoryTableSkeleton />
    }

    if (isError) {
        return (
            <div className='rounded-md border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700'>
                {error instanceof Error ? error.message : 'Failed to load payment history.'}
            </div>
        )
    }

    const searchColumn = table.getColumn('search')
    const paymentModeColumn = table.getColumn('payment_mode')
    const statusColumn = table.getColumn('status')

    return (
        <>
            <div className='mt-5 w-full space-y-5 select-auto'>
                <div className='flex space-x-3'>
                    <div className='w-[30vw]'>
                        {searchColumn ? <Filter column={searchColumn} /> : null}
                    </div>
                    <div className='w-[10vw]'>
                        {paymentModeColumn ? <Filter column={paymentModeColumn} /> : null}
                    </div>
                    <div className='w-[10vw]'>
                        {statusColumn ? <Filter column={statusColumn} /> : null}
                    </div>
                </div>

                <div className='overflow-hidden rounded-md border border-slate-200 bg-white'>
                    <Table>
                        <TableHeader>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow
                                    key={headerGroup.id}
                                    className='bg-slate-50/70 hover:bg-slate-50/70'
                                >
                                    {headerGroup.headers.map((header) => {
                                        if (header.column.id === 'search') return null

                                        return (
                                            <TableHead
                                                key={header.id}
                                                className='h-11 border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-500'
                                            >
                                                {header.isPlaceholder
                                                    ? null
                                                    : flexRender(
                                                        header.column.columnDef.header,
                                                        header.getContext()
                                                    )}
                                            </TableHead>
                                        )
                                    })}
                                </TableRow>
                            ))}
                        </TableHeader>

                        <TableBody>
                            {paginatedRows.length > 0 ? (
                                paginatedRows.map((row) => (
                                    <TableRow
                                        key={row.id}
                                        className='cursor-pointer hover:bg-slate-50/60'
                                        data-state={row.getIsSelected() && 'selected'}
                                        onClick={() => handleOpenView(row.original)}
                                    >
                                        {row.getVisibleCells().map((cell) => {
                                            if (cell.column.id === 'search') return null

                                            return (
                                                <TableCell key={cell.id} className='py-3'>
                                                    {flexRender(
                                                        cell.column.columnDef.cell,
                                                        cell.getContext()
                                                    )}
                                                </TableCell>
                                            )
                                        })}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell
                                        colSpan={columns.length - 1}
                                        className='h-24 text-center text-sm text-slate-500'
                                    >
                                        No payment history found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>

                    {filteredRows.length > 0 ? (
                        <div className='flex items-center justify-between border-t border-slate-200 px-4 py-3'>
                            <div className='text-sm text-slate-500'>
                                Showing {(currentPage - 1) * PAGE_SIZE + 1} to{' '}
                                {Math.min(currentPage * PAGE_SIZE, filteredRows.length)} of{' '}
                                {filteredRows.length}
                            </div>

                            <div className='flex items-center gap-2'>
                                {pageNumbers.map((page) => (
                                    <Button
                                        key={page}
                                        type='button'
                                        variant={page === currentPage ? 'default' : 'outline'}
                                        size='sm'
                                        className='h-8 min-w-8 rounded-md px-2'
                                        onClick={() => setCurrentPage(page)}
                                    >
                                        {page}
                                    </Button>
                                ))}

                                <Button
                                    type='button'
                                    variant='outline'
                                    size='sm'
                                    className='h-8 rounded-md px-3'
                                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage >= totalPages}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    ) : null}
                </div>

            </div>

            <View
                open={viewOpen}
                onOpenChange={setViewOpen}
                data={selectedRow}
            />
        </>
    )
}

export default PaymentHistory