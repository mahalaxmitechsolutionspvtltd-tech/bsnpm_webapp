"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { AgGridReact } from "ag-grid-react"
import {
    AllCommunityModule,
    ModuleRegistry,
    themeQuartz,
} from "ag-grid-community"
import type {
    CellClickedEvent,
    ColDef,
    ICellRendererParams,
    IHeaderParams,
    ValueFormatterParams,
} from "ag-grid-community"
import {
    CalendarDays,
    ChevronDown,
    Download,
    FileText,
    ListFilter,
    Search,
    Sheet,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { DepositApplication } from "@/types/depositeTypes"
import { getAllDepositeApplications } from "@/services/depositeHandler"
import View from "./View"

ModuleRegistry.registerModules([AllCommunityModule])

type DepositeApplicationsHeaderParams = IHeaderParams<DepositApplication> & {
    displayName: string
}

type SelectOption = {
    value: string
    label: string
}

type DepositApplicationWithStatus = DepositApplication & {
    application_status?: string | number | boolean | null
    status?: string | number | boolean | null
    deposit_status?: string | number | boolean | null
    approval_status?: string | number | boolean | null
    applicationStatus?: string | number | boolean | null
    depositStatus?: string | number | boolean | null
    is_approved?: string | number | boolean | null
}

const normalizeValue = (value: unknown) => String(value ?? "").trim().toLowerCase()

const formatDate = (value: unknown) => {
    if (!value) return "-"
    const stringValue = String(value)
    if (stringValue.includes("T")) {
        return stringValue.split("T")[0]
    }
    return stringValue
}

const getDisplayValue = (value: unknown) => {
    if (value === null || value === undefined || value === "") return "-"
    return String(value)
}

const getApplicationStatus = (application?: DepositApplication | null) => {
    const data = application as DepositApplicationWithStatus | null | undefined
    const rawStatus =
        data?.application_status ??
        data?.status ??
        data?.deposit_status ??
        data?.approval_status ??
        data?.applicationStatus ??
        data?.depositStatus ??
        data?.is_approved

    if (typeof rawStatus === "boolean") {
        return rawStatus ? "approved" : "pending"
    }

    if (typeof rawStatus === "number") {
        if (rawStatus === 1) return "approved"
        if (rawStatus === 0) return "pending"
    }

    const status = getDisplayValue(rawStatus)

    return status === "-" ? "pending" : status
}

const getStatusBadgeClass = (status?: string | null) => {
    const value = normalizeValue(status)

    if (value === "approved" || value === "active" || value === "completed" || value === "success") {
        return "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300"
    }

    if (value === "pending" || value === "processing" || value === "in process") {
        return "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-50 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300"
    }

    if (value === "rejected" || value === "cancelled" || value === "inactive" || value === "failed") {
        return "border-red-200 bg-red-50 text-red-700 hover:bg-red-50 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
    }

    return "border-border bg-muted text-foreground hover:bg-muted"
}

const escapeHtml = (value: string) => {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;")
}

const defaultValueFormatter = (
    params: ValueFormatterParams<DepositApplication, unknown>
) => {
    return getDisplayValue(params.value)
}

const depositeApplicationsTableTheme = themeQuartz.withParams({
    borderRadius: 5.6,
    wrapperBorderRadius: 5.6,
    headerHeight: 42,
    rowHeight: 48,
    fontSize: 13,
    spacing: 7,
    headerFontSize: 12,
    headerFontWeight: 700,
})

const DepositeApplicationsHeader = (params: DepositeApplicationsHeaderParams) => {
    const menuButtonRef = useRef<HTMLButtonElement | null>(null)

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
                    if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault()
                        params.progressSort(event.shiftKey)
                    }
                }}
                className="min-w-0 flex-1 truncate text-left text-[12px] font-bold uppercase tracking-[0.04em] text-foreground"
            >
                {String(params.displayName ?? "").toUpperCase()}
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

const ApplicationNoCellRenderer = (
    params: ICellRendererParams<DepositApplication, unknown>
) => {
    return (
        <div className="flex h-full min-w-0 items-center">
            <span className="truncate font-semibold text-primary">
                {getDisplayValue(params.value)}
            </span>
        </div>
    )
}

const TextCellRenderer = (
    params: ICellRendererParams<DepositApplication, unknown>
) => {
    return (
        <div className="flex h-full min-w-0 items-center">
            <span className="truncate">
                {getDisplayValue(params.value)}
            </span>
        </div>
    )
}

const DepositAmountCellRenderer = (
    params: ICellRendererParams<DepositApplication, unknown>
) => {
    return (
        <div className="flex h-full min-w-0 items-center font-semibold tabular-nums text-foreground">
            <span className="truncate">
                {getDisplayValue(params.value)}
            </span>
        </div>
    )
}

const TenureCellRenderer = (
    params: ICellRendererParams<DepositApplication, unknown>
) => {
    const value = getDisplayValue(params.value)

    return (
        <div className="flex h-full items-center">
            <span className="whitespace-nowrap">
                {value === "-" ? "-" : `${value} years`}
            </span>
        </div>
    )
}

const InterestCellRenderer = (
    params: ICellRendererParams<DepositApplication, unknown>
) => {
    const value = getDisplayValue(params.value)

    return (
        <div className="flex h-full items-center">
            <Badge
                variant="secondary"
                className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
            >
                {value === "-" ? "-" : `${value} %`}
            </Badge>
        </div>
    )
}

const StatusCellRenderer = (
    params: ICellRendererParams<DepositApplication, unknown>
) => {
    const status = getDisplayValue(params.value)

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

const DateCellRenderer = (
    params: ICellRendererParams<DepositApplication, unknown>
) => {
    const value = params.value
    const hasDate = value !== null && value !== undefined && value !== ""

    if (!hasDate) {
        return (
            <div className="flex h-full items-center">
                <span className="text-sm font-medium capitalize opacity-50">
                    pending
                </span>
            </div>
        )
    }

    return (
        <div className="flex h-full items-center">
            <Badge
                variant="outline"
                className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
            >
                <CalendarDays className="mr-1.5 h-3.5 w-3.5" />
                {formatDate(value)}
            </Badge>
        </div>
    )
}

export default function DepositeApplications() {
    const [searchText, setSearchText] = useState("")
    const [interestFilter, setInterestFilter] = useState("all")
    const [exportMenuOpen, setExportMenuOpen] = useState(false)
    const [selectedApplication, setSelectedApplication] = useState<DepositApplication | null>(null)
    const [viewOpen, setViewOpen] = useState(false)
    const exportMenuRef = useRef<HTMLDivElement | null>(null)

    const { data: applications = [], isLoading, isError } = useQuery({
        queryKey: ["deposit-applications"],
        queryFn: async () => {
            const res = await getAllDepositeApplications()
            return Array.isArray(res) ? res : (res?.data ?? [])
        },
    })

    const safeApplications = useMemo<DepositApplication[]>(() => {
        return Array.isArray(applications) ? applications : []
    }, [applications])

    const interestOptions = useMemo<SelectOption[]>(() => {
        const values = new Set<string>()

        safeApplications.forEach((application) => {
            const value = getDisplayValue(application.interest_rate)
            if (value !== "-") {
                values.add(value)
            }
        })

        return Array.from(values)
            .sort((a, b) => Number(a) - Number(b))
            .map((value) => ({
                value,
                label: `${value} %`,
            }))
    }, [safeApplications])

    const filteredApplications = useMemo<DepositApplication[]>(() => {
        const search = normalizeValue(searchText)
        const selectedInterest = normalizeValue(interestFilter)

        return safeApplications.filter((application) => {
            const applicationNo = normalizeValue(application.application_no)
            const memberName = normalizeValue(application.member_name)
            const depositAmount = normalizeValue(application.deposit_amount)
            const tenureYears = normalizeValue(application.tenure_years)
            const interestRate = normalizeValue(application.interest_rate)
            const status = normalizeValue(getApplicationStatus(application))

            const matchesSearch =
                !search ||
                applicationNo.includes(search) ||
                memberName.includes(search) ||
                depositAmount.includes(search) ||
                tenureYears.includes(search) ||
                status.includes(search)

            const matchesInterest = selectedInterest === "all" || interestRate === selectedInterest

            return matchesSearch && matchesInterest
        })
    }, [safeApplications, searchText, interestFilter])

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                exportMenuRef.current &&
                event.target instanceof Node &&
                !exportMenuRef.current.contains(event.target)
            ) {
                setExportMenuOpen(false)
            }
        }

        document.addEventListener("mousedown", handleClickOutside)

        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [])

    const handleOpenView = (application: DepositApplication) => {
        setSelectedApplication(application)
        setViewOpen(true)
    }

    const handleCellClick = (event: CellClickedEvent<DepositApplication>) => {
        const columnId = event.column.getColId()
        const isDateColumn = columnId === "start_date" || columnId === "end_date"

        if (isDateColumn || !event.data) return

        handleOpenView(event.data)
    }

    const getExportRows = () => {
        return filteredApplications.map((application) => [
            getDisplayValue(application.application_no),
            getDisplayValue(application.member_name),
            getDisplayValue(application.deposit_amount),
            getDisplayValue(application.tenure_years),
            getDisplayValue(application.interest_rate),
            getApplicationStatus(application),
            formatDate(application.start_date),
            formatDate(application.end_date),
        ])
    }

    const getExportTableHtml = () => {
        const rows = getExportRows()

        return `
            <table border="1">
                <thead>
                    <tr>
                        <th>Application No</th>
                        <th>Member Name</th>
                        <th>Deposit Amount</th>
                        <th>Tenure</th>
                        <th>Interest</th>
                        <th>Status</th>
                        <th>Start Date</th>
                        <th>End Date</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows
                .map((row) => (
                    `<tr>${row.map((cell) => `<td>${escapeHtml(String(cell))}</td>`).join("")}</tr>`
                ))
                .join("")}
                </tbody>
            </table>
        `
    }

    const handleExportExcel = () => {
        const tableHtml = getExportTableHtml()

        const workbookHtml = `
            <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
                <head>
                    <meta charset="UTF-8" />
                    <meta name="ProgId" content="Excel.Sheet" />
                    <meta name="Generator" content="Microsoft Excel 15" />
                    <style>
                        table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
                        th, td { border: 1px solid #d1d5db; padding: 8px; font-family: Arial, sans-serif; font-size: 12px; }
                        th { font-weight: 700; background: #f3f4f6; }
                    </style>
                </head>
                <body>
                    <h2>Deposite Applications</h2>
                    ${tableHtml}
                </body>
            </html>
        `

        const blob = new Blob(["\ufeff", workbookHtml], {
            type: "application/vnd.ms-excel;charset=utf-8;",
        })

        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = "deposite-applications.xls"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        setExportMenuOpen(false)
    }

    const handleExportPdf = () => {
        const tableHtml = getExportTableHtml()

        const printHtml = `
            <!doctype html>
            <html>
                <head>
                    <meta charset="UTF-8" />
                    <title>Deposite Applications</title>
                    <style>
                        @page { size: landscape; margin: 12mm; }
                        body { font-family: Arial, sans-serif; color: #111827; }
                        h1 { margin: 0 0 6px 0; font-size: 18px; }
                        p { margin: 0 0 14px 0; font-size: 11px; color: #4b5563; }
                        table { border-collapse: collapse; width: 100%; margin-top: 14px; }
                        th, td { border: 1px solid #d1d5db; padding: 7px; font-size: 11px; text-align: left; }
                        th { background: #f3f4f6; font-weight: 700; }
                    </style>
                </head>
                <body>
                    <h1>Deposite Applications</h1>
                    <p>Total Records: ${filteredApplications.length}</p>
                    ${tableHtml}
                    <script>
                        window.onload = function () {
                            window.focus();
                            window.print();
                        };
                    </script>
                </body>
            </html>
        `

        const printWindow = window.open("", "_blank", "width=1200,height=800")
        if (!printWindow) {
            setExportMenuOpen(false)
            return
        }

        printWindow.document.open()
        printWindow.document.write(printHtml)
        printWindow.document.close()
        setExportMenuOpen(false)
    }

    const columnDefs = useMemo<ColDef<DepositApplication>[]>(() => [
        {
            headerName: "Application No",
            field: "application_no",
            minWidth: 150,
            pinned: "left",
            sort: "asc",
            cellRenderer: ApplicationNoCellRenderer,
        },
        {
            headerName: "Member Name",
            field: "member_name",
            minWidth: 190,
            flex: 1,
            cellRenderer: TextCellRenderer,
        },
        {
            headerName: "Deposit Amount",
            field: "deposit_amount",
            minWidth: 135,
            cellRenderer: DepositAmountCellRenderer,
        },
        {
            headerName: "Tenure",
            field: "tenure_years",
            minWidth: 105,
            cellRenderer: TenureCellRenderer,
        },
        {
            headerName: "Interest",
            field: "interest_rate",
            minWidth: 110,
            cellRenderer: InterestCellRenderer,
        },
        {
            headerName: "Status",
            colId: "application_status",
            minWidth: 130,
            valueGetter: (params) => getApplicationStatus(params.data),
            cellRenderer: StatusCellRenderer,
        },
        {
            headerName: "Start Date",
            field: "start_date",
            minWidth: 140,
            cellRenderer: DateCellRenderer,
            cellClass: "cursor-default",
        },
        {
            headerName: "End Date",
            field: "end_date",
            minWidth: 140,
            cellRenderer: DateCellRenderer,
            cellClass: "cursor-default",
        },
    ], [])

    const defaultColDef = useMemo<ColDef<DepositApplication>>(() => ({
        sortable: true,
        filter: true,
        resizable: true,
        suppressMovable: false,
        valueFormatter: defaultValueFormatter,
        cellClass: "cursor-pointer",
        headerComponent: DepositeApplicationsHeader,
        headerClass: "deposite-applications-header-cell",
    }), [])

    if (isLoading) {
        return (
            <div className="w-full space-y-4 overflow-hidden rounded-md">
                <div className="rounded-xl border bg-background p-4 shadow-sm">
                    <Skeleton className="h-5 w-44 rounded-md" />
                    <Skeleton className="mt-2 h-4 w-72 rounded-md" />
                </div>

                <div className="w-full overflow-hidden rounded-xl border bg-background">
                    <div className="grid grid-cols-8 gap-0 border-b bg-background px-4 py-3">
                        {Array.from({ length: 8 }).map((_, index) => (
                            <Skeleton key={`header-${index}`} className="h-4 w-24 rounded-md" />
                        ))}
                    </div>

                    <div className="divide-y">
                        {Array.from({ length: 6 }).map((_, rowIndex) => (
                            <div key={`row-${rowIndex}`} className="grid grid-cols-8 gap-4 px-4 py-4">
                                {Array.from({ length: 8 }).map((__, columnIndex) => (
                                    <Skeleton
                                        key={`cell-${rowIndex}-${columnIndex}`}
                                        className="h-5 w-full rounded-md"
                                    />
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    if (isError) {
        return <div className="p-4 text-red-500">Failed to fetch deposit applications.</div>
    }

    return (
        <>
            <style jsx global>{`
                .deposite-applications-ag-grid {
                    border-top-left-radius: 0 !important;
                    border-top-right-radius: 0 !important;
                    border-bottom-left-radius: 5.6px !important;
                    border-bottom-right-radius: 5.6px !important;
                }

                .deposite-applications-ag-grid .ag-root-wrapper,
                .deposite-applications-ag-grid .ag-root,
                .deposite-applications-ag-grid .ag-header,
                .deposite-applications-ag-grid .ag-header-viewport,
                .deposite-applications-ag-grid .ag-header-container {
                    border-top-left-radius: 0 !important;
                    border-top-right-radius: 0 !important;
                }

                .deposite-applications-ag-grid .ag-root-wrapper,
                .deposite-applications-ag-grid .ag-root {
                    border-bottom-left-radius: 5.6px !important;
                    border-bottom-right-radius: 5.6px !important;
                }

                .deposite-applications-ag-grid .ag-body-horizontal-scroll,
                .deposite-applications-ag-grid .ag-body-vertical-scroll {
                    display: none !important;
                    height: 0 !important;
                    width: 0 !important;
                    min-height: 0 !important;
                    min-width: 0 !important;
                    max-height: 0 !important;
                    max-width: 0 !important;
                    overflow: hidden !important;
                }

                .deposite-applications-ag-grid .ag-body-viewport,
                .deposite-applications-ag-grid .ag-center-cols-viewport,
                .deposite-applications-ag-grid .ag-body-horizontal-scroll-viewport,
                .deposite-applications-ag-grid .ag-body-vertical-scroll-viewport {
                    scrollbar-width: none !important;
                    -ms-overflow-style: none !important;
                }

                .deposite-applications-ag-grid .ag-body-viewport::-webkit-scrollbar,
                .deposite-applications-ag-grid .ag-center-cols-viewport::-webkit-scrollbar,
                .deposite-applications-ag-grid .ag-body-horizontal-scroll-viewport::-webkit-scrollbar,
                .deposite-applications-ag-grid .ag-body-vertical-scroll-viewport::-webkit-scrollbar {
                    display: none !important;
                    width: 0 !important;
                    height: 0 !important;
                }

                .deposite-applications-ag-grid .deposite-applications-header-cell {
                    padding-left: 12px !important;
                    padding-right: 8px !important;
                }

                .deposite-applications-ag-grid .ag-header-cell-comp-wrapper,
                .deposite-applications-ag-grid .ag-cell-label-container {
                    width: 100% !important;
                }

                .deposite-applications-ag-grid .ag-header-cell-label {
                    width: 100% !important;
                }

                .deposite-applications-ag-grid .ag-header-cell-menu-button,
                .deposite-applications-ag-grid .ag-header-cell-filter-button,
                .deposite-applications-ag-grid .ag-sort-indicator-container {
                    display: none !important;
                }

                .deposite-applications-ag-grid .ag-header-cell-text {
                    text-transform: uppercase !important;
                }

                .deposite-applications-ag-grid .ag-cell {
                    display: flex;
                    align-items: center;
                }

                .deposite-applications-ag-grid .ag-header-cell-resize {
                    right: 0;
                }
            `}</style>

            <div className="w-full space-y-4 overflow-hidden rounded-md">
                <View open={viewOpen} onOpenChange={setViewOpen} data={selectedApplication} />

                <div>
                    <p className="text-xl font-bold text-foreground">
                        Deposite Applications
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                        Showing {filteredApplications.length} of {safeApplications.length} applications
                    </p>
                </div>

                <div className="overflow-hidden rounded-xl border bg-background shadow-sm">
                    <div className="border-b bg-background px-4 py-3">
                        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
                            <div className="grid w-full grid-cols-1 gap-3 md:grid-cols-[minmax(240px,1fr)_160px] xl:max-w-2xl">
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-foreground">
                                        Search
                                    </label>
                                    <div className="relative">
                                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            value={searchText}
                                            onChange={(event) => setSearchText(event.target.value)}
                                            placeholder="Search by Application No, Member Name, Amount, Tenure..."
                                            className="h-10 rounded-xl border-border bg-background pl-9 text-sm"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-foreground">
                                        Interest
                                    </label>
                                    <Select value={interestFilter} onValueChange={setInterestFilter}>
                                        <SelectTrigger className="h-10 rounded-xl">
                                            <SelectValue placeholder="Interest" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl">
                                            <SelectItem value="all">All</SelectItem>
                                            {interestOptions.map((option) => (
                                                <SelectItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div ref={exportMenuRef} className="relative flex w-full items-end justify-end xl:w-auto">
                                <Button
                                    type="button"
                                    onClick={() => setExportMenuOpen((open) => !open)}
                                    className="h-10 w-full rounded-xl xl:w-44"
                                    disabled={filteredApplications.length === 0}
                                >
                                    <Download className="mr-2 h-4 w-4" />
                                    Export
                                    <ChevronDown className="ml-2 h-4 w-4" />
                                </Button>

                                {exportMenuOpen ? (
                                    <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-48 overflow-hidden rounded-xl border bg-popover p-1 shadow-xl">
                                        <button
                                            type="button"
                                            onClick={handleExportPdf}
                                            className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm font-medium text-popover-foreground hover:bg-muted"
                                        >
                                            <FileText className="mr-2 h-4 w-4" />
                                            Export PDF
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleExportExcel}
                                            className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm font-medium text-popover-foreground hover:bg-muted"
                                        >
                                            <Sheet className="mr-2 h-4 w-4" />
                                            Export Excel
                                        </button>
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    </div>

                    <div className="deposite-applications-ag-grid h-160 w-full overflow-hidden">
                        <AgGridReact<DepositApplication>
                            theme={depositeApplicationsTableTheme}
                            rowData={filteredApplications}
                            columnDefs={columnDefs}
                            defaultColDef={defaultColDef}
                            pagination
                            paginationPageSize={10}
                            paginationPageSizeSelector={[10, 20, 50, 100]}
                            animateRows
                            rowSelection="single"
                            suppressCellFocus
                            suppressRowClickSelection
                            suppressHorizontalScroll
                            onCellClicked={handleCellClick}
                            overlayNoRowsTemplate="<span class='text-sm text-muted-foreground'>No results.</span>"
                        />
                    </div>
                </div>
            </div>
        </>
    )
}