"use client"

import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  ColumnDef,
  ColumnFiltersState,
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
  Loader2,
  Plus,
  SendIcon,
  Trash2,
} from "lucide-react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  deleteMomHandler,
  getAllMomHandler,
  publishMomHandler,
} from "@/services/momHandler"
import type { MomItem } from "@/types/mom"
import AddMinutesDialog from "./AddMinutesDialog"
import ViewMomDialog from "./ViewMomDialog"
import Filter from "@/components/ui/filter"

const formatDate = (value: string | null) => {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return format(date, "dd-MM-yyyy")
}

export default function MinutesOfMeating() {
  const queryClient = useQueryClient()

  const [isAddOpen, setIsAddOpen] = React.useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false)
  const [isViewOpen, setIsViewOpen] = React.useState(false)
  const [selectedMom, setSelectedMom] = React.useState<MomItem | null>(null)
  const [page, setPage] = React.useState(1)
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [sorting, setSorting] = React.useState<SortingState>([])
  const perPage = 10

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["mom-list", page, perPage],
    queryFn: () =>
      getAllMomHandler({
        page,
        per_page: perPage,
      }),
  })

  const rows = data?.data?.data ?? []
  const currentPage = data?.data?.current_page ?? 1
  const lastPage = data?.data?.last_page ?? 1
  const total = data?.data?.total ?? 0

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteMomHandler(id),
    onSuccess: () => {
      setIsDeleteOpen(false)
      setSelectedMom(null)
      queryClient.invalidateQueries({ queryKey: ["mom-list"] })
    },
  })

  const publishMutation = useMutation({
    mutationFn: ({ id, is_published }: { id: number; is_published: boolean }) =>
      publishMomHandler(id, {
        is_published,
        publish_date: is_published ? new Date().toISOString().slice(0, 10) : null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mom-list"] })
    },
  })

  const handleOpenViewDialog = (item: MomItem) => {
    setSelectedMom(item)
    setIsViewOpen(true)
  }

  const columns = React.useMemo<ColumnDef<MomItem>[]>(
    () => [
      {
        accessorKey: "title",
        header: "Title",
        meta: {
          filterVariant: "text",
        },
        cell: ({ row }) => (
          <div className="min-w-55">
            <div className="font-medium text-foreground">{row.original.title}</div>
            <div className="mt-1 text-xs capitalize text-muted-foreground">
              {row.original.audience ? String(row.original.audience) : "-"}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "meeting_date",
        header: "Meeting Date",
        cell: ({ row }) => formatDate(row.original.meeting_date),
      },
      {
        accessorKey: "publish_date",
        header: "Publish Date",
        cell: ({ row }) => formatDate(row.original.publish_date),
      },
      {
        accessorKey: "is_published",
        header: "Status",
        meta: {
          filterVariant: "select",
        },
        accessorFn: (row) => (row.is_published ? "Published" : "Draft"),
        filterFn: (row, columnId, value) => {
          if (!value) return true
          return String(row.getValue(columnId)).toLowerCase() === String(value).toLowerCase()
        },
        cell: ({ row }) =>
          row.original.is_published ? (
            <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              Published
            </span>
          ) : (
            <span className="inline-flex rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
              Draft
            </span>
          ),
      },
      {
        id: "actions",
        header: "Actions",
        enableSorting: false,
        enableColumnFilter: false,
        cell: ({ row }) => {
          const item = row.original
          const publishing = publishMutation.isPending && selectedMom?.id === item.id
          return (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="h-9 w-9 rounded-lg"
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedMom(item)
                  publishMutation.mutate({
                    id: item.id,
                    is_published: !item.is_published,
                  })
                }}
                disabled={publishing}
              >
                {publishing ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <SendIcon className="size-4" />
                )}
              </Button>
              <Button
                type="button"
                size="icon"
                variant="destructive"
                className="h-9 w-9 rounded-lg"
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedMom(item)
                  setIsDeleteOpen(true)
                }}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          )
        },
      },
    ],
    [publishMutation, selectedMom?.id]
  )

  const table = useReactTable({
    data: rows,
    columns,
    state: {
      columnFilters,
      sorting,
    },
    onColumnFiltersChange: setColumnFilters,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
  })

  return (
    <div className="space-y-4 ">
      <div className="rounded-xl ">
        <div className="space-y-4 ">
          <div className="flex w-full flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="grid w-full grid-cols-1 gap-4 md:max-w-2xl md:grid-cols-2">
              {table.getColumn("title") ? (
                <Filter column={table.getColumn("title")!} />
              ) : null}
              {table.getColumn("is_published") ? (
                <Filter column={table.getColumn("is_published")!} />
              ) : null}
            </div>
            <div className="flex justify-end">
              <Button size={"lg"} type="button" className="rounded-xl" onClick={() => setIsAddOpen(true)}>
                <Plus className="mr-2 size-4" />
                Add Minutes
              </Button>
            </div>
          </div>

          <div className=" overflow-x-auto rounded-xl border">
            <Table className="w-full min-w-full">
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="bg-muted/40 hover:bg-muted/40">
                    {headerGroup.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        className="h-12 whitespace-nowrap"
                        onClick={header.column.getCanSort() ? header.column.getToggleSortingHandler() : undefined}
                      >
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>

              <TableBody>
                {isLoading ? (
                  Array.from({ length: 8 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell colSpan={columns.length} className="h-14">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Loader2 className="size-4 animate-spin" />
                          Loading minutes...
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : table.getRowModel().rows.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      className="cursor-pointer"
                      onClick={() => handleOpenViewDialog(row.original)}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell
                          key={cell.id}
                          className="align-middle"
                          onClick={(e) => {
                            if (cell.column.id === "actions") {
                              e.stopPropagation()
                            }
                          }}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-28 text-center text-muted-foreground">
                      No minutes found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col gap-3 border-t px-0 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="mt-0 text-sm text-muted-foreground">
              Showing page {currentPage} of {lastPage} · Total {total} records
            </div>

            <div className="my-auto mt-0 flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage <= 1 || isFetching}
              >
                Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                onClick={() => setPage((prev) => Math.min(prev + 1, lastPage))}
                disabled={currentPage >= lastPage || isFetching}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </div>

      <AddMinutesDialog open={isAddOpen} onOpenChange={setIsAddOpen} />

      <ViewMomDialog
        open={isViewOpen}
        onOpenChange={setIsViewOpen}
        details={selectedMom}
      />

      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Minutes</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-medium text-foreground">
                {selectedMom?.title ?? "this record"}
              </span>
              ?
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="rounded-xl"
              onClick={() => selectedMom?.id && deleteMutation.mutate(selectedMom.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}