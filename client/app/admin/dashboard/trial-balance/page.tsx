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

function safeNumber(value: unknown) {
    const numberValue = Number(value)
    return Number.isFinite(numberValue) ? numberValue : 0
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

function isOutgoingParticular(title: string) {
    const normalized = normalizeTitle(title)

    return (
        normalized.includes('expense') ||
        normalized.includes('withdrawal') ||
        normalized.includes('withdraw') ||
        normalized.includes('refund') ||
        normalized.includes('paid out') ||
        normalized.includes('payment out') ||
        normalized.includes('loan disbursement') ||
        normalized.includes('loan given') ||
        normalized.includes('cash paid') ||
        normalized.includes('bank paid') ||
        normalized.includes('salary') ||
        normalized.includes('rent') ||
        normalized.includes('electricity') ||
        normalized.includes('office expense') ||
        normalized.includes('maintenance expense')
    )
}

function normalizeBankingRow(row: TrialBalanceRow): TrialBalanceRow {
    if (
        row.rowType === 'debit_total' ||
        row.rowType === 'credit_total' ||
        row.rowType === 'difference' ||
        row.rowType === 'total'
    ) {
        return row
    }

    if (row.credit > 0 && row.debit === 0 && !isOutgoingParticular(row.particulars)) {
        return {
            ...row,
            debit: row.credit,
            credit: 0,
            value: row.credit,
            rowType: row.rowType === 'credit' ? 'debit' : row.rowType,
        }
    }

    return row
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
            const debit = safeNumber(item?.debit ?? 0)
            const credit = safeNumber(item?.credit ?? 0)
            const value = safeNumber(item?.value ?? (debit > 0 ? debit : credit))

            return normalizeBankingRow({
                id: index + 1,
                particulars: title,
                debit,
                credit,
                value,
                rowType,
            })
        })
    }

    const fallbackSummary: TrialBalanceSummaryItem[] = [
        { title: 'Opening Balance', debit: Number(data?.opening_balance ?? 0), credit: 0, type: 'opening_balance' },
        { title: 'Cash in Hand', debit: Number(data?.cash_in_hand ?? 0), credit: 0, type: 'cash_in_hand' },
        { title: 'Bank Balance', debit: Number(data?.bank_balance ?? 0), credit: 0, type: 'bank_balance' },
        { title: 'Closing Balance', debit: Number(data?.closing_balance ?? 0), credit: 0, type: 'closing_balance' },
        { title: 'Principal Amount Total', debit: Number(data?.principal_amount_total ?? 0), credit: 0, type: 'principal_total' },
        { title: 'Loan Interest', debit: Number(data?.interest_amount_total ?? 0), credit: 0, type: 'interest_total' },
        { title: 'Debit Total', debit: Number(data?.debit_total ?? 0), credit: 0, type: 'debit_total' },
        { title: 'Credit Total', debit: 0, credit: Number(data?.credit_total ?? 0), type: 'credit_total' },
        { title: 'Difference', debit: Number(data?.difference ?? 0), credit: 0, type: 'difference' },
        { title: 'Total', debit: Number(data?.debit_total ?? 0), credit: Number(data?.credit_total ?? 0), type: 'total' },
    ]

    return fallbackSummary.map((item, index) => {
        const title = String(item.title ?? '').trim()
        const rowType = getRowType(title, item.type ?? null)
        const debit = safeNumber(item.debit ?? 0)
        const credit = safeNumber(item.credit ?? 0)
        const value = safeNumber(item.value ?? (debit > 0 ? debit : credit))

        return normalizeBankingRow({
            id: index + 1,
            particulars: title,
            debit,
            credit,
            value,
            rowType,
        })
    })
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

function getKpiTone(index: number) {
    if (index === 0) return 'border-emerald-200 bg-emerald-50/60'
    if (index === 1) return 'border-rose-200 bg-rose-50/60'
    if (index === 2) return 'border-blue-200 bg-blue-50/60'
    return 'border-amber-200 bg-amber-50/60'
}

function TrialBalanceSkeleton() {
    return (
        <div className="w-full space-y-5 p-4 md:p-6">
            <div>
                <Skeleton className="h-8 w-56 rounded-lg" />
                <Skeleton className="mt-2 h-4 w-80 rounded-lg" />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
                    <Card key={index} className="rounded-xl border border-slate-200 shadow-sm">
                        <CardContent className="p-5">
                            <Skeleton className="h-5 w-32 rounded-lg" />
                            <Skeleton className="mt-3 h-8 w-40 rounded-lg" />
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
                <div className="flex w-full flex-col gap-2 sm:w-auto">
                    <Skeleton className="h-4 w-28 rounded-lg" />
                    <Skeleton className="h-10 w-full min-w-55 rounded-xl md:w-65" />
                </div>

                <Skeleton className="h-10 w-28 rounded-xl" />
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="p-4">
                    <div className="grid grid-cols-3 gap-4 border-b border-slate-200 pb-4">
                        <Skeleton className="h-5 w-28 rounded-lg" />
                        <Skeleton className="ml-auto h-5 w-20 rounded-lg" />
                        <Skeleton className="ml-auto h-5 w-20 rounded-lg" />
                    </div>

                    <div className="space-y-4 py-4">
                        {Array.from({ length: 12 }).map((_, index) => (
                            <div key={index} className="grid grid-cols-3 items-center gap-4">
                                <Skeleton className="h-5 w-64 rounded-lg" />
                                <Skeleton className="ml-auto h-5 w-24 rounded-lg" />
                                <Skeleton className="ml-auto h-5 w-24 rounded-lg" />
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-3 gap-4 border-t border-slate-200 pt-4">
                        <Skeleton className="h-5 w-20 rounded-lg" />
                        <Skeleton className="ml-auto h-5 w-24 rounded-lg" />
                        <Skeleton className="ml-auto h-5 w-24 rounded-lg" />
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

    const debitTotal = React.useMemo(
        () => displayRows.reduce((total, row) => total + safeNumber(row.debit), 0),
        [displayRows]
    )

    const creditTotal = React.useMemo(
        () => displayRows.reduce((total, row) => total + safeNumber(row.credit), 0),
        [displayRows]
    )

    const bankBalance = React.useMemo(
        () => debitTotal - creditTotal,
        [debitTotal, creditTotal]
    )

    const difference = bankBalance

    const columns = React.useMemo<ColumnDef<TrialBalanceRow>[]>(
        () => [
            {
                accessorKey: 'particulars',
                header: () => <span className="text-[13px] font-semibold text-slate-700">Particulars</span>,
                cell: ({ row }) => (
                    <div className="text-[13px] font-medium text-slate-800">
                        {row.original.particulars}
                    </div>
                ),
                size: 900,
            },
            {
                accessorKey: 'debit',
                header: () => <div className="text-right text-[13px] font-semibold text-slate-700">Debit</div>,
                cell: ({ row }) => (
                    <div className="min-h-5 text-right text-[13px] font-medium text-slate-800">
                        {formatBodyCellValue(row.original.debit, row.original.rowType)}
                    </div>
                ),
                size: 220,
            },
            {
                accessorKey: 'credit',
                header: () => <div className="text-right text-[13px] font-semibold text-slate-700">Credit</div>,
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

    const selectedFinancialYearLabel =
        financialYearOptions.find((item) => item.value === selectedFinancialYear)?.label ?? selectedFinancialYear

    const handleExportExcel = React.useCallback(() => {
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
                        <th>Debit</th>
                        <th>Credit</th>
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
                        th { font-weight: 700; background: #f8fafc; }
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
    }, [bankBalance, creditTotal, debitTotal, difference, displayRows, selectedFinancialYear, selectedFinancialYearLabel])

    if (isLoading || isFetching) {
        return <TrialBalanceSkeleton />
    }

    if (isError) {
        return (
            <div className="w-full p-4 md:p-6">
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-600 shadow-sm">
                    {error instanceof Error ? error.message : 'Failed to load trial balance'}
                </div>
            </div>
        )
    }

    const kpiCards = [
        {
            label: 'Total Debit',
            value: debitTotal,
            helper: 'Money received in society or bank',
        },
        {
            label: 'Total Credit',
            value: creditTotal,
            helper: 'Money paid from society or bank',
        },
        {
            label: 'Bank Balance',
            value: bankBalance,
            helper: 'Debit minus credit balance',
        },
        {
            label: 'Final Balance',
            value: difference,
            helper: 'Current calculated difference',
        },
    ]

    return (
        <div className="w-full space-y-5 p-4 md:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-950">
                        Trial Balance
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        View debit, credit, bank balance, and financial year summary.
                    </p>
                </div>

                <div className="flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-500 shadow-sm">
                    FY {selectedFinancialYearLabel}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {kpiCards.map((card, index) => (
                    <Card key={card.label} className={`rounded-xl border shadow-sm ${getKpiTone(index)}`}>
                        <CardContent className="">
                            <div className="text-sm font-bold uppercase tracking-[0.08em] text-slate-500">
                                {card.label}
                            </div>
                            <div className="mt-2 text-[22px] font-bold text-slate-950">
                                {formatCurrency(card.value)}
                            </div>
                            <div className="mt-1 text-xs font-medium text-slate-500">
                                {card.helper}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-end md:justify-between">
                <div className="flex w-full flex-col gap-2 sm:w-auto">
                    <div className="text-sm font-semibold text-slate-700">
                        Financial Year
                    </div>
                    <Select value={selectedFinancialYear} onValueChange={setSelectedFinancialYear}>
                        <SelectTrigger className="h-10 w-full min-w-55 rounded-xl border-slate-300 bg-white md:w-65">
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

                <Button type="button" className="h-10 gap-2 rounded-xl" onClick={handleExportExcel}>
                    <Download className="h-4 w-4" />
                    Export
                </Button>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
                    <div className="text-sm font-bold text-slate-800">
                        Trial Balance Summary
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                        Debit means money received. Credit means money paid.
                    </div>
                </div>

                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id} className="bg-white hover:bg-white">
                                {headerGroup.headers.map((header) => (
                                    <TableHead
                                        key={header.id}
                                        style={{ width: header.getSize() }}
                                        className={header.column.id === 'particulars' ? 'h-11 border-b border-slate-200 text-left text-slate-700' : 'h-11 border-b border-slate-200 text-right text-slate-700'}
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
                                    className={`${getBottomSummaryRowClass(row.original.rowType)} hover:bg-slate-50/70`}
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
                        <TableRow className="border-t border-slate-200 bg-slate-100 hover:bg-slate-100">
                            <TableCell className="py-5 text-left text-[13px] font-bold text-slate-950">
                                Total
                            </TableCell>
                            <TableCell className="py-5 text-right text-[13px] font-bold text-slate-950">
                                {debitTotal > 0 ? formatCurrency(debitTotal) : '0'}
                            </TableCell>
                            <TableCell className="py-5 text-right text-[13px] font-bold text-slate-950">
                                {creditTotal > 0 ? formatCurrency(creditTotal) : '0'}
                            </TableCell>
                        </TableRow>
                    </TableFooter>
                </Table>
            </div>
        </div>
    )
}