'use client'

import React from 'react'
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
} from '@tanstack/react-table'
import { useQuery } from '@tanstack/react-query'
import { getTrialBalanceHandler } from '@/services/trialBalanceHandler'

type ApiRowType =
    | 'opening_balance'
    | 'credit'
    | 'debit'
    | 'closing_balance'
    | 'cash_in_hand'
    | 'bank_balance'
    | 'total'

type ApiRow = {
    title?: string
    debit?: number | null
    credit?: number | null
    type?: ApiRowType
}

type TrialBalanceRow = {
    id: number
    particulars: string
    debit: number
    credit: number
    rowType: 'normal' | 'opening' | 'closing' | 'cash' | 'bank' | 'total'
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

function sanitizeDisplayTitle(value: string) {
    return value.replace(/\s*apply payment\s*$/i, '').trim()
}

function getRowStyles(rowType: TrialBalanceRow['rowType']) {
    switch (rowType) {
        case 'closing':
            return {
                row: 'bg-[#ece8d9]',
                particulars: 'text-[#b25d00]',
                debit: 'text-[#d7c8ad]',
                credit: 'text-[#d06a00]',
            }
        case 'cash':
            return {
                row: 'bg-[#d7e8e1]',
                particulars: 'text-[#005c4b]',
                debit: 'text-[#b7cec6]',
                credit: 'text-[#007561]',
            }
        case 'bank':
            return {
                row: 'bg-[#ece5f0]',
                particulars: 'text-[#92259f]',
                debit: 'text-[#cfc2d8]',
                credit: 'text-[#b224c2]',
            }
        case 'total':
            return {
                row: 'bg-[#04153f]',
                particulars: 'text-white',
                debit: 'text-white',
                credit: 'text-white',
            }
        default:
            return {
                row: 'bg-white',
                particulars: 'text-slate-800',
                debit: 'text-[#b8c5d8]',
                credit: 'text-slate-800',
            }
    }
}

const fixedParticulars = [
    'Bank Interest Collection',
    'Interest on Investment / Deposit',
    'Anamat Income',
    'Entrance Fee',
    'Donation',
    'Grant',
    'Bank Charges',
    'Stationery / Xerox Expense',
    'Dividend / Profit Share @ 5%',
    'Annual General Meeting Expense',
    'Audit Department Expense',
    'Audit Interest / Audit (Other)',
    'Audit Interest / Audit Confirmation',
    'Audit Fees',
    'Permanent Deposit',
    'Student Scholarship / Donation',
    'Travel Expense',
    'Interest on Permanent Deposit',
    'Interest Paid on Fixed Deposit',
    'Interest Paid on RD (Lakhpati Yojana)',
    'Accounts Writing',
    'Office Exp',
    'Salary',
    'Electricity',
    'Repair & Maint.',
    'Event Exp',
    'Miscellaneous',
    'Meeting Expences',
    'Depreciation',
    'Rent, Rates & Taxes',
]

export default function Page() {
    const { data, isLoading, isError, error } = useQuery({
        queryKey: ['trial-balance'],
        queryFn: () => getTrialBalanceHandler(),
    })

    const rows = React.useMemo<TrialBalanceRow[]>(() => {
        const apiRows = Array.isArray(data?.rows) ? (data.rows as ApiRow[]) : []

        const specialRows = {
            opening: apiRows.find((row) => row.type === 'opening_balance'),
            closing: apiRows.find((row) => row.type === 'closing_balance'),
            cash: apiRows.find((row) => row.type === 'cash_in_hand'),
            bank: apiRows.find((row) => row.type === 'bank_balance'),
            total: apiRows.find((row) => row.type === 'total'),
        }

        const normalRows = apiRows.filter(
            (row) =>
                row.type !== 'opening_balance' &&
                row.type !== 'closing_balance' &&
                row.type !== 'cash_in_hand' &&
                row.type !== 'bank_balance' &&
                row.type !== 'total'
        )

        const normalMap = new Map<string, { title: string; debit: number; credit: number }>()

        normalRows.forEach((row) => {
            const title = sanitizeDisplayTitle(String(row.title ?? '').trim())
            if (!title) {
                return
            }

            const key = normalizeTitle(title)
            const existing = normalMap.get(key)

            if (existing) {
                existing.debit += Number(row.debit ?? 0)
                existing.credit += Number(row.credit ?? 0)
            } else {
                normalMap.set(key, {
                    title,
                    debit: Number(row.debit ?? 0),
                    credit: Number(row.credit ?? 0),
                })
            }
        })

        const finalRows: TrialBalanceRow[] = []
        const usedKeys = new Set<string>()

        const pushRow = (
            particulars: string,
            debit: number,
            credit: number,
            rowType: TrialBalanceRow['rowType']
        ) => {
            finalRows.push({
                id: finalRows.length + 1,
                particulars,
                debit,
                credit,
                rowType,
            })
        }

        pushRow(
            'Opening Balance',
            Number(specialRows.opening?.debit ?? 0),
            Number(specialRows.opening?.credit ?? 0),
            'normal'
        )

        pushRow('Cash in Hand (Opening)', 0, 0, 'normal')
        // pushRow('Bank Balance – Savings Account', 0, 0, 'normal')

        fixedParticulars.forEach((particular) => {
            const key = normalizeTitle(particular)
            const match = normalMap.get(key)

            pushRow(
                particular,
                Number(match?.debit ?? 0),
                Number(match?.credit ?? 0),
                'normal'
            )

            usedKeys.add(key)
        })

        normalMap.forEach((value, key) => {
            if (usedKeys.has(key)) {
                return
            }

            pushRow(
                value.title,
                Number(value.debit ?? 0),
                Number(value.credit ?? 0),
                'normal'
            )
        })

        pushRow(
            'Closing Balance',
            Number(specialRows.closing?.debit ?? 0),
            Number(specialRows.closing?.credit ?? 0),
            'closing'
        )

        pushRow(
            'Cash in Hand (Closing)',
            Number(specialRows.cash?.debit ?? 0),
            Number(specialRows.cash?.credit ?? 0),
            'cash'
        )

        pushRow(
            'Bank Balance',
            Number(specialRows.bank?.debit ?? 0),
            Number(specialRows.bank?.credit ?? 0),
            'bank'
        )

        pushRow(
            'Total',
            Number(specialRows.total?.debit ?? 0),
            Number(specialRows.total?.credit ?? 0),
            'total'
        )

        return finalRows
    }, [data])

    const totalDebit = Number(data?.debit_total ?? 0)
    const totalCredit = Number(data?.credit_total ?? 0)
    const difference = Math.abs(Number(data?.difference ?? 0))

    const columns = React.useMemo<ColumnDef<TrialBalanceRow>[]>(
        () => [
            {
                accessorKey: 'particulars',
                header: () => (
                    <span className="text-[13px] font-bold text-slate-600">
                        Particulars
                    </span>
                ),
                cell: ({ row }) => {
                    const styles = getRowStyles(row.original.rowType)

                    return (
                        <div className={['text-[13px] font-medium', styles.particulars].join(' ')}>
                            {row.original.particulars}
                        </div>
                    )
                },
                size: 900,
            },
            {
                accessorKey: 'debit',
                header: () => (
                    <div className="text-right">
                        <span className="text-[13px] font-bold text-slate-600">
                            Debit
                        </span>
                    </div>
                ),
                cell: ({ row }) => {
                    const styles = getRowStyles(row.original.rowType)

                    return (
                        <div className={['text-right text-[13px] font-semibold', styles.debit].join(' ')}>
                            {row.original.debit > 0 ? formatCurrency(row.original.debit) : '0'}
                        </div>
                    )
                },
                size: 220,
            },
            {
                accessorKey: 'credit',
                header: () => (
                    <div className="text-right">
                        <span className="text-[13px] font-bold text-slate-600">
                            Credit
                        </span>
                    </div>
                ),
                cell: ({ row }) => {
                    const styles = getRowStyles(row.original.rowType)

                    return (
                        <div className={['text-right text-[13px] font-semibold', styles.credit].join(' ')}>
                            {row.original.credit > 0 ? formatCurrency(row.original.credit) : '0'}
                        </div>
                    )
                },
                size: 220,
            },
        ],
        []
    )

    const table = useReactTable({
        data: rows,
        columns,
        getCoreRowModel: getCoreRowModel(),
    })

    if (isLoading) {
        return <div className="w-full bg-slate-50/70 p-4 md:p-6"></div>
    }

    if (isError) {
        return (
            <div className="w-full bg-slate-50/70 p-4 md:p-6">
                <div className="rounded-xl border border-red-200 bg-white p-4 text-sm font-medium text-red-600 shadow-sm">
                    {error instanceof Error ? error.message : 'Failed to load trial balance'}
                </div>
            </div>
        )
    }

    return (
        <div className="w-full p-4 md:p-6">
            <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-3 text-[12px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                        Total Debit
                    </div>
                    <div className="text-[22px] font-bold text-[#d1144f]">
                        {formatCurrency(totalDebit)}
                    </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-3 text-[12px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                        Total Credit
                    </div>
                    <div className="text-[22px] font-bold text-[#007f68]">
                        {formatCurrency(totalCredit)}
                    </div>
                </div>

                <div className="rounded-xl bg-[#04153f] p-5 shadow-sm">
                    <div className="mb-3 text-[12px] font-semibold uppercase tracking-[0.22em] text-white/80">
                        Balance Gap
                    </div>
                    <div className="text-[22px] font-bold text-white">
                        {formatCurrency(difference)}
                    </div>
                </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead className="bg-white">
                            {table.getHeaderGroups().map((headerGroup) => (
                                <tr key={headerGroup.id} className="border-b border-slate-200">
                                    {headerGroup.headers.map((header) => (
                                        <th
                                            key={header.id}
                                            style={{ width: header.getSize() }}
                                            className={[
                                                'px-4 py-3 capitalize',
                                                header.column.id === 'particulars' ? 'text-left' : 'text-right',
                                            ].join(' ')}
                                        >
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(header.column.columnDef.header, header.getContext())}
                                        </th>
                                    ))}
                                </tr>
                            ))}
                        </thead>

                        <tbody>
                            {table.getRowModel().rows.map((row) => {
                                const styles = getRowStyles(row.original.rowType)

                                return (
                                    <tr key={row.id} className={['border-b border-slate-200', styles.row].join(' ')}>
                                        {row.getVisibleCells().map((cell) => (
                                            <td
                                                key={cell.id}
                                                className={[
                                                    'px-4 py-2.5 align-middle',
                                                    cell.column.id === 'particulars' ? 'text-left' : 'text-right',
                                                ].join(' ')}
                                            >
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </td>
                                        ))}
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}