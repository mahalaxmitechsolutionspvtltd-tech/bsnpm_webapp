'use client'

import {
    ColumnDef,
    ColumnFiltersState,
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
import { useQuery } from '@tanstack/react-query'
import { Badge } from '@/components/ui/badge'
import Filter from '@/components/ui/filter'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDateDDMMYYYY } from '@/lib/formateDate'
import { LoanEmiOverduesNotice } from '@/types/loanOverdues'
import { getRecoveryNoticesHandler } from '@/services/loanHandler'

declare module '@tanstack/react-table' {
    interface ColumnMeta<TData extends RowData, TValue> {
        filterVariant?: 'text' | 'range' | 'select'
    }
}

export default function RecoveryNoticesTable() {
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const [sorting, setSorting] = useState<SortingState>([
        { id: 'emi_date', desc: true },
    ])

    const {
        data: recoveryNotices = [],
        isLoading,
        isError,
    } = useQuery<LoanEmiOverduesNotice[]>({
        queryKey: ['recovery-notices'],
        queryFn: getRecoveryNoticesHandler,
    })

    const columns: ColumnDef<LoanEmiOverduesNotice>[] = useMemo(
        () => [
            {
                header: 'Application No',
                accessorKey: 'application_no',
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
                header: 'Member ID',
                accessorKey: 'member_id',
                cell: ({ row }) => (
                    <div>{String(row.getValue('member_id') ?? '-')}</div>
                ),
                meta: {
                    filterVariant: 'text',
                },
            },
            {
                header: 'Member Name',
                accessorKey: 'member_name',
                cell: ({ row }) => (
                    <div className="font-medium">
                        {String(row.getValue('member_name') ?? '-')}
                    </div>
                ),
                meta: {
                    filterVariant: 'text',
                },
            },
            {
                header: 'Email',
                accessorKey: 'member_email',
                cell: ({ row }) => {
                    const email = row.getValue('member_email')

                    if (!email) {
                        return (
                            <span className="text-sm text-muted-foreground">-</span>
                        )
                    }

                    return <div className="max-w-60 truncate">{String(email)}</div>
                },
                meta: {
                    filterVariant: 'text',
                },
            },
            {
                header: 'EMI Date',
                accessorKey: 'emi_date',
                cell: ({ row }) => {
                    const emiDate = row.getValue('emi_date')

                    if (!emiDate) {
                        return (
                            <span className="text-sm text-muted-foreground">-</span>
                        )
                    }

                    return (
                        <Badge variant="outline">
                            {formatDateDDMMYYYY(String(emiDate))}
                        </Badge>
                    )
                },
                meta: {
                    filterVariant: 'text',
                },
            },
            {
                header: 'EMI Amount',
                accessorKey: 'emi_amount',
                cell: ({ row }) => {
                    const amount = row.getValue('emi_amount')

                    return (
                        <div className="font-medium">
                            ₹
                            {Number(amount ?? 0).toLocaleString('en-IN', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                            })}
                        </div>
                    )
                },
                meta: {
                    filterVariant: 'text',
                },
            },
            {
                header: 'Mail Status',
                accessorKey: 'is_mail_send',
                cell: ({ row }) => {
                    const isMailSend = row.original.is_mail_send

                    const sent =
                        isMailSend == 1
                    return (
                        <Badge
                            variant="outline"
                            className={
                                sent
                                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                    : 'border-amber-200 bg-amber-50 text-amber-700'
                            }
                        >
                            {sent ? 'Sent' : 'Pending'}
                        </Badge>
                    )
                },
                meta: {
                    filterVariant: 'select',
                },
            },
            {
                header: 'Sent By',
                accessorKey: 'send_by',
                cell: ({ row }) => {
                    const sendBy = row.getValue('send_by')

                    if (!sendBy) {
                        return (
                            <span className="text-sm text-muted-foreground">-</span>
                        )
                    }

                    return <div>{String(sendBy)}</div>
                },
                meta: {
                    filterVariant: 'text',
                },
            },
            {
                header: 'Sent At',
                accessorKey: 'send_at',
                cell: ({ row }) => {
                    const sendAt = row.getValue('send_at')

                    if (!sendAt) {
                        return (
                            <span className="text-sm text-muted-foreground">-</span>
                        )
                    }

                    return (
                        <Badge variant="outline">
                            {formatDateDDMMYYYY(String(sendAt))}
                        </Badge>
                    )
                },
                meta: {
                    filterVariant: 'text',
                },
            },
        ],
        []
    )

    const table = useReactTable({
        data: recoveryNotices,
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
                                    <Skeleton className="h-4 w-32" />
                                </TableHead>
                                <TableHead className="h-10 border-t">
                                    <Skeleton className="h-4 w-24" />
                                </TableHead>
                                <TableHead className="h-10 border-t">
                                    <Skeleton className="h-4 w-32" />
                                </TableHead>
                                <TableHead className="h-10 border-t">
                                    <Skeleton className="h-4 w-40" />
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
                                        <Skeleton className="h-4 w-32" />
                                    </TableCell>
                                    <TableCell>
                                        <Skeleton className="h-4 w-24" />
                                    </TableCell>
                                    <TableCell>
                                        <Skeleton className="h-4 w-32" />
                                    </TableCell>
                                    <TableCell>
                                        <Skeleton className="h-4 w-40" />
                                    </TableCell>
                                    <TableCell>
                                        <Skeleton className="h-6 w-28 rounded-full" />
                                    </TableCell>
                                    <TableCell>
                                        <Skeleton className="h-4 w-24" />
                                    </TableCell>
                                    <TableCell>
                                        <Skeleton className="h-6 w-24 rounded-full" />
                                    </TableCell>
                                    <TableCell>
                                        <Skeleton className="h-4 w-24" />
                                    </TableCell>
                                    <TableCell>
                                        <Skeleton className="h-6 w-28 rounded-full" />
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
        return (
            <div className="p-4 text-red-500">
                Failed to fetch recovery notices.
            </div>
        )
    }

    return (
        <div className="overflow-hidden rounded-md">
            <div className="flex flex-wrap justify-between gap-3 px-2 py-6">
                <div className="my-auto flex flex-wrap gap-3">
                    <div className="w-55">
                        <Filter column={table.getColumn('application_no')!} />
                    </div>
                    <div className="w-45">
                        <Filter column={table.getColumn('member_id')!} />
                    </div>
                    <div className="w-60">
                        <Filter column={table.getColumn('member_name')!} />
                    </div>
                    <div className="w-45">
                        <Filter column={table.getColumn('is_mail_send')!} />
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id} className=' cursor-pointer'>
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
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-24 text-center"
                                >
                                    There is no data.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}