'use client'

import React from 'react'
import {
    Eye,
    FileSpreadsheet,
    CheckCircle2,
    TrendingUp,
    CalendarDays,
    Wallet,
    Search,
} from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import {
    createDividendHandler,
    getAllDividentHandler,
    getMemberShareCapitalHandler,
    MemberShareCapitalItem,
    type DividentItem,
} from '@/services/dividentHandler'

type DividendRecord = {
    id: number
    financialYear: string
    rate: number
    totalPayout: number
    declaredDate: string
    createdBy: string
    status: 'declared'
}

type PreviewMemberRow = {
    id: number
    memberId: string
    memberName: string
    shareCapitalAmount: number
    dividendAmount: number
    financialYear: string
}

const formatCurrency = (value: number) =>
    `₹ ${new Intl.NumberFormat('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(Number.isFinite(value) ? value : 0)}`

const formatPercent = (value: number) => `${Number.isFinite(value) ? value.toFixed(2) : '0.00'}%`

const formatDate = (value: string) => {
    if (!value) return '-'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    return new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    }).format(date)
}

const normalizeFinancialYear = (value: string | null | undefined) => {
    const raw = String(value ?? '').trim()
    if (!raw) return '-'
    const match = raw.match(/^(\d{4})-(\d{2}|\d{4})$/)
    if (!match) return raw
    const start = match[1]
    const end = match[2].length === 2 ? `${start.slice(0, 2)}${match[2]}` : match[2]
    return `${start}-${end}`
}

const mapDividendItem = (item: DividentItem): DividendRecord => ({
    id: Number(item.id ?? 0),
    financialYear: normalizeFinancialYear(item.financial_year),
    rate: Number(item.dividend_rate ?? 0),
    totalPayout: Number(item.total_payout ?? 0),
    declaredDate: String(item.declared_date ?? ''),
    createdBy: String(item.created_by ?? '-'),
    status: 'declared',
})

const mapMemberShareCapitalItem = (item: MemberShareCapitalItem): PreviewMemberRow => ({
    id: Number(item.id ?? 0),
    memberId: String(item.member_id ?? '-'),
    memberName: String(item.member_name ?? '-'),
    shareCapitalAmount: Number(item.share_capital_amount ?? 0),
    dividendAmount: 0,
    financialYear: normalizeFinancialYear((item as MemberShareCapitalItem & { financial_year?: string | null }).financial_year),
})

function PageSkeleton() {
    return (
        <div className="w-full space-y-5 md:p-6">
            <Card className="rounded-2xl border border-slate-200 shadow-sm">
                <CardContent className="px-4 py-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                            <Skeleton className="h-16 w-full rounded-xl" />
                            <Skeleton className="h-16 w-full rounded-xl" />
                        </div>
                        <div className="flex flex-col gap-3 sm:flex-row">
                            <Skeleton className="h-10 w-40 rounded-xl" />
                            <Skeleton className="h-10 w-32 rounded-xl" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="rounded-2xl border border-slate-200 shadow-sm">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    {Array.from({ length: 6 }).map((_, index) => (
                                        <TableHead key={index}>
                                            <Skeleton className="h-4 w-20" />
                                        </TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {Array.from({ length: 5 }).map((_, rowIndex) => (
                                    <TableRow key={rowIndex}>
                                        {Array.from({ length: 6 }).map((__, cellIndex) => (
                                            <TableCell key={cellIndex}>
                                                <Skeleton className="h-4 w-24" />
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export default function Page() {
    const queryClient = useQueryClient()
    const [previewOpen, setPreviewOpen] = React.useState(false)
    const [selectedFinancialYear, setSelectedFinancialYear] = React.useState<string>('all')
    const [dividendRateInput, setDividendRateInput] = React.useState<string>('')
    const [saveError, setSaveError] = React.useState<string>('')

    const {
        data: dividendResponse,
        isLoading: isDividendLoading,
        isError: isDividendError,
        error: dividendError,
    } = useQuery({
        queryKey: ['all-divident'],
        queryFn: () => getAllDividentHandler(),
    })

    const {
        data: memberShareCapitalResponse,
        isLoading: isMemberShareCapitalLoading,
        isError: isMemberShareCapitalError,
        error: memberShareCapitalError,
    } = useQuery({
        queryKey: ['member-share-capital'],
        queryFn: () => getMemberShareCapitalHandler(),
    })

    const records = React.useMemo<DividendRecord[]>(() => {
        return Array.isArray(dividendResponse?.data)
            ? dividendResponse.data.map(mapDividendItem)
            : []
    }, [dividendResponse])

    const memberShareCapitalRecords = React.useMemo<PreviewMemberRow[]>(() => {
        return Array.isArray(memberShareCapitalResponse?.data)
            ? memberShareCapitalResponse.data.map(mapMemberShareCapitalItem)
            : []
    }, [memberShareCapitalResponse])

    const memberFinancialYearOptions = React.useMemo(() => {
        return Array.from(
            new Set(
                memberShareCapitalRecords
                    .map((item) => item.financialYear)
                    .concat(records.map((item) => item.financialYear))
                    .filter((year) => {
                        const normalized = String(year ?? '').trim()
                        return normalized !== '' && normalized !== '-'
                    })
            )
        ).sort((a, b) => b.localeCompare(a))
    }, [memberShareCapitalRecords, records])

    React.useEffect(() => {
        if (selectedFinancialYear === 'all' && records.length > 0 && dividendRateInput === '') {
            const latestRecord = records[0]
            setSelectedFinancialYear(latestRecord.financialYear)
            setDividendRateInput(String(latestRecord.rate))
        }
    }, [records, selectedFinancialYear, dividendRateInput])

    const selectedDividendRate = React.useMemo(() => {
        const parsedRate = Number(dividendRateInput ?? '')
        if (Number.isFinite(parsedRate) && parsedRate > 0) return parsedRate

        if (selectedFinancialYear !== 'all') {
            const matchedRecord = records.find((item) => item.financialYear === selectedFinancialYear)
            if (matchedRecord) return Number(matchedRecord.rate ?? 0)
        }

        return 0
    }, [dividendRateInput, selectedFinancialYear, records])

    const previewRows = React.useMemo<PreviewMemberRow[]>(() => {
        const yearFilteredMembers =
            selectedFinancialYear !== 'all'
                ? memberShareCapitalRecords.filter((item) => item.financialYear === selectedFinancialYear || item.financialYear === '-')
                : memberShareCapitalRecords

        return yearFilteredMembers.map((item) => ({
            ...item,
            dividendAmount: Number(((item.shareCapitalAmount * selectedDividendRate) / 100).toFixed(2)),
        }))
    }, [memberShareCapitalRecords, selectedDividendRate, selectedFinancialYear])

    const previewTotalPayout = React.useMemo(() => {
        return previewRows.reduce((sum, item) => sum + item.dividendAmount, 0)
    }, [previewRows])

    const createDividendMutation = useMutation({
        mutationFn: createDividendHandler,
        onMutate: () => {
            setSaveError('')
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['all-divident'] })
            setPreviewOpen(false)
        },
        onError: (error: any) => {
            const apiMessage =
                error?.response?.data?.message ||
                error?.message ||
                'Failed to save dividend declaration.'
            setSaveError(String(apiMessage))
        },
    })

    const handleViewDeclaration = () => {
        if (!selectedFinancialYear || selectedFinancialYear === 'all') return
        if (!Number.isFinite(selectedDividendRate) || selectedDividendRate <= 0) return
        if (previewRows.length === 0) return
        setSaveError('')
        setPreviewOpen(true)
    }

    const handleConfirmDeclaration = () => {
        if (!selectedFinancialYear || selectedFinancialYear === 'all') return
        if (!Number.isFinite(selectedDividendRate) || selectedDividendRate <= 0) return

        createDividendMutation.mutate({
            financial_year: selectedFinancialYear,
            dividend_rate: selectedDividendRate,
        })
    }

    const handleExportCsv = () => {
        const headers = ['Financial Year', 'Rate (%)', 'Total Payout', 'Declared Date', 'Created By', 'Status']
        const rows = records.map((row) => [
            row.financialYear,
            row.rate.toFixed(2),
            row.totalPayout.toFixed(2),
            row.declaredDate,
            row.createdBy,
            row.status,
        ])

        const csvContent = [headers, ...rows]
            .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
            .join('\n')

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = 'dividend-records.csv'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
    }

    if (isDividendLoading || isMemberShareCapitalLoading) return <PageSkeleton />

    if (isDividendError || isMemberShareCapitalError) {
        return (
            <div className="w-full md:p-6">
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-600 shadow-sm">
                    {dividendError instanceof Error
                        ? dividendError.message
                        : memberShareCapitalError instanceof Error
                            ? memberShareCapitalError.message
                            : 'Failed to load dividend records.'}
                </div>
            </div>
        )
    }

    return (
        <div className="">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between border rounded-lg px-3 py-3">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:min-w-130">
                    <div className="w-full space-y-2">
                        <label className="text-sm font-medium text-slate-700">Financial Year</label>
                        <Select
                            value={selectedFinancialYear}
                            onValueChange={(value) => {
                                setSelectedFinancialYear(value)
                                if (value !== 'all') {
                                    const matchedRecord = records.find((item) => item.financialYear === value)
                                    if (matchedRecord) {
                                        setDividendRateInput(String(matchedRecord.rate))
                                    }
                                }
                            }}
                        >
                            <SelectTrigger className="h-10 w-full rounded-xl">
                                <SelectValue placeholder="Select financial year" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All</SelectItem>
                                {memberFinancialYearOptions.map((year) => (
                                    <SelectItem key={year} value={year}>
                                        {year}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="w-30 space-y-2">
                        <label className="text-sm font-medium text-slate-700">Dividend Rate</label>
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <Input
                                value={dividendRateInput}
                                onChange={(e) => setDividendRateInput(e.target.value)}
                                placeholder="12.6%"
                                type="number"
                                inputMode="decimal"
                                className="rounded-xl pl-9"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <Button
                        type="button"
                        onClick={handleViewDeclaration}
                        disabled={
                            !selectedFinancialYear ||
                            selectedFinancialYear === 'all' ||
                            !Number.isFinite(selectedDividendRate) ||
                            selectedDividendRate <= 0 ||
                            previewRows.length === 0
                        }
                        className="h-10 rounded-xl px-5 sm:min-w-42"
                    >
                        <Eye className="mr-2 h-4 w-4" />
                        View Declaration
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleExportCsv}
                        className="h-10 rounded-xl px-5"
                        disabled={records.length === 0}
                    >
                        <FileSpreadsheet className="mr-2 h-4 w-4" />
                        Export CSV
                    </Button>
                </div>
            </div>

            <div className="mt-5 overflow-x-auto border rounded-xl">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50/70 hover:bg-slate-50/70">
                            <TableHead className="h-11 px-5 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                                Financial Year
                            </TableHead>
                            <TableHead className="h-11 px-5 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                                Dividend Rate
                            </TableHead>
                            <TableHead className="h-11 px-5 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                                Total Payout
                            </TableHead>
                            <TableHead className="h-11 px-5 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                                Declared Date
                            </TableHead>
                            <TableHead className="h-11 px-5 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                                Created By
                            </TableHead>
                            <TableHead className="h-11 px-5 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                                Status
                            </TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {records.length > 0 ? (
                            records.map((row) => (
                                <TableRow
                                    key={row.id}
                                    className="group border-slate-100 transition-colors hover:bg-slate-50/60"
                                >
                                    <TableCell className="px-5 py-3.5">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-semibold text-slate-900">
                                                {row.financialYear}
                                            </span>
                                            <span className="mt-0.5 text-xs text-slate-400">
                                                ID #{row.id}
                                            </span>
                                        </div>
                                    </TableCell>

                                    <TableCell className="px-5 py-3.5">
                                        <Badge
                                            variant="outline"
                                            className="rounded-lg border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700"
                                        >
                                            {formatPercent(row.rate)}
                                        </Badge>
                                    </TableCell>

                                    <TableCell className="px-5 py-3.5">
                                        <span className="text-sm font-bold tabular-nums text-slate-900">
                                            {formatCurrency(row.totalPayout)}
                                        </span>
                                    </TableCell>

                                    <TableCell className="px-5 py-3.5">
                                        <span className="text-sm text-slate-600">
                                            {formatDate(row.declaredDate)}
                                        </span>
                                    </TableCell>

                                    <TableCell className="px-5 py-3.5">
                                        <div className="flex items-center gap-2">
                                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold uppercase text-slate-600">
                                                {row.createdBy?.charAt(0) ?? '?'}
                                            </div>
                                            <span className="text-sm text-slate-700">
                                                {row.createdBy || '-'}
                                            </span>
                                        </div>
                                    </TableCell>

                                    <TableCell className="px-5 py-3.5">
                                        <Badge className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold capitalize text-emerald-700 hover:bg-emerald-50">
                                            <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                            {row.status}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} className="px-5 py-16 text-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <Wallet className="h-8 w-8 text-slate-300" />
                                        <p className="text-sm font-medium text-slate-500">No dividend records found.</p>
                                        <p className="text-xs text-slate-400">Try adjusting your filters.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                <DialogContent className="overflow-hidden rounded-2xl p-0 shadow-xl sm:max-w-4xl">
                    <div className="bg-white px-6 py-5">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <DialogHeader className="space-y-1">
                                <DialogTitle className="text-xl font-bold text-slate-900">
                                    Distribution Preview
                                </DialogTitle>
                                <DialogDescription className="flex items-center gap-2 text-sm text-slate-500">
                                    <CalendarDays className="h-3.5 w-3.5" />
                                    FY: <span className="font-semibold text-slate-700">{selectedFinancialYear}</span>
                                    <span className="text-slate-300">|</span>
                                    <TrendingUp className="h-3.5 w-3.5" />
                                    Rate: <span className="font-semibold text-slate-700">{formatPercent(selectedDividendRate)}</span>
                                </DialogDescription>
                            </DialogHeader>

                            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 mx-10 py-1 text-right">
                                <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">
                                    Total Payout
                                </div>
                                <div className="text-xl font-extrabold tabular-nums text-emerald-700">
                                    {formatCurrency(previewTotalPayout)}
                                </div>
                            </div>
                        </div>
                    </div>

                    {saveError ? (
                        <div className="px-6 pt-2">
                            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                                {saveError}
                            </div>
                        </div>
                    ) : null}

                    <div className="max-h-100 overflow-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                                    <TableHead className="h-10 px-6 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                                        Member Name / ID
                                    </TableHead>
                                    <TableHead className="h-10 px-6 text-right text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                                        Share Capital
                                    </TableHead>
                                    <TableHead className="h-10 px-6 text-right text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                                        Dividend
                                    </TableHead>
                                    <TableHead className="h-10 px-6 text-center text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                                        Status
                                    </TableHead>
                                </TableRow>
                            </TableHeader>

                            <TableBody>
                                {previewRows.length > 0 ? (
                                    previewRows.map((row) => (
                                        <TableRow key={row.id} className="border-slate-100 transition-colors hover:bg-slate-50/60">
                                            <TableCell className="px-6 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-bold uppercase text-slate-600">
                                                        {row.memberName?.charAt(0) ?? '?'}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-semibold text-slate-900">
                                                            {row.memberName}
                                                        </span>
                                                        <span className="text-xs text-slate-400">{row.memberId}</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-6 py-3 text-right text-sm font-semibold tabular-nums text-slate-700">
                                                {formatCurrency(row.shareCapitalAmount)}
                                            </TableCell>
                                            <TableCell className="px-6 py-3 text-right text-sm font-bold tabular-nums text-emerald-600">
                                                {formatCurrency(row.dividendAmount)}
                                            </TableCell>
                                            <TableCell className="px-6 py-3">
                                                <div className="flex items-center justify-center">
                                                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="px-6 py-12 text-center text-sm text-slate-500">
                                            No member share capital records found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <Separator className="bg-slate-100" />

                    <DialogFooter className="px-6 py-4 sm:justify-end">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setPreviewOpen(false)}
                            className="rounded-xl"
                            disabled={createDividendMutation.isPending}
                        >
                            Close
                        </Button>
                        <Button
                            type="button"
                            onClick={handleConfirmDeclaration}
                            className="rounded-xl"
                            disabled={createDividendMutation.isPending}
                        >
                            {createDividendMutation.isPending ? 'Saving...' : 'Confirm Declaration'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}