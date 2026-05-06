'use client'

import * as React from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { formatDateDDMMYYYY } from '@/lib/formateDate'

export type EMIScheduleItem = {
    'emi date': string
    'emi amount': number
    'principal amount': number
    'interest amount': number
    'outstanding balance': number
    status: string
}

export type LoanEmi = {
    id: number
    application_no: string
    member_id: string
    member_name: string
    loan_amount: number | string | null
    start_date: string | null
    end_date: string | null
    emi_schedule: EMIScheduleItem[]
    created_by: string | null
    created_at: string | null
}

type ViewProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    data: LoanEmi | null
}

const ROWS_PER_PAGE = 10

const formatCurrency = (value: unknown) => {
    const amount =
        typeof value === 'number'
            ? value
            : typeof value === 'string'
                ? Number(value)
                : 0

    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(Number.isFinite(amount) ? amount : 0)
}

const getStatusClass = (status?: string | null) => {
    const value = String(status ?? '').toLowerCase()

    if (value === 'paid') {
        return 'border-emerald-200 bg-emerald-50 text-emerald-700'
    }

    if (value === 'pending') {
        return 'border-amber-200 bg-amber-50 text-amber-700'
    }

    if (value === 'partial') {
        return 'border-blue-200 bg-blue-50 text-blue-700'
    }

    if (value === 'overdue') {
        return 'border-red-200 bg-red-50 text-red-700'
    }

    return 'border-border bg-muted text-foreground'
}

export default function View({ open, onOpenChange, data }: ViewProps) {
    const [currentPage, setCurrentPage] = React.useState(1)

    React.useEffect(() => {
        if (open) {
            setCurrentPage(1)
        }
    }, [open, data])

    if (!data) return null

    const emiSchedule = Array.isArray(data.emi_schedule) ? data.emi_schedule : []
    const startDate = formatDateDDMMYYYY(data.start_date)
    const endDate = formatDateDDMMYYYY(data.end_date)

    const totalPages = Math.max(1, Math.ceil(emiSchedule.length / ROWS_PER_PAGE))
    const safeCurrentPage = Math.min(currentPage, totalPages)
    const startIndex = (safeCurrentPage - 1) * ROWS_PER_PAGE
    const endIndex = startIndex + ROWS_PER_PAGE
    const paginatedEmiSchedule = emiSchedule.slice(startIndex, endIndex)

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto rounded-xl border bg-background p-0 shadow-2xl sm:max-w-6xl">
                <DialogHeader className="border-b px-5 py-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div className="my-auto min-w-0">
                            <DialogTitle className="truncate text-base font-semibold">
                                {data.application_no}
                            </DialogTitle>
                            <p className="text-lg font-bold text-primary">
                                {data.member_name}
                            </p>
                        </div>

                        <Badge variant="outline" className="my-auto mx-20 h-7 rounded-xl">
                            Total EMI: {emiSchedule.length}
                        </Badge>
                    </div>
                </DialogHeader>

                <div className="space-y-4 px-5 py-4">
                    <div className="grid grid-cols-12 gap-3">
                        <div className="col-span-2 w-44 rounded-xl border bg-background px-3 py-2">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                                Application Number
                            </p>
                            <div className="mt-1 wrap-break-word text-xs font-medium text-foreground">
                                {data.application_no}
                            </div>
                        </div>

                        <div className="col-span-2 w-44 rounded-xl border bg-background px-3 py-2">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                                Member ID
                            </p>
                            <div className="mt-1 wrap-break-word text-xs font-medium text-foreground">
                                {data.member_id}
                            </div>
                        </div>

                        <div className="col-span-2 w-44 rounded-xl border bg-background px-3 py-2">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                                Member Name
                            </p>
                            <div className="mt-1 wrap-break-word text-xs font-medium text-foreground">
                                {data.member_name}
                            </div>
                        </div>

                        <div className="col-span-2 w-44 rounded-xl border bg-background px-3 py-2">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                                Loan Amount
                            </p>
                            <div className="mt-1 wrap-break-word text-xs font-medium text-foreground">
                                {formatCurrency(data.loan_amount)}
                            </div>
                        </div>

                        <div className="col-span-2 w-44 rounded-xl border bg-background px-3 py-2">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                                Start Date
                            </p>
                            <div className="mt-1 wrap-break-word text-xs font-medium text-foreground">
                                {startDate}
                            </div>
                        </div>

                        <div className="col-span-2 w-44 rounded-xl border bg-background px-3 py-2">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                                End Date
                            </p>
                            <div className="mt-1 wrap-break-word text-xs font-medium text-foreground">
                                {endDate}
                            </div>
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-xl border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>EMI Date</TableHead>
                                    <TableHead>EMI Amount</TableHead>
                                    <TableHead>Principal Amount</TableHead>
                                    <TableHead>Interest Amount</TableHead>
                                    <TableHead>Outstanding Balance</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>

                            <TableBody>
                                {paginatedEmiSchedule.length > 0 ? (
                                    paginatedEmiSchedule.map((item, index) => (
                                        <TableRow key={`${item['emi date']}-${startIndex + index}`}>
                                            <TableCell>{item['emi date']}</TableCell>
                                            <TableCell>{formatCurrency(item['emi amount'])}</TableCell>
                                            <TableCell>{formatCurrency(item['principal amount'])}</TableCell>
                                            <TableCell>{formatCurrency(item['interest amount'])}</TableCell>
                                            <TableCell>{formatCurrency(item['outstanding balance'])}</TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className={`rounded-xl capitalize ${getStatusClass(item.status)}`}
                                                >
                                                    {item.status}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">
                                            No EMI schedule found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {emiSchedule.length > ROWS_PER_PAGE && (
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="text-sm text-muted-foreground">
                                Showing {startIndex + 1} to {Math.min(endIndex, emiSchedule.length)} of{' '}
                                {emiSchedule.length} EMI
                            </div>

                            <div className="flex flex-wrap items-center justify-end gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="rounded-xl"
                                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                    disabled={safeCurrentPage === 1}
                                >
                                    Prev
                                </Button>

                                {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                                    <Button
                                        key={page}
                                        type="button"
                                        size="sm"
                                        variant={safeCurrentPage === page ? 'default' : 'outline'}
                                        className="min-w-9 rounded-xl"
                                        onClick={() => setCurrentPage(page)}
                                    >
                                        {page}
                                    </Button>
                                ))}

                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="rounded-xl"
                                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                                    disabled={safeCurrentPage === totalPages}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end">
                        <Button
                            type="button"
                            variant="outline"
                            className="rounded-xl"
                            onClick={() => onOpenChange(false)}
                        >
                            Close
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}