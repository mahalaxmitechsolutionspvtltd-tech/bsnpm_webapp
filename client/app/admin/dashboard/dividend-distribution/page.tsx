'use client'

import React from 'react'
import {
    PlusSquare,
    History,
    RefreshCw,
    Download,
    Pencil,
    Trash2,
    Eye,
    Sparkles,
    FileSpreadsheet,
    ArrowUpRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
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

type DividendRecord = {
    id: string
    financialYear: string
    rate: number
    totalPayout: number
    declaredDate: string
    status: 'draft' | 'declared'
}

const financialYearOptions = [
    '2023-2024',
    '2024-2025',
    '2025-2026',
    '2026-2027',
    '2027-2028',
    '2028-2029',
]

const initialRecords: DividendRecord[] = [
    {
        id: 'DIV-2026-001',
        financialYear: '2026-2027',
        rate: 20,
        totalPayout: 239800,
        declaredDate: '2026-04-12',
        status: 'declared',
    },
    {
        id: 'DIV-2024-001',
        financialYear: '2024-2025',
        rate: 20,
        totalPayout: 100,
        declaredDate: '2026-02-13',
        status: 'declared',
    },
]

const shareCapitalByYear: Record<string, number> = {
    '2023-2024': 950000,
    '2024-2025': 500,
    '2025-2026': 840000,
    '2026-2027': 1199000,
    '2027-2028': 1320000,
    '2028-2029': 1450000,
}

const formatCurrency = (value: number) =>
    `₹ ${new Intl.NumberFormat('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value)}`

const formatPercent = (value: number) => `${value.toFixed(2)}%`

const formatDate = (value: string) => value

export default function Page() {
    const currentYear = new Date().getFullYear()
    const currentFinancialYear = `${currentYear}-${currentYear + 1}`

    const [selectedYear, setSelectedYear] = React.useState('')
    const [rate, setRate] = React.useState('')
    const [records, setRecords] = React.useState<DividendRecord[]>(initialRecords)
    const [previewOpen, setPreviewOpen] = React.useState(false)
    const [editingRecord, setEditingRecord] = React.useState<DividendRecord | null>(null)

    const numericRate = Number(rate)
    const isRateValid = Number.isFinite(numericRate) && numericRate > 0
    const selectedShareCapital = selectedYear ? shareCapitalByYear[selectedYear] ?? 0 : 0
    const previewPayout = selectedYear && isRateValid ? (selectedShareCapital * numericRate) / 100 : 0

    const resetForm = () => {
        setSelectedYear('')
        setRate('')
        setEditingRecord(null)
        setPreviewOpen(false)
    }

    const handlePreview = () => {
        if (!selectedYear || !isRateValid) return
        setPreviewOpen(true)
    }

    const handleSaveDeclaration = () => {
        if (!selectedYear || !isRateValid) return

        const newRecord: DividendRecord = {
            id: editingRecord?.id ?? `DIV-${selectedYear.split('-')[0]}-${String(records.length + 1).padStart(3, '0')}`,
            financialYear: selectedYear,
            rate: numericRate,
            totalPayout: previewPayout,
            declaredDate: new Date().toISOString().slice(0, 10),
            status: 'declared',
        }

        setRecords((prev) => {
            if (editingRecord) {
                return prev.map((item) => (item.id === editingRecord.id ? newRecord : item))
            }
            return [newRecord, ...prev]
        })

        resetForm()
    }

    const handleEdit = (record: DividendRecord) => {
        setEditingRecord(record)
        setSelectedYear(record.financialYear)
        setRate(String(record.rate))
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const handleDelete = (id: string) => {
        setRecords((prev) => prev.filter((item) => item.id !== id))
        if (editingRecord?.id === id) {
            resetForm()
        }
    }

    const handleRefresh = () => {
        setRecords([...records])
    }

    const handleExportCsv = () => {
        const headers = ['Financial Year', 'Rate (%)', 'Total Payout', 'Declared Date', 'Status']
        const rows = records.map((item) => [
            item.financialYear,
            item.rate.toFixed(2),
            item.totalPayout.toFixed(2),
            item.declaredDate,
            item.status,
        ])

        const csvContent = [headers, ...rows]
            .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
            .join('\n')

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = 'dividend-distribution-records.csv'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
    }

    return (
        <div className="w-full space-y-5 bg-gradient-to-b from-slate-50 via-white to-slate-50 p-4 md:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                <Button
                    type="button"
                    onClick={handleExportCsv}
                    className="h-10 rounded-xl bg-emerald-600 px-4 text-white shadow-sm hover:bg-emerald-700"
                >
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Export CSV
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    onClick={handleRefresh}
                    className="h-10 rounded-xl border-slate-200 bg-white px-4"
                >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh
                </Button>
            </div>

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
                <Card className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
                    <CardHeader className="border-b border-slate-200 bg-slate-50/70 px-5 py-4">
                        <CardTitle className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.16em] text-slate-900">
                            <PlusSquare className="h-4 w-4" />
                            {editingRecord ? 'Edit Declaration' : 'New Declaration'}
                        </CardTitle>
                        <CardDescription className="text-xs text-slate-500">
                            Configure year and rate, then preview the payout before declaration.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-5 px-5 py-5">
                        <div className="space-y-2">
                            <label className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-600">
                                Financial Year <span className="text-rose-500">*</span>
                            </label>
                            <Select value={selectedYear} onValueChange={setSelectedYear}>
                                <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-white shadow-none">
                                    <SelectValue placeholder="-- Select Year --" />
                                </SelectTrigger>
                                <SelectContent>
                                    {financialYearOptions.map((year) => (
                                        <SelectItem key={year} value={year}>
                                            {year}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-600">
                                Dividend Rate (%) <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                                <Input
                                    value={rate}
                                    onChange={(e) => setRate(e.target.value)}
                                    placeholder="e.g. 10.5"
                                    inputMode="decimal"
                                    className="h-11 rounded-xl border-slate-200 bg-white pr-12 shadow-none"
                                />
                                <div className="pointer-events-none absolute inset-y-1 right-1 flex w-10 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-600">
                                    %
                                </div>
                            </div>
                        </div>




                        <div className="flex flex-col gap-2">
                            <Button
                                type="button"
                                onClick={handlePreview}
                                disabled={!selectedYear || !isRateValid}
                                size={"sm"}
                                className="h-11 rounded-xl bg-slate-950 text-white hover:bg-slate-900"
                            >
                                <Eye className="mr-2 h-4 w-4" />
                                Preview Declaration
                            </Button>

                            {editingRecord ? (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={resetForm}
                                    className="h-11 rounded-xl border-slate-200"
                                >
                                    Cancel Edit
                                </Button>
                            ) : null}
                        </div>
                    </CardContent>
                </Card>

                <Card className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
                    <CardHeader className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-1">
                            <CardTitle className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.16em] text-slate-900">
                                <History className="h-4 w-4" />
                                Declaration Records
                            </CardTitle>
                            <CardDescription className="text-xs text-slate-500">
                                FY: {currentFinancialYear}
                            </CardDescription>
                        </div>
                        <Badge
                            variant="outline"
                            className="rounded-full border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-600"
                        >
                            {records.length} Records
                        </Badge>
                    </CardHeader>

                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-b border-slate-200 bg-white hover:bg-white">
                                        <TableHead className="h-11 px-5 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
                                            Financial Year
                                        </TableHead>
                                        <TableHead className="h-11 px-5 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
                                            Rate
                                        </TableHead>
                                        <TableHead className="h-11 px-5 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
                                            Total Payout
                                        </TableHead>
                                        <TableHead className="h-11 px-5 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
                                            Declared Date
                                        </TableHead>
                                        <TableHead className="h-11 px-5 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
                                            Status
                                        </TableHead>
                                        <TableHead className="h-11 px-5 text-right text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
                                            Actions
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>

                                <TableBody>
                                    {records.length > 0 ? (
                                        records.map((record) => (
                                            <TableRow
                                                key={record.id}
                                                className="border-b border-slate-200 transition-colors hover:bg-slate-50/70"
                                            >
                                                <TableCell className="px-5 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-semibold text-slate-900">
                                                            {record.financialYear}
                                                        </span>
                                                        <span className="text-xs text-slate-500">
                                                            {record.id}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-5 py-4">
                                                    <Badge
                                                        variant="outline"
                                                        className="rounded-xl border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-700"
                                                    >
                                                        {formatPercent(record.rate)}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="px-5 py-4">
                                                    <div className="text-sm font-bold text-emerald-600">
                                                        {formatCurrency(record.totalPayout)}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-5 py-4 text-sm text-slate-600">
                                                    {formatDate(record.declaredDate)}
                                                </TableCell>
                                                <TableCell className="px-5 py-4">
                                                    <Badge className="rounded-xl bg-emerald-100 px-2.5 py-1 text-emerald-700 hover:bg-emerald-100">
                                                        {record.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="px-5 py-4">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleEdit(record)}
                                                            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDelete(record.id)}
                                                            className="flex h-9 w-9 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-500 transition hover:border-rose-300 hover:text-rose-700"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell
                                                colSpan={6}
                                                className="px-5 py-12 text-center text-sm text-slate-500"
                                            >
                                                No declaration records found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                <DialogContent className="overflow-hidden rounded-3xl border border-slate-200 p-0 shadow-2xl sm:max-w-[640px]">
                    <div className="border-b border-slate-200 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.14),transparent_35%),linear-gradient(135deg,#ffffff_0%,#f8fafc_100%)] px-6 py-5">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold text-slate-900">
                                Dividend Preview
                            </DialogTitle>
                            <DialogDescription className="text-sm text-slate-500">
                                Review the declaration details before saving this dividend entry.
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    <div className="space-y-4 px-6 py-5">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                                    Financial Year
                                </div>
                                <div className="mt-2 text-sm font-semibold text-slate-900">
                                    {selectedYear || '-'}
                                </div>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                                    Dividend Rate
                                </div>
                                <div className="mt-2 text-sm font-semibold text-slate-900">
                                    {isRateValid ? formatPercent(numericRate) : '-'}
                                </div>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                                    Share Capital
                                </div>
                                <div className="mt-2 text-sm font-semibold text-slate-900">
                                    {formatCurrency(selectedShareCapital)}
                                </div>
                            </div>

                            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-600">
                                    Total Payout
                                </div>
                                <div className="mt-2 text-base font-bold text-emerald-700">
                                    {formatCurrency(previewPayout)}
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="border-t border-slate-200 px-6 py-4 sm:justify-end">
                        <Button type="button" variant="outline" onClick={() => setPreviewOpen(false)} className="rounded-xl">
                            Close
                        </Button>
                        <Button type="button" onClick={handleSaveDeclaration} className="rounded-xl">
                            {editingRecord ? 'Update Declaration' : 'Declare Dividend'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}