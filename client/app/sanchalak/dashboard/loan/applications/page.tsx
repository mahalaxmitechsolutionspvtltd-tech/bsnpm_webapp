'use client'

import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { AgGridReact } from 'ag-grid-react'
import {
    AllCommunityModule,
    ModuleRegistry,
    themeQuartz,
} from 'ag-grid-community'
import type {
    CellClickedEvent,
    ColDef,
    ICellRendererParams,
    IHeaderParams,
    ValueFormatterParams,
} from 'ag-grid-community'
import {
    BadgeIndianRupee,
    CalendarDays,
    LayoutGrid,
    List,
    Percent,
    User2,
    FileText,
    CreditCard,
    ListFilter,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { getLoanApplicationsHandler } from '@/services/loanHandler'
import type { LoanApplication } from '@/types/LoanApplications'
import ViewLoanApplication from './EditLoanApplication'

ModuleRegistry.registerModules([AllCommunityModule])

type GetLoanApplicationsResponse = {
    success: boolean
    message: string
    data: LoanApplication[]
}

type ViewMode = 'list' | 'grid'

type LoanApplicationGridRow = LoanApplication & {
    tenure_label?: string
}

type LoanApplicationsHeaderParams = IHeaderParams<LoanApplicationGridRow> & {
    displayName: string
}

type ButtonVariant = React.ComponentProps<typeof Button>['variant']

const getTenureLabel = (application: LoanApplication) => {
    const tenureYears = application.tenure_years
    const tenureMonths = application.tenure_months

    if (tenureYears) return `${tenureYears} Years`
    if (tenureMonths) return `${tenureMonths} Months`
    return '-'
}

const toNumber = (value: unknown) => {
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0

    if (typeof value === 'string') {
        const clean = value.replace(/,/g, '').replace(/₹/g, '').trim()
        const parsed = Number(clean)
        return Number.isFinite(parsed) ? parsed : 0
    }

    return 0
}

const formatCurrency = (value: unknown) => {
    const amount = toNumber(value)

    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount)
}

const getStatusBadgeClass = (status?: string | null) => {
    const value = String(status ?? '').toLowerCase()

    if (value === 'approved') {
        return 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300'
    }

    if (value === 'pending') {
        return 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-50 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300'
    }

    if (value === 'rejected') {
        return 'border-red-200 bg-red-50 text-red-700 hover:bg-red-50 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300'
    }

    return 'border-border bg-muted text-foreground hover:bg-muted'
}

const loanApplicationsTableTheme = themeQuartz.withParams({
    borderRadius: 10,
    wrapperBorderRadius: 10,
    headerHeight: 42,
    rowHeight: 46,
    fontSize: 13,
    spacing: 7,
    headerFontSize: 12,
    headerFontWeight: 700,
})

const LoanApplicationsHeader = (params: LoanApplicationsHeaderParams) => {
    const menuButtonRef = React.useRef<HTMLButtonElement | null>(null)

    const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault()
        event.stopPropagation()

        if (menuButtonRef.current) {
            params.showColumnMenu(menuButtonRef.current)
        }
    }

    const handleSortClick = (event: React.MouseEvent<HTMLDivElement>) => {
        event.preventDefault()
        event.stopPropagation()
        params.progressSort(event.shiftKey)
    }

    return (
        <div className="flex h-full w-full min-w-0 items-center justify-between gap-2">
            <div
                role="button"
                tabIndex={0}
                onClick={handleSortClick}
                onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        params.progressSort(event.shiftKey)
                    }
                }}
                className="min-w-0 flex-1 truncate text-left text-[12px] font-bold uppercase tracking-[0.04em] text-foreground"
            >
                {String(params.displayName ?? '').toUpperCase()}
            </div>

            <button
                ref={menuButtonRef}
                type="button"
                onClick={handleMenuClick}
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label={`${params.displayName} filter`}
            >
                <ListFilter className="h-3.5 w-3.5" />
            </button>
        </div>
    )
}

const StatusCellRenderer = (
    params: ICellRendererParams<LoanApplicationGridRow, string | null | undefined>
) => {
    const status = String(params.value ?? '-')

    return (
        <div className="flex h-full items-center">
            <Badge
                variant="outline"
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${getStatusBadgeClass(status)}`}
            >
                {status}
            </Badge>
        </div>
    )
}

const AmountCellRenderer = (
    params: ICellRendererParams<LoanApplicationGridRow, string | number | null | undefined>
) => {
    return (
        <div className="flex h-full items-center font-semibold tabular-nums text-foreground">
            {formatCurrency(params.value)}
        </div>
    )
}

const InterestCellRenderer = (
    params: ICellRendererParams<LoanApplicationGridRow, string | number | null | undefined>
) => {
    return (
        <div className="flex h-full items-center">
            <Badge
                variant="secondary"
                className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
            >
                {String(params.value ?? '-')}%
            </Badge>
        </div>
    )
}

const ApplicationNoCellRenderer = (
    params: ICellRendererParams<LoanApplicationGridRow, string | null | undefined>
) => {
    return (
        <div className="flex h-full items-center font-semibold text-primary">
            {String(params.value ?? '-')}
        </div>
    )
}

const defaultValueFormatter = (
    params: ValueFormatterParams<LoanApplicationGridRow, unknown>
) => {
    const value = params.value
    if (value === null || value === undefined || value === '') return '-'
    return String(value)
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

    const getViewButtonVariant = React.useCallback(
        (mode: ViewMode): ButtonVariant => {
            return viewMode === mode ? 'default' : 'outline'
        },
        [viewMode]
    )

    // eslint-disable-next-line react-hooks/preserve-manual-memoization
    const loanApplications = React.useMemo<LoanApplicationGridRow[]>(() => {
        const applications = Array.isArray(data?.data) ? data.data : []

        return applications.map((application) => ({
            ...application,
            tenure_label: getTenureLabel(application),
        }))
    }, [data?.data])

    const filteredGridApplications = React.useMemo(() => {
        const search = globalFilter.toLowerCase().trim()

        if (!search) return loanApplications

        return loanApplications.filter((application) => {
            const applicationNo = String(application.application_no ?? '').toLowerCase()
            const memberName = String(application.member_name ?? '').toLowerCase()
            const memberId = String(application.member_id ?? '').toLowerCase()

            return (
                applicationNo.includes(search) ||
                memberName.includes(search) ||
                memberId.includes(search)
            )
        })
    }, [globalFilter, loanApplications])

    const handleCellClick = React.useCallback((event: CellClickedEvent<LoanApplicationGridRow>) => {
        const blockedColumns = ['application_status', 'status', 'action', 'actions']
        const columnId = event.column.getColId()

        if (blockedColumns.includes(columnId)) return
        if (!event.data) return

        setSelectedApplication(event.data)
        setOpenViewDialog(true)
    }, [])

    const handleCardClick = React.useCallback((application: LoanApplication) => {
        setSelectedApplication(application)
        setOpenViewDialog(true)
    }, [])

    const columnDefs = React.useMemo<ColDef<LoanApplicationGridRow>[]>(() => [
        {
            headerName: 'Application No',
            field: 'application_no',
            minWidth: 170,
            pinned: 'left',
            cellRenderer: ApplicationNoCellRenderer,
        },
        {
            headerName: 'Member ID',
            field: 'member_id',
            minWidth: 135,
            valueFormatter: defaultValueFormatter,
        },
        {
            headerName: 'Member Name',
            field: 'member_name',
            minWidth: 210,
            flex: 1,
            valueFormatter: defaultValueFormatter,
        },
        {
            headerName: 'Scheme Name',
            field: 'scheme_name',
            minWidth: 190,
            flex: 1,
            valueFormatter: defaultValueFormatter,
        },
        {
            headerName: 'Loan Amount',
            field: 'loan_amount',
            minWidth: 160,
            type: 'rightAligned',
            cellRenderer: AmountCellRenderer,
        },
        {
            headerName: 'Interest Rate',
            field: 'interest_rate',
            minWidth: 150,
            cellRenderer: InterestCellRenderer,
        },
        {
            headerName: 'Tenure',
            field: 'tenure_label',
            minWidth: 130,
            valueFormatter: defaultValueFormatter,
        },
        {
            headerName: 'Status',
            field: 'application_status',
            minWidth: 130,
            cellRenderer: StatusCellRenderer,
        },
    ], [])

    const defaultColDef = React.useMemo<ColDef<LoanApplicationGridRow>>(() => ({
        sortable: true,
        filter: true,
        resizable: true,
        suppressMovable: false,
        valueFormatter: defaultValueFormatter,
        cellClass: 'cursor-pointer',
        headerComponent: LoanApplicationsHeader,
        headerClass: 'loan-applications-header-cell',
    }), [])

    if (isLoading) {
        return (
            <div className="w-full space-y-4">
                <div className="rounded-xl border bg-card p-4 shadow-sm">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="mt-2 h-4 w-72" />
                </div>

                {viewMode === 'list' ? (
                    <div className="overflow-hidden rounded-xl border bg-background">
                        <div className="grid grid-cols-8 gap-0 border-b bg-muted/50 px-4 py-3">
                            {Array.from({ length: 8 }).map((_, index) => (
                                <Skeleton key={index} className="h-4 w-24" />
                            ))}
                        </div>

                        <div className="divide-y">
                            {Array.from({ length: 8 }).map((_, index) => (
                                <div key={index} className="grid grid-cols-8 gap-0 px-4 py-4">
                                    {Array.from({ length: 8 }).map((__, cellIndex) => (
                                        <Skeleton key={cellIndex} className="h-4 w-24" />
                                    ))}
                                </div>
                            ))}
                        </div>
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
            <style jsx global>{`
                .loan-applications-ag-grid .ag-body-horizontal-scroll,
                .loan-applications-ag-grid .ag-body-vertical-scroll {
                    display: none !important;
                    height: 0 !important;
                    width: 0 !important;
                    min-height: 0 !important;
                    min-width: 0 !important;
                    max-height: 0 !important;
                    max-width: 0 !important;
                    overflow: hidden !important;
                }

                .loan-applications-ag-grid .ag-body-viewport,
                .loan-applications-ag-grid .ag-center-cols-viewport,
                .loan-applications-ag-grid .ag-body-horizontal-scroll-viewport,
                .loan-applications-ag-grid .ag-body-vertical-scroll-viewport {
                    scrollbar-width: none !important;
                    -ms-overflow-style: none !important;
                }

                .loan-applications-ag-grid .ag-body-viewport::-webkit-scrollbar,
                .loan-applications-ag-grid .ag-center-cols-viewport::-webkit-scrollbar,
                .loan-applications-ag-grid .ag-body-horizontal-scroll-viewport::-webkit-scrollbar,
                .loan-applications-ag-grid .ag-body-vertical-scroll-viewport::-webkit-scrollbar {
                    display: none !important;
                    width: 0 !important;
                    height: 0 !important;
                }

                .loan-applications-ag-grid .loan-applications-header-cell {
                    padding-left: 12px !important;
                    padding-right: 8px !important;
                }

                .loan-applications-ag-grid .ag-header-cell-comp-wrapper,
                .loan-applications-ag-grid .ag-cell-label-container {
                    width: 100% !important;
                }

                .loan-applications-ag-grid .ag-header-cell-label {
                    width: 100% !important;
                }

                .loan-applications-ag-grid .ag-header-cell-menu-button,
                .loan-applications-ag-grid .ag-header-cell-filter-button,
                .loan-applications-ag-grid .ag-sort-indicator-container {
                    display: none !important;
                }

                .loan-applications-ag-grid .ag-header-cell-text {
                    text-transform: uppercase !important;
                }

                .loan-applications-ag-grid .ag-cell {
                    display: flex;
                    align-items: center;
                }

                .loan-applications-ag-grid .ag-header-cell-resize {
                    right: 0;
                }
            `}</style>

            <div className="w-full space-y-4">
                <div className="">
                    <p className="text-xl font-bold text-foreground">
                        Loan Applications
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                        Showing {loanApplications.length} applications with searchable financial table
                    </p>
                </div>

                {viewMode === 'list' ? (
                    <div className="overflow-hidden rounded-xl border bg-background shadow-sm">
                        <div className="border-b bg-muted/20 px-4 py-3">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                                <div className="w-full max-w-sm">
                                    <label className="mb-2 block text-sm font-semibold text-foreground">
                                        Search
                                    </label>
                                    <Input
                                        placeholder="Search by Loan ID, Member ID, Member Name..."
                                        className="rounded-xl border-border bg-background text-sm"
                                        value={globalFilter}
                                        onChange={(event) => setGlobalFilter(event.target.value)}
                                    />
                                </div>

                                <div className="flex items-center gap-2">
                                    <Button
                                        type="button"
                                        variant={getViewButtonVariant('list')}
                                        className="rounded-xl"
                                        onClick={() => setViewMode('list')}
                                    >
                                        <List className="mr-2 h-4 w-4" />
                                        List View
                                    </Button>

                                    <Button
                                        type="button"
                                        variant={getViewButtonVariant('grid')}
                                        className="rounded-xl"
                                        onClick={() => setViewMode('grid')}
                                    >
                                        <LayoutGrid className="mr-2 h-4 w-4" />
                                        Grid View
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className="loan-applications-ag-grid h-155 w-full overflow-hidden">
                            <AgGridReact<LoanApplicationGridRow>
                                theme={loanApplicationsTableTheme}
                                rowData={loanApplications}
                                columnDefs={columnDefs}
                                defaultColDef={defaultColDef}
                                quickFilterText={globalFilter}
                                pagination
                                paginationPageSize={10}
                                paginationPageSizeSelector={[10, 20, 50, 100]}
                                animateRows
                                rowSelection="single"
                                suppressCellFocus
                                suppressRowClickSelection
                                suppressHorizontalScroll
                                onCellClicked={handleCellClick}
                                overlayNoRowsTemplate="<span class='text-sm text-muted-foreground'>No loan applications found.</span>"
                            />
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="rounded-xl border bg-background shadow-sm">
                            <div className="border-b bg-muted/20 px-4 py-3">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                                    <div className="w-full max-w-sm">
                                        <label className="mb-2 block text-sm font-semibold text-foreground">
                                            Search
                                        </label>
                                        <Input
                                            placeholder="Search by Loan ID, Member ID, Member Name..."
                                            className="h-10 rounded-xl border-border bg-background text-sm"
                                            value={globalFilter}
                                            onChange={(event) => setGlobalFilter(event.target.value)}
                                        />
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Button
                                            type="button"
                                            variant={getViewButtonVariant('list')}
                                            className="rounded-xl"
                                            onClick={() => setViewMode('list')}
                                        >
                                            <List className="mr-2 h-4 w-4" />
                                            List View
                                        </Button>

                                        <Button
                                            type="button"
                                            variant={getViewButtonVariant('grid')}
                                            className="rounded-xl"
                                            onClick={() => setViewMode('grid')}
                                        >
                                            <LayoutGrid className="mr-2 h-4 w-4" />
                                            Grid View
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {filteredGridApplications.length ? (
                            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                                {filteredGridApplications.map((application, index) => (
                                    <div
                                        key={`${application.application_no ?? 'application'}-${index}`}
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
                                                        {formatCurrency(application.loan_amount)}
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
                                ))}
                            </div>
                        ) : (
                            <div className="flex h-24 items-center justify-center rounded-xl border text-sm">
                                No loan applications found.
                            </div>
                        )}
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