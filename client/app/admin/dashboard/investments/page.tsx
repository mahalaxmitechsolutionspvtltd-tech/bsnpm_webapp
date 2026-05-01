'use client'

import React from 'react'
import { useQuery } from '@tanstack/react-query'
import {
    ColumnDef,
    ColumnFiltersState,
    PaginationState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
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
import {
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Download,
    FileText,
    Sheet,
} from 'lucide-react'
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

const pageSizeOptions = ['10', '20', '50', '100']

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

const getNumericColumnClassName = (columnId: string) => {
    if (columnId === 'rd' || columnId === 'fd' || columnId === 'td' || columnId === 'ly' || columnId === 'dd') {
        return 'min-w-18 w-auto'
    }

    if (columnId === 'share' || columnId === 'emergency') {
        return 'min-w-24 w-auto'
    }

    if (columnId === 'loan_amt' || columnId === 'loan_out' || columnId === 'kayam_thev' || columnId === 'total_value') {
        return 'min-w-28 w-auto'
    }

    return 'w-auto'
}

const SkeletonRow = () => {
    return (
        <tr className='border-b last:border-b-0'>
            <td className='min-w-64 px-3 py-2.5'>
                <div className='space-y-1.5'>
                    <div className='h-3.5 w-32 animate-pulse rounded bg-muted' />
                    <div className='h-3 w-20 animate-pulse rounded bg-muted' />
                </div>
            </td>
            {Array.from({ length: 11 }).map((_, index) => (
                <td key={index} className='min-w-18 px-3 py-2.5 text-center'>
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
    const [exportMenuOpen, setExportMenuOpen] = React.useState(false)
    const exportMenuRef = React.useRef<HTMLDivElement | null>(null)
    const [pagination, setPagination] = React.useState<PaginationState>({
        pageIndex: 0,
        pageSize: 10,
    })

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

    React.useEffect(() => {
        setPagination((prev) => ({
            ...prev,
            pageIndex: 0,
        }))
    }, [selectedScheme, sortOrder, columnFilters])

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                exportMenuRef.current &&
                event.target instanceof Node &&
                !exportMenuRef.current.contains(event.target)
            ) {
                setExportMenuOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [])

    const queryParams: GetMemberInvestmentPortfolioParams = React.useMemo(
        () => ({
            ...(search.trim() ? { search: search.trim() } : {})
        }),
        [search]
    )

    const { data, isLoading, isError, error } = useQuery({
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
                    <div className='flex min-w-64 flex-col'>
                        <span className='text-[14px] font-semibold leading-5 text-foreground'>
                            {row.original.member_name || '-'}
                        </span>
                        <span className='text-[11px] text-muted-foreground'>
                            {row.original.member_id || '-'}
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

    // eslint-disable-next-line react-hooks/incompatible-library
    const table = useReactTable({
        data: filteredSortedMembers,
        columns,
        state: {
            columnFilters,
            pagination,
        },
        onColumnFiltersChange: setColumnFilters,
        onPaginationChange: setPagination,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    })

    const visibleRowsCount = table.getFilteredRowModel().rows.length
    const currentRowsCount = table.getPaginationRowModel().rows.length
    const pageCount = table.getPageCount()
    const currentPage = table.getState().pagination.pageIndex + 1
    const currentPageSize = table.getState().pagination.pageSize
    const fromRow = visibleRowsCount === 0 ? 0 : table.getState().pagination.pageIndex * currentPageSize + 1
    const toRow = visibleRowsCount === 0 ? 0 : fromRow + currentRowsCount - 1

    const getExportRows = React.useCallback(() => {
        return table.getFilteredRowModel().rows.map((row) => row.original)
    }, [table])

    const getSummaryRows = React.useCallback((rowsLength: number) => {
        return [
            ['Total Members', String(summary.total_members)],
            ['Total Deposits', formatCurrencyForExport(summary.total_deposits)],
            ['Total Loans', formatCurrencyForExport(summary.total_loans)],
            ['Outstanding', formatCurrencyForExport(summary.outstanding)],
            ['Kayam Thev', formatCurrencyForExport(summary.kayam_thev)],
            ['Selected Scheme', schemeOptions.find((item) => item.value === selectedScheme)?.label ?? 'All Schemes'],
            ['Sort Order', sortOrderOptions.find((item) => item.value === sortOrder)?.label ?? 'High to Low'],
            ['Visible Rows', String(rowsLength)],
        ]
    }, [summary, selectedScheme, sortOrder])

    const getDataTableHtml = React.useCallback((rows: SafeMember[]) => {
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

        return `
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
    }, [])

    const getSummaryTableHtml = React.useCallback((rowsLength: number) => {
        const summaryRows = getSummaryRows(rowsLength)

        return `
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
    }, [getSummaryRows])

    const handleExportExcel = React.useCallback(() => {
        const rows = getExportRows()
        const summaryTableHtml = getSummaryTableHtml(rows.length)
        const dataTableHtml = getDataTableHtml(rows)

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
        setExportMenuOpen(false)
    }, [getExportRows, getSummaryTableHtml, getDataTableHtml, selectedScheme, sortOrder])

    const handleExportPdf = React.useCallback(() => {
        const rows = getExportRows()
        const summaryTableHtml = getSummaryTableHtml(rows.length)
        const dataTableHtml = getDataTableHtml(rows)

        const printHtml = `
            <!doctype html>
            <html>
                <head>
                    <meta charset="UTF-8" />
                    <title>Investment Portfolio</title>
                    <style>
                        @page { size: landscape; margin: 12mm; }
                        body { font-family: Arial, sans-serif; color: #111827; }
                        h1 { margin: 0 0 6px 0; font-size: 18px; }
                        p { margin: 0 0 14px 0; font-size: 11px; color: #4b5563; }
                        table { border-collapse: collapse; width: 100%; margin-bottom: 18px; }
                        th, td { border: 1px solid #d1d5db; padding: 6px; font-size: 10px; text-align: left; }
                        th { background: #f3f4f6; font-weight: 700; }
                    </style>
                </head>
                <body>
                    <h1>Investment Portfolio</h1>
                    <p>Selected Scheme: ${escapeHtml(schemeOptions.find((item) => item.value === selectedScheme)?.label ?? 'All Schemes')} | Sort Order: ${escapeHtml(sortOrderOptions.find((item) => item.value === sortOrder)?.label ?? 'High to Low')}</p>
                    ${summaryTableHtml}
                    ${dataTableHtml}
                    <script>
                        window.onload = function () {
                            window.focus();
                            window.print();
                        };
                    </script>
                </body>
            </html>
        `

        const printWindow = window.open('', '_blank', 'width=1200,height=800')
        if (!printWindow) {
            setExportMenuOpen(false)
            return
        }

        printWindow.document.open()
        printWindow.document.write(printHtml)
        printWindow.document.close()
        setExportMenuOpen(false)
    }, [getExportRows, getSummaryTableHtml, getDataTableHtml, selectedScheme, sortOrder])

    return (
        <>
            <style jsx global>{`
                .investment-portfolio-table-scroll {
                    scrollbar-width: none;
                    -ms-overflow-style: none;
                }

                .investment-portfolio-table-scroll::-webkit-scrollbar {
                    width: 0;
                    height: 0;
                    display: none;
                }
            `}</style>

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

                        <div ref={exportMenuRef} className='relative flex w-full items-end justify-between gap-3 xl:w-auto xl:justify-end'>
                            <div className='w-full max-w-45 xl:w-45 shrink-0'>
                                <Button
                                    type='button'
                                    onClick={() => setExportMenuOpen((open) => !open)}
                                    className='h-10 w-full rounded-xl'
                                    disabled={isLoading || table.getFilteredRowModel().rows.length === 0}
                                >
                                    <Download className='mr-2 h-4 w-4' />
                                    Export
                                    <ChevronDown className='ml-2 h-4 w-4' />
                                </Button>

                                {exportMenuOpen ? (
                                    <div className='absolute right-0 top-[calc(100%+8px)] z-50 w-48 overflow-hidden rounded-xl border bg-popover p-1 shadow-xl'>
                                        <button
                                            type='button'
                                            onClick={handleExportPdf}
                                            className='flex w-full items-center rounded-lg px-3 py-2 text-left text-sm font-medium text-popover-foreground hover:bg-muted'
                                        >
                                            <FileText className='mr-2 h-4 w-4' />
                                            Export PDF
                                        </button>
                                        <button
                                            type='button'
                                            onClick={handleExportExcel}
                                            className='flex w-full items-center rounded-lg px-3 py-2 text-left text-sm font-medium text-popover-foreground hover:bg-muted'
                                        >
                                            <Sheet className='mr-2 h-4 w-4' />
                                            Export Excel
                                        </button>
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    </div>
                </div>

                <div className='w-full overflow-hidden rounded-xl border bg-background'>
                    <div className='investment-portfolio-table-scroll relative min-h-87.5 max-h-140 w-full overflow-auto'>
                        <table className='w-max min-w-full border-separate border-spacing-0'>
                            <thead className='z-20'>
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <tr key={headerGroup.id}>
                                        {headerGroup.headers
                                            .filter((header) => header.column.id !== 'member_search')
                                            .map((header) => (
                                                <th
                                                    key={header.id}
                                                    className={`sticky top-0 z-20 border-b bg-background px-3 py-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground  whitespace-nowrap ${header.column.id === 'member_name' ? 'min-w-64 text-left' : `${getNumericColumnClassName(header.column.id)} text-center`}`}
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
                                ) : table.getPaginationRowModel().rows.length > 0 ? (
                                    table.getPaginationRowModel().rows.map((row) => (
                                        <tr
                                            key={row.id}
                                            className='transition-colors hover:bg-muted/20'
                                        >
                                            {row.getVisibleCells()
                                                .filter((cell) => cell.column.id !== 'member_search')
                                                .map((cell) => (
                                                    <td
                                                        key={cell.id}
                                                        className={`border-b bg-background px-3 py-2.5 align-middle whitespace-nowrap ${cell.column.id === 'member_name' ? 'min-w-64 text-left' : `${getNumericColumnClassName(cell.column.id)} text-center`}`}
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
                                            className='border-b bg-background px-4 py-8 text-center text-sm text-muted-foreground'
                                        >
                                            {emptyMessage}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className='flex flex-col gap-3 border-t bg-background px-4 py-3 sm:flex-row sm:items-center sm:justify-between'>
                        <div className='text-xs text-muted-foreground'>
                            Showing {fromRow} to {toRow} of {visibleRowsCount} entries
                        </div>

                        <div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
                            <div className='flex items-center gap-2'>
                                <span className='text-xs font-medium text-muted-foreground'>
                                    Rows
                                </span>
                                <Select
                                    value={String(currentPageSize)}
                                    onValueChange={(value) => table.setPageSize(Number(value))}
                                >
                                    <SelectTrigger className='h-8 w-20 rounded-lg text-xs'>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {pageSizeOptions.map((size) => (
                                            <SelectItem key={size} value={size}>
                                                {size}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className='flex items-center gap-2'>
                                <span className='text-xs font-medium text-muted-foreground'>
                                    Page {pageCount === 0 ? 0 : currentPage} of {pageCount}
                                </span>

                                <div className='flex items-center gap-1'>
                                    <Button
                                        type='button'
                                        variant='outline'
                                        size='icon'
                                        className='h-8 w-8 rounded-lg'
                                        onClick={() => table.setPageIndex(0)}
                                        disabled={!table.getCanPreviousPage()}
                                    >
                                        <ChevronsLeft className='h-4 w-4' />
                                    </Button>

                                    <Button
                                        type='button'
                                        variant='outline'
                                        size='icon'
                                        className='h-8 w-8 rounded-lg'
                                        onClick={() => table.previousPage()}
                                        disabled={!table.getCanPreviousPage()}
                                    >
                                        <ChevronLeft className='h-4 w-4' />
                                    </Button>

                                    <Button
                                        type='button'
                                        variant='outline'
                                        size='icon'
                                        className='h-8 w-8 rounded-lg'
                                        onClick={() => table.nextPage()}
                                        disabled={!table.getCanNextPage()}
                                    >
                                        <ChevronRight className='h-4 w-4' />
                                    </Button>

                                    <Button
                                        type='button'
                                        variant='outline'
                                        size='icon'
                                        className='h-8 w-8 rounded-lg'
                                        onClick={() => table.setPageIndex(pageCount - 1)}
                                        disabled={!table.getCanNextPage()}
                                    >
                                        <ChevronsRight className='h-4 w-4' />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default InvestmentPortfolioTable