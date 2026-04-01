'use client'

import * as React from 'react'
import type { ColumnDef, FilterFn } from '@tanstack/react-table'
import {
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    useReactTable,
} from '@tanstack/react-table'
import { useQuery } from '@tanstack/react-query'
import {
    BadgeIndianRupee,
    CalendarDays,
    LayoutGrid,
    List,
    Percent,
    User2,
    FileText,
    CreditCard,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { getLoanApplicationsHandler } from '@/services/loanHandler'
import type { LoanApplication } from '@/types/LoanApplications'
import ViewLoanApplication from './EditLoanApplication'

type GetLoanApplicationsResponse = {
    success: boolean
    message: string
    data: LoanApplication[]
}

type ViewMode = 'list' | 'grid'

const globalLoanSearchFilter: FilterFn<LoanApplication> = (row, _columnId, filterValue) => {
    const search = String(filterValue ?? '')
        .toLowerCase()
        .trim()

    if (!search) return true

    const applicationNo = String(row.original.application_no ?? '').toLowerCase()
    const memberName = String(row.original.member_name ?? '').toLowerCase()
    const memberId = String(row.original.member_id ?? '').toLowerCase()

    return (
        applicationNo.includes(search) ||
        memberName.includes(search) ||
        memberId.includes(search)
    )
}

const getTenureLabel = (application: LoanApplication) => {
    const tenureYears = application.tenure_years
    const tenureMonths = application.tenure_months

    if (tenureYears) return `${tenureYears} Years`
    if (tenureMonths) return `${tenureMonths} Months`
    return '-'
}

const getStatusBadgeClass = (status?: string | null) => {
    const value = String(status ?? '').toLowerCase()

    if (value === 'approved') {
        return 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50'
    }

    if (value === 'pending') {
        return 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-50'
    }

    if (value === 'rejected') {
        return 'border-red-200 bg-red-50 text-red-700 hover:bg-red-50'
    }

    return 'border-border bg-muted text-foreground hover:bg-muted'
}

const LoanApplications = () => {
    const [globalFilter, setGlobalFilter] = React.useState('')
    const [openViewDialog, setOpenViewDialog] = React.useState(false)
    const [selectedApplication, setSelectedApplication] =
        React.useState<LoanApplication | null>(null)
    const [viewMode, setViewMode] = React.useState<ViewMode>('list')

    const { data, error, isLoading } = useQuery<GetLoanApplicationsResponse>({
        queryKey: ['loan-applications'],
        queryFn: getLoanApplicationsHandler,
    })

    const loanApplications = Array.isArray(data?.data) ? data.data : []

    const handleCellClick = React.useCallback(
        (application: LoanApplication, columnId: string) => {
            const blockedColumns = ['application_status', 'status', 'action', 'actions']

            if (blockedColumns.includes(columnId)) return

            setSelectedApplication(application)
            setOpenViewDialog(true)
        },
        []
    )

    const handleCardClick = React.useCallback((application: LoanApplication) => {
        setSelectedApplication(application)
        setOpenViewDialog(true)
    }, [])

    const columns: ColumnDef<LoanApplication>[] = [
        {
            header: 'Application No',
            accessorKey: 'application_no',
            cell: ({ row }) => (
                <div className="font-medium">
                    {String(row.getValue('application_no') ?? '-')}
                </div>
            ),
        },
        {
            header: 'Member ID',
            accessorKey: 'member_id',
            cell: ({ row }) => <div>{String(row.getValue('member_id') ?? '-')}</div>,
        },
        {
            header: 'Member Name',
            accessorKey: 'member_name',
            cell: ({ row }) => <div>{String(row.getValue('member_name') ?? '-')}</div>,
        },
        {
            header: 'Scheme Name',
            accessorKey: 'scheme_name',
            cell: ({ row }) => <div>{String(row.getValue('scheme_name') ?? '-')}</div>,
        },
        {
            header: 'Loan Amount',
            accessorKey: 'loan_amount',
            cell: ({ row }) => <div>{String(row.getValue('loan_amount') ?? '-')}</div>,
        },
        {
            header: 'Interest Rate',
            accessorKey: 'interest_rate',
            cell: ({ row }) => (
                <Badge variant="secondary" className="rounded-xl">
                    {String(row.getValue('interest_rate') ?? '-')}%
                </Badge>
            ),
        },
        {
            header: 'Tenure',
            id: 'tenure',
            cell: ({ row }) => <div>{getTenureLabel(row.original)}</div>,
        },
        {
            header: 'Status',
            accessorKey: 'application_status',
            cell: ({ row }) => (
                <Badge className="rounded-xl">
                    {String(row.getValue('application_status') ?? '-')}
                </Badge>
            ),
        },
    ]

    const table = useReactTable({
        data: loanApplications,
        columns,
        state: {
            globalFilter,
        },
        globalFilterFn: globalLoanSearchFilter,
        onGlobalFilterChange: setGlobalFilter,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
    })

    if (isLoading) {
        return (
            <div className="w-full space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="w-full max-w-sm">
                        <Skeleton className="h-10 w-full" />
                    </div>

                    <div className="flex items-center gap-2">
                        <Skeleton className="h-10 w-24 rounded-xl" />
                        <Skeleton className="h-10 w-24 rounded-xl" />
                    </div>
                </div>

                {viewMode === 'list' ? (
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50">
                                    <TableHead className="h-10">
                                        <Skeleton className="h-4 w-28" />
                                    </TableHead>
                                    <TableHead className="h-10">
                                        <Skeleton className="h-4 w-20" />
                                    </TableHead>
                                    <TableHead className="h-10">
                                        <Skeleton className="h-4 w-28" />
                                    </TableHead>
                                    <TableHead className="h-10">
                                        <Skeleton className="h-4 w-28" />
                                    </TableHead>
                                    <TableHead className="h-10">
                                        <Skeleton className="h-4 w-24" />
                                    </TableHead>
                                    <TableHead className="h-10">
                                        <Skeleton className="h-4 w-20" />
                                    </TableHead>
                                    <TableHead className="h-10">
                                        <Skeleton className="h-4 w-20" />
                                    </TableHead>
                                    <TableHead className="h-10">
                                        <Skeleton className="h-4 w-20" />
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
                                            <Skeleton className="h-4 w-20" />
                                        </TableCell>
                                        <TableCell>
                                            <Skeleton className="h-4 w-28" />
                                        </TableCell>
                                        <TableCell>
                                            <Skeleton className="h-4 w-28" />
                                        </TableCell>
                                        <TableCell>
                                            <Skeleton className="h-4 w-24" />
                                        </TableCell>
                                        <TableCell>
                                            <Skeleton className="h-6 w-16 rounded-full" />
                                        </TableCell>
                                        <TableCell>
                                            <Skeleton className="h-4 w-20" />
                                        </TableCell>
                                        <TableCell>
                                            <Skeleton className="h-6 w-20 rounded-full" />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                        {Array.from({ length: 6 }).map((_, index) => (
                            <div
                                key={index}
                                className="rounded-2xl border bg-background p-5 shadow-sm"
                            >
                                <div className="space-y-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="space-y-2">
                                            <Skeleton className="h-5 w-36" />
                                            <Skeleton className="h-4 w-28" />
                                        </div>
                                        <Skeleton className="h-6 w-20 rounded-full" />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <Skeleton className="h-16 rounded-xl" />
                                        <Skeleton className="h-16 rounded-xl" />
                                        <Skeleton className="h-16 rounded-xl" />
                                        <Skeleton className="h-16 rounded-xl" />
                                    </div>

                                    <Skeleton className="h-4 w-40" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex h-32 items-center justify-center rounded-xl border text-sm text-red-500">
                Failed to load loan applications
            </div>
        )
    }

    return (
        <>
            <div className="w-full space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div className="w-full max-w-sm">
                        <label className="mb-2 block text-sm font-medium">Search</label>
                        <Input
                            placeholder="Search by Loan ID, Member ID, Member Name..."
                            className="rounded-xl"
                            value={globalFilter ?? ''}
                            onChange={(e) => setGlobalFilter(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant={viewMode === 'list' ? 'default' : 'outline'}
                            className="rounded-xl"
                            onClick={() => setViewMode('list')}
                        >
                            <List className="mr-2 h-4 w-4" />
                            List View
                        </Button>

                        <Button
                            type="button"
                            variant={viewMode === 'grid' ? 'default' : 'outline'}
                            className="rounded-xl"
                            onClick={() => setViewMode('grid')}
                        >
                            <LayoutGrid className="mr-2 h-4 w-4" />
                            Grid View
                        </Button>
                    </div>
                </div>

                {viewMode === 'list' ? (
                    <div className="rounded-xl border">
                        <Table>
                            <TableHeader className="border-t">
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <TableRow
                                        key={headerGroup.id}
                                        className="border-t-0 bg-muted/50"
                                    >
                                        {headerGroup.headers.map((header) => (
                                            <TableHead
                                                key={header.id}
                                                className="relative h-10 select-none border-t"
                                            >
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
                                {table.getRowModel().rows.length ? (
                                    table.getRowModel().rows.map((row) => (
                                        <TableRow key={row.id} className="hover:bg-muted/50">
                                            {row.getVisibleCells().map((cell) => {
                                                const columnId = cell.column.id
                                                const isBlockedColumn = [
                                                    'application_status',
                                                    'status',
                                                    'action',
                                                    'actions',
                                                ].includes(columnId)

                                                return (
                                                    <TableCell
                                                        key={cell.id}
                                                        onClick={() =>
                                                            handleCellClick(
                                                                row.original,
                                                                columnId
                                                            )
                                                        }
                                                        className={
                                                            isBlockedColumn
                                                                ? ''
                                                                : 'cursor-pointer'
                                                        }
                                                    >
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
                                            colSpan={columns.length}
                                            className="h-24 text-center"
                                        >
                                            No loan applications found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                ) : table.getRowModel().rows.length ? (
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                        {table.getRowModel().rows.map((row) => {
                            const application = row.original

                            return (
                                <div
                                    key={row.id}
                                    onClick={() => handleCardClick(application)}
                                    className="group cursor-pointer overflow-hidden rounded-2xl border bg-card shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                                >
                                    <div className="border-b bg-muted/30 px-5 py-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <div className="mb-1 flex items-center gap-2">
                                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                                        <FileText className="h-4 w-4" />
                                                    </div>
                                                    <p className="truncate text-base font-semibold text-foreground">
                                                        {String(application.application_no ?? '-')}
                                                    </p>
                                                </div>

                                                <p className="truncate pl-11 text-sm text-muted-foreground">
                                                    {String(application.scheme_name ?? '-')}
                                                </p>
                                            </div>

                                            <Badge
                                                variant="outline"
                                                className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${getStatusBadgeClass(
                                                    application.application_status
                                                )}`}
                                            >
                                                {String(application.application_status ?? '-')}
                                            </Badge>
                                        </div>
                                    </div>

                                    <div className="p-5">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="rounded-xl border bg-background p-3">
                                                <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                                                    <User2 className="h-4 w-4" />
                                                    <span className="text-xs font-medium">
                                                        Member
                                                    </span>
                                                </div>
                                                <p className="truncate text-sm font-semibold text-foreground">
                                                    {String(application.member_name ?? '-')}
                                                </p>
                                                <p className="mt-1 text-xs text-muted-foreground">
                                                    {String(application.member_id ?? '-')}
                                                </p>
                                            </div>

                                            <div className="rounded-xl border bg-background p-3">
                                                <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                                                    <BadgeIndianRupee className="h-4 w-4" />
                                                    <span className="text-xs font-medium">
                                                        Amount
                                                    </span>
                                                </div>
                                                <p className="truncate text-sm font-semibold text-foreground">
                                                    {String(application.loan_amount ?? '-')}
                                                </p>
                                            </div>

                                            <div className="rounded-xl border bg-background p-3">
                                                <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                                                    <Percent className="h-4 w-4" />
                                                    <span className="text-xs font-medium">
                                                        Interest
                                                    </span>
                                                </div>
                                                <p className="text-sm font-semibold text-foreground">
                                                    {String(application.interest_rate ?? '-')}%
                                                </p>
                                            </div>

                                            <div className="rounded-xl border bg-background p-3">
                                                <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                                                    <CalendarDays className="h-4 w-4" />
                                                    <span className="text-xs font-medium">
                                                        Tenure
                                                    </span>
                                                </div>
                                                <p className="text-sm font-semibold text-foreground">
                                                    {getTenureLabel(application)}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-4 flex items-center justify-between rounded-xl border bg-muted/20 px-3 py-2">
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <CreditCard className="h-4 w-4" />
                                                <span>Click to view full application</span>
                                            </div>
                                            <span className="text-xs font-medium text-primary group-hover:underline">
                                                View Details
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    <div className="flex h-24 items-center justify-center rounded-xl border text-sm">
                        No loan applications found.
                    </div>
                )}
            </div>

            <ViewLoanApplication
                open={openViewDialog}
                onOpenChange={setOpenViewDialog}
                application={selectedApplication}
            />
        </>
    )
}

export default LoanApplications