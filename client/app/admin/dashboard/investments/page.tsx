'use client'

import React from 'react'
import { useQuery } from '@tanstack/react-query'
import {
    ColumnDef,
    ColumnFiltersState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    useReactTable,
} from '@tanstack/react-table'
import Filter from '@/components/ui/filter'
import { Button } from '@/components/ui/button'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Download } from 'lucide-react'
import { GetMemberInvestmentPortfolioParams } from '@/types/InvestmentPortfolio'
import { getMemberInvestmentPortfolioHandler } from '@/services/InvestmentPortfolioHandler'

type InvestmentPortfolioTableProps = {
    search?: string
    emptyMessage?: string
    className?: string
}

type SafeMember = {
    member_id: string
    member_name: string
    member_email: string
    rd: number
    fd: number
    td: number
    ly: number
    dd: number
    share: number
    emergency: number
    loan_amt: number
    loan_out: number
    kayam_thev: number
    member_search: string
}

type PortfolioSummary = {
    total_members: number
    total_deposits: number
    total_loans: number
    outstanding: number
    kayam_thev: number
}

type PortfolioResponseShape = {
    success?: boolean
    message?: string
    data?: {
        members?: unknown
        summary?: Partial<PortfolioSummary> | null
    }
}

type SchemeFilterKey =
    | 'all'
    | 'rd'
    | 'fd'
    | 'td'
    | 'ly'
    | 'dd'
    | 'share'
    | 'emergency'
    | 'loan_amt'
    | 'loan_out'
    | 'kayam_thev'
    | 'total'

type SortOrderKey =
    | 'high_to_low'
    | 'low_to_high'
    | 'name_asc'
    | 'name_desc'
    | 'id_asc'
    | 'id_desc'

const schemeOptions: Array<{ value: SchemeFilterKey; label: string }> = [
    { value: 'all', label: 'All Schemes' },
    { value: 'rd', label: 'RD' },
    { value: 'fd', label: 'FD' },
    { value: 'td', label: 'TD' },
    { value: 'ly', label: 'LY' },
    { value: 'dd', label: 'DD' },
    { value: 'share', label: 'Share' },
    { value: 'emergency', label: 'Emergency' },
    { value: 'loan_amt', label: 'Loan Amount' },
    { value: 'loan_out', label: 'Loan Out' },
    { value: 'kayam_thev', label: 'Kayam Thev' },
    { value: 'total', label: 'Total Value' },
]

const sortOrderOptions: Array<{ value: SortOrderKey; label: string }> = [
    { value: 'high_to_low', label: 'High to Low' },
    { value: 'low_to_high', label: 'Low to High' },
    { value: 'name_asc', label: 'Name A-Z' },
    { value: 'name_desc', label: 'Name Z-A' },
    { value: 'id_asc', label: 'ID A-Z' },
    { value: 'id_desc', label: 'ID Z-A' },
]

const formatCurrency = (value: number | string | null | undefined) => {
    const numberValue = typeof value === 'number' ? value : Number(value)
    return Number.isFinite(numberValue)
        ? `₹ ${new Intl.NumberFormat('en-IN', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(numberValue)}`
        : '₹ 0'
}

const formatCurrencyForExport = (value: number | string | null | undefined) => {
    const numberValue = typeof value === 'number' ? value : Number(value)
    return Number.isFinite(numberValue)
        ? new Intl.NumberFormat('en-IN', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(numberValue)
        : '0'
}

function toSafeNumber(value: unknown) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
}

function toSafeString(value: unknown) {
    return typeof value === 'string' ? value : ''
}

function escapeHtml(value: string) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
}

function getSafeMembers(value: unknown): SafeMember[] {
    if (!Array.isArray(value)) {
        return []
    }

    return value.map((member) => {
        const typedMember = (member ?? {}) as Record<string, unknown>
        const memberId = toSafeString(typedMember.member_id).trim()
        const memberName = toSafeString(typedMember.member_name).trim()
        const memberEmail = toSafeString(typedMember.member_email).trim()

        return {
            member_id: memberId,
            member_name: memberName,
            member_email: memberEmail,
            rd: toSafeNumber(typedMember.rd),
            fd: toSafeNumber(typedMember.fd),
            td: toSafeNumber(typedMember.td),
            ly: toSafeNumber(typedMember.ly),
            dd: toSafeNumber(typedMember.dd),
            share: toSafeNumber(typedMember.share),
            emergency: toSafeNumber(typedMember.emergency),
            loan_amt: toSafeNumber(typedMember.loan_amt),
            loan_out: toSafeNumber(typedMember.loan_out),
            kayam_thev: toSafeNumber(typedMember.kayam_thev),
            member_search: `${memberId} ${memberName} ${memberEmail}`.trim(),
        }
    })
}

function getSummary(value: unknown, membersCount: number): PortfolioSummary {
    const typedSummary = (value ?? {}) as Record<string, unknown>

    return {
        total_members: toSafeNumber(typedSummary.total_members ?? membersCount),
        total_deposits: toSafeNumber(typedSummary.total_deposits),
        total_loans: toSafeNumber(typedSummary.total_loans),
        outstanding: toSafeNumber(typedSummary.outstanding),
        kayam_thev: toSafeNumber(typedSummary.kayam_thev),
    }
}

function getMemberTotalValue(member: SafeMember) {
    return (
        member.rd +
        member.fd +
        member.td +
        member.ly +
        member.dd +
        member.share +
        member.emergency +
        member.loan_amt +
        member.kayam_thev
    )
}

function getSchemeValue(member: SafeMember, scheme: SchemeFilterKey) {
    if (scheme === 'rd') return member.rd
    if (scheme === 'fd') return member.fd
    if (scheme === 'td') return member.td
    if (scheme === 'ly') return member.ly
    if (scheme === 'dd') return member.dd
    if (scheme === 'share') return member.share
    if (scheme === 'emergency') return member.emergency
    if (scheme === 'loan_amt') return member.loan_amt
    if (scheme === 'loan_out') return member.loan_out
    if (scheme === 'kayam_thev') return member.kayam_thev
    if (scheme === 'total') return getMemberTotalValue(member)
    return getMemberTotalValue(member)
}

const SkeletonRow = () => {
    return (
        <tr className='border-b last:border-b-0'>
            <td className='px-3 py-2.5'>
                <div className='space-y-1.5'>
                    <div className='h-3.5 w-32 animate-pulse rounded bg-muted' />
                    <div className='h-3 w-20 animate-pulse rounded bg-muted' />
                </div>
            </td>
            {Array.from({ length: 11 }).map((_, index) => (
                <td key={index} className='px-3 py-2.5 text-center'>
                    <div className='mx-auto h-3.5 w-14 animate-pulse rounded bg-muted' />
                </td>
            ))}
        </tr>
    )
}

const InvestmentPortfolioTable = ({
    search = '',
    emptyMessage = 'No portfolio data found.',
    className = ''
}: InvestmentPortfolioTableProps) => {
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
        search.trim()
            ? [{ id: 'member_search', value: search.trim() }]
            : []
    )
    const [selectedScheme, setSelectedScheme] = React.useState<SchemeFilterKey>('all')
    const [sortOrder, setSortOrder] = React.useState<SortOrderKey>('high_to_low')

    React.useEffect(() => {
        const nextValue = search.trim()
        setColumnFilters((prev) => {
            const currentValue = typeof prev.find((item) => item.id === 'member_search')?.value === 'string'
                ? String(prev.find((item) => item.id === 'member_search')?.value ?? '')
                : ''

            if (currentValue === nextValue) {
                return prev
            }

            if (!nextValue) {
                return prev.filter((item) => item.id !== 'member_search')
            }

            const withoutSearch = prev.filter((item) => item.id !== 'member_search')
            return [...withoutSearch, { id: 'member_search', value: nextValue }]
        })
    }, [search])

    const queryParams: GetMemberInvestmentPortfolioParams = React.useMemo(
        () => ({
            ...(search.trim() ? { search: search.trim() } : {})
        }),
        [search]
    )

    const { data, isLoading, isFetching, isError, error } = useQuery({
        queryKey: ['member-investment-portfolio', queryParams],
        queryFn: () => getMemberInvestmentPortfolioHandler(queryParams)
    })

    const responseData = data as PortfolioResponseShape | undefined

    const members = React.useMemo<SafeMember[]>(
        () => getSafeMembers(responseData?.data?.members),
        [responseData]
    )

    const summary = React.useMemo<PortfolioSummary>(
        () => getSummary(responseData?.data?.summary, members.length),
        [responseData, members.length]
    )

    const filteredSortedMembers = React.useMemo(() => {
        const nextMembers = [...members]

        const schemeFilteredMembers = selectedScheme === 'all'
            ? nextMembers
            : nextMembers.filter((member) => getSchemeValue(member, selectedScheme) > 0)

        schemeFilteredMembers.sort((a, b) => {
            if (sortOrder === 'name_asc') {
                return a.member_name.localeCompare(b.member_name)
            }

            if (sortOrder === 'name_desc') {
                return b.member_name.localeCompare(a.member_name)
            }

            if (sortOrder === 'id_asc') {
                return a.member_id.localeCompare(b.member_id)
            }

            if (sortOrder === 'id_desc') {
                return b.member_id.localeCompare(a.member_id)
            }

            const aValue = getSchemeValue(a, selectedScheme)
            const bValue = getSchemeValue(b, selectedScheme)

            if (sortOrder === 'low_to_high') {
                return aValue - bValue
            }

            return bValue - aValue
        })

        return schemeFilteredMembers
    }, [members, selectedScheme, sortOrder])

    const columns = React.useMemo<ColumnDef<SafeMember>[]>(
        () => [
            {
                accessorKey: 'member_search',
                header: () => 'Search',
                cell: () => null,
            },
            {
                accessorKey: 'member_name',
                header: () => 'Member',
                cell: ({ row }) => (
                    <div className='flex min-w-45 flex-col'>
                        <span className='text-[14px] font-semibold leading-5 text-foreground'>
                            {row.original.member_name || '-'}
                        </span>
                        <span className='text-[11px] text-muted-foreground'>
                            {row.original.member_id || '-'}
                        </span>
                        <span className='text-[11px] text-muted-foreground'>
                            {row.original.member_email || '-'}
                        </span>
                    </div>
                ),
            },
            {
                accessorKey: 'rd',
                header: () => 'RD',
                cell: ({ row }) => (
                    <div className='text-center text-[13px] font-medium whitespace-nowrap'>
                        {formatCurrency(row.original.rd)}
                    </div>
                ),
            },
            {
                accessorKey: 'fd',
                header: () => 'FD',
                cell: ({ row }) => (
                    <div className='text-center text-[13px] font-medium whitespace-nowrap'>
                        {formatCurrency(row.original.fd)}
                    </div>
                ),
            },
            {
                accessorKey: 'td',
                header: () => 'TD',
                cell: ({ row }) => (
                    <div className='text-center text-[13px] font-medium whitespace-nowrap'>
                        {formatCurrency(row.original.td)}
                    </div>
                ),
            },
            {
                accessorKey: 'ly',
                header: () => 'LY',
                cell: ({ row }) => (
                    <div className='text-center text-[13px] font-medium whitespace-nowrap'>
                        {formatCurrency(row.original.ly)}
                    </div>
                ),
            },
            {
                accessorKey: 'dd',
                header: () => 'DD',
                cell: ({ row }) => (
                    <div className='text-center text-[13px] font-medium whitespace-nowrap'>
                        {formatCurrency(row.original.dd)}
                    </div>
                ),
            },
            {
                accessorKey: 'share',
                header: () => 'Share',
                cell: ({ row }) => (
                    <div className='text-center text-[13px] font-medium whitespace-nowrap'>
                        {formatCurrency(row.original.share)}
                    </div>
                ),
            },
            {
                accessorKey: 'emergency',
                header: () => 'Emergency',
                cell: ({ row }) => (
                    <div className='text-center text-[13px] font-medium whitespace-nowrap'>
                        {formatCurrency(row.original.emergency)}
                    </div>
                ),
            },
            {
                accessorKey: 'loan_amt',
                header: () => 'Loan Amt',
                cell: ({ row }) => (
                    <div className='text-center text-[13px] font-medium whitespace-nowrap'>
                        {formatCurrency(row.original.loan_amt)}
                    </div>
                ),
            },
            {
                accessorKey: 'loan_out',
                header: () => 'Loan Out',
                cell: ({ row }) => (
                    <div className='text-center text-[13px] font-medium whitespace-nowrap'>
                        {formatCurrency(row.original.loan_out)}
                    </div>
                ),
            },
            {
                accessorKey: 'kayam_thev',
                header: () => 'Kayam Thev',
                cell: ({ row }) => (
                    <div className='text-center text-[13px] font-medium whitespace-nowrap'>
                        {formatCurrency(row.original.kayam_thev)}
                    </div>
                ),
            },
            {
                id: 'total_value',
                header: () => 'Total',
                accessorFn: (row) => getMemberTotalValue(row),
                cell: ({ row }) => (
                    <div className='text-center text-[13px] font-semibold whitespace-nowrap'>
                        {formatCurrency(getMemberTotalValue(row.original))}
                    </div>
                ),
            },
        ],
        []
    )

    const table = useReactTable({
        data: filteredSortedMembers,
        columns,
        state: {
            columnFilters,
        },
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
    })

    const handleExportExcel = React.useCallback(() => {
        const rows = table.getRowModel().rows.map((row) => row.original)

        const exportRows = rows.map((member) => [
            member.member_name || '-',
            member.member_id || '-',
            member.member_email || '-',
            formatCurrencyForExport(member.rd),
            formatCurrencyForExport(member.fd),
            formatCurrencyForExport(member.td),
            formatCurrencyForExport(member.ly),
            formatCurrencyForExport(member.dd),
            formatCurrencyForExport(member.share),
            formatCurrencyForExport(member.emergency),
            formatCurrencyForExport(member.loan_amt),
            formatCurrencyForExport(member.loan_out),
            formatCurrencyForExport(member.kayam_thev),
            formatCurrencyForExport(getMemberTotalValue(member)),
        ])

        const summaryRows = [
            ['Total Members', String(summary.total_members)],
            ['Total Deposits', formatCurrencyForExport(summary.total_deposits)],
            ['Total Loans', formatCurrencyForExport(summary.total_loans)],
            ['Outstanding', formatCurrencyForExport(summary.outstanding)],
            ['Kayam Thev', formatCurrencyForExport(summary.kayam_thev)],
            ['Selected Scheme', schemeOptions.find((item) => item.value === selectedScheme)?.label ?? 'All Schemes'],
            ['Sort Order', sortOrderOptions.find((item) => item.value === sortOrder)?.label ?? 'High to Low'],
            ['Visible Rows', String(rows.length)],
        ]

        const summaryTableHtml = `
            <table border="1">
                <thead>
                    <tr>
                        <th colspan="2">Investment Portfolio Summary</th>
                    </tr>
                </thead>
                <tbody>
                    ${summaryRows
                .map(
                    (row) =>
                        `<tr><td>${escapeHtml(String(row[0]))}</td><td>${escapeHtml(String(row[1]))}</td></tr>`
                )
                .join('')}
                </tbody>
            </table>
        `

        const dataTableHtml = `
            <table border="1">
                <thead>
                    <tr>
                        <th>Member Name</th>
                        <th>Member ID</th>
                        <th>Email</th>
                        <th>RD</th>
                        <th>FD</th>
                        <th>TD</th>
                        <th>LY</th>
                        <th>DD</th>
                        <th>Share</th>
                        <th>Emergency</th>
                        <th>Loan Amt</th>
                        <th>Loan Out</th>
                        <th>Kayam Thev</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${exportRows
                .map(
                    (row) =>
                        `<tr>${row.map((cell) => `<td>${escapeHtml(String(cell))}</td>`).join('')}</tr>`
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
                    ${summaryTableHtml}
                    ${dataTableHtml}
                </body>
            </html>
        `

        const blob = new Blob(['\ufeff', workbookHtml], {
            type: 'application/vnd.ms-excel;charset=utf-8;',
        })

        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `investment-portfolio-${selectedScheme}-${sortOrder}.xls`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
    }, [table, summary, selectedScheme, sortOrder])

    return (
        <div className={`w-full space-y-3 ${className}`}>
            <div className='grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4'>
                <div className='rounded-xl border bg-background p-3'>
                    <div className='text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground'>
                        Total Members
                    </div>
                    <div className='mt-1.5 text-xl font-bold text-foreground'>
                        {summary.total_members}
                    </div>
                </div>

                <div className='rounded-xl border bg-background p-3'>
                    <div className='text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground'>
                        Total Deposits
                    </div>
                    <div className='mt-1.5 text-xl font-bold text-foreground'>
                        {formatCurrency(summary.total_deposits)}
                    </div>
                </div>

                <div className='rounded-xl border bg-background p-3'>
                    <div className='text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground'>
                        Total Loans
                    </div>
                    <div className='mt-1.5 text-xl font-bold text-foreground'>
                        {formatCurrency(summary.total_loans)}
                    </div>
                </div>

                <div className='rounded-xl border bg-background p-3'>
                    <div className='text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground'>
                        Outstanding
                    </div>
                    <div className='mt-1.5 text-xl font-bold text-foreground'>
                        {formatCurrency(summary.outstanding)}
                    </div>
                </div>
            </div>

            <div className='rounded-xl border bg-background p-3'>
                <div className='flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between'>
                    <div className='flex min-w-0 flex-1 flex-col gap-3 md:flex-row md:items-end'>
                        <div className='min-w-0 flex-1 md:max-w-[320px]'>
                            <label className='mb-1.5 block text-[11px] font-semibold text-muted-foreground'>
                                Search
                            </label>
                            <Filter column={table.getColumn('member_search')!} />
                        </div>

                        <div className='w-full md:w-47.5 shrink-0'>
                            <label className='mb-1.5 block text-[11px] font-semibold text-muted-foreground'>
                                Scheme Filter
                            </label>
                            <Select value={selectedScheme} onValueChange={(value) => setSelectedScheme(value as SchemeFilterKey)}>
                                <SelectTrigger className='h-10 w-full rounded-xl'>
                                    <SelectValue placeholder='Select scheme' />
                                </SelectTrigger>
                                <SelectContent>
                                    {schemeOptions.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className='w-full md:w-47.5 shrink-0'>
                            <label className='mb-1.5 block text-[11px] font-semibold text-muted-foreground'>
                                Sort Order
                            </label>
                            <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as SortOrderKey)}>
                                <SelectTrigger className='h-10 w-full rounded-xl'>
                                    <SelectValue placeholder='Sort by' />
                                </SelectTrigger>
                                <SelectContent>
                                    {sortOrderOptions.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className='flex w-full items-end justify-between gap-3 xl:w-auto xl:justify-end'>


                        <div className='w-full max-w-45 xl:w-45 shrink-0'>
                           
                            <Button
                                type='button'
                                onClick={handleExportExcel}
                                className='h-10 w-full rounded-xl'
                                disabled={isLoading || table.getRowModel().rows.length === 0}
                            >
                                <Download className='mr-2 h-4 w-4' />
                                Export Excel
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className='w-full overflow-hidden rounded-xl border bg-background'>
                <div className='w-full overflow-x-auto'>
                    <table className='w-full min-w-375 border-collapse'>
                        <thead>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <tr key={headerGroup.id} className='border-b bg-muted/40'>
                                    {headerGroup.headers
                                        .filter((header) => header.column.id !== 'member_search')
                                        .map((header) => (
                                            <th
                                                key={header.id}
                                                className={`px-3 py-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground ${header.column.id === 'member_name' ? 'text-left' : 'text-center'}`}
                                            >
                                                {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                            </th>
                                        ))}
                                </tr>
                            ))}
                        </thead>

                        <tbody>
                            {isLoading ? (
                                Array.from({ length: 4 }).map((_, index) => <SkeletonRow key={index} />)
                            ) : isError ? (
                                <tr>
                                    <td
                                        colSpan={12}
                                        className='px-4 py-8 text-center text-sm text-red-600'
                                    >
                                        {error instanceof Error ? error.message : 'Failed to load portfolio data.'}
                                    </td>
                                </tr>
                            ) : table.getRowModel().rows.length > 0 ? (
                                table.getRowModel().rows.map((row) => (
                                    <tr
                                        key={row.id}
                                        className='border-b transition-colors last:border-b-0 hover:bg-muted/20'
                                    >
                                        {row.getVisibleCells()
                                            .filter((cell) => cell.column.id !== 'member_search')
                                            .map((cell) => (
                                                <td
                                                    key={cell.id}
                                                    className={`px-3 py-2.5 align-middle ${cell.column.id === 'member_name' ? 'text-left' : 'text-center'}`}
                                                >
                                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                </td>
                                            ))}
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td
                                        colSpan={12}
                                        className='px-4 py-8 text-center text-sm text-muted-foreground'
                                    >
                                        {emptyMessage}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

export default InvestmentPortfolioTable