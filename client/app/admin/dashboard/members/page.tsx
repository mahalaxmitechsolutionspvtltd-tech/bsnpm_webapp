"use client"

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
} from "@tanstack/react-table"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Member } from "@/types/memberTypes"
import { getMemberHandler, updateMemberStatusHandler } from "@/services/memberHandler"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useMemo, useState } from "react"
import { UserRoundCog, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import Filter from "@/components/ui/filter"
import { AddMembers } from "@/components/AddMembers"
import View from "./features/View"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { useAuth } from "@/providers/auth-provider"
import { Spinner } from "@/components/ui/spinner"


declare module "@tanstack/react-table" {
    interface ColumnMeta<TData extends RowData, TValue> {
        filterVariant?: "text" | "range" | "select"
    }
}

const normalizeValue = (value: unknown) => String(value ?? "").trim().toLowerCase()

const memberSearchFilter: FilterFn<Member> = (row, _columnId, filterValue) => {
    const search = normalizeValue(filterValue)

    if (!search) return true

    const memberId = normalizeValue(row.original.member_id)
    const fullName = normalizeValue(row.original.full_name)
    const email = normalizeValue(row.original.email)
    const mobile = normalizeValue(row.original.mobile_number)

    return (
        memberId.includes(search) ||
        fullName.includes(search) ||
        email.includes(search) ||
        mobile.includes(search)
    )
}

const exactSelectFilter: FilterFn<Member> = (row, columnId, filterValue) => {
    const selected = normalizeValue(filterValue)

    if (!selected) return true

    const cellValue = normalizeValue(row.getValue(columnId))

    return cellValue === selected
}

export default function Members() {
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const [sorting, setSorting] = useState<SortingState>([
        { id: "member_id", desc: false }
    ])
    const [viewOpen, setViewOpen] = useState(false)
    const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null)

    const { data: members = [] } = useQuery({
        queryKey: ["members"],
        queryFn: getMemberHandler
    })

    const columns: ColumnDef<Member>[] = useMemo(() => [
        {
            header: "Member Id",
            accessorKey: "member_id",
            cell: ({ row }) => <div className="font-medium">{String(row.getValue("member_id") ?? "-")}</div>,
            meta: {
                filterVariant: "text"
            }
        },
        {
            header: "Name",
            accessorKey: "full_name",
            filterFn: memberSearchFilter,
            cell: ({ row }) => <div>{String(row.getValue("full_name") ?? "")}</div>,
            meta: {
                filterVariant: "text"
            }
        },
        {
            header: "Email",
            accessorKey: "email",
            cell: ({ row }) => <div>{String(row.getValue("email") ?? "-")}</div>,
            meta: {
                filterVariant: "text"
            }
        },
        {
            header: "Mobile",
            accessorKey: "mobile_number",
            cell: ({ row }) => <div>{String(row.getValue("mobile_number") ?? "-")}</div>,
            meta: {
                filterVariant: "text"
            }
        },
        {
            header: "Gender",
            accessorKey: "gender",
            filterFn: exactSelectFilter,
            cell: ({ row }) => <div className="capitalize">{String(row.getValue("gender") ?? "-")}</div>,
            meta: {
                filterVariant: "select"
            }
        },
        {
            header: "Status",
            accessorKey: "status",
            filterFn: exactSelectFilter,
            cell: ({ row }) => <Badge className="capitalize">{String(row.getValue("status") ?? "-")}</Badge>,
            meta: {
                filterVariant: "select"
            }
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => {

                const queryClient = useQueryClient()
                const { user } = useAuth()
                const member = row.original
                const [selectedStatus, setSelectedStatus] = useState<string>(member.status || "active")

                useEffect(() => {
                    setSelectedStatus(member.status || "")
                }, [member.status])


                const updateStatusMutation = useMutation({
                    mutationFn: updateMemberStatusHandler,
                    onSuccess: async () => {
                        toast.success("Member status updated successfully")
                        await queryClient.invalidateQueries({ queryKey: ["members"] })

                    },
                    onError: (error: any) => {
                        toast.error(
                            error?.response?.data?.message ||
                            error?.message ||
                            "Failed to update member status"
                        )
                    },
                })

                const handleChangeStatus = async () => {
                    if (!selectedStatus || selectedStatus === member.status) return

                    await updateStatusMutation.mutateAsync({
                        member_id: member.member_id,
                        status: selectedStatus as "active" | "defaulter" | "resigned" | "deactive",
                        updated_by: user?.admin_name ? String(user.admin_name) : null,
                    })
                }
                return (
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
                                className="h-9 rounded-xl border-border bg-background px-3 shadow-sm hover:bg-muted"
                            >
                                <UserRoundCog size={14} />
                                {member.status}
                            </Button>
                        </DialogTrigger>

                        <DialogContent className="overflow-hidden rounded-xl border-0 p-0 shadow-2xl sm:max-w-xl">
                            <div className="border-b bg-linear-to-r from-slate-50 to-zinc-50 px-6 py-5">
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

                            <div className="">
                                <div className=" p-4">
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <div className="rounded-xl border bg-background p-4 sm:col-span-2">
                                            <div className="flex justify-between">

                                                <p className="mt-1 text-xl font-semibold text-foreground">
                                                    {member.full_name || "-"}
                                                </p>
                                                <Badge className="mt-1 text-sm font-semibold capitalize text-white">
                                                    {member.status || "-"}
                                                </Badge>
                                            </div>

                                            <div className="">


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

                                <div className=" p-4">
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
                )
            }
        }
    ], [])

    const table = useReactTable({
        data: members,
        columns,
        state: {
            sorting,
            columnFilters
        },
        onColumnFiltersChange: setColumnFilters,
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
        getFacetedMinMaxValues: getFacetedMinMaxValues(),
        enableSortingRemoval: false
    })

    const handleOpenView = (memberId: string) => {
        setSelectedMemberId(memberId)
        setViewOpen(true)
    }

    const nonClickableColumns = new Set(["gender", "status", "nominee", "actions"])

    return (
        <div className="overflow-hidden rounded-md">
            <div className="flex justify-between gap-3 px-2 py-6">
                <div className="flex gap-3 my-auto">
                    <div className="w-100">
                        <Filter column={table.getColumn("full_name")!} />
                    </div>
                    <div className="w-36">
                        <Filter column={table.getColumn("gender")!} />
                    </div>
                    <div className="w-36">
                        <Filter column={table.getColumn("status")!} />
                    </div>
                </div>
                <div className="my-auto">
                    <AddMembers />
                </div>
            </div>
            {selectedMemberId ? (
                <View
                    memberId={selectedMemberId}
                    open={viewOpen}
                    onOpenChange={setViewOpen}
                />
            ) : null}

            <div className="border border-border rounded-lg">
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
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                >
                                    {row.getVisibleCells().map((cell) => {
                                        const isClickable = !nonClickableColumns.has(cell.column.id)

                                        return (
                                            <TableCell
                                                key={cell.id}
                                                className={isClickable ? "cursor-pointer transition-colors hover:bg-muted/50" : ""}
                                                onClick={isClickable ? () => handleOpenView(row.original.member_id) : undefined}
                                            >
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </TableCell>
                                        )
                                    })}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}