"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table"
import {
  CalendarDays,
  Clock3,
  User,
} from "lucide-react"
import { format } from "date-fns"
import { getHelpListHandler } from "@/services/helpHandler"
import type { HelpItem, HelpMemberReplyItem, HelpReplyItem } from "@/types/helpTypes"
import { cn } from "@/lib/utils"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import HelpDeskChatDialog from "./HelpDeskChatDialog"


const formatDateTime = (value?: string | null) => {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return format(date, "dd MMM yyyy, hh:mm a")
}

const safeReplies = <T,>(value: T[] | null | undefined): T[] => {
  return Array.isArray(value) ? value : []
}

const getStatusClass = (status?: string | null) => {
  const normalized = (status || "").toLowerCase()
  if (normalized === "pending") {
    return "border-amber-500/20 bg-amber-500/10 text-amber-700"
  }
  if (normalized === "replied") {
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-700"
  }
  if (normalized === "closed") {
    return "border-slate-500/20 bg-slate-500/10 text-slate-700"
  }
  return "border-primary/20 bg-primary/10 text-primary"
}

export default function HelpPage() {
  const [selectedRequest, setSelectedRequest] = React.useState<HelpItem | null>(null)
  const [dialogOpen, setDialogOpen] = React.useState(false)

  const {
    data: helpData,
    isLoading,
    isFetching,
    error,
  } = useQuery<HelpItem[], Error>({
    queryKey: ["help-requests"],
    queryFn: async () => {
      return await getHelpListHandler()
    },
  })

  const data: HelpItem[] = helpData ?? []

  const openRequestDialog = (request: HelpItem) => {
    setSelectedRequest(request)
    setDialogOpen(true)
  }

  const columns = React.useMemo<ColumnDef<HelpItem>[]>(
    () => [
      {
        accessorKey: "subject",
        header: "Request",
        cell: ({ row }) => (
          <div className="min-w-[360px] py-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[15px] font-semibold leading-5 text-foreground">
                {row.original.subject || "-"}
              </p>
              <Badge
                variant="outline"
                className={cn(
                  "rounded-md border px-2 py-0.5 text-[11px] capitalize",
                  getStatusClass(row.original.status)
                )}
              >
                {row.original.status || "-"}
              </Badge>
              <Badge
                variant="secondary"
                className="rounded-md border-0 bg-muted px-2 py-0.5 text-[11px] capitalize text-muted-foreground"
              >
                {row.original.category || "-"}
              </Badge>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                {row.original.member_name || "-"} ({row.original.member_id || "-"})
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5" />
                {formatDateTime(row.original.created_at)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock3 className="h-3.5 w-3.5" />
                {formatDateTime(row.original.updated_at)}
              </span>
            </div>
          </div>
        ),
      },
      {
        id: "message",
        header: "Message",
        cell: ({ row }) => (
          <p className="max-w-[520px] truncate text-sm text-muted-foreground">
            {row.original.message || "-"}
          </p>
        ),
      },
      {
        id: "replies",
        header: "Replies",
        cell: ({ row }) => {
          const adminCount = safeReplies<HelpReplyItem>(row.original.admin_reply).length
          const memberCount = safeReplies<HelpMemberReplyItem>(row.original.member_replies).length
          const total = adminCount + memberCount

          return (
            <div className="flex min-w-[92px] items-center justify-end">
              <Badge
                variant="outline"
                className="rounded-md border bg-background px-2 py-0.5 text-xs"
              >
                {total}
              </Badge>
            </div>
          )
        },
      },
    ],
    []
  )

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <>
      <div className="px-4 py-4 md:px-6">
        <div className="rounded-xl bg-background">
          <div className="flex items-center justify-between px-1 pb-3">
            <div className="text-sm font-semibold tracking-wide text-foreground">REQUESTS</div>
            <div className="text-xs text-muted-foreground">
              {isLoading ? "Loading..." : `${data.length} loaded`}
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-16 w-full rounded-lg" />
              <Skeleton className="h-16 w-full rounded-lg" />
              <Skeleton className="h-16 w-full rounded-lg" />
            </div>
          ) : error ? (
            <div className="rounded-lg bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {error.message || "Failed to load requests."}
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl bg-background">
              <ScrollArea className="w-full">
                <Table>
                  <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id} className="border-b">
                        {headerGroup.headers.map((header) => (
                          <TableHead
                            key={header.id}
                            className="h-11 px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
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
                    {table.getRowModel().rows.length ? (
                      table.getRowModel().rows.map((row) => (
                        <TableRow
                          key={row.id}
                          className="cursor-pointer border-b bg-background transition-colors hover:bg-muted/30"
                          onClick={() => openRequestDialog(row.original)}
                        >
                          {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id} className="px-3 py-3 align-middle">
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={columns.length}
                          className="h-24 px-3 text-center text-sm text-muted-foreground"
                        >
                          No requests found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          )}

          {isFetching && !isLoading ? (
            <div className="pt-2 text-xs text-muted-foreground">Refreshing data...</div>
          ) : null}
        </div>
      </div>

      <HelpDeskChatDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        request={selectedRequest}
      />
    </>
  )
}