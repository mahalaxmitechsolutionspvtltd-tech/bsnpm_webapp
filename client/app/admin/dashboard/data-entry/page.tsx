'use client'

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
import { useQuery } from '@tanstack/react-query'
import Filter from '@/components/ui/filter'
import { Skeleton } from '@/components/ui/skeleton'
import { getDataEntryHandler } from '@/services/dataEntryHandler'
import { Badge } from '@/components/ui/badge'
import AddDataEntryDialog from './AddEntry'
import ViewAndEdit from './ViewAndEdit'
import { DataEntry } from '@/types/dataEntryTypes'
import { formatApiDate } from '@/lib/formateApiDate'

declare module '@tanstack/react-table' {
    interface ColumnMeta<TData extends RowData, TValue> {
        filterVariant?: 'text' | 'range' | 'select'
    }
}

type DataEntryTableRow = DataEntry

const normalizeValue = (value: unknown) => String(value ?? '').trim().toLowerCase()

const searchFilter: FilterFn<DataEntryTableRow> = (row, _columnId, filterValue) => {
    const search = normalizeValue(filterValue)

    if (!search) return true

    const id = normalizeValue(row.original.id)
    const voucher = normalizeValue((row.original as DataEntry & { voucher?: string | null }).voucher)
    const voucherNo = normalizeValue((row.original as DataEntry & { voucher_no?: string | null }).voucher_no)
    const category = normalizeValue(row.original.category)
    const reference = normalizeValue(row.original.reference)
    const paymentMode = normalizeValue(row.original.payment_mode)
    const description = normalizeValue(row.original.description)
    const amount = normalizeValue(row.original.amount)
    const entryType = normalizeValue(row.original.entry_type)
    const createdBy = normalizeValue((row.original as DataEntry & { created_by?: string | null }).created_by)
    const date = normalizeValue(row.original.date)

    return (
        id.includes(search) ||
        voucher.includes(search) ||
        voucherNo.includes(search) ||
        category.includes(search) ||
        reference.includes(search) ||
        paymentMode.includes(search) ||
        description.includes(search) ||
        amount.includes(search) ||
        entryType.includes(search) ||
        createdBy.includes(search) ||
        date.includes(search)
    )
}

const exactSelectFilter: FilterFn<DataEntryTableRow> = (row, columnId, filterValue) => {
    const selected = normalizeValue(filterValue)

    if (!selected) return true

    const cellValue = normalizeValue(row.getValue(columnId))
    return cellValue === selected
}

export default function Page() {
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const [sorting, setSorting] = useState<SortingState>([{ id: 'id', desc: true }])
    const [selectedRow, setSelectedRow] = useState<DataEntry | null>(null)
    const [dialogOpen, setDialogOpen] = useState(false)

    const { data: dataEntries = [], isLoading, isError } = useQuery({
        queryKey: ['data-entry'],
        queryFn: getDataEntryHandler,
    })

    const mappedData = useMemo<DataEntry[]>(() => {
        return Array.isArray(dataEntries) ? dataEntries : []
    }, [dataEntries])

    const totalIncome = useMemo(() => {
        return mappedData.reduce((sum, item) => {
            if (String(item.entry_type).toLowerCase() === 'income') {
                return sum + Number(item.amount ?? 0)
            }
            return sum
        }, 0)
    }, [mappedData])

    const totalExpense = useMemo(() => {
        return mappedData.reduce((sum, item) => {
            if (String(item.entry_type).toLowerCase() === 'expense') {
                return sum + Number(item.amount ?? 0)
            }
            return sum
        }, 0)
    }, [mappedData])

    const handleRowOpen = (row: DataEntry) => {
        setSelectedRow(row)
        setDialogOpen(true)
    }

    const handleCreateSuccessOpenView = (row: DataEntry) => {
        setSelectedRow(row)
        setDialogOpen(true)
    }

    const columns: ColumnDef<DataEntry>[] = useMemo(
        () => [
            {
                header: 'ID',
                accessorKey: 'id',
                cell: ({ row }) => (
                    <div className='text-[13px] text-slate-500'>
                        {row.original.id}
                    </div>
                ),
            },
            {
                header: 'Voucher',
                accessorKey: 'voucher_no',
                cell: ({ row }) => (
                    <div className='text-[13px] font-semibold text-slate-800'>
                        {String((row.original as DataEntry & { voucher_no?: string | null }).voucher_no ?? '-')}
                    </div>
                ),
            },
            {
                header: 'Head',
                accessorKey: 'category',
                filterFn: searchFilter,
                cell: ({ row }) => (
                    <div className='text-[13px] font-medium text-slate-800'>
                        {String(row.original.category ?? '-')}
                    </div>
                ),
                meta: {
                    filterVariant: 'text',
                },
            },
            {
                header: 'Payment Mode',
                accessorKey: 'payment_mode',
                cell: ({ row }) => (
                    <div className='text-[13px] text-slate-700'>
                        {String(row.original.payment_mode ?? '-')}
                    </div>
                ),
            },
            {
                header: 'Type',
                accessorKey: 'entry_type',
                filterFn: exactSelectFilter,
                cell: ({ row }) => {
                    const value = String(row.getValue('entry_type') ?? '-')
                    const isIncome = value.toLowerCase() === 'income'

                    return (
                        <Badge
                            className={
                                isIncome
                                    ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
                                    : 'bg-rose-100 text-rose-700 hover:bg-rose-100'
                            }
                        >
                            {value.toUpperCase()}
                        </Badge>
                    )
                },
                meta: {
                    filterVariant: 'select',
                },
            },
            {
                header: 'Amount',
                accessorKey: 'amount',
                cell: ({ row }) => {
                    const type = String(row.original.entry_type ?? '').toLowerCase()
                    const amount = Number(row.original.amount ?? 0)

                    return (
                        <div
                            className={`text-[13px] font-semibold ${type === 'income' ? 'text-emerald-700' : 'text-rose-700'}`}
                        >
                            ₹{' '}
                            {amount.toLocaleString('en-IN', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                            })}
                        </div>
                    )
                },
            },
            {
                header: 'Date',
                accessorKey: 'date',
                cell: ({ row }) => (
                    <div className='text-[13px] text-slate-700'>
                        {formatApiDate(row.original.date)}
                    </div>
                ),
            },
        ],
        []
    )

    const table = useReactTable({
        data: mappedData,
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
            <div className='w-full space-y-4'>
                <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                    <div className='rounded-xl border border-rose-200 bg-white p-4 shadow-sm'>
                        <Skeleton className='mb-3 h-4 w-24' />
                        <Skeleton className='h-8 w-40' />
                    </div>
                    <div className='rounded-xl border border-emerald-200 bg-white p-4 shadow-sm'>
                        <Skeleton className='mb-3 h-4 w-24' />
                        <Skeleton className='h-8 w-40' />
                    </div>
                </div>

                <div className='rounded-lg border border-border'>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                {Array.from({ length: 10 }).map((_, index) => (
                                    <TableHead key={index}>
                                        <Skeleton className='h-4 w-20' />
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {Array.from({ length: 5 }).map((_, index) => (
                                <TableRow key={index}>
                                    {Array.from({ length: 10 }).map((__, cellIndex) => (
                                        <TableCell key={cellIndex}>
                                            <Skeleton className='h-4 w-20' />
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
        return <div className='p-4 text-red-500'>Failed to fetch data entry.</div>
    }

    return (
        <div className='w-full space-y-4'>
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                <div className='rounded-xl border border-rose-200 bg-white p-4'>
                    <div className='mb-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-500'>
                        Total Expense
                    </div>
                    <div className='text-[22px] font-bold text-[#b51f4a]'>
                        ₹{' '}
                        {totalExpense.toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                        })}
                    </div>
                </div>

                <div className='rounded-xl border border-emerald-200 bg-white p-4'>
                    <div className='mb-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-500'>
                        Total Income
                    </div>
                    <div className='text-[22px] font-bold text-[#0d7a55]'>
                        ₹{' '}
                        {totalIncome.toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                        })}
                    </div>
                </div>
            </div>

            <div className='overflow-hidden rounded-md'>
                <div className='flex flex-col gap-3 px-2 py-4 md:flex-row md:items-end md:justify-between'>
                    <div className='flex w-full flex-col gap-3 md:w-auto md:flex-row md:items-end'>
                        <div className='w-full md:w-95'>
                            <Filter column={table.getColumn('category')!} />
                        </div>

                        <div className='w-full md:w-40'>
                            <Filter column={table.getColumn('entry_type')!} />
                        </div>
                    </div>

                    <div className='flex justify-end'>
                        <AddDataEntryDialog onSuccessOpenView={handleCreateSuccessOpenView} />
                    </div>
                </div>

                <div className='rounded-lg border border-border'>
                    <Table>
                        <TableHeader>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => (
                                        <TableHead
                                            key={header.id}
                                            className='text-[12px] font-bold uppercase text-slate-600'
                                        >
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(header.column.columnDef.header, header.getContext())}
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
                                        onClick={() => handleRowOpen(row.original)}
                                        className='cursor-pointer transition-colors hover:bg-slate-50'
                                    >
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell key={cell.id} className='text-[13px]'>
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={columns.length} className='h-24 text-center'>
                                        No results.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {selectedRow ? (
                <ViewAndEdit
                    data={selectedRow}
                    open={dialogOpen}
                    onOpenChange={setDialogOpen}
                />
            ) : null}
        </div>
    )
}