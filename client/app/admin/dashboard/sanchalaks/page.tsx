"use client"

import * as React from "react"
import Image from "next/image"
import { useQuery } from "@tanstack/react-query"
import { AgGridReact } from "ag-grid-react"
import {
  AllCommunityModule,
  ModuleRegistry,
  type ColDef,
  type GridReadyEvent,
  type ICellRendererParams,
} from "ag-grid-community"
import {
  CalendarDays,
  Download,
  FileSpreadsheet,
  FileText,
  Grid2X2,
  List,
  Mail,
  Pencil,
  Phone,
  Plus,
  Search,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CreateSanchalakDialog } from "./CreateSanchalakDialog"
import { EditSanchalakDialog } from "./EditSanchalakDialog"
import { getSanchalaksHandler, type Sanchalak } from "@/services/sanchalakHandlers"

ModuleRegistry.registerModules([AllCommunityModule])

type ViewMode = "list" | "grid"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"

const normalizePath = (path: string): string => {
  return path.trim().replace(/\\\//g, "/").replace(/^"+|"+$/g, "")
}

const getOptimizedCloudinaryUrl = (url: string): string => {
  if (!url.includes("res.cloudinary.com") || !url.includes("/image/upload/")) {
    return url
  }

  if (url.includes("/image/upload/f_auto")) {
    return url
  }

  return url.replace("/image/upload/", "/image/upload/f_auto,q_auto,w_240,h_240,c_fill,g_face/")
}

const getPhotoUrl = (path: string | null): string => {
  if (!path) {
    return ""
  }

  const cleanedPath = normalizePath(path)

  if (!cleanedPath) {
    return ""
  }

  if (cleanedPath.startsWith("http://") || cleanedPath.startsWith("https://")) {
    return getOptimizedCloudinaryUrl(cleanedPath)
  }

  if (cleanedPath.startsWith("/storage/")) {
    return `${API_BASE_URL}${cleanedPath}`
  }

  if (cleanedPath.startsWith("storage/")) {
    return `${API_BASE_URL}/${cleanedPath}`
  }

  if (cleanedPath.startsWith("/")) {
    return `${API_BASE_URL}${cleanedPath}`
  }

  return `${API_BASE_URL}/storage/${cleanedPath}`
}

const formatDateTime = (value?: string | null): string => {
  if (!value) {
    return "-"
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "-"
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })
}

const getStatusClassName = (status: string): string => {
  const statusValue = status.toLowerCase()

  if (statusValue === "active") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300"
  }

  if (statusValue === "blocked") {
    return "border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
  }

  return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300"
}

const downloadFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")

  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

const escapeCsvValue = (value: string | number | null | undefined): string => {
  const text = value === null || value === undefined ? "" : String(value)
  return `"${text.replace(/"/g, '""')}"`
}

const exportExcelFile = (rows: Sanchalak[]) => {
  const headers = ["ID", "Sanchalak ID", "Name", "Email", "Mobile", "Status", "Created At"]

  const csvRows = rows.map((row) => [
    row.id,
    row.sanchalak_id,
    row.sanchalak_name,
    row.sanchalak_email,
    row.sanchalak_mobile,
    row.status,
    formatDateTime(row.created_at),
  ])

  const content = [headers, ...csvRows]
    .map((row) => row.map((cell) => escapeCsvValue(cell)).join(","))
    .join("\n")

  downloadFile(content, "sanchalaks-export.csv", "text/csv;charset=utf-8;")
}

const exportPdfFile = (rows: Sanchalak[]) => {
  const htmlRows = rows
    .map(
      (row) => `
        <tr>
          <td>${row.sanchalak_id || "-"}</td>
          <td>${row.sanchalak_name || "-"}</td>
          <td>${row.sanchalak_email || "-"}</td>
          <td>${row.sanchalak_mobile || "-"}</td>
          <td>${row.status || "-"}</td>
          <td>${formatDateTime(row.created_at)}</td>
        </tr>
      `
    )
    .join("")

  const html = `
    <!doctype html>
    <html>
      <head>
        <title>Sanchalaks Export</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; color: #111827; }
          h1 { font-size: 22px; margin-bottom: 16px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; }
          th { background: #f3f4f6; }
        </style>
      </head>
      <body>
        <h1>Sanchalaks List</h1>
        <table>
          <thead>
            <tr>
              <th>Sanchalak ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Mobile</th>
              <th>Status</th>
              <th>Created At</th>
            </tr>
          </thead>
          <tbody>${htmlRows}</tbody>
        </table>
      </body>
    </html>
  `

  const printWindow = window.open("", "_blank", "width=1200,height=800")

  if (!printWindow) {
    return
  }

  printWindow.document.open()
  printWindow.document.write(html)
  printWindow.document.close()
  printWindow.focus()
  printWindow.print()
}

function PhotoCellRenderer(params: ICellRendererParams<Sanchalak>) {
  const [hasError, setHasError] = React.useState(false)
  const photoUrl = getPhotoUrl(params.data?.profile_photo || null)

  if (!photoUrl || hasError) {
    return (
      <div className="flex h-full w-full items-center">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-xs font-semibold text-muted-foreground">
          NA
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full w-full items-center">
      <Image
        src={photoUrl}
        alt={params.data?.sanchalak_name || "Profile"}
        width={36}
        height={36}
        className="h-9 w-9 rounded-full border object-cover"
        loading="lazy"
        unoptimized
        onError={() => setHasError(true)}
      />
    </div>
  )
}

function StatusCellRenderer(params: ICellRendererParams<Sanchalak>) {
  const value = String(params.value || "-")

  return (
    <div className="flex h-full w-full items-center">
      <span className={`inline-flex items-center rounded-md border px-2 py-1 text-xs font-medium capitalize ${getStatusClassName(value)}`}>
        {value}
      </span>
    </div>
  )
}

function TextCellRenderer(params: ICellRendererParams<Sanchalak>) {
  const value = params.value === null || params.value === undefined || params.value === "" ? "-" : String(params.value)

  return (
    <div className="flex h-full w-full items-center">
      <span className="truncate">{value}</span>
    </div>
  )
}

function DateCellRenderer(params: ICellRendererParams<Sanchalak>) {
  return (
    <div className="flex h-full w-full items-center">
      <span className="truncate">{formatDateTime(params.value)}</span>
    </div>
  )
}

function Sanchalaks() {
  const [createOpen, setCreateOpen] = React.useState(false)
  const [editOpen, setEditOpen] = React.useState(false)
  const [selectedSanchalak, setSelectedSanchalak] = React.useState<Sanchalak | null>(null)
  const [viewMode, setViewMode] = React.useState<ViewMode>("list")
  const [search, setSearch] = React.useState("")
  const [status, setStatus] = React.useState("all")
  const [fromDate] = React.useState("")
  const [toDate] = React.useState("")
  const [pageSize, setPageSize] = React.useState(10)

  const queryParams = React.useMemo(
    () => ({
      search: search.trim() || undefined,
      status: status === "all" ? undefined : status,
      from_date: fromDate || undefined,
      to_date: toDate || undefined,
      per_page: 100,
      sort_by: "id",
      sort_order: "desc" as const,
      all: true,
    }),
    [search, status, fromDate, toDate]
  )

  const { data, isLoading, error } = useQuery({
    queryKey: ["sanchalaks", queryParams],
    queryFn: () => getSanchalaksHandler(queryParams),
  })

  const rowData = React.useMemo(() => data?.data || [], [data])

  const openEditDialog = React.useCallback((sanchalak: Sanchalak) => {
    setSelectedSanchalak(sanchalak)
    setEditOpen(true)
  }, [])

  const columnDefs = React.useMemo<ColDef<Sanchalak>[]>(
    () => [
      {
        headerName: "Photo",
        field: "profile_photo",
        width: 90,
        filter: false,
        sortable: false,
        cellRenderer: PhotoCellRenderer,
        cellClass: "flex items-center",
      },
      {
        headerName: "Sanchalak ID",
        field: "sanchalak_id",
        minWidth: 150,
        filter: true,
        cellRenderer: TextCellRenderer,
        cellClass: "flex items-center",
      },
      {
        headerName: "Name",
        field: "sanchalak_name",
        minWidth: 190,
        flex: 1,
        filter: true,
        cellRenderer: TextCellRenderer,
        cellClass: "flex items-center",
      },
      {
        headerName: "Email",
        field: "sanchalak_email",
        minWidth: 240,
        flex: 1,
        filter: true,
        cellRenderer: TextCellRenderer,
        cellClass: "flex items-center",
      },
      {
        headerName: "Mobile",
        field: "sanchalak_mobile",
        minWidth: 150,
        filter: true,
        cellRenderer: TextCellRenderer,
        cellClass: "flex items-center",
      },
      {
        headerName: "Status",
        field: "status",
        minWidth: 130,
        filter: true,
        cellRenderer: StatusCellRenderer,
        cellClass: "flex items-center",
      },
      {
        headerName: "Created At",
        field: "created_at",
        minWidth: 190,
        filter: true,
        cellRenderer: DateCellRenderer,
        cellClass: "flex items-center",
      },
      {
        headerName: "Action",
        field: "id",
        width: 120,
        minWidth: 120,
        filter: false,
        sortable: false,
        cellClass: "flex items-center",
        cellRenderer: (params: ICellRendererParams<Sanchalak>) => {
          if (!params.data) {
            return null
          }

          return (
            <div className="flex h-full w-full items-center">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 rounded-lg"
                onClick={() => openEditDialog(params.data as Sanchalak)}
              >
                <Pencil className="mr-1.5 h-3.5 w-3.5" />
                Edit
              </Button>
            </div>
          )
        },
      },
    ],
    [openEditDialog]
  )

  const defaultColDef = React.useMemo<ColDef<Sanchalak>>(
    () => ({
      sortable: true,
      resizable: true,
      floatingFilter: false,
      filter: true,
      suppressHeaderMenuButton: false,
      cellClass: "flex items-center",
    }),
    []
  )

  const handleGridReady = (_event: GridReadyEvent<Sanchalak>) => {}

  const handleExportExcel = () => {
    exportExcelFile(rowData)
  }

  const handleExportPdf = () => {
    exportPdfFile(rowData)
  }

  return (
    <>
      <style jsx global>{`
        .sanchalaks-ag-grid {
          border-top-left-radius: 0 !important;
          border-top-right-radius: 0 !important;
          border-bottom-left-radius: 5.6px !important;
          border-bottom-right-radius: 5.6px !important;
        }

        .sanchalaks-ag-grid .ag-root-wrapper,
        .sanchalaks-ag-grid .ag-root,
        .sanchalaks-ag-grid .ag-header,
        .sanchalaks-ag-grid .ag-header-viewport,
        .sanchalaks-ag-grid .ag-header-container {
          border-top-left-radius: 0 !important;
          border-top-right-radius: 0 !important;
        }

        .sanchalaks-ag-grid .ag-root-wrapper,
        .sanchalaks-ag-grid .ag-root {
          border-bottom-left-radius: 5.6px !important;
          border-bottom-right-radius: 5.6px !important;
        }
      `}</style>

      <div className="">
        <div className="flex flex-col gap-4 rshadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Sanchalaks</h1>
            <p className="text-sm text-muted-foreground">
              Manage sanchalak records, profile details and account status.
            </p>
          </div>

          <Button className="w-full rounded-lg md:w-auto" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Sanchalak
          </Button>
        </div>

        <div className="rounded-lg border mt-5">
          <div className="space-y-4 py-5 px-4">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="relative sm:col-span-2 lg:col-span-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search name, email, mobile..."
                    className="rounded-lg pl-9"
                  />
                </div>

                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="rounded-lg">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="blocked">Blocked</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="rounded-lg bg-primary text-white hover:bg-primary/90 hover:text-white">
                      <Download className="mr-2 h-4 w-4" />
                      Export
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={handleExportPdf}>
                      <FileText className="mr-2 h-4 w-4" />
                      Export PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleExportExcel}>
                      <FileSpreadsheet className="mr-2 h-4 w-4" />
                      Export Excel File
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <div className="flex rounded-lg border">
                  <Button
                    type="button"
                    variant={viewMode === "list" ? "secondary" : "ghost"}
                    size="icon"
                    className="rounded-md"
                    onClick={() => setViewMode("list")}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant={viewMode === "grid" ? "secondary" : "ghost"}
                    size="icon"
                    className="rounded-md"
                    onClick={() => setViewMode("grid")}
                  >
                    <Grid2X2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="">
            {error ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                {error instanceof Error ? error.message : "Failed to load sanchalaks"}
              </div>
            ) : null}

            {viewMode === "list" ? (
              <div className="sanchalaks-ag-grid ag-theme-quartz h-155 w-full overflow-hidden">
                <AgGridReact<Sanchalak>
                  rowData={rowData}
                  columnDefs={columnDefs}
                  defaultColDef={defaultColDef}
                  onGridReady={handleGridReady}
                  pagination
                  paginationPageSize={pageSize}
                  paginationPageSizeSelector={[10, 20, 50, 100]}
                  suppressCellFocus
                  animateRows
                  loading={isLoading}
                  overlayNoRowsTemplate="<span>No sanchalaks found</span>"
                  rowHeight={56}
                  headerHeight={46}
                  onPaginationChanged={(event) => {
                    const size = event.api.paginationGetPageSize()
                    setPageSize(size)
                  }}
                />
              </div>
            ) : (
              <div className="grid gap-4 p-4 xl:grid-cols-2">
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="h-[210px] animate-pulse rounded-lg border bg-muted" />
                  ))
                ) : rowData.length > 0 ? (
                  rowData.map((item) => {
                    const photoUrl = getPhotoUrl(item.profile_photo)
                    const statusLabel = item.status || "-"
                    const statusClassName = getStatusClassName(statusLabel)

                    return (
                      <div
                        key={item.id}
                        className="group overflow-hidden rounded-xl border bg-card transition-all duration-200 hover:shadow-md"
                      >
                        <div className="flex flex-col gap-4 p-4 sm:flex-row">
                          <div className="flex h-52 w-full shrink-0 items-center justify-center rounded-xl border bg-muted/30 sm:h-44 sm:w-52">
                            {photoUrl ? (
                              <Image
                                src={photoUrl}
                                alt={item.sanchalak_name || "Sanchalak"}
                                width={150}
                                height={120}
                                className="h-full w-full rounded-xl object-cover transition-transform duration-300 group-hover:scale-105"
                                loading="lazy"
                                unoptimized
                              />
                            ) : (
                              <span className="text-sm font-semibold text-muted-foreground">NA</span>
                            )}
                          </div>

                          <div className="flex min-w-0 flex-1 flex-col justify-between py-1">
                            <div className="space-y-3">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                  <h3 className="line-clamp-1 text-lg font-semibold leading-6 text-foreground">
                                    {item.sanchalak_name || "-"}
                                  </h3>
                                  <p className="mt-1 text-sm font-medium text-primary">
                                    {item.sanchalak_id || "-"}
                                  </p>
                                </div>

                                <span className={`inline-flex shrink-0 items-center rounded-md border px-2.5 py-1 text-xs font-semibold capitalize ${statusClassName}`}>
                                  {statusLabel}
                                </span>
                              </div>

                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
                                  <span className="truncate text-sm text-muted-foreground">
                                    {item.sanchalak_email || "-"}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2">
                                  <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
                                  <span className="truncate text-sm text-muted-foreground">
                                    {item.sanchalak_mobile || "-"}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2">
                                  <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" />
                                  <span className="truncate text-sm text-muted-foreground">
                                    {formatDateTime(item.created_at)}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="mt-4 flex items-center justify-end">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-8 rounded-lg"
                                onClick={() => openEditDialog(item)}
                              >
                                <Pencil className="mr-1.5 h-3.5 w-3.5" />
                                Edit
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="col-span-full rounded-lg border p-10 text-center text-sm text-muted-foreground">
                    No sanchalaks found
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <CreateSanchalakDialog open={createOpen} onOpenChange={setCreateOpen} />
        <EditSanchalakDialog open={editOpen} sanchalak={selectedSanchalak} onOpenChange={setEditOpen} />
      </div>
    </>
  )
}

export default Sanchalaks