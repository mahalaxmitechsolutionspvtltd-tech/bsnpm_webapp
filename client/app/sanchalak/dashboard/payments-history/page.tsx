"use client";

import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AgGridReact } from "ag-grid-react";
import {
  AllCommunityModule,
  ModuleRegistry,
  themeQuartz,
} from "ag-grid-community";
import type {
  ColDef,
  GridApi,
  GridReadyEvent,
  ICellRendererParams,
  IHeaderParams,
  RowClickedEvent,
  ValueFormatterParams,
} from "ag-grid-community";
import {
  ChevronDown,
  Download,
  FileText,
  ListFilter,
  Search,
  Sheet,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { getPaymentHistoryHandler } from "@/services/paymentHistoryHandler";
import View from "./View";

ModuleRegistry.registerModules([AllCommunityModule]);

type PaymentProof = {
  file_url?: string | null;
  file_name?: string | null;
  file_type?: string | null;
};

type ApplicationDetails = {
  title?: string | null;
  member_name?: string | null;
  amount?: number | string | null;
  application_no?: string | null;
  tenure?: string | null;
  breakdown?: ApplicationDetails[] | null;
};

type InstallmentDetails = {
  date?: string | null;
  amount?: number | string | null;
  status?: string | null;
  updated_by?: string | null;
};

type PaymentHistoryRow = {
  id?: number | string | null;
  account_management_id?: number | string | null;
  member_id?: string | null;
  member_name?: string | null;
  submitted_on?: string | null;
  submitted_time?: string | null;
  date_of_payment?: string | null;
  date_paid?: string | null;
  amount?: number | string | null;
  total_amount?: number | string | null;
  payment_mode?: string | null;
  proof_file?: string | null;
  proof_file_url?: string | null;
  proof_file_name?: string | null;
  reference_trn?: string | null;
  remark?: string | null;
  status?: string | null;
  account_management_status?: string | null;
  application_status?: string | null;
  installment_status?: string | null;
  created_by?: string | null;
  created_at?: string | null;
  submitted_at?: string | null;
  application_no?: string | null;
  source_type?: string | null;
  application_details?: ApplicationDetails | null;
  proof?: PaymentProof | null;
  installment?: InstallmentDetails | null;
  payments?: PaymentHistoryRow[];
  raw?: PaymentHistoryRow;
  rowKey?: string;
};

type PaymentHistoryResponse = {
  success?: boolean;
  message?: string;
  data?: unknown;
  meta?: {
    current_page?: number;
    per_page?: number;
    total?: number;
    last_page?: number;
    from?: number | null;
    to?: number | null;
    available_statuses?: string[];
    active_status?: string | null;
    default_filter?: string | null;
    status_counts?: Record<string, number>;
  };
};

type PaymentHistoryHeaderParams = IHeaderParams<PaymentHistoryRow> & {
  displayName: string;
};

const asRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const asString = (value: unknown, fallback = "") => {
  if (value === null || value === undefined) return fallback;
  const text = String(value).trim();
  return text || fallback;
};

const asNumber = (value: unknown) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const formatCurrency = (value: unknown) => {
  const n = Number(value);
  if (Number.isNaN(n)) return String(value ?? "-");

  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
};

const formatDateOnly = (value: unknown) => {
  if (!value) return "-";

  const raw = String(value).trim();
  if (!raw) return "-";

  if (/^\d{2}-\d{2}-\d{4}$/.test(raw)) {
    const [day, month, year] = raw.split("-");
    return `${year}-${month}-${day}`;
  }

  const parsed = new Date(raw);

  if (Number.isNaN(parsed.getTime())) {
    if (raw.includes("T")) return raw.split("T")[0];
    if (raw.includes(" ")) return raw.split(" ")[0];
    return raw;
  }

  return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}-${String(parsed.getDate()).padStart(2, "0")}`;
};

const getDateSortValue = (value: unknown) => {
  const formatted = formatDateOnly(value);
  if (formatted === "-") return 0;

  const date = new Date(formatted);

  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
};

const toTitleCase = (value: string) => {
  return value
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const escapeHtml = (value: string) => {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

const getStatusTone = (status: string | null | undefined) => {
  const value = String(status ?? "").toLowerCase();

  if (value === "approved" || value === "paid" || value === "completed") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300";
  }

  if (value === "pending" || value === "processing") {
    return "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-50 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300";
  }

  if (value === "rejected" || value === "failed" || value === "cancelled") {
    return "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-50 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300";
  }

  if (value === "partial") {
    return "border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-50 dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-300";
  }

  return "border-border bg-muted text-foreground hover:bg-muted";
};

const getMemberName = (row?: PaymentHistoryRow | null) => {
  return asString(
    row?.member_name ??
      row?.application_details?.member_name ??
      row?.raw?.member_name ??
      row?.raw?.application_details?.member_name,
    "-",
  );
};

const getMemberId = (row?: PaymentHistoryRow | null) => {
  return asString(row?.member_id ?? row?.raw?.member_id, "-");
};

const getApplicationNo = (row?: PaymentHistoryRow | null) => {
  return asString(
    row?.application_no ??
      row?.application_details?.application_no ??
      row?.raw?.application_no ??
      row?.raw?.application_details?.application_no,
    "-",
  );
};

const getApplicationTitle = (row?: PaymentHistoryRow | null) => {
  return asString(
    row?.application_details?.title ?? row?.raw?.application_details?.title,
    "-",
  );
};

const getPaymentAmount = (row?: PaymentHistoryRow | null) => {
  return asNumber(
    row?.amount ??
      row?.total_amount ??
      row?.installment?.amount ??
      row?.application_details?.amount,
  );
};

const getPaymentStatus = (row?: PaymentHistoryRow | null) => {
  return asString(
    row?.status ??
      row?.installment_status ??
      row?.account_management_status ??
      row?.application_status,
    "-",
  );
};

const normalizeRow = (
  item: Record<string, unknown>,
  index: number,
): PaymentHistoryRow => {
  const row = item as PaymentHistoryRow;
  const accountId = asString(
    row.account_management_id ?? row.id,
    String(index + 1),
  );
  const applicationNo = asString(
    row.application_no ?? row.application_details?.application_no,
  );
  const installmentDate = asString(row.installment?.date);
  const rowKey = [
    accountId,
    asString(row.member_id),
    applicationNo,
    installmentDate,
    asString(row.status),
    asString(row.total_amount ?? row.amount),
    index,
  ]
    .map((value) => value || "x")
    .join("__");

  return {
    ...row,
    rowKey,
    payments: [row],
    raw: row,
  };
};

const normalizeApiRows = (response: unknown): PaymentHistoryRow[] => {
  if (Array.isArray(response)) {
    return response
      .filter(asRecord)
      .map((item, index) => normalizeRow(item, index));
  }

  if (asRecord(response)) {
    const envelope = response as PaymentHistoryResponse;

    if (Array.isArray(envelope.data)) {
      return envelope.data
        .filter(asRecord)
        .map((item, index) => normalizeRow(item, index));
    }

    if (asRecord(envelope.data)) {
      const nestedEnvelope = envelope.data as PaymentHistoryResponse;

      if (Array.isArray(nestedEnvelope.data)) {
        return nestedEnvelope.data
          .filter(asRecord)
          .map((item, index) => normalizeRow(item, index));
      }
    }
  }

  return [];
};

const extractMeta = (
  response: unknown,
): PaymentHistoryResponse["meta"] | null => {
  if (!asRecord(response)) return null;

  const envelope = response as PaymentHistoryResponse;

  if (envelope.meta) return envelope.meta;

  if (asRecord(envelope.data)) {
    const nestedEnvelope = envelope.data as PaymentHistoryResponse;
    return nestedEnvelope.meta ?? null;
  }

  return null;
};

const paymentHistoryTableTheme = themeQuartz.withParams({
  borderRadius: 5.6,
  wrapperBorderRadius: 5.6,
  headerHeight: 42,
  rowHeight: 58,
  fontSize: 13,
  spacing: 7,
  headerFontSize: 12,
  headerFontWeight: 700,
});

const PaymentHistoryHeader = (params: PaymentHistoryHeaderParams) => {
  const menuButtonRef = React.useRef<HTMLButtonElement | null>(null);

  const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (menuButtonRef.current) {
      params.showColumnMenu(menuButtonRef.current);
    }
  };

  const handleSortClick = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    params.progressSort(event.shiftKey);
  };

  return (
    <div className="flex h-full w-full min-w-0 items-center justify-between gap-2">
      <div
        role="button"
        tabIndex={0}
        onClick={handleSortClick}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            params.progressSort(event.shiftKey);
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
  );
};

const StatusCell = (
  params: ICellRendererParams<PaymentHistoryRow, string | null | undefined>,
) => {
  const status = asString(params.value, "-");

  return (
    <div className="flex h-full items-center">
      <Badge
        variant="outline"
        className={cn(
          "rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize shadow-sm",
          getStatusTone(status),
        )}
      >
        {status}
      </Badge>
    </div>
  );
};

const MemberCell = (
  params: ICellRendererParams<PaymentHistoryRow, string | null | undefined>,
) => {
  const memberName = getMemberName(params.data);
  const memberId = getMemberId(params.data);

  return (
    <div className="flex min-w-0 flex-col justify-center">
      <span className="truncate text-[14px] font-semibold text-foreground">
        {memberName}
      </span>
      <span className="-mt-5 truncate text-xs font-medium text-muted-foreground">
        {memberId}
      </span>
    </div>
  );
};

const ApplicationCell = (
  params: ICellRendererParams<PaymentHistoryRow, string | null | undefined>,
) => {
  const applicationNo = getApplicationNo(params.data);
  const applicationTitle = getApplicationTitle(params.data);

  return (
    <div className="flex min-w-0 flex-col justify-center">
      <span className="truncate text-[14px] font-semibold text-primary">
        {applicationNo}
      </span>
      <span className="-mt-5 truncate text-xs text-muted-foreground">
        {applicationTitle}
      </span>
    </div>
  );
};

const AmountCell = (params: ICellRendererParams<PaymentHistoryRow, number>) => {
  return (
    <div className="flex h-full w-full items-center justify-end text-right">
      <span className="text-[14px] font-semibold tabular-nums text-foreground">
        ₹ {formatCurrency(params.value)}
      </span>
    </div>
  );
};

const TextCell = (
  params: ICellRendererParams<PaymentHistoryRow, string | null | undefined>,
) => {
  return (
    <div className="flex h-full min-w-0 items-center">
      <span className="truncate text-[13px] font-medium text-foreground">
        {asString(params.value, "-")}
      </span>
    </div>
  );
};

const DateCell = (
  params: ICellRendererParams<PaymentHistoryRow, string | null | undefined>,
) => {
  return (
    <div className="flex h-full items-center">
      <span className="whitespace-nowrap text-[13px] font-medium text-foreground">
        {formatDateOnly(params.value)}
      </span>
    </div>
  );
};

const PaymentModeCell = (
  params: ICellRendererParams<PaymentHistoryRow, string | null | undefined>,
) => {
  return (
    <div className="flex h-full items-center">
      <Badge
        variant="secondary"
        className="rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize"
      >
        {toTitleCase(asString(params.value, "-").replace(/_/g, " "))}
      </Badge>
    </div>
  );
};

const PaymentHistoryTableSkeleton = ({ rows = 8 }: { rows?: number }) => (
  <div className="w-full space-y-4 overflow-hidden rounded-md">
    <div className="rounded-xl border bg-background p-4 shadow-sm">
      <Skeleton className="h-5 w-44 rounded-md" />
      <Skeleton className="mt-2 h-4 w-72 rounded-md" />
    </div>

    <div className="w-full overflow-hidden rounded-xl border bg-background">
      <div className="grid grid-cols-7 gap-0 border-b bg-background px-4 py-3">
        {Array.from({ length: 7 }).map((_, index) => (
          <Skeleton key={`header-${index}`} className="h-4 w-24 rounded-md" />
        ))}
      </div>

      <div className="divide-y">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            key={`row-${rowIndex}`}
            className="grid grid-cols-7 gap-4 px-4 py-4"
          >
            {Array.from({ length: 7 }).map((__, columnIndex) => (
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
);

const PaymentHistory = () => {
  const [selectedRow, setSelectedRow] =
    React.useState<PaymentHistoryRow | null>(null);
  const [viewOpen, setViewOpen] = React.useState(false);
  const [quickFilter, setQuickFilter] = React.useState("");
  const [gridApi, setGridApi] =
    React.useState<GridApi<PaymentHistoryRow> | null>(null);
  const [exportMenuOpen, setExportMenuOpen] = React.useState(false);
  const exportMenuRef = React.useRef<HTMLDivElement | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["payment-history"],
    queryFn: () => getPaymentHistoryHandler(),
  });

  const rowData = React.useMemo<PaymentHistoryRow[]>(() => {
    return normalizeApiRows(data);
  }, [data]);

  const meta = React.useMemo(() => extractMeta(data), [data]);

  const columnDefs = React.useMemo<ColDef<PaymentHistoryRow>[]>(
    () => [
      {
        headerName: "Submitted On",
        field: "date_of_payment",
        minWidth: 145,
        sort: "desc",
        valueFormatter: (
          params: ValueFormatterParams<
            PaymentHistoryRow,
            string | null | undefined
          >,
        ) => formatDateOnly(params.value),
        comparator: (a, b) => getDateSortValue(a) - getDateSortValue(b),
        filter: "agDateColumnFilter",
        cellRenderer: DateCell,
      },
      {
        headerName: "Member",
        colId: "member_details",
        minWidth: 270,
        flex: 1.1,
        valueGetter: (params) =>
          `${getMemberName(params.data)} ${getMemberId(params.data)}`,
        cellRenderer: MemberCell,
        filter: "agTextColumnFilter",
      },
      {
        headerName: "Application",
        colId: "application_details",
        minWidth: 250,
        flex: 1,
        valueGetter: (params) =>
          `${getApplicationNo(params.data)} ${getApplicationTitle(params.data)}`,
        cellRenderer: ApplicationCell,
        filter: "agTextColumnFilter",
      },
      {
        headerName: "Amount",
        field: "amount",
        minWidth: 150,
        valueGetter: (params) => getPaymentAmount(params.data),
        valueFormatter: (
          params: ValueFormatterParams<PaymentHistoryRow, number>,
        ) => `₹ ${formatCurrency(params.value)}`,
        cellRenderer: AmountCell,
        filter: "agNumberColumnFilter",
        type: "rightAligned",
      },
      {
        headerName: "Status",
        field: "status",
        minWidth: 135,
        valueGetter: (params) => getPaymentStatus(params.data),
        cellRenderer: StatusCell,
        filter: "agTextColumnFilter",
      },
      {
        headerName: "Reference",
        field: "reference_trn",
        minWidth: 155,
        filter: "agTextColumnFilter",
        cellRenderer: TextCell,
      },
      {
        headerName: "Payment Mode",
        field: "payment_mode",
        minWidth: 155,
        filter: "agTextColumnFilter",
        cellRenderer: PaymentModeCell,
      },
    ],
    [],
  );

  const defaultColDef = React.useMemo<ColDef<PaymentHistoryRow>>(
    () => ({
      sortable: true,
      filter: true,
      resizable: true,
      floatingFilter: false,
      suppressHeaderMenuButton: false,
      suppressHeaderFilterButton: false,
      unSortIcon: true,
      headerComponent: PaymentHistoryHeader,
      headerClass: "payment-history-header-cell",
      cellClass: "cursor-pointer",
    }),
    [],
  );

  const exportRows = React.useMemo(() => {
    const search = quickFilter.trim().toLowerCase();

    return rowData.filter((row) => {
      if (!search) return true;

      const values = [
        formatDateOnly(row.date_of_payment),
        getMemberName(row),
        getMemberId(row),
        getApplicationNo(row),
        getApplicationTitle(row),
        formatCurrency(getPaymentAmount(row)),
        getPaymentStatus(row),
        asString(row.reference_trn, "-"),
        toTitleCase(asString(row.payment_mode, "-").replace(/_/g, " ")),
      ];

      return values.join(" ").toLowerCase().includes(search);
    });
  }, [rowData, quickFilter]);

  const getExportTableHtml = React.useCallback(() => {
    return `
            <table border="1">
                <thead>
                    <tr>
                        <th>Submitted On</th>
                        <th>Member Name</th>
                        <th>Member ID</th>
                        <th>Application No</th>
                        <th>Application Title</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Reference</th>
                        <th>Payment Mode</th>
                    </tr>
                </thead>
                <tbody>
                    ${exportRows
                      .map((row) => {
                        const cells = [
                          formatDateOnly(row.date_of_payment),
                          getMemberName(row),
                          getMemberId(row),
                          getApplicationNo(row),
                          getApplicationTitle(row),
                          `₹ ${formatCurrency(getPaymentAmount(row))}`,
                          getPaymentStatus(row),
                          asString(row.reference_trn, "-"),
                          toTitleCase(
                            asString(row.payment_mode, "-").replace(/_/g, " "),
                          ),
                        ];

                        return `<tr>${cells.map((cell) => `<td>${escapeHtml(String(cell))}</td>`).join("")}</tr>`;
                      })
                      .join("")}
                </tbody>
            </table>
        `;
  }, [exportRows]);

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const handleExportExcel = React.useCallback(() => {
    const tableHtml = getExportTableHtml();

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
                    <h2>Payment History</h2>
                    <p>Status: All | Rows: ${exportRows.length}${meta?.total !== undefined ? ` | Total: ${meta.total}` : ""}</p>
                    ${tableHtml}
                </body>
            </html>
        `;

    const blob = new Blob(["\ufeff", workbookHtml], {
      type: "application/vnd.ms-excel;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `payment-history-all.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setExportMenuOpen(false);
  }, [getExportTableHtml, exportRows.length, meta?.total]);

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const handleExportPdf = React.useCallback(() => {
    const tableHtml = getExportTableHtml();

    const printHtml = `
            <!doctype html>
            <html>
                <head>
                    <meta charset="UTF-8" />
                    <title>Payment History</title>
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
                    <h1>Payment History</h1>
                    <p>Status: All | Rows: ${exportRows.length}${meta?.total !== undefined ? ` | Total: ${meta.total}` : ""}</p>
                    ${tableHtml}
                    <script>
                        window.onload = function () {
                            window.focus();
                            window.print();
                        };
                    </script>
                </body>
            </html>
        `;

    const printWindow = window.open("", "_blank", "width=1200,height=800");

    if (!printWindow) {
      setExportMenuOpen(false);
      return;
    }

    printWindow.document.open();
    printWindow.document.write(printHtml);
    printWindow.document.close();
    setExportMenuOpen(false);
  }, [getExportTableHtml, exportRows.length, meta?.total]);

  const handleGridReady = React.useCallback(
    (event: GridReadyEvent<PaymentHistoryRow>) => {
      setGridApi(event.api);
      window.requestAnimationFrame(() => {
        event.api.sizeColumnsToFit();
      });
    },
    [],
  );

  const handleOpenView = React.useCallback((row: PaymentHistoryRow) => {
    setSelectedRow(row);
    setViewOpen(true);
  }, []);

  const handleViewOpenChange = React.useCallback(
    (open: boolean) => {
      setViewOpen(open);

      if (!open) {
        void queryClient.invalidateQueries({ queryKey: ["payment-history"] });
        void refetch();
      }
    },
    [queryClient, refetch],
  );

  const handleRowClicked = React.useCallback(
    (event: RowClickedEvent<PaymentHistoryRow>) => {
      if (!event.data) return;
      handleOpenView(event.data);
    },
    [handleOpenView],
  );

  React.useEffect(() => {
    if (!gridApi) return;
    gridApi.setGridOption("quickFilterText", quickFilter);
  }, [gridApi, quickFilter]);

  React.useEffect(() => {
    if (!gridApi) return;

    window.requestAnimationFrame(() => {
      gridApi.sizeColumnsToFit();
    });
  }, [gridApi, rowData.length]);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        exportMenuRef.current &&
        event.target instanceof Node &&
        !exportMenuRef.current.contains(event.target)
      ) {
        setExportMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  if (isLoading) return <PaymentHistoryTableSkeleton />;

  if (isError) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 shadow-sm">
        {error instanceof Error
          ? error.message
          : "Failed to load payment history."}
      </div>
    );
  }

  return (
    <>
      <style jsx global>{`
        .payment-history-grid {
          border-top-left-radius: 0 !important;
          border-top-right-radius: 0 !important;
          border-bottom-left-radius: 5.6px !important;
          border-bottom-right-radius: 5.6px !important;
        }

        .payment-history-grid .ag-root-wrapper,
        .payment-history-grid .ag-root,
        .payment-history-grid .ag-header,
        .payment-history-grid .ag-header-viewport,
        .payment-history-grid .ag-header-container {
          border-top-left-radius: 0 !important;
          border-top-right-radius: 0 !important;
        }

        .payment-history-grid .ag-root-wrapper,
        .payment-history-grid .ag-root {
          border-bottom-left-radius: 5.6px !important;
          border-bottom-right-radius: 5.6px !important;
        }

        .payment-history-grid .ag-body-horizontal-scroll,
        .payment-history-grid .ag-body-vertical-scroll {
          display: none !important;
          height: 0 !important;
          width: 0 !important;
          min-height: 0 !important;
          min-width: 0 !important;
          max-height: 0 !important;
          max-width: 0 !important;
          overflow: hidden !important;
        }

        .payment-history-grid .ag-body-viewport,
        .payment-history-grid .ag-center-cols-viewport,
        .payment-history-grid .ag-body-horizontal-scroll-viewport,
        .payment-history-grid .ag-body-vertical-scroll-viewport {
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
        }

        .payment-history-grid .ag-body-viewport::-webkit-scrollbar,
        .payment-history-grid .ag-center-cols-viewport::-webkit-scrollbar,
        .payment-history-grid
          .ag-body-horizontal-scroll-viewport::-webkit-scrollbar,
        .payment-history-grid
          .ag-body-vertical-scroll-viewport::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
        }

        .payment-history-grid .payment-history-header-cell {
          padding-left: 12px !important;
          padding-right: 8px !important;
        }

        .payment-history-grid .ag-header-cell-comp-wrapper,
        .payment-history-grid .ag-cell-label-container {
          width: 100% !important;
        }

        .payment-history-grid .ag-header-cell-label {
          width: 100% !important;
        }

        .payment-history-grid .ag-header-cell-menu-button,
        .payment-history-grid .ag-header-cell-filter-button,
        .payment-history-grid .ag-sort-indicator-container {
          display: none !important;
        }

        .payment-history-grid .ag-header-cell-text {
          text-transform: uppercase !important;
        }

        .payment-history-grid .ag-cell {
          display: flex;
          align-items: center;
        }

        .payment-history-grid .ag-header-cell-resize {
          right: 0;
        }

        .payment-history-grid .ag-paging-panel {
          border-top: 1px solid hsl(var(--border)) !important;
          min-height: 48px !important;
          padding: 0 12px !important;
          font-size: 13px !important;
        }
      `}</style>

      <div className="w-full space-y-4 overflow-hidden rounded-md">
        <div>
          <h1 className="text-xl font-bold text-foreground">Payment History</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Review member payments, installment approvals, references, and
            payment modes.
          </p>
        </div>

        <div className="overflow-hidden rounded-xl border bg-background shadow-sm">
          <div className="border-b bg-background px-4 py-3">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
              <div className="grid w-full grid-cols-1 gap-3 md:grid-cols-[minmax(240px,1fr)_170px] xl:max-w-2xl">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-foreground">
                    Search
                  </label>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={quickFilter}
                      onChange={(event) => setQuickFilter(event.target.value)}
                      placeholder="Search member, application, reference, status"
                      className="h-10 rounded-xl border-border bg-background pl-9 text-sm"
                    />
                  </div>
                </div>
              </div>

              <div
                ref={exportMenuRef}
                className="relative flex w-full items-end justify-end xl:w-auto"
              >
                <Button
                  type="button"
                  onClick={() => setExportMenuOpen((open) => !open)}
                  className="h-10 w-full rounded-xl xl:w-44"
                  disabled={exportRows.length === 0}
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

          <div className="payment-history-grid h-160 w-full overflow-hidden">
            <AgGridReact<PaymentHistoryRow>
              theme={paymentHistoryTableTheme}
              rowData={rowData}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              pagination
              paginationPageSize={10}
              paginationPageSizeSelector={[10, 20, 50, 100]}
              animateRows
              rowHeight={58}
              headerHeight={42}
              suppressCellFocus
              rowSelection="single"
              suppressRowClickSelection
              onGridReady={handleGridReady}
              onRowClicked={handleRowClicked}
              getRowId={(params) =>
                params.data.rowKey ?? String(params.data.id ?? Math.random())
              }
              overlayNoRowsTemplate='<span class="text-sm text-muted-foreground">No payment history found.</span>'
            />
          </div>
        </div>

        <View
          open={viewOpen}
          onOpenChange={handleViewOpenChange}
          data={selectedRow as never}
        />
      </div>
    </>
  );
};

export default PaymentHistory;