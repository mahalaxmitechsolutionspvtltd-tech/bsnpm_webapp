'use client'

import Lottie from 'lottie-react'
import {
    ColumnDef,
    ColumnFiltersState,
    FilterFn,
    RowData,
    SortingState,
    flexRender,
    getCoreRowModel,
    getFacetedMinMaxValues,
    getFacetedRowModel,
    getFacetedUniqueValues,
    getFilteredRowModel,
    getSortedRowModel,
    useReactTable,
} from '@tanstack/react-table'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Filter from '@/components/ui/filter'
import { Skeleton } from '@/components/ui/skeleton'
import { Loader2, Send } from 'lucide-react'
import { getLoanEmiOvedues, sendRecoveryNoticeHandler } from '@/services/loanHandler'

import notFound from '@/public/No_data_Found.json'
import type {
    LoanEmiSummary,
    SendRecoveryNoticeRequest,
    SendRecoveryNoticeResponse,
} from '@/types/loanOverdues'

declare module '@tanstack/react-table' {
    interface ColumnMeta<TData extends RowData, TValue> {
        filterVariant?: 'text' | 'range' | 'select'
    }
}

const normalizeValue = (value: unknown) => String(value ?? '').trim().toLowerCase()

const formatDate = (value: unknown) => {
    if (!value) return '-'

    const stringValue = String(value)

    if (stringValue.includes('T')) {
        return stringValue.split('T')[0]
    }

    return stringValue
}

const formatCurrency = (value: unknown) => {
    const amount = Number(value ?? 0)

    return amount.toLocaleString('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })
}

const overdueSearchFilter: FilterFn<LoanEmiSummary> = (row, _columnId, filterValue) => {
    const search = normalizeValue(filterValue)

    if (!search) return true

    const applicationNo = normalizeValue(row.original.application_no)
    const memberName = normalizeValue(row.original.member_name)
    const memberId = normalizeValue(row.original.member_id)
    const memberEmail = normalizeValue(row.original.member_email)
    const loanAmount = normalizeValue(row.original.loan_amount)
    const status = normalizeValue(row.original.status)
    const emiDate = normalizeValue(row.original.next_emi?.emi_date)
    const overdueSinceDate = normalizeValue(row.original.next_emi?.overdue_since_date)
    const overdueDays = normalizeValue(row.original.next_emi?.overdue_days)

    return (
        applicationNo.includes(search) ||
        memberName.includes(search) ||
        memberId.includes(search) ||
        memberEmail.includes(search) ||
        loanAmount.includes(search) ||
        status.includes(search) ||
        emiDate.includes(search) ||
        overdueSinceDate.includes(search) ||
        overdueDays.includes(search)
    )
}

const exactSelectFilter: FilterFn<LoanEmiSummary> = (row, columnId, filterValue) => {
    const selected = normalizeValue(filterValue)

    if (!selected) return true

    const cellValue = normalizeValue(row.getValue(columnId))

    return cellValue === selected
}

const getStatusBadgeClass = (status: unknown) => {
    const value = normalizeValue(status)

    if (value === 'overdue') {
        return 'border-red-200 bg-red-50 text-red-700 hover:bg-red-50'
    }

    if (value === 'pending') {
        return 'border-yellow-200 bg-yellow-50 text-yellow-700 hover:bg-yellow-50'
    }

    if (value === 'approved' || value === 'completed' || value === 'paid') {
        return 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50'
    }

    if (value === 'partial') {
        return 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-50'
    }

    return 'border-border bg-muted text-foreground hover:bg-muted'
}

export default function LoanEmiOverdues() {
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const [sorting, setSorting] = useState<SortingState>([
        { id: 'application_no', desc: false },
    ])

    const queryClient = useQueryClient()

    const {
        data: overdues = [],
        isLoading,
        isError,
    } = useQuery<LoanEmiSummary[], Error>({
        queryKey: ['loan-emi-overdues'],
        queryFn: getLoanEmiOvedues,
    })

    const sendMailMutation = useMutation<
        SendRecoveryNoticeResponse,
        Error,
        SendRecoveryNoticeRequest
    >({
        mutationFn: sendRecoveryNoticeHandler,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['loan-emi-overdues'] })
            queryClient.invalidateQueries({ queryKey: ['recovery-notices'] })
        },
    })

    const columns: ColumnDef<LoanEmiSummary>[] = useMemo(
        () => [
            {
                header: 'Application No',
                accessorKey: 'application_no',
                filterFn: overdueSearchFilter,
                cell: ({ row }) => (
                    <div className="font-medium">
                        {String(row.getValue('application_no') ?? '-')}
                    </div>
                ),
                meta: {
                    filterVariant: 'text',
                },
            },
            {
                header: 'Member Name',
                accessorKey: 'member_name',
                filterFn: overdueSearchFilter,
                cell: ({ row }) => (
                    <div className="space-y-0.5">
                        <div>{String(row.getValue('member_name') ?? '-')}</div>
                        <div className="text-xs text-muted-foreground">
                            {String(row.original.member_id ?? '-')}
                        </div>
                    </div>
                ),
                meta: {
                    filterVariant: 'text',
                },
            },
            {
                header: 'Loan Amount',
                accessorKey: 'loan_amount',
                filterFn: overdueSearchFilter,
                cell: ({ row }) => <div>{formatCurrency(row.getValue('loan_amount'))}</div>,
                meta: {
                    filterVariant: 'text',
                },
            },
            {
                header: 'EMI Due Date',
                id: 'emi_due_date',
                accessorFn: (row) => row.next_emi?.emi_date ?? '',
                filterFn: overdueSearchFilter,
                cell: ({ row }) => {
                    const nextEmi = row.original.next_emi

                    if (!nextEmi) {
                        return <span className="text-sm font-medium opacity-50">-</span>
                    }

                    return (
                        <div className="space-y-0.5">
                            <div className="font-medium">{formatDate(nextEmi.emi_date)}</div>
                            <div className="text-xs text-muted-foreground">
                                {formatCurrency(nextEmi.emi_amount)}
                            </div>
                        </div>
                    )
                },
                meta: {
                    filterVariant: 'text',
                },
            },
            {
                header: 'Overdue Since',
                id: 'overdue_since_date',
                accessorFn: (row) => row.next_emi?.overdue_since_date ?? '',
                filterFn: overdueSearchFilter,
                cell: ({ row }) => {
                    const nextEmi = row.original.next_emi

                    if (!nextEmi || !nextEmi.overdue_since_date) {
                        return <span className="text-sm text-muted-foreground">-</span>
                    }

                    return (
                        <Badge
                            variant="outline"
                            className="border-red-200 bg-red-50 text-red-700 hover:bg-red-50"
                        >
                            {formatDate(nextEmi.overdue_since_date)}
                        </Badge>
                    )
                },
                meta: {
                    filterVariant: 'text',
                },
            },
            {
                header: 'Overdue Days',
                id: 'overdue_days',
                accessorFn: (row) => row.next_emi?.overdue_days ?? '',
                filterFn: overdueSearchFilter,
                cell: ({ row }) => {
                    const nextEmi = row.original.next_emi

                    if (!nextEmi || row.original.status !== 'overdue') {
                        return <span className="text-sm text-muted-foreground">-</span>
                    }

                    return (
                        <Badge
                            variant="outline"
                            className="border-red-200 bg-red-50 text-red-700 hover:bg-red-50"
                        >
                            {nextEmi.overdue_days} day{nextEmi.overdue_days === 1 ? '' : 's'}
                        </Badge>
                    )
                },
                meta: {
                    filterVariant: 'text',
                },
            },
            {
                header: 'Status',
                accessorKey: 'status',
                filterFn: exactSelectFilter,
                cell: ({ row }) => {
                    const status = row.getValue('status')

                    return (
                        <Badge
                            variant="outline"
                            className={`capitalize ${getStatusBadgeClass(status)}`}
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
                header: 'Action',
                id: 'action',
                enableSorting: false,
                enableColumnFilter: false,
                cell: ({ row }) => {
                    const applicationNo = String(row.original.application_no ?? '')
                    const memberEmail = String(row.original.member_email ?? '').trim()
                    const emiDate = String(row.original.next_emi?.emi_date ?? '').trim()
                    const emiAmount = row.original.next_emi?.emi_amount ?? 0
                    const isOverdue = normalizeValue(row.original.status) === 'overdue'

                    const isSending =
                        sendMailMutation.isPending &&
                        sendMailMutation.variables?.applicationNo === applicationNo

                    return (
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-9 rounded-xl"

                            onClick={() =>
                                sendMailMutation.mutate({
                                    applicationNo,
                                    payload: {
                                        member_id: String(row.original.member_id ?? ''),
                                        member_name: String(row.original.member_name ?? ''),
                                        member_email: memberEmail,
                                        emi_date: emiDate,
                                        emi_amount: emiAmount,
                                    },
                                })
                            }
                        >
                            {isSending ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Send className="mr-2 h-4 w-4" />
                            )}
                            {isSending ? 'Sending...' : 'Send Mail'}
                        </Button>
                    )
                },
            },
        ],
        [sendMailMutation.isPending, sendMailMutation.variables]
    )

    const table = useReactTable({
        data: overdues,
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

    if (isLoading) {
        return (
            <div className="w-full">
                <div className="rounded-md">
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
                                    <Skeleton className="h-4 w-24" />
                                </TableHead>
                                <TableHead className="h-10 border-t">
                                    <Skeleton className="h-4 w-24" />
                                </TableHead>
                                <TableHead className="h-10 border-t">
                                    <Skeleton className="h-4 w-20" />
                                </TableHead>
                                <TableHead className="h-10 border-t">
                                    <Skeleton className="h-4 w-20" />
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
                                        <Skeleton className="h-4 w-full max-w-40" />
                                    </TableCell>
                                    <TableCell>
                                        <Skeleton className="h-4 w-24" />
                                    </TableCell>
                                    <TableCell>
                                        <Skeleton className="h-6 w-24 rounded-full" />
                                    </TableCell>
                                    <TableCell>
                                        <Skeleton className="h-6 w-24 rounded-full" />
                                    </TableCell>
                                    <TableCell>
                                        <Skeleton className="h-6 w-20 rounded-full" />
                                    </TableCell>
                                    <TableCell>
                                        <Skeleton className="h-6 w-20 rounded-full" />
                                    </TableCell>
                                    <TableCell>
                                        <Skeleton className="h-9 w-28 rounded-xl" />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        )
    }

    if (isError) {
        return <div className="p-4 text-red-500">Failed to fetch loan EMI overdue records.</div>
    }

    return (
        <div className="overflow-hidden rounded-md">
            <div className="flex flex-wrap justify-between gap-3 px-2 py-6">
                <div className="my-auto flex flex-wrap gap-3">
                    <div className="w-70">
                        <Filter column={table.getColumn('member_name')!} />
                    </div>
                    <div className="w-45">
                        <Filter column={table.getColumn('status')!} />
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-border">
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
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow key={row.id}>
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
                                <TableCell colSpan={columns.length} className="border-0 bg-white text-center h-[70vh]">
                                    There is no data availabel...
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}