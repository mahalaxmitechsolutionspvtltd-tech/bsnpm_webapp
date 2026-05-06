"use client"

import React from "react"
import { useQuery } from "@tanstack/react-query"
import { AgGridReact } from "ag-grid-react"
import {
    AllCommunityModule,
    CellClickedEvent,
    ColDef,
    ICellRendererParams,
    ModuleRegistry,
    ValueFormatterParams,
} from "ag-grid-community"
import { Plus, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import {
    getReserveFundsHandler,
    ReserveFund,
    ReserveFundStatus,
} from "@/services/reserveFundsHandler"
import ReserveFundsDialog from "./ReserveFundsDialog"
import ViewReseveFunds from "./ViewReseveFunds"

ModuleRegistry.registerModules([AllCommunityModule])

type StatusFilterValue = "all" | ReserveFundStatus

type ReserveFundStatusBadgeProps = {
    status: ReserveFundStatus
}

const currencyFormatter = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
})

function formatCurrency(value: unknown): string {
    const amount = Number(value)
    return currencyFormatter.format(Number.isFinite(amount) ? amount : 0)
}

function getStatusBadgeClass(status: ReserveFundStatus): string {
    if (status === "active") {
        return "border-emerald-200 bg-emerald-50 text-emerald-700"
    }

    if (status === "inactive") {
        return "border-slate-200 bg-slate-50 text-slate-600"
    }

    return "border-rose-200 bg-rose-50 text-rose-700"
}

function ReserveFundStatusBadge({ status }: ReserveFundStatusBadgeProps) {
    return (
        <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${getStatusBadgeClass(status)}`}>
            {status}
        </span>
    )
}

export default function ReserveFunds() {
    const [search, setSearch] = React.useState("")
    const [statusFilter, setStatusFilter] = React.useState<StatusFilterValue>("all")
    const [isDialogOpen, setIsDialogOpen] = React.useState(false)
    const [isViewDialogOpen, setIsViewDialogOpen] = React.useState(false)
    const [selectedReserveFund, setSelectedReserveFund] = React.useState<ReserveFund | null>(null)

    const { data, isLoading, isFetching, isError, error } = useQuery({
        queryKey: ["reserve-funds", search, statusFilter],
        queryFn: () =>
            getReserveFundsHandler({
                search,
                status: statusFilter === "all" ? undefined : statusFilter,
                per_page: 100,
                sort_by: "id",
                sort_order: "desc",
            }),
    })

    const rowData = React.useMemo<ReserveFund[]>(() => {
        return data?.data?.data ?? []
    }, [data])

    const columnDefs = React.useMemo<ColDef<ReserveFund>[]>(
        () => [
            {
                headerName: "Reserve Fund ID",
                field: "reserve_fund_id",
                minWidth: 180,
                flex: 1,
                pinned: "left",
                sortable: true,
                filter: "agTextColumnFilter",
                floatingFilter: false,
                menuTabs: ["filterMenuTab"],
            },
            {
                headerName: "Title",
                field: "title",
                minWidth: 260,
                flex: 1.6,
                sortable: true,
                filter: "agTextColumnFilter",
                floatingFilter: false,
                menuTabs: ["filterMenuTab"],
            },
            {
                headerName: "Amount",
                field: "amount",
                minWidth: 160,
                flex: 1,
                sortable: true,
                filter: "agNumberColumnFilter",
                floatingFilter: false,
                menuTabs: ["filterMenuTab"],
                type: "rightAligned",
                valueFormatter: (params: ValueFormatterParams<ReserveFund, string | number>) => formatCurrency(params.value),
            },
            {
                headerName: "Payment Mode",
                field: "payment_mode",
                minWidth: 160,
                flex: 1,
                sortable: true,
                filter: "agTextColumnFilter",
                floatingFilter: false,
                menuTabs: ["filterMenuTab"],
                valueFormatter: (params: ValueFormatterParams<ReserveFund, string | null>) => params.value ? params.value.toUpperCase() : "-",
            },
            {
                headerName: "Financial Year",
                field: "financial_year",
                minWidth: 160,
                flex: 1,
                sortable: true,
                filter: "agTextColumnFilter",
                floatingFilter: false,
                menuTabs: ["filterMenuTab"],
                valueFormatter: (params: ValueFormatterParams<ReserveFund, string | null>) => params.value || "-",
            },
            {
                headerName: "Status",
                field: "status",
                minWidth: 140,
                flex: 0.8,
                sortable: true,
                filter: "agSetColumnFilter",
                floatingFilter: false,
                menuTabs: ["filterMenuTab"],
                cellRenderer: (params: ICellRendererParams<ReserveFund, ReserveFundStatus>) => (
                    <ReserveFundStatusBadge status={params.value ?? "inactive"} />
                ),
            },
            {
                headerName: "Created By",
                field: "created_by",
                minWidth: 170,
                flex: 1,
                sortable: true,
                filter: "agTextColumnFilter",
                floatingFilter: false,
                menuTabs: ["filterMenuTab"],
                valueFormatter: (params: ValueFormatterParams<ReserveFund, string | null>) => params.value || "-",
            },
        ],
        []
    )

    const defaultColDef = React.useMemo<ColDef<ReserveFund>>(
        () => ({
            resizable: true,
            suppressMovable: true,
            sortable: true,
            filter: true,
            floatingFilter: false,
        }),
        []
    )

    const handleCellClick = React.useCallback((event: CellClickedEvent<ReserveFund>) => {
        if (!event.data) {
            return
        }

        setSelectedReserveFund(event.data)
        setIsViewDialogOpen(true)
    }, [])

    const handleViewDialogOpenChange = React.useCallback((open: boolean) => {
        setIsViewDialogOpen(open)

        if (!open) {
            setSelectedReserveFund(null)
        }
    }, [])

    return (
        <>
            <style jsx global>{`
                .reserve-funds-ag-grid {
                    border-top-left-radius: 0 !important;
                    border-top-right-radius: 0 !important;
                    border-bottom-left-radius: 5.6px !important;
                    border-bottom-right-radius: 5.6px !important;
                    overflow: hidden !important;
                }

                .reserve-funds-ag-grid .ag-root-wrapper,
                .reserve-funds-ag-grid .ag-root,
                .reserve-funds-ag-grid .ag-header,
                .reserve-funds-ag-grid .ag-header-viewport,
                .reserve-funds-ag-grid .ag-header-container {
                    border-top-left-radius: 0 !important;
                    border-top-right-radius: 0 !important;
                }

                .reserve-funds-ag-grid .ag-root-wrapper,
                .reserve-funds-ag-grid .ag-root {
                    border-bottom-left-radius: 5.6px !important;
                    border-bottom-right-radius: 5.6px !important;
                }
            `}</style>

            <div className="space-y-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-slate-950">
                            Reserve Funds
                        </h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Manage society reserve fund records, fund entries, status and audit details.
                        </p>
                    </div>

                    <Button
                        type="button"
                        className="h-10 rounded-lg px-4"
                        onClick={() => setIsDialogOpen(true)}
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Fund
                    </Button>
                </div>

                <div className="border rounded-xl">
                    <div className="p-0">
                        <div className="flex gap-3 border-b px-4 py-4 md:flex-row md:items-center">
                            <div className="relative w-full md:max-w-sm">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <Input
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder="Search reserve fund..."
                                    className="rounded-lg border-slate-300 pl-9"
                                />
                            </div>

                            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilterValue)}>
                                <SelectTrigger className="h-10 w-full rounded-lg border-slate-300 bg-white md:w-48">
                                    <SelectValue placeholder="Filter status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {isError ? (
                            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-600">
                                {error instanceof Error ? error.message : "Failed to fetch reserve funds"}
                            </div>
                        ) : (
                            <div className="h-140">
                                <div className="reserve-funds-ag-grid ag-theme-quartz h-full">
                                    <AgGridReact<ReserveFund>
                                        rowData={rowData}
                                        columnDefs={columnDefs}
                                        defaultColDef={defaultColDef}
                                        loading={isLoading || isFetching}
                                        animateRows={true}
                                        rowHeight={46}
                                        headerHeight={44}
                                        pagination={true}
                                        paginationPageSize={10}
                                        paginationPageSizeSelector={[10, 20, 50, 100]}
                                        suppressCellFocus={true}
                                        onCellClicked={handleCellClick}
                                        overlayNoRowsTemplate="<span style='font-size: 14px; color: #64748b;'>No reserve funds found</span>"
                                        overlayLoadingTemplate="<span style='font-size: 14px; color: #64748b;'>Loading reserve funds...</span>"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <ReserveFundsDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
            />

            <ViewReseveFunds
                open={isViewDialogOpen}
                onOpenChange={handleViewDialogOpenChange}
                reserveFund={selectedReserveFund}
            />
        </>
    )
}