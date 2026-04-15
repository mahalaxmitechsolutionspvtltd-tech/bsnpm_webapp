'use client'

import React from 'react'
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
} from '@tanstack/react-table'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Table,
    TableBody,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Download } from 'lucide-react'
import { getTrialBalanceHandler } from '@/services/trialBalanceHandler'

type TrialBalanceSummaryItem = {
    title?: string
    debit?: number | null
    credit?: number | null
    value?: number | null
    type?: string | null
}

type TrialBalanceApiData = {
    financial_year?: string
    summary?: TrialBalanceSummaryItem[]
    opening_balance?: number
    cash_in_hand?: number
    bank_balance?: number
    closing_balance?: number
    debit_total?: number
    credit_total?: number
    principal_amount_total?: number
    interest_amount_total?: number
    difference?: number
}

type TrialBalanceApiResponse = {
    success?: boolean
    message?: string
    data?: TrialBalanceApiData
}

type TrialBalanceRow = {
    id: number
    particulars: string
    debit: number
    credit: number
    value: number
    rowType:
    | 'opening'
    | 'cash'
    | 'bank'
    | 'closing'
    | 'debit'
    | 'credit'
    | 'debit_total'
    | 'credit_total'
    | 'principal_total'
    | 'interest_total'
    | 'difference'
    | 'total'
    | 'normal'
}

type FinancialYearOption = {
    value: string
    label: string
}

const currencyFormatter = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
})

function formatCurrency(value: number) {
    return `₹ ${currencyFormatter.format(Number.isFinite(value) ? value : 0)}`
}

function formatCurrencyForExport(value: number) {
    return `Rs. ${currencyFormatter.format(Number.isFinite(value) ? value : 0)}`
}

function normalizeTitle(value: string) {
    return value.toLowerCase().replace(/\s+/g, ' ').trim()
}

function getRowType(title: string, type?: string | null): TrialBalanceRow['rowType'] {
    const normalizedType = normalizeTitle(String(type ?? ''))
    const normalizedTitle = normalizeTitle(title)

    if (normalizedType === 'opening_balance' || normalizedTitle === 'opening balance') return 'opening'
    if (normalizedType === 'cash_in_hand' || normalizedTitle === 'cash in hand') return 'cash'
    if (normalizedType === 'bank_balance' || normalizedTitle === 'bank balance') return 'bank'
    if (normalizedType === 'closing_balance' || normalizedTitle === 'closing balance') return 'closing'
    if (normalizedType === 'debit') return 'debit'
    if (normalizedType === 'credit') return 'credit'
    if (normalizedType === 'debit_total' || normalizedTitle === 'debit total') return 'debit_total'
    if (normalizedType === 'credit_total' || normalizedTitle === 'credit total') return 'credit_total'
    if (normalizedType === 'principal_total' || normalizedTitle === 'principal amount total') return 'principal_total'
    if (normalizedType === 'interest_total' || normalizedTitle === 'interest amount total' || normalizedTitle === 'loan interest') return 'interest_total'
    if (normalizedType === 'difference' || normalizedTitle === 'difference') return 'difference'
    if (normalizedType === 'total' || normalizedTitle === 'total') return 'total'

    return 'normal'
}

function extractTrialBalancePayload(response: unknown): TrialBalanceApiData {
    if (!response || typeof response !== 'object') {
        return {}
    }

    const wrapped = response as TrialBalanceApiResponse

    if (wrapped.data && typeof wrapped.data === 'object') {
        return wrapped.data
    }

    return response as TrialBalanceApiData
}

function mapSummaryToRows(data: TrialBalanceApiData | undefined): TrialBalanceRow[] {
    const summary = Array.isArray(data?.summary) ? data.summary : []

    if (summary.length > 0) {
        return summary.map((item, index) => {
            const title = String(item?.title ?? '').trim() || `Row ${index + 1}`
            const rowType = getRowType(title, item?.type ?? null)
            const debit = Number(item?.debit ?? 0)
            const credit = Number(item?.credit ?? 0)
            const value = Number(item?.value ?? (credit > 0 ? credit : debit))

            return {
                id: index + 1,
                particulars: title,
                debit: Number.isFinite(debit) ? debit : 0,
                credit: Number.isFinite(credit) ? credit : 0,
                value: Number.isFinite(value) ? value : 0,
                rowType,
            }
        })
    }

    const fallbackSummary: TrialBalanceSummaryItem[] = [
        { title: 'Opening Balance', debit: 0, credit: Number(data?.opening_balance ?? 0), type: 'opening_balance' },
        { title: 'Cash in Hand', debit: 0, credit: Number(data?.cash_in_hand ?? 0), type: 'cash_in_hand' },
        { title: 'Bank Balance', debit: 0, credit: Number(data?.bank_balance ?? 0), type: 'bank_balance' },
        { title: 'Closing Balance', debit: 0, credit: Number(data?.closing_balance ?? 0), type: 'closing_balance' },
        { title: 'Principal Amount Total', debit: 0, credit: Number(data?.principal_amount_total ?? 0), type: 'principal_total' },
        { title: 'Loan Interest', debit: 0, credit: Number(data?.interest_amount_total ?? 0), type: 'interest_total' },
        { title: 'Debit Total', debit: Number(data?.debit_total ?? 0), credit: 0, type: 'debit_total' },
        { title: 'Credit Total', debit: 0, credit: Number(data?.credit_total ?? 0), type: 'credit_total' },
        { title: 'Difference', debit: 0, credit: Number(data?.difference ?? 0), type: 'difference' },
        { title: 'Total', debit: Number(data?.debit_total ?? 0), credit: Number(data?.credit_total ?? 0), type: 'total' },
    ]

    return fallbackSummary.map((item, index) => {
        const title = String(item.title ?? '').trim()
        const rowType = getRowType(title, item.type ?? null)
        const debit = Number(item.debit ?? 0)
        const credit = Number(item.credit ?? 0)
        const value = Number(item.value ?? (credit > 0 ? credit : debit))

        return {
            id: index + 1,
            particulars: title,
            debit,
            credit,
            value,
            rowType,
        }
    })
}

function getKpiValue(rows: TrialBalanceRow[], title: string, fallback = 0) {
    const found = rows.find((row) => normalizeTitle(row.particulars) === normalizeTitle(title))
    return Number(found?.value ?? fallback)
}

function getBottomSummaryRowClass(rowType: TrialBalanceRow['rowType']) {
    if (rowType === 'opening') return 'bg-sky-50/80'
    if (rowType === 'cash') return 'bg-emerald-50/80'
    if (rowType === 'bank') return 'bg-violet-50/80'
    if (rowType === 'closing') return 'bg-amber-50/80'
    return ''
}

function shouldHideMarkedRowZero(rowType: TrialBalanceRow['rowType']) {
    return rowType === 'opening' || rowType === 'cash' || rowType === 'bank' || rowType === 'closing'
}

function formatBodyCellValue(value: number, rowType: TrialBalanceRow['rowType']) {
    if (value > 0) {
        return formatCurrency(value)
    }

    if (shouldHideMarkedRowZero(rowType)) {
        return ''
    }

    return '0'
}

function getCurrentFinancialYear() {
    const today = new Date()
    const month = today.getMonth() + 1
    const year = today.getFullYear()

    if (month >= 4) {
        return `${year}-${String(year + 1).slice(-2)}`
    }

    return `${year - 1}-${String(year).slice(-2)}`
}

function buildFinancialYearOptions(totalYears = 6): FinancialYearOption[] {
    const currentFinancialYear = getCurrentFinancialYear()
    const startYear = Number(currentFinancialYear.split('-')[0])

    return Array.from({ length: totalYears }).map((_, index) => {
        const fyStart = startYear - index
        const fyEnd = fyStart + 1
        const value = `${fyStart}-${String(fyEnd).slice(-2)}`
        const label = value

        return { value, label }
    })
}

function escapeHtml(value: string) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
}

function TrialBalanceSkeleton() {
    return (
        <div className="w-full space-y-4 p-4 md:p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
                    <Card key={index} className="rounded-xl shadow-sm">
                        <CardContent>
                            <Skeleton className="h-6 w-32" />
                            <Skeleton className="mt-3 h-8 w-40" />
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
                <div className="flex w-full flex-col gap-2 sm:w-auto">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-10 w-full min-w-55 md:w-65" />
                </div>

                <div className="my-auto">
                    <Skeleton className="h-10 w-28 rounded-xl" />
                </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="p-4">
                    <div className="grid grid-cols-3 gap-4 border-b border-slate-200 pb-4">
                        <Skeleton className="h-5 w-28" />
                        <Skeleton className="ml-auto h-5 w-20" />
                        <Skeleton className="ml-auto h-5 w-20" />
                    </div>

                    <div className="space-y-4 py-4">
                        {Array.from({ length: 12 }).map((_, index) => (
                            <div key={index} className="grid grid-cols-3 gap-4 items-center">
                                <Skeleton className="h-5 w-64" />
                                <Skeleton className="ml-auto h-5 w-24" />
                                <Skeleton className="ml-auto h-5 w-24" />
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-3 gap-4 border-t border-slate-200 pt-4">
                        <Skeleton className="h-5 w-20" />
                        <Skeleton className="ml-auto h-5 w-24" />
                        <Skeleton className="ml-auto h-5 w-24" />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function Page() {
    const financialYearOptions = React.useMemo(() => buildFinancialYearOptions(), [])
    const [selectedFinancialYear, setSelectedFinancialYear] = React.useState<string>(getCurrentFinancialYear())

    const { data: response, isLoading, isFetching, isError, error } = useQuery<TrialBalanceApiResponse | TrialBalanceApiData>({
        queryKey: ['trial-balance', selectedFinancialYear],
        queryFn: async () => {
            const handler = getTrialBalanceHandler as unknown as (params?: { financial_year?: string }) => Promise<TrialBalanceApiResponse | TrialBalanceApiData>
            return await handler({ financial_year: selectedFinancialYear })
        },
    })

    const data = React.useMemo<TrialBalanceApiData>(() => {
        return extractTrialBalancePayload(response)
    }, [response])

    const rows = React.useMemo<TrialBalanceRow[]>(() => mapSummaryToRows(data), [data])

    const specialBottomRows = React.useMemo(
        () =>
            rows.filter(
                (row) =>
                    row.rowType === 'opening' ||
                    row.rowType === 'cash' ||
                    row.rowType === 'bank' ||
                    row.rowType === 'closing'
            ),
        [rows]
    )

    const mainTableRows = React.useMemo(
        () =>
            rows.filter(
                (row) =>
                    row.rowType !== 'opening' &&
                    row.rowType !== 'cash' &&
                    row.rowType !== 'bank' &&
                    row.rowType !== 'closing' &&
                    row.rowType !== 'debit_total' &&
                    row.rowType !== 'credit_total' &&
                    row.rowType !== 'difference' &&
                    row.rowType !== 'total'
            ),
        [rows]
    )

    const displayRows = React.useMemo(
        () => [...mainTableRows, ...specialBottomRows],
        [mainTableRows, specialBottomRows]
    )

    const columns = React.useMemo<ColumnDef<TrialBalanceRow>[]>(
        () => [
            {
                accessorKey: 'particulars',
                header: () => <span className="text-[13px] font-semibold">Particulars</span>,
                cell: ({ row }) => (
                    <div className="text-[13px] font-medium text-slate-800">
                        {row.original.particulars}
                    </div>
                ),
                size: 900,
            },
            {
                accessorKey: 'credit',
                header: () => <div className="text-right text-[13px] font-semibold">Credit</div>,
                cell: ({ row }) => (
                    <div className="min-h-5 text-right text-[13px] font-medium text-slate-800">
                        {formatBodyCellValue(row.original.debit, row.original.rowType)}
                    </div>
                ),
                size: 220,
            },
            {
                accessorKey: 'debit',
                header: () => <div className="text-right text-[13px] font-semibold">Debit</div>,
                cell: ({ row }) => (
                    <div className="min-h-5 text-right text-[13px] font-medium text-slate-800">
                        {formatBodyCellValue(row.original.credit, row.original.rowType)}
                    </div>
                ),
                size: 220,
            },
        ],
        []
    )

    const table = useReactTable({
        data: displayRows,
        columns,
        getCoreRowModel: getCoreRowModel(),
    })

    const debitTotal = getKpiValue(rows, 'Debit Total', Number(data?.debit_total ?? 0))
    const creditTotal = getKpiValue(rows, 'Credit Total', Number(data?.credit_total ?? 0))
    const bankBalance = getKpiValue(rows, 'Bank Balance', Number(data?.bank_balance ?? 0))
    const difference = getKpiValue(rows, 'Difference', Number(data?.difference ?? 0))

    const handleExportExcel = React.useCallback(() => {
        const selectedFinancialYearLabel =
            financialYearOptions.find((item) => item.value === selectedFinancialYear)?.label ?? selectedFinancialYear

        const kpiRows = [
            ['Total Debit', formatCurrencyForExport(debitTotal)],
            ['Total Credit', formatCurrencyForExport(creditTotal)],
            ['Bank Balance', formatCurrencyForExport(bankBalance)],
            ['Final Balance', formatCurrencyForExport(difference)],
            ['Financial Year', selectedFinancialYearLabel],
        ]

        const tableRowsForExport = [
            ...displayRows.map((row) => [
                row.particulars,
                row.debit > 0 ? formatCurrencyForExport(row.debit) : '',
                row.credit > 0 ? formatCurrencyForExport(row.credit) : '',
            ]),
            ['Total', debitTotal > 0 ? formatCurrencyForExport(debitTotal) : '0', creditTotal > 0 ? formatCurrencyForExport(creditTotal) : '0'],
        ]

        const kpiTableHtml = `
            <table border="1">
                <thead>
                    <tr>
                        <th colspan="2">Trial Balance Summary</th>
                    </tr>
                </thead>
                <tbody>
                    ${kpiRows
                .map(
                    (row) =>
                        `<tr><td>${escapeHtml(String(row[0]))}</td><td>${escapeHtml(String(row[1]))}</td></tr>`
                )
                .join('')}
                </tbody>
            </table>
        `

        const mainTableHtml = `
            <table border="1">
                <thead>
                    <tr>
                        <th>Particulars</th>
                        <th>Credit</th>
                        <th>Debit</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRowsForExport
                .map(
                    (row) =>
                        `<tr><td>${escapeHtml(String(row[0]))}</td><td>${escapeHtml(String(row[1]))}</td><td>${escapeHtml(String(row[2]))}</td></tr>`
                )
                .join('')}
                </tbody>
            </table>
        `

        const workbookHtml = `
            <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
                <head>
                    <meta charset="UTF-8" />
                    <meta name="ProgId" content="Excel.Sheet" />
                    <meta name="Generator" content="Microsoft Excel 15" />
                    <style>
                        table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
                        th, td { border: 1px solid #d1d5db; padding: 8px; font-family: Arial, sans-serif; font-size: 12px; }
                        th { font-weight: 700; }
                    </style>
                </head>
                <body>
                    ${kpiTableHtml}
                    ${mainTableHtml}
                </body>
            </html>
        `

        const blob = new Blob(['\ufeff', workbookHtml], {
            type: 'application/vnd.ms-excel;charset=utf-8;',
        })

        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `trial-balance-${selectedFinancialYear}.xls`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
    }, [bankBalance, creditTotal, debitTotal, difference, displayRows, financialYearOptions, selectedFinancialYear])

    if (isLoading || isFetching) {
        return <TrialBalanceSkeleton />
    }

    if (isError) {
        return (
            <div className="w-full p-4 md:p-6">
                <div className="rounded-xl border border-red-200 bg-white p-4 text-sm font-medium text-red-600 shadow-sm">
                    {error instanceof Error ? error.message : 'Failed to load trial balance'}
                </div>
            </div>
        )
    }

    return (
        <div className="w-full space-y-4 p-4 md:p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Card className="rounded-xl shadow-sm">
                    <CardContent>
                        <div className="text-lg font-bold capitalize text-slate-500">
                            Total Credit
                        </div>
                        <div className="text-[22px] font-bold text-slate-900">
                            {formatCurrency(debitTotal)}
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-xl shadow-sm">
                    <CardContent>
                        <div className="text-lg font-bold capitalize text-slate-500">
                            Total Debit
                        </div>
                        <div className="text-[22px] font-bold text-slate-900">
                            {formatCurrency(creditTotal)}
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-xl shadow-sm">
                    <CardContent>
                        <div className="text-lg font-bold capitalize text-slate-500">
                            Bank Balance
                        </div>
                        <div className="text-[22px] font-bold text-slate-900">
                            {formatCurrency(bankBalance)}
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-xl shadow-sm">
                    <CardContent>
                        <div className="text-lg font-bold capitalize text-slate-500">
                            Final balance
                        </div>
                        <div className="text-[22px] font-bold text-slate-900">
                            {formatCurrency(difference)}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
                <div className="my-auto flex w-full flex-col gap-2 sm:w-auto">
                    <div className="text-sm font-medium text-slate-600">
                        Financial Year
                    </div>
                    <Select value={selectedFinancialYear} onValueChange={setSelectedFinancialYear}>
                        <SelectTrigger className="w-full min-w-55 rounded-xl md:w-65">
                            <SelectValue placeholder="Select financial year" />
                        </SelectTrigger>
                        <SelectContent>
                            {financialYearOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="my-auto">
                    <Button type="button" className="mt-7 gap-2 rounded-xl" onClick={handleExportExcel}>
                        <Download className="h-4 w-4" />
                        Export
                    </Button>
                </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead
                                        key={header.id}
                                        style={{ width: header.getSize() }}
                                        className={header.column.id === 'particulars' ? 'text-left' : 'text-right'}
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
                        {table.getRowModel().rows.length > 0 ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    className={getBottomSummaryRowClass(row.original.rowType)}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell
                                            key={cell.id}
                                            className={cell.column.id === 'particulars' ? 'py-3 text-left' : 'py-3 text-right'}
                                        >
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={3} className="h-24 text-center text-sm text-slate-500">
                                    No trial balance data found
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>

                    <TableFooter>
                        <TableRow>
                            <TableCell className="py-5 text-left text-[13px] font-semibold text-slate-900">
                                Total
                            </TableCell>
                            <TableCell className="py-5 text-right text-[13px] font-semibold text-slate-900">
                                {debitTotal > 0 ? formatCurrency(debitTotal) : '0'}
                            </TableCell>
                            <TableCell className="py-5 text-right text-[13px] font-semibold text-slate-900">
                                {creditTotal > 0 ? formatCurrency(creditTotal) : '0'}
                            </TableCell>
                        </TableRow>
                    </TableFooter>
                </Table>
            </div>
        </div>
    )
}