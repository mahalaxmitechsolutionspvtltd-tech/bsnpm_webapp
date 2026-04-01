'use client'

import { useEffect, useMemo, useState } from 'react'
import type {
    ColumnDef,
    ColumnFiltersState,
    FilterFn,
    RowData,
    SortingState,
} from '@tanstack/react-table'
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
import { ArrowUpDown, Search } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import { getDepositeApplicaionRenewals } from '@/services/depositeHandler'
import type { DepositRenewalApplication } from '@/types/depositeTypes'
import ViewRenewals from './View'
import { Skeleton } from '@/components/ui/skeleton'


declare module '@tanstack/react-table' {
    interface ColumnMeta<TData extends RowData, TValue> {
        filterVariant?: 'text' | 'range' | 'select'
    }
}

const formatCurrency = (value: string | number | null | undefined) => {
    const amount = Number(value ?? 0)
    if (Number.isNaN(amount)) return '₹ 0.00'
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount)
}

const formatDate = (value: string | null | undefined) => {
    if (!value) return '-'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    return new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(date)
}

const getStatusBadgeClass = (status: string) => {
    switch (status) {
        case 'APPROVED':
            return 'border-emerald-200 bg-emerald-50 text-emerald-700'
        case 'REJECTED':
            return 'border-rose-200 bg-rose-50 text-rose-700'
        default:
            return 'border-amber-200 bg-amber-50 text-amber-700'
    }
}

const statusFilterFn: FilterFn<DepositRenewalApplication> = (row, columnId, filterValue) => {
    if (!filterValue) return true
    return String(row.getValue(columnId) ?? '').toUpperCase() === String(filterValue).toUpperCase()
}

const SortableHeader = ({ title, column }: { title: string; column: any }) => (
    <Button
        type="button"
        variant="ghost"
        className="h-auto p-0 font-semibold text-foreground hover:bg-transparent"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
    >
        {title}
        <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
)

export default function DepositRenewalApplicationsTable() {
    const [isHydrated, setIsHydrated] = useState(false)
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const [globalFilter, setGlobalFilter] = useState('')
    const [sorting, setSorting] = useState<SortingState>([])

    const [viewOpen, setViewOpen] = useState(false)
    const [selectedApplication, setSelectedApplication] = useState<DepositRenewalApplication | null>(null)

    useEffect(() => {
        setIsHydrated(true)
    }, [])

    const {
        data: applicationsResponse,
        isPending,
        isLoading,
        error,
    } = useQuery({
        queryKey: ['deposite-renewals-applicaions'],
        queryFn: async () => {
            const res = await getDepositeApplicaionRenewals()
            return res ?? { data: [] }
        },
        staleTime: 30_000,
        refetchOnWindowFocus: false,
    })

    const applications = useMemo<DepositRenewalApplication[]>(() => {
        if (Array.isArray(applicationsResponse)) return applicationsResponse
        if (applicationsResponse && Array.isArray((applicationsResponse as any).data)) {
            return (applicationsResponse as any).data
        }
        return []
    }, [applicationsResponse])

    const handleOpenView = (rowData: DepositRenewalApplication) => {
        setSelectedApplication(rowData)
        setViewOpen(true)
    }

    const columns = useMemo<ColumnDef<DepositRenewalApplication>[]>(() => [
        {
            header: ({ column }) => <SortableHeader title="Renewal No" column={column} />,
            accessorKey: 'renewal_application_no',
            cell: ({ row }) => (
                <button
                    type="button"
                    onClick={() => handleOpenView(row.original)}

                >
                    {String(row.getValue('renewal_application_no') ?? '-')}
                </button>
            ),
        },
        {
            header: 'Old Application no',
            accessorKey: 'old_application_no',
            cell: ({ row }) => (
                <button
                    type="button"
                    onClick={() => handleOpenView(row.original)}

                >
                    {String(row.getValue('old_application_no') ?? '-')}
                </button>
            ),
        },
        {
            header: 'Member Id',
            accessorKey: 'member_id',
            cell: ({ row }) => (
                <button
                    type="button"
                    onClick={() => handleOpenView(row.original)}

                >
                    {String(row.getValue('member_id') ?? '-')}
                </button>
            ),
        },
        {
            header: 'Member Name',
            accessorKey: 'member_name',
            cell: ({ row }) => (
                <button
                    type="button"
                    onClick={() => handleOpenView(row.original)}
                >
                    {String(row.getValue('member_name') ?? '-')}
                </button>
            ),
        },
        {
            header: 'Scheme Name',
            accessorKey: 'scheme_name',
            cell: ({ row }) => (
                <button
                    type="button"
                    onClick={() => handleOpenView(row.original)}

                >
                    {String(row.getValue('scheme_name') ?? '-')}
                </button>
            ),
        },
        {
            header: ({ column }) => <SortableHeader title="Current Deposit" column={column} />,
            accessorKey: 'current_deposit_amount',
            cell: ({ row }) => (
                <button
                    type="button"
                    onClick={() => handleOpenView(row.original)}

                >
                    {formatCurrency(row.getValue('current_deposit_amount') as any)}
                </button>
            ),
        },
        {
            header: 'Status',
            accessorKey: 'status',
            filterFn: statusFilterFn,
            cell: ({ row }) => {
                const status = String(row.getValue('status') ?? 'PENDING').toUpperCase()
                return (
                    <Badge className={cn('rounded-full border px-2.5 py-1 text-xs font-semibold', getStatusBadgeClass(status))}>
                        {status}
                    </Badge>
                )
            },
        },
        {
            header: ({ column }) => <SortableHeader title="Created At" column={column} />,
            accessorKey: 'created_at',
            cell: ({ row }) => <div>{formatDate(row.getValue('created_at') as string)}</div>,
        },
    ], [])

    const table = useReactTable({
        data: applications,
        columns,
        state: { columnFilters, globalFilter, sorting },
        onColumnFiltersChange: setColumnFilters,
        onGlobalFilterChange: setGlobalFilter,
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
        getFacetedMinMaxValues: getFacetedMinMaxValues(),
        globalFilterFn: (row, _columnId, filterValue) => {
            const search = String(filterValue ?? '').toLowerCase().trim()
            if (!search) return true
            return JSON.stringify(row.original).toLowerCase().includes(search)
        },
    })

    if (!isHydrated) return null

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

    if (error) {
        return (
            <Alert variant="destructive">
                <AlertTitle>Failed to load renewal applications</AlertTitle>
                <AlertDescription>
                    {error instanceof Error ? error.message : 'Something went wrong.'}
                </AlertDescription>
            </Alert>
        )
    }

    return (
        <>
            <div className="w-full space-y-4">
                <div className="rounded-xl border bg-background p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="relative w-full md:max-w-sm">
                            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={globalFilter}
                                onChange={(e) => setGlobalFilter(e.target.value)}
                                placeholder="Search..."
                                className="pl-9 rounded-xl"
                            />
                        </div>

                        <div className="flex w-full flex-col gap-3 sm:flex-row md:w-auto">
                            <Select
                                value={(table.getColumn('status')?.getFilterValue() as string) || 'all'}
                                onValueChange={(val) =>
                                    table.getColumn('status')?.setFilterValue(val === 'all' ? '' : val)
                                }
                            >
                                <SelectTrigger className="w-full sm:w-45 rounded-xl">
                                    <SelectValue placeholder="Filter status" />
                                </SelectTrigger>
                                <SelectContent className='rounded-xl'>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="PENDING">Pending</SelectItem>
                                    <SelectItem value="APPROVED">Approved</SelectItem>
                                    <SelectItem value="REJECTED">Rejected</SelectItem>
                                </SelectContent>
                            </Select>

                            <Button
                                variant="default"
                                className=''
                                onClick={() => {
                                    setGlobalFilter('')
                                    setColumnFilters([])
                                    setSorting([])
                                }}
                            >
                                Reset
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="overflow-hidden rounded-xl border bg-background">
                    <Table>
                        <TableHeader>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id} className="bg-muted/40">
                                    {headerGroup.headers.map((header) => (
                                        <TableHead key={header.id} className="h-11 whitespace-nowrap">
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(header.column.columnDef.header, header.getContext())}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            ))}
                        </TableHeader>

                        <TableBody>
                            {isPending ? (
                                <TableRow>
                                    <TableCell colSpan={columns.length} className="h-24 text-center">
                                        Loading...
                                    </TableCell>
                                </TableRow>
                            ) : table.getRowModel().rows.length > 0 ? (
                                table.getRowModel().rows.map((row) => (
                                    <TableRow key={row.id}>
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell key={cell.id} className="whitespace-nowrap">
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={columns.length} className="h-24 text-center">
                                        No data found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                <div className="text-sm text-muted-foreground">
                    Total: {table.getFilteredRowModel().rows.length} renewal application(s)
                </div>
            </div>

            <ViewRenewals
                open={viewOpen}
                onOpenChange={setViewOpen}
                applicationData={selectedApplication}
            />
        </>
    )
}