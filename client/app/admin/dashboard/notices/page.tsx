// "use client"

// import {
//     ColumnDef,
//     ColumnFiltersState,
//     FilterFn,
//     RowData,
//     SortingState,
//     flexRender,
//     getCoreRowModel,
//     getFacetedMinMaxValues,
//     getFacetedRowModel,
//     getFacetedUniqueValues,
//     getFilteredRowModel,
//     getSortedRowModel,
//     useReactTable,
// } from "@tanstack/react-table"
// import {
//     Table,
//     TableBody,
//     TableCell,
//     TableHead,
//     TableHeader,
//     TableRow,
// } from "@/components/ui/table"
// import { useMemo, useState } from "react"
// import { useQuery } from "@tanstack/react-query"
// import { Badge } from "@/components/ui/badge"
// import Filter from "@/components/ui/filter"
// import { DepositApplication } from "@/types/depositeTypes"
// import { getAllDepositeApplications } from "@/services/depositeHandler"

// import { Skeleton } from "@/components/ui/skeleton"
// import { Notice } from "@/types/noticesType"

// declare module "@tanstack/react-table" {
//     interface ColumnMeta<TData extends RowData, TValue> {
//         filterVariant?: "text" | "range" | "select"
//     }
// }

// const normalizeValue = (value: unknown) => String(value ?? "").trim().toLowerCase()

// const formatDate = (value: unknown) => {
//     if (!value) return "-"
//     const stringValue = String(value)
//     if (stringValue.includes("T")) {
//         return stringValue.split("T")[0]
//     }
//     return stringValue
// }

// const applicationSearchFilter: FilterFn<DepositApplication> = (row, _columnId, filterValue) => {
//     const search = normalizeValue(filterValue)

//     if (!search) return true

//     const applicationNo = normalizeValue(row.original.application_no)
//     const memberName = normalizeValue(row.original.member_name)
//     const depositAmount = normalizeValue(row.original.deposit_amount)
//     const tenureYears = normalizeValue(row.original.tenure_years)

//     return (
//         applicationNo.includes(search) ||
//         memberName.includes(search) ||
//         depositAmount.includes(search) ||
//         tenureYears.includes(search)
//     )
// }

// const exactSelectFilter: FilterFn<DepositApplication> = (row, columnId, filterValue) => {
//     const selected = normalizeValue(filterValue)

//     if (!selected) return true

//     const cellValue = normalizeValue(row.getValue(columnId))

//     return cellValue === selected
// }

// export default function DepositeApplications() {
//     const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
//     const [sorting, setSorting] = useState<SortingState>([{ id: "application_no", desc: false }])
//     const [selectedApplication, setSelectedApplication] = useState<DepositApplication | null>(null)
//     const [viewOpen, setViewOpen] = useState(false)

//     const { data: applications = [], isLoading, isError } = useQuery({
//         queryKey: ["deposit-applications"],
//         queryFn: async () => {
//             const res = await getAllDepositeApplications()
//             return Array.isArray(res) ? res : (res?.data ?? [])
//         },
//     })

//     const handleOpenView = (application: DepositApplication) => {
//         setSelectedApplication(application)
//         setViewOpen(true)
//     }

//     const columns: ColumnDef<Notice>[] = useMemo(() => [
//         {
//             header: "Title",
//             accessorKey: "title",
//             filterFn: applicationSearchFilter,
//             cell: ({ row }) => <div className="font-medium">{String(row.getValue("title") ?? "-")}</div>,
//             meta: {
//                 filterVariant: "text",
//             },
//         },
//         {
//             header: "Audiant",
//             accessorKey: "audiance",
//             filterFn: applicationSearchFilter,
//             cell: ({ row }) => <div>{String(row.getValue("audiance") ?? "-")}</div>,
//             meta: {
//                 filterVariant: "text",
//             },
//         },
//         {
//             header: "Message",
//             accessorKey: "message",
//             cell: ({ row }) => <div>{String(row.getValue("message") ?? "-")}</div>,
//             meta: {
//                 filterVariant: "text",
//             },
//         },
//         {
//             header: "Tenure",
//             accessorKey: "tenure_years",
//             cell: ({ row }) => <div>{String(row.getValue("tenure_years") ?? "-")} years</div>,
//             meta: {
//                 filterVariant: "text",
//             },
//         },
//         {
//             header: "Interest",
//             accessorKey: "interest_rate",
//             filterFn: exactSelectFilter,
//             cell: ({ row }) => <div>{String(row.getValue("interest_rate") ?? "-")} %</div>,
//             meta: {
//                 filterVariant: "select",
//             },
//         },
//         {
//             header: "Start Date",
//             accessorKey: "start_date",
//             filterFn: exactSelectFilter,
//             cell: ({ row }) => {
//                 const startDate = row.getValue("start_date")
//                 const hasStartDate = startDate !== null && startDate !== undefined && startDate !== ""

//                 if (!hasStartDate) {
//                     return <span className="text-sm font-medium opacity-50">pending</span>
//                 }

//                 return (
//                     <Badge>
//                         {hasStartDate ? formatDate(startDate) : "Pending"}
//                     </Badge>
//                 )
//             },
//             meta: {
//                 filterVariant: "select",
//             },
//         },
//         {
//             header: "End Date",
//             accessorKey: "end_date",
//             filterFn: exactSelectFilter,
//             cell: ({ row }) => {
//                 const endDate = row.getValue("end_date")

//                 const hasEndDate = endDate !== null && endDate !== undefined && endDate !== "";

//                 if (!hasEndDate) {
//                     return <span className="text-sm font-medium opacity-50">pending </span>
//                 }

//                 return <Badge>{formatDate(endDate)}</Badge>
//             },
//             meta: {
//                 filterVariant: "select",
//             },
//         },
//     ], [])

//     const table = useReactTable({
//         data: Array.isArray(applications) ? applications : [],
//         columns,
//         state: {
//             sorting,
//             columnFilters,
//         },
//         onColumnFiltersChange: setColumnFilters,
//         onSortingChange: setSorting,
//         getCoreRowModel: getCoreRowModel(),
//         getFilteredRowModel: getFilteredRowModel(),
//         getSortedRowModel: getSortedRowModel(),
//         getFacetedRowModel: getFacetedRowModel(),
//         getFacetedUniqueValues: getFacetedUniqueValues(),
//         getFacetedMinMaxValues: getFacetedMinMaxValues(),
//         enableSortingRemoval: false,
//     })

//     if (isLoading) {
//         return (
//             <div className="w-full">
//                 <div className="rounded-md ">
//                     <Table>
//                         <TableHeader>
//                             <TableRow className="bg-muted/50">
//                                 <TableHead className="h-10 border-t">
//                                     <Skeleton className="h-4 w-24" />
//                                 </TableHead>
//                                 <TableHead className="h-10 border-t">
//                                     <Skeleton className="h-4 w-28" />
//                                 </TableHead>
//                                 <TableHead className="h-10 border-t">
//                                     <Skeleton className="h-4 w-24" />
//                                 </TableHead>
//                                 <TableHead className="h-10 border-t">
//                                     <Skeleton className="h-4 w-32" />
//                                 </TableHead>
//                                 <TableHead className="h-10 border-t">
//                                     <Skeleton className="h-4 w-24" />
//                                 </TableHead>
//                                 <TableHead className="h-10 border-t">
//                                     <Skeleton className="h-4 w-24" />
//                                 </TableHead>
//                             </TableRow>
//                         </TableHeader>

//                         <TableBody>
//                             {Array.from({ length: 6 }).map((_, index) => (
//                                 <TableRow key={index}>
//                                     <TableCell>
//                                         <Skeleton className="h-4 w-28" />
//                                     </TableCell>
//                                     <TableCell>
//                                         <Skeleton className="h-4 w-full max-w-55" />
//                                     </TableCell>
//                                     <TableCell>
//                                         <Skeleton className="h-6 w-16 rounded-full" />
//                                     </TableCell>
//                                     <TableCell>
//                                         <Skeleton className="h-4 w-24" />
//                                     </TableCell>
//                                     <TableCell>
//                                         <Skeleton className="h-4 w-28" />
//                                     </TableCell>
//                                     <TableCell>
//                                         <Skeleton className="h-4 w-24" />
//                                     </TableCell>
//                                 </TableRow>
//                             ))}
//                         </TableBody>
//                     </Table>
//                 </div>
//             </div>
//         )
//     }

//     if (isError) {
//         return <div className="p-4 text-red-500">Failed to fetch deposit applications.</div>
//     }

//     return (
//         <div className="overflow-hidden rounded-md">
//             <div className="flex justify-between gap-3 px-2 py-6">
//                 <div className="flex gap-3 my-auto">
//                     <div className="w-100">
//                         <Filter column={table.getColumn("member_name")!} />
//                     </div>
//                     <div className="w-36">
//                         <Filter column={table.getColumn("interest_rate")!} />
//                     </div>
//                     <div className="w-36">
//                         <Filter column={table.getColumn("start_date")!} />
//                     </div>
//                 </div>
//             </div>

//             <div className="border border-border rounded-lg">
//                 <Table>
//                     <TableHeader>
//                         {table.getHeaderGroups().map((headerGroup) => (
//                             <TableRow key={headerGroup.id}>
//                                 {headerGroup.headers.map((header) => (
//                                     <TableHead key={header.id}>
//                                         {header.isPlaceholder
//                                             ? null
//                                             : flexRender(header.column.columnDef.header, header.getContext())}
//                                     </TableHead>
//                                 ))}
//                             </TableRow>
//                         ))}
//                     </TableHeader>

//                     <TableBody>
//                         {table.getRowModel().rows?.length ? (
//                             table.getRowModel().rows.map((row) => (
//                                 <TableRow key={row.id}>
//                                     {row.getVisibleCells().map((cell) => {
//                                         const isDateColumn =
//                                             cell.column.id === "start_date" || cell.column.id === "end_date"

//                                         return (
//                                             <TableCell
//                                                 key={cell.id}
//                                                 onClick={() => {
//                                                     if (!isDateColumn) {
//                                                         handleOpenView(row.original)
//                                                     }
//                                                 }}
//                                                 className={isDateColumn ? "" : "cursor-pointer"}
//                                             >
//                                                 {flexRender(cell.column.columnDef.cell, cell.getContext())}
//                                             </TableCell>
//                                         )
//                                     })}
//                                 </TableRow>
//                             ))
//                         ) : (
//                             <TableRow>
//                                 <TableCell colSpan={columns.length} className="h-24 text-center">
//                                     No results.
//                                 </TableCell>
//                             </TableRow>
//                         )}
//                     </TableBody>
//                 </Table>
//             </div>
//         </div>
//     )
// }

import React from 'react'

export default function Notice() {
  return (
    <div>Notice</div>
  )
}
