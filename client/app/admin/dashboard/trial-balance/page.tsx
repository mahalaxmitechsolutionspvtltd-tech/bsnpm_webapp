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
import {
    Table,
    TableBody,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
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

const currencyFormatter = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
})

function formatCurrency(value: number) {
    return `₹ ${currencyFormatter.format(Number.isFinite(value) ? value : 0)}`
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

export default function Page() {
    const { data: response, isLoading, isError, error } = useQuery<TrialBalanceApiResponse | TrialBalanceApiData>({
        queryKey: ['trial-balance'],
        queryFn: async () => {
            return await getTrialBalanceHandler()
        },
    })

    const data = React.useMemo<TrialBalanceApiData>(() => {
        return extractTrialBalancePayload(response)
    }, [response])

    const rows = React.useMemo<TrialBalanceRow[]>(() => mapSummaryToRows(data), [data])

    const tableRows = React.useMemo(
        () =>
            rows.filter(
                (row) =>
                    row.rowType !== 'debit_total' &&
                    row.rowType !== 'credit_total' &&
                    row.rowType !== 'difference' &&
                    row.rowType !== 'total'
            ),
        [rows]
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
                accessorKey: 'debit',
                header: () => <div className="text-right text-[13px] font-semibold">Debit</div>,
                cell: ({ row }) => (
                    <div className="text-right text-[13px] font-medium text-slate-800 ">
                        {row.original.debit > 0 ? formatCurrency(row.original.debit) : '0'}
                    </div>
                ),
                size: 220,
            },
            {
                accessorKey: 'credit',
                header: () => <div className="text-right text-[13px] font-semibold">Credit</div>,
                cell: ({ row }) => (
                    <div className="text-right text-[13px] font-medium text-slate-800">
                        {row.original.credit > 0 ? formatCurrency(row.original.credit) : '0'}
                    </div>
                ),
                size: 220,
            },
        ],
        []
    )

    const table = useReactTable({
        data: tableRows,
        columns,
        getCoreRowModel: getCoreRowModel(),
    })

    const debitTotal = getKpiValue(rows, 'Debit Total', Number(data?.debit_total ?? 0))
    const creditTotal = getKpiValue(rows, 'Credit Total', Number(data?.credit_total ?? 0))
    const bankBalance = getKpiValue(rows, 'Bank Balance', Number(data?.bank_balance ?? 0))
    const difference = getKpiValue(rows, 'Difference', Number(data?.difference ?? 0))

    if (isLoading) {
        return <div className="w-full p-4 md:p-6" />
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
                    <CardContent className="">
                        <div className="text-lg font-bold capitalize text-slate-500">
                            Total Debit
                        </div>
                        <div className=" text-[22px] font-bold text-slate-900">
                            {formatCurrency(debitTotal)}
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-xl shadow-sm">
                    <CardContent className="">
                        <div className="text-lg font-bold capitalize text-slate-500">
                            Total Credit
                        </div>
                        <div className=" text-[22px] font-bold text-slate-900">
                            {formatCurrency(creditTotal)}
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-xl shadow-sm">
                    <CardContent className="">
                        <div className="text-lg font-bold capitalize text-slate-500">
                            Bank Balance
                        </div>
                        <div className=" text-[22px] font-bold text-slate-900">
                            {formatCurrency(bankBalance)}
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-xl shadow-sm">
                    <CardContent className="">
                        <div className="text-lg font-bold capitalize text-slate-500">
                            Final balance
                        </div>
                        <div className=" text-[22px] font-bold text-slate-900">
                            {formatCurrency(difference)}
                        </div>
                    </CardContent>
                </Card>
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
                                <TableRow key={row.id}>
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