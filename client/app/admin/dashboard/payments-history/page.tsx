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
import { cn } from '@/lib/utils'

import { getPaymentHistoryHandler } from '@/services/paymentHistoryHandler'
import View from './View'

declare module '@tanstack/react-table' {
    interface ColumnMeta<TData extends RowData, TValue> {
        filterVariant?: 'text' | 'range' | 'select'
    }
}

type FilterProps = {
    column: Column<GroupedSchemeRow, unknown>
}

const Filter = FilterBase as React.ComponentType<FilterProps>

const PAGE_SIZE = 10

const schemeLabels: Record<string, string> = {
    loan: 'Loan',
    recurring_deposit: 'Recurring Deposit',
    lakhpati_yojna: 'Lakhpati Yojna',
    share_capital: 'Share Capital',
    emergency_fund: 'Emergency Fund',
    joining_fee: 'Joining Fee',
    deposit: 'Deposit',
    other: 'Other',
}

type SchemePayment = {
    id?: number
    account_management_id?: number
    application_no?: string | null
    date_of_payment?: string | null
    submitted_on?: string | null
    amount?: number | string | null
    payment_mode?: string | null
    status?: string | null
    title?: string | null
    member_name?: string | null
    member_id?: string | null
    reference_trn?: string | null
    remark?: string | null
    proof_file_url?: string | null
    submitted_at?: string | null
    deposit_installment?: any
    source_type?: string | null
    application_details?: {
        title?: string | null
        member_name?: string | null
        amount?: number | string | null
        application_no?: string | null
        tenure?: string | null
    } | null
    [key: string]: any
}

type GroupedApiMember = {
    member_id?: string
    member_name?: string
    schemes?: Record<string, SchemePayment[]>
    [key: string]: any
}

type GroupedSchemeRow = {
    rowKey: string
    member_id: string
    member_name: string
    scheme: string
    schemeLabel: string
    total_amount: number
    status: string
    payment_mode: string
    reference_trn: string
    date_of_payment: string
    payments: SchemePayment[]
    raw: any
}

const formatCurrency = (value: unknown) => {
    const n = Number(value)
    if (Number.isNaN(n)) return String(value ?? '-')
    return new Intl.NumberFormat('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(n)
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
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const getStatusTone = (status: string | null | undefined) => {
    const v = String(status ?? '').toLowerCase()
    if (v === 'approved' || v === 'paid') return 'border-emerald-200 bg-emerald-50 text-emerald-700'
    if (v === 'pending' || v === 'processing') return 'border-amber-200 bg-amber-50 text-amber-700'
    if (v === 'rejected' || v === 'failed' || v === 'cancelled') return 'border-rose-200 bg-rose-50 text-rose-700'
    if (v === 'partial') return 'border-sky-200 bg-sky-50 text-sky-700'
    if (v === 'completed') return 'border-violet-200 bg-violet-50 text-violet-700'
    return 'border-slate-200 bg-slate-100 text-slate-700'
}

const deriveStatus = (payments: SchemePayment[]): string => {
    if (!payments.length) return 'Pending'
    const statuses = payments.map((p) => String(p.status ?? '').toLowerCase())
    if (statuses.every((s) => s === 'approved')) return 'Approved'
    if (statuses.every((s) => s === 'paid')) return 'Paid'
    if (statuses.some((s) => s === 'approved' || s === 'paid')) return 'Partial'
    if (statuses.every((s) => s === 'pending')) return 'Pending'
    return String(payments[0]?.status ?? 'Pending')
}

const normalizeSchemeKey = (payment: SchemePayment) => {
    const sourceType = String(payment.source_type ?? '').trim().toLowerCase()
    const title = String(payment.application_details?.title ?? payment.title ?? '').trim().toLowerCase()
    const applicationNo = String(payment.application_no ?? payment.application_details?.application_no ?? '').trim().toLowerCase()

    if (sourceType === 'joining_fee' || title.includes('joining fee')) return 'joining_fee'
    if (sourceType === 'share_capital' || title.includes('share capital')) return 'share_capital'
    if (sourceType === 'emergency_fund' || title.includes('emergency fund')) return 'emergency_fund'
    if (sourceType === 'loan' || title.includes('loan') || applicationNo.includes('-ln-')) return 'loan'
    if (sourceType === 'lakhpati_yojna' || title.includes('lakhpati') || applicationNo.includes('-ly-')) return 'lakhpati_yojna'
    if (sourceType === 'recurring_deposit' || title.includes('recurring') || applicationNo.includes('-rd-')) return 'recurring_deposit'
    if (sourceType && schemeLabels[sourceType]) return sourceType
    if (title.includes('deposit')) return 'deposit'
    return 'other'
}

const sortPaymentsAsc = (payments: SchemePayment[]) => {
    return payments.slice().sort((a, b) => {
        const da = new Date(a.date_of_payment ?? a.submitted_on ?? a.submitted_at ?? '').getTime()
        const db = new Date(b.date_of_payment ?? b.submitted_on ?? b.submitted_at ?? '').getTime()
        return da - db
    })
}

const buildGroupedRow = (
    memberId: string,
    memberName: string,
    schemeKey: string,
    payments: SchemePayment[],
    raw: any
): GroupedSchemeRow => {
    const paymentsArr = sortPaymentsAsc(payments)
    const totalAmount = paymentsArr.reduce((sum, p) => sum + Number(p.amount ?? 0), 0)
    const status = deriveStatus(paymentsArr)
    const latestPayment = paymentsArr[paymentsArr.length - 1]
    const latestDate = latestPayment?.date_of_payment ?? latestPayment?.submitted_on ?? latestPayment?.submitted_at ?? ''

    return {
        rowKey: `${memberId}__${schemeKey}`,
        member_id: memberId,
        member_name: memberName,
        scheme: schemeKey,
        schemeLabel: schemeLabels[schemeKey] ?? schemeKey,
        total_amount: totalAmount,
        status,
        payment_mode: String(latestPayment?.payment_mode ?? '-'),
        reference_trn: String(latestPayment?.reference_trn ?? '-'),
        date_of_payment: String(latestDate ?? ''),
        payments: paymentsArr,
        raw,
    }
}

const transformGroupedApiRows = (apiData: GroupedApiMember[]) => {
    const rows: GroupedSchemeRow[] = []

    for (const memberData of apiData) {
        const memberId = String(memberData.member_id ?? '')
        const memberName = String(memberData.member_name ?? '')
        const schemes = memberData.schemes ?? {}

        for (const [schemeKey, payments] of Object.entries(schemes)) {
            rows.push(
                buildGroupedRow(
                    memberId,
                    memberName,
                    schemeKey,
                    Array.isArray(payments) ? payments : [],
                    memberData
                )
            )
        }
    }

    rows.sort((a, b) => {
        const da = new Date(a.date_of_payment ?? '').getTime()
        const db = new Date(b.date_of_payment ?? '').getTime()
        return db - da
    })

    return rows
}

const transformFlatApiRows = (apiData: SchemePayment[]) => {
    const grouped = new Map<string, { memberId: string; memberName: string; schemeKey: string; payments: SchemePayment[] }>()

    for (const payment of apiData) {
        const memberId = String(payment.member_id ?? '')
        const memberName = String(payment.member_name ?? payment.application_details?.member_name ?? '')
        const schemeKey = normalizeSchemeKey(payment)
        const mapKey = `${memberId}__${schemeKey}`

        if (!grouped.has(mapKey)) {
            grouped.set(mapKey, {
                memberId,
                memberName,
                schemeKey,
                payments: [],
            })
        }

        grouped.get(mapKey)!.payments.push(payment)
    }

    const rows = Array.from(grouped.values()).map((group) =>
        buildGroupedRow(
            group.memberId,
            group.memberName,
            group.schemeKey,
            group.payments,
            {
                member_id: group.memberId,
                member_name: group.memberName,
                scheme: group.schemeKey,
                payments: group.payments,
            }
        )
    )

    rows.sort((a, b) => {
        const da = new Date(a.date_of_payment ?? '').getTime()
        const db = new Date(b.date_of_payment ?? '').getTime()
        return db - da
    })

    return rows
}

const transformToGroupedRows = (apiData: any[]): GroupedSchemeRow[] => {
    if (!Array.isArray(apiData) || apiData.length === 0) return []
    const firstItem = apiData[0]

    if (firstItem && typeof firstItem === 'object' && firstItem.schemes && !Array.isArray(firstItem.schemes)) {
        return transformGroupedApiRows(apiData as GroupedApiMember[])
    }

    return transformFlatApiRows(apiData as SchemePayment[])
}

const columns: ColumnDef<GroupedSchemeRow>[] = [
    {
        id: 'search',
        header: 'Search',
        accessorFn: (row) =>
            [
                row.member_name,
                row.member_id,
                row.schemeLabel,
                row.reference_trn,
                ...row.payments.flatMap((payment) => [
                    payment.application_no,
                    payment.application_details?.application_no,
                    payment.application_details?.title,
                    payment.title,
                ]),
            ]
                .map((v) => String(v ?? '').trim())
                .filter(Boolean)
                .join(' '),
        filterFn: 'includesString',
        meta: { filterVariant: 'text' },
    },
    {
        header: 'Submitted On',
        id: 'submitted_on',
        cell: ({ row }) => (
            <div className='font-medium text-slate-900'>
                {formatDateOnly(row.original.date_of_payment)}
            </div>
        ),
    },
    {
        header: 'Member',
        id: 'member_name',
        accessorFn: (row) => row.member_name,
        cell: ({ row }) => (
            <div className='flex min-w-0 flex-col'>
                <span className='truncate font-medium text-slate-900'>
                    {row.original.member_name}
                </span>
                <span className='text-xs text-slate-500'>{row.original.member_id}</span>
            </div>
        ),
    },
    {
        header: 'Amount',
        id: 'amount',
        accessorFn: (row) => row.total_amount,
        cell: ({ row }) => (
            <div className='font-semibold text-slate-900'>
                ₹ {formatCurrency(row.original.total_amount)}
            </div>
        ),
    },
    {
        header: 'Status',
        id: 'status',
        accessorFn: (row) => row.status,
        cell: ({ row }) => (
            <Badge
                className={cn(
                    'rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize',
                    getStatusTone(row.original.status)
                )}
            >
                {row.original.status}
            </Badge>
        ),
        meta: { filterVariant: 'select' },
    },
    {
        header: 'Reference',
        id: 'reference_trn',
        accessorFn: (row) => row.reference_trn,
        cell: ({ row }) => (
            <div className='text-slate-700'>{row.original.reference_trn}</div>
        ),
    },
    {
        header: 'Payment Mode',
        id: 'payment_mode',
        accessorFn: (row) => row.payment_mode,
        cell: ({ row }) => (
            <div className='capitalize text-slate-700'>
                {String(row.original.payment_mode ?? '-').replace(/_/g, ' ')}
            </div>
        ),
        meta: { filterVariant: 'select' },
    },
]

const PaymentHistoryTableSkeleton = ({ rows = 8 }: { rows?: number }) => (
    <div className='rounded-md border border-slate-200 bg-white'>
        <Table>
            <TableHeader>
                <TableRow className='bg-slate-50/70 hover:bg-slate-50/70'>
                    <TableHead>Submitted On</TableHead>
                    <TableHead>Member</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Payment Mode</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {Array.from({ length: rows }).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell><Skeleton className='h-4 w-24 rounded-md' /></TableCell>
                        <TableCell>
                            <div className='space-y-2'>
                                <Skeleton className='h-4 w-40 rounded-md' />
                                <Skeleton className='h-3 w-20 rounded-md' />
                            </div>
                        </TableCell>
                        <TableCell><Skeleton className='h-4 w-24 rounded-md' /></TableCell>
                        <TableCell><Skeleton className='h-6 w-24 rounded-full' /></TableCell>
                        <TableCell><Skeleton className='h-4 w-24 rounded-md' /></TableCell>
                        <TableCell><Skeleton className='h-4 w-24 rounded-md' /></TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    </div>
)

const PaymentHistory = () => {
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
    const [selectedRow, setSelectedRow] = React.useState<GroupedSchemeRow | null>(null)
    const [viewOpen, setViewOpen] = React.useState(false)
    const [currentPage, setCurrentPage] = React.useState(1)

    const { data, isLoading, isError, error } = useQuery({
        queryKey: ['payment-history'],
        queryFn: getPaymentHistoryHandler,
    })

    const items = React.useMemo<GroupedSchemeRow[]>(() => {
        if (!Array.isArray(data)) return []
        return transformToGroupedRows(data)
    }, [data])

    const table = useReactTable({
        data: items,
        columns,
        state: {
            columnFilters,
            columnVisibility: { search: false },
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

    const handleOpenView = (row: GroupedSchemeRow) => {
        setSelectedRow(row)
        setViewOpen(true)
    }

    const filteredRows = table.getRowModel().rows
    const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE))

    React.useEffect(() => {
        setCurrentPage(1)
    }, [columnFilters, items.length])

    React.useEffect(() => {
        if (currentPage > totalPages) setCurrentPage(totalPages)
    }, [currentPage, totalPages])

    const paginatedRows = React.useMemo(() => {
        const start = (currentPage - 1) * PAGE_SIZE
        return filteredRows.slice(start, start + PAGE_SIZE)
    }, [filteredRows, currentPage])

    const pageNumbers = React.useMemo(
        () => Array.from({ length: totalPages }, (_, i) => i + 1),
        [totalPages]
    )

    if (isLoading) return <PaymentHistoryTableSkeleton />

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
                                                {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                            </TableHead>
                                        )
                                    })}
                                </TableRow>
                            ))}
                        </TableHeader>

                        <TableBody>
                            {paginatedRows.length > 0 ? (
                                paginatedRows.map((row) => {
                                    const groupedRow = row.original

                                    return (
                                        <TableRow
                                            key={groupedRow.rowKey}
                                            className='cursor-pointer hover:bg-slate-50/60'
                                            onClick={() => handleOpenView(groupedRow)}
                                        >
                                            {row.getVisibleCells().map((cell) => {
                                                if (cell.column.id === 'search') return null
                                                return (
                                                    <TableCell key={cell.id} className='py-3'>
                                                        {cell.column.id === 'submitted_on' ? (
                                                            <div className='flex flex-col gap-1'>
                                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                            </div>
                                                        ) : (
                                                            flexRender(cell.column.columnDef.cell, cell.getContext())
                                                        )}
                                                    </TableCell>
                                                )
                                            })}
                                        </TableRow>
                                    )
                                })
                            ) : (
                                <TableRow>
                                    <TableCell
                                        colSpan={columns.length}
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