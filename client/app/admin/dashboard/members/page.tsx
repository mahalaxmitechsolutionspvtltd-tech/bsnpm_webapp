"use client"

import { useMemo, useState, useEffect, useRef } from "react"
import type { MouseEvent, KeyboardEvent } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
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
    UserRoundCog,
    X,
    ListFilter,
    Search,
} from "lucide-react"

import { Member } from "@/types/memberTypes"
import { getMemberHandler, updateMemberStatusHandler } from "@/services/memberHandler"
import { Badge } from "@/components/ui/badge"
import { AddMembers } from "@/components/AddMembers"
import View from "./features/View"
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { useAuth } from "@/providers/auth-provider"
import { Spinner } from "@/components/ui/spinner"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"

ModuleRegistry.registerModules([AllCommunityModule])

type MemberGridRow = Member

type MembersHeaderParams = IHeaderParams<MemberGridRow> & {
    displayName: string
}

type StatusValue = "active" | "defaulter" | "resigned" | "deactive"

type StatusActionCellProps = {
    member: Member
}

const normalizeValue = (value: unknown) => String(value ?? "").trim().toLowerCase()

const membersTableTheme = themeQuartz.withParams({
    borderRadius: 10,
    wrapperBorderRadius: 10,
    headerHeight: 42,
    rowHeight: 48,
    fontSize: 13,
    spacing: 7,
    headerFontSize: 12,
    headerFontWeight: 700,
})

const getStatusBadgeClass = (status?: string | null) => {
    const value = normalizeValue(status)

    if (value === "active") {
        return "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300"
    }

    if (value === "defaulter") {
        return "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-50 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300"
    }

    if (value === "resigned") {
        return "border-red-200 bg-red-50 text-red-700 hover:bg-red-50 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
    }

    if (value === "deactive") {
        return "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
    }

    return "border-border bg-muted text-foreground hover:bg-muted"
}

const defaultValueFormatter = (
    params: ValueFormatterParams<MemberGridRow, unknown>
) => {
    const value = params.value

    if (value === null || value === undefined || value === "") return "-"

    return String(value)
}

const MembersHeader = (params: MembersHeaderParams) => {
    const menuButtonRef = useRef<HTMLButtonElement | null>(null)

    const handleMenuClick = (event: MouseEvent<HTMLButtonElement>) => {
        event.preventDefault()
        event.stopPropagation()

        if (menuButtonRef.current) {
            params.showColumnMenu(menuButtonRef.current)
        }
    }

    const handleSortClick = (event: MouseEvent<HTMLDivElement>) => {
        event.preventDefault()
        event.stopPropagation()
        params.progressSort(event.shiftKey)
    }

    const handleSortKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault()
            params.progressSort(event.shiftKey)
        }
    }

    return (
        <div className="flex h-full w-full min-w-0 items-center justify-between gap-2">
            <div
                role="button"
                tabIndex={0}
                onClick={handleSortClick}
                onKeyDown={handleSortKeyDown}
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

const MembersActionHeader = (params: MembersHeaderParams) => {
    return (
        <div className="flex h-full w-full items-center justify-center">
            <span className="truncate text-center text-[12px] font-bold uppercase tracking-[0.04em] text-foreground">
                {String(params.displayName ?? "").toUpperCase()}
            </span>
        </div>
    )
}

const MemberIdCellRenderer = (
    params: ICellRendererParams<MemberGridRow, string | null | undefined>
) => {
    return (
        <div className="flex h-full items-center font-semibold text-primary">
            {String(params.value ?? "-")}
        </div>
    )
}

const TextCellRenderer = (
    params: ICellRendererParams<MemberGridRow, string | null | undefined>
) => {
    return (
        <div className="flex h-full min-w-0 items-center">
            <span className="truncate">{String(params.value ?? "-")}</span>
        </div>
    )
}

const CapitalizeCellRenderer = (
    params: ICellRendererParams<MemberGridRow, string | null | undefined>
) => {
    return (
        <div className="flex h-full items-center capitalize">
            {String(params.value ?? "-")}
        </div>
    )
}

const StatusCellRenderer = (
    params: ICellRendererParams<MemberGridRow, string | null | undefined>
) => {
    const status = String(params.value ?? "-")

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

const StatusActionCell = ({ member }: StatusActionCellProps) => {
    const queryClient = useQueryClient()
    const { user } = useAuth()
    const [selectedStatus, setSelectedStatus] = useState<string>(member.status || "active")

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSelectedStatus(member.status || "")
    }, [member.status])

    const updateStatusMutation = useMutation({
        mutationFn: updateMemberStatusHandler,
        onSuccess: async () => {
            toast.success("Member status updated successfully")
            await queryClient.invalidateQueries({ queryKey: ["members"] })
        },
        onError: (error: unknown) => {
            const message =
                typeof error === "object" &&
                error !== null &&
                "response" in error &&
                typeof error.response === "object" &&
                error.response !== null &&
                "data" in error.response &&
                typeof error.response.data === "object" &&
                error.response.data !== null &&
                "message" in error.response.data
                    ? String(error.response.data.message)
                    : error instanceof Error
                        ? error.message
                        : "Failed to update member status"

            toast.error(message)
        },
    })

    const handleChangeStatus = async () => {
        if (!selectedStatus || selectedStatus === member.status) return

        await updateStatusMutation.mutateAsync({
            member_id: member.member_id,
            status: selectedStatus as StatusValue,
            updated_by: user?.admin_name ? String(user.admin_name) : null,
        })
    }

    return (
        <div className="flex h-full w-full items-center justify-center">
            <Dialog
                onOpenChange={(open) => {
                    if (open) {
                        setSelectedStatus(member.status || "")
                    }
                }}
            >
                <DialogTrigger asChild>
                    <Button
                        size="sm"
                        variant="outline"
                        className="h-9 min-w-24 justify-center rounded-xl border-border bg-background px-3 text-xs font-semibold capitalize shadow-sm hover:bg-muted"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <UserRoundCog size={14} />
                        {member.status || "-"}
                    </Button>
                </DialogTrigger>

                <DialogContent className="overflow-hidden rounded-xl border-0 p-0 shadow-2xl sm:max-w-xl">
                    <div className="border-b bg-linear-to-r from-slate-50 to-zinc-50 px-6 py-5 dark:from-slate-950 dark:to-zinc-950">
                        <DialogHeader className="space-y-3">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-start gap-3">
                                    <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                        <UserRoundCog size={20} />
                                    </div>
                                    <div>
                                        <DialogTitle className="text-xl font-semibold text-foreground">
                                            Change Member Status
                                        </DialogTitle>
                                        <DialogDescription className="mt-1 text-sm text-muted-foreground">
                                            Review member details and update the account status.
                                        </DialogDescription>
                                    </div>
                                </div>
                            </div>
                        </DialogHeader>
                    </div>

                    <div>
                        <div className="p-4">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="rounded-xl border bg-background p-4 sm:col-span-2">
                                    <div className="flex justify-between gap-3">
                                        <p className="mt-1 text-xl font-semibold text-foreground">
                                            {member.full_name || "-"}
                                        </p>
                                        <Badge className="mt-1 text-sm font-semibold capitalize text-white">
                                            {member.status || "-"}
                                        </Badge>
                                    </div>

                                    <div>
                                        <p className="mt-1 break-all text-sm font-semibold text-foreground">
                                            {member.email || "-"}
                                        </p>
                                        <p className="mt-1 text-sm font-semibold text-foreground">
                                            {member.mobile_number || "-"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-4">
                            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                Select New Status
                            </p>
                            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                                <SelectTrigger className="w-full rounded-xl capitalize">
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    <SelectItem className="capitalize" value="active">
                                        Active
                                    </SelectItem>
                                    <SelectItem className="capitalize" value="deactive">
                                        Deactive
                                    </SelectItem>
                                    <SelectItem className="capitalize" value="defaulter">
                                        Defaulter
                                    </SelectItem>
                                    <SelectItem className="capitalize" value="resigned">
                                        Resigned
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter className="gap-2 border-t bg-muted/20 px-6 py-4 sm:justify-end">
                        <DialogClose asChild>
                            <Button variant="outline" className="rounded-xl">
                                <X size={14} />
                                Cancel
                            </Button>
                        </DialogClose>

                        <Button
                            className="rounded-xl capitalize"
                            disabled={
                                updateStatusMutation.isPending ||
                                !selectedStatus ||
                                selectedStatus === member.status
                            }
                            onClick={handleChangeStatus}
                        >
                            {updateStatusMutation.isPending ? <Spinner /> : <UserRoundCog size={14} />}
                            Change
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

const StatusActionCellRenderer = (
    params: ICellRendererParams<MemberGridRow, string | null | undefined>
) => {
    if (!params.data) return null

    return <StatusActionCell member={params.data} />
}

export default function Members() {
    const [searchText, setSearchText] = useState("")
    const [genderFilter, setGenderFilter] = useState("all")
    const [statusFilter, setStatusFilter] = useState("all")
    const [viewOpen, setViewOpen] = useState(false)
    const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null)

    const { data: members = [], isLoading } = useQuery({
        queryKey: ["members"],
        queryFn: getMemberHandler,
    })

    const filteredMembers = useMemo<MemberGridRow[]>(() => {
        const search = normalizeValue(searchText)
        const selectedGender = normalizeValue(genderFilter)
        const selectedStatus = normalizeValue(statusFilter)

        return members.filter((member) => {
            const memberId = normalizeValue(member.member_id)
            const fullName = normalizeValue(member.full_name)
            const email = normalizeValue(member.email)
            const mobile = normalizeValue(member.mobile_number)
            const gender = normalizeValue(member.gender)
            const status = normalizeValue(member.status)

            const matchesSearch =
                !search ||
                memberId.includes(search) ||
                fullName.includes(search) ||
                email.includes(search) ||
                mobile.includes(search)

            const matchesGender = selectedGender === "all" || gender === selectedGender
            const matchesStatus = selectedStatus === "all" || status === selectedStatus

            return matchesSearch && matchesGender && matchesStatus
        })
    }, [members, searchText, genderFilter, statusFilter])

    const handleOpenView = (memberId: string) => {
        setSelectedMemberId(memberId)
        setViewOpen(true)
    }

    const handleCellClick = (event: CellClickedEvent<MemberGridRow>) => {
        const nonClickableColumns = new Set(["gender", "status", "nominee", "actions"])
        const columnId = event.column.getColId()

        if (nonClickableColumns.has(columnId)) return
        if (!event.data?.member_id) return

        handleOpenView(event.data.member_id)
    }

    const columnDefs = useMemo<ColDef<MemberGridRow>[]>(() => [
        {
            headerName: "Member Id",
            field: "member_id",
            minWidth: 145,
            pinned: "left",
            cellRenderer: MemberIdCellRenderer,
        },
        {
            headerName: "Name",
            field: "full_name",
            minWidth: 220,
            flex: 1,
            cellRenderer: TextCellRenderer,
        },
        {
            headerName: "Email",
            field: "email",
            minWidth: 260,
            flex: 1,
            cellRenderer: TextCellRenderer,
        },
        {
            headerName: "Mobile",
            field: "mobile_number",
            minWidth: 145,
            cellRenderer: TextCellRenderer,
        },
        {
            headerName: "Gender",
            field: "gender",
            minWidth: 120,
            cellRenderer: CapitalizeCellRenderer,
        },
        {
            headerName: "Status",
            field: "status",
            minWidth: 135,
            cellRenderer: StatusCellRenderer,
        },
        {
            headerName: "Actions",
            field: "status",
            colId: "actions",
            minWidth: 150,
            maxWidth: 150,
            pinned: "right",
            sortable: false,
            filter: false,
            resizable: false,
            cellRenderer: StatusActionCellRenderer,
            cellClass: "members-actions-cell",
            headerClass: "members-actions-header-cell",
            headerComponent: MembersActionHeader,
        },
    ], [])

    const defaultColDef = useMemo<ColDef<MemberGridRow>>(() => ({
        sortable: true,
        filter: true,
        resizable: true,
        suppressMovable: false,
        valueFormatter: defaultValueFormatter,
        cellClass: "cursor-pointer",
        headerComponent: MembersHeader,
        headerClass: "members-header-cell",
    }), [])

    const skeletonRows = Array.from({ length: 8 })

    return (
        <>
            <style jsx global>{`
                .members-ag-grid .ag-body-horizontal-scroll,
                .members-ag-grid .ag-body-vertical-scroll {
                    display: none !important;
                    height: 0 !important;
                    width: 0 !important;
                    min-height: 0 !important;
                    min-width: 0 !important;
                    max-height: 0 !important;
                    max-width: 0 !important;
                    overflow: hidden !important;
                }

                .members-ag-grid .ag-body-viewport,
                .members-ag-grid .ag-center-cols-viewport,
                .members-ag-grid .ag-body-horizontal-scroll-viewport,
                .members-ag-grid .ag-body-vertical-scroll-viewport {
                    scrollbar-width: none !important;
                    -ms-overflow-style: none !important;
                }

                .members-ag-grid .ag-body-viewport::-webkit-scrollbar,
                .members-ag-grid .ag-center-cols-viewport::-webkit-scrollbar,
                .members-ag-grid .ag-body-horizontal-scroll-viewport::-webkit-scrollbar,
                .members-ag-grid .ag-body-vertical-scroll-viewport::-webkit-scrollbar {
                    display: none !important;
                    width: 0 !important;
                    height: 0 !important;
                }

                .members-ag-grid .members-header-cell {
                    padding-left: 12px !important;
                    padding-right: 8px !important;
                }

                .members-ag-grid .members-actions-header-cell {
                    padding-left: 0 !important;
                    padding-right: 0 !important;
                    text-align: center !important;
                }

                .members-ag-grid .members-actions-cell {
                    padding-left: 0 !important;
                    padding-right: 0 !important;
                    justify-content: center !important;
                    cursor: default !important;
                }

                .members-ag-grid .members-actions-cell .ag-cell-wrapper,
                .members-ag-grid .members-actions-cell .ag-cell-value {
                    width: 100% !important;
                    height: 100% !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                }

                .members-ag-grid .ag-header-cell-comp-wrapper,
                .members-ag-grid .ag-cell-label-container {
                    width: 100% !important;
                }

                .members-ag-grid .ag-header-cell-label {
                    width: 100% !important;
                }

                .members-ag-grid .ag-header-cell-menu-button,
                .members-ag-grid .ag-header-cell-filter-button,
                .members-ag-grid .ag-sort-indicator-container {
                    display: none !important;
                }

                .members-ag-grid .ag-header-cell-text {
                    text-transform: uppercase !important;
                }

                .members-ag-grid .ag-cell {
                    display: flex;
                    align-items: center;
                }

                .members-ag-grid .ag-header-cell-resize {
                    right: 0;
                }
            `}</style>

            <div className="w-full space-y-4 overflow-hidden rounded-md">
                <div className="">
                    <div className="flex items-start gap-3">
                        
                        <div>
                            <p className="text-xl font-bold text-foreground">
                                Members
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Showing {filteredMembers.length} of {members.length} members with searchable financial table
                            </p>
                        </div>
                    </div>
                </div>

                {selectedMemberId ? (
                    <View
                        memberId={selectedMemberId}
                        open={viewOpen}
                        onOpenChange={setViewOpen}
                    />
                ) : null}

                <div className="overflow-hidden rounded-xl border bg-background shadow-sm">
                    <div className="border-b bg-muted/20 px-4 py-3">
                        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
                            <div className="grid w-full grid-cols-1 gap-3 md:grid-cols-[minmax(240px,1fr)_160px_160px] xl:max-w-3xl">
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-foreground">
                                        Search
                                    </label>
                                    <div className="relative">
                                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            value={searchText}
                                            onChange={(event) => setSearchText(event.target.value)}
                                            placeholder="Search by Member ID, Name, Email, Mobile..."
                                            className=" rounded-xl border-border bg-background pl-9 text-sm"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-foreground">
                                        Gender
                                    </label>
                                    <Select value={genderFilter} onValueChange={setGenderFilter}>
                                        <SelectTrigger className="w-25 rounded-xl capitalize">
                                            <SelectValue placeholder="Gender" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl">
                                            <SelectItem value="all">All</SelectItem>
                                            <SelectItem value="male">Male</SelectItem>
                                            <SelectItem value="female">Female</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-foreground">
                                        Status
                                    </label>
                                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                                        <SelectTrigger className="w-25 rounded-xl capitalize">
                                            <SelectValue placeholder="Status" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl">
                                            <SelectItem value="all">All</SelectItem>
                                            <SelectItem value="active">Active</SelectItem>
                                            <SelectItem value="deactive">Deactive</SelectItem>
                                            <SelectItem value="defaulter">Defaulter</SelectItem>
                                            <SelectItem value="resigned">Resigned</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="flex shrink-0 items-center justify-end">
                                <AddMembers />
                            </div>
                        </div>
                    </div>

                    <div className="members-ag-grid h-160 w-full overflow-hidden">
                        {isLoading ? (
                            <div className="h-full w-full">
                                <div className="grid grid-cols-7 gap-0 border-b bg-muted/50 px-4 py-3">
                                    {Array.from({ length: 7 }).map((_, index) => (
                                        <Skeleton key={`header-${index}`} className="h-4 w-24 rounded-md" />
                                    ))}
                                </div>

                                <div className="divide-y">
                                    {skeletonRows.map((_, rowIndex) => (
                                        <div key={`skeleton-row-${rowIndex}`} className="grid grid-cols-7 gap-4 px-4 py-4">
                                            {Array.from({ length: 7 }).map((__, columnIndex) => (
                                                <Skeleton
                                                    key={`skeleton-cell-${rowIndex}-${columnIndex}`}
                                                    className="h-5 w-full rounded-md"
                                                />
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <AgGridReact<MemberGridRow>
                                theme={membersTableTheme}
                                rowData={filteredMembers}
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
                        )}
                    </div>
                </div>
            </div>
        </>
    )
}