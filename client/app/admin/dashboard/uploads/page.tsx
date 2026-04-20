"use client"

import * as React from "react"
import { useMutation } from "@tanstack/react-query"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { Download, Pencil, Trash2 } from "lucide-react"
import type { DownloadItem } from "@/types/downloads"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { deleteDownload, getAllDownloads } from "@/services/downloads"
import Filter from "@/components/ui/filter"
import AddUploadsDialog from "./AddUploadsDialog"
import EditUploadsDialog from "./EditUploadsDialog"
import { useAuth } from "@/providers/auth-provider"
import { Spinner } from "@/components/ui/spinner"


declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData, TValue> {
    filterVariant?: "text" | "range" | "select"
    label?: string
  }
}

export default function DownloadsPage() {
  const { user } = useAuth() as {
    user?: {
      full_name?: string
      admin_name?: string
    } | null
  }

  const actorName = user?.full_name || user?.admin_name || ""

  const [data, setData] = React.useState<DownloadItem[]>([])
  const [loading, setLoading] = React.useState(true)
  const [refresh, setRefreshing] = React.useState(false)
  const [error, setError] = React.useState<string>("")
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [addOpen, setAddOpen] = React.useState(false)
  const [editOpen, setEditOpen] = React.useState(false)
  const [selectedUpload, setSelectedUpload] = React.useState<DownloadItem | null>(
    null
  )
  console.info(refresh);
  const fetchDownloads = React.useCallback(async (showRefreshing = false) => {
    try {
      setError("")
      if (showRefreshing) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      const response = await getAllDownloads()
      setData(Array.isArray(response.data) ? response.data : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load downloads")
      setData([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  React.useEffect(() => {
    fetchDownloads()
  }, [fetchDownloads])

  const deleteMutation = useMutation({
    mutationFn: async (item: DownloadItem) => {
      return deleteDownload(item.id, {
        deleted_by: actorName,
      })
    },
    onSuccess: async () => {
      await fetchDownloads(true)
    },
    onError: (err: Error) => {
      setError(err.message || "Failed to delete upload")
    },
  })

  const handleEditClick = React.useCallback((item: DownloadItem) => {
    setSelectedUpload(item)
    setEditOpen(true)
  }, [])

  const handleDeleteClick = React.useCallback(
    (item: DownloadItem) => {
      const confirmed = window.confirm(
        `Are you sure you want to delete "${item.title}"?`
      )

      if (!confirmed) {
        return
      }

      deleteMutation.mutate(item)
    },
    [deleteMutation]
  )

  const columns = React.useMemo<ColumnDef<DownloadItem>[]>(
    () => [
      {
        accessorKey: "id",
        header: "ID",
        cell: ({ row }) => <span className="font-medium">{row.original.id}</span>,
      },
      {
        accessorKey: "title",
        header: "Title",
        meta: {
          filterVariant: "text",
          label: "Search",
        },
        filterFn: (row, _columnId, value) => {
          const search = String(value ?? "").toLowerCase().trim()

          if (!search) {
            return true
          }

          const item = row.original

          return [
            item.id,
            item.title,
            item.description,
            item.attachment,
            item.created_by,
            item.updated_by,
            item.created_at,
          ]
            .map((field) => String(field ?? "").toLowerCase())
            .some((field) => field.includes(search))
        },
        cell: ({ row }) => (
          <span className="font-medium text-foreground">{row.original.title}</span>
        ),
      },
      {
        accessorKey: "description",
        header: "Description",
        cell: ({ row }) => (
          <span className="line-clamp-2 text-sm text-muted-foreground">
            {row.original.description || "-"}
          </span>
        ),
      },
      {
        accessorKey: "attachment",
        header: "Attachment",
        cell: ({ row }) => {
          const attachment = row.original.attachment
          const href = attachment?.startsWith("http")
            ? attachment
            : `${process.env.NEXT_PUBLIC_API_BASE_URL}`
                .replace(/\/$/, "")
                .concat("/", String(attachment || "").replace(/^\/+/, ""))

          return attachment ? (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              <Download className="h-4 w-4" />
              View File
            </a>
          ) : (
            "-"
          )
        },
      },
      {
        accessorKey: "created_by",
        header: "Created By",
        cell: ({ row }) => row.original.created_by || "-",
      },
      {
        accessorKey: "updated_by",
        header: "Updated By",
        cell: ({ row }) => row.original.updated_by || "-",
      },
      {
        accessorKey: "created_at",
        header: "Created At",
        meta: {
          filterVariant: "select",
          label: "Sort",
        },
        cell: ({ row }) => {
          const value = row.original.created_at
          return value
            ? new Date(value).toLocaleString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "-"
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const isDeleting =
            deleteMutation.isPending &&
            Number(deleteMutation.variables?.id) === Number(row.original.id)

          return (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                className=" rounded-xl px-4"
                onClick={() => handleEditClick(row.original)}
                disabled={isDeleting}
              >
                <Pencil className="mr-2 h-4 w-4" />
              </Button>

              <Button
                type="button"
                variant="outline"
                className="rounded-xl px-4"
                onClick={() => handleDeleteClick(row.original)}
                disabled={isDeleting}
              >
                
                {isDeleting ? <Spinner/> : <Trash2 className="mr-2 h-4 w-4" />}
              </Button>
            </div>
          )
        },
      },
    ],
    [deleteMutation.isPending, deleteMutation.variables, handleDeleteClick, handleEditClick]
  )

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  return (
    <>
      <div className="w-full space-y-4">
        <div className="flex justify-between">
          <div className="flex gap-4 w-[60vw]">
            <div className="w-full max-w-md">
              <Filter column={table.getColumn("title")!} />
            </div>
            <div className="w-55 min-w-55">
              <Filter column={table.getColumn("created_at")!} />
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button className="rounded-xl" onClick={() => setAddOpen(true)}>
              Add uploads
            </Button>
          </div>
        </div>

        {error ? (
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <div className="overflow-hidden w-full rounded-lg border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id} className="whitespace-nowrap">
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>

            <TableBody>
              {loading ? (
                Array.from({ length: 8 }).map((_, index) => (
                  <TableRow key={index}>
                    {columns.map((_, cellIndex) => (
                      <TableCell key={cellIndex}>
                        <Skeleton className="h-5 w-full rounded-md" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="align-top"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-3">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center text-sm text-muted-foreground"
                  >
                    No downloads found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {table.getRowModel().rows.length} of {data.length} records
          </p>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-lg"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount() || 1}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-lg"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      <AddUploadsDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onSuccess={() => fetchDownloads(true)}
      />

      <EditUploadsDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        data={selectedUpload}
        onSuccess={() => fetchDownloads(true)}
      />
    </>
  )
}