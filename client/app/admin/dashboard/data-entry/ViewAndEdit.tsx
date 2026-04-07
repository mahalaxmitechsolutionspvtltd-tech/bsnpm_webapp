'use client'

import * as React from 'react'
import { format } from 'date-fns'
import {
    CalendarIcon,
    Download,
    Loader2,
    Pencil,
    Save,
    X,
} from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import jsPDF from 'jspdf'

import { DataEntry, DataEntryFormData } from '@/types/dataEntryTypes'
import { updateDataEntryHandler } from '@/services/dataEntryHandler'

import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import SearchableSelect from '@/components/ui/searchable-select'
import { formatApiDate } from '@/lib/formateApiDate'

const INCOME_HEADS = [
    'Bank Interest Collection',
    'Interest on Investment / Deposit',
    'Anamat Income',
    'Entrance Fee',
    'Donation',
    'Grant',
]

const EXPENSE_HEADS = [
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

type ViewAndEditProps = {
    data: DataEntry
    open: boolean
    onOpenChange: (open: boolean) => void
}

type VoucherAccent = {
    header: string
    soft: string
    amountText: string
    pdfHeader: readonly [number, number, number]
    pdfSoft: readonly [number, number, number]
    pdfSoftBorder: readonly [number, number, number]
    pdfAmount: readonly [number, number, number]
}

const getSafeString = (value: unknown) => String(value ?? '').trim()

const getInitialForm = (data: DataEntry): DataEntryFormData => ({
    entry_type: getSafeString(data.entry_type) || 'income',
    date: getSafeString(data.date),
    category: getSafeString(data.category),
    payment_mode: getSafeString(data.payment_mode) || 'online',
    amount:
        data.amount === null || data.amount === undefined || data.amount === ''
            ? ''
            : String(data.amount),
    reference: getSafeString(data.reference),
    description: getSafeString(data.description),
})

const formatCurrency = (value: unknown) => {
    const amount = Number(value ?? 0)
    if (Number.isNaN(amount)) return '0.00'

    return amount.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })
}

const formatCurrencyPdf = (value: unknown) => {
    const amount = Number(value ?? 0)
    if (Number.isNaN(amount)) return '0.00'
    return amount.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })
}

const getVoucherAccent = (entryType: string): VoucherAccent => {
    return entryType.toLowerCase() === 'income'
        ? {
            header: 'from-emerald-600 via-emerald-500 to-teal-500',
            soft: 'bg-emerald-50',
            amountText: 'text-emerald-700',
            pdfHeader: [5, 150, 105],
            pdfSoft: [236, 253, 245],
            pdfSoftBorder: [167, 243, 208],
            pdfAmount: [4, 120, 87],
        }
        : {
            header: 'from-rose-600 via-pink-600 to-rose-500',
            soft: 'bg-rose-50',
            amountText: 'text-rose-700',
            pdfHeader: [225, 29, 72],
            pdfSoft: [255, 241, 242],
            pdfSoftBorder: [254, 205, 211],
            pdfAmount: [190, 24, 93],
        }
}

const wrapText = (doc: jsPDF, text: string, maxWidth: number) => {
    return doc.splitTextToSize(String(text || '-'), maxWidth)
}

function EditEntryDialog({
    data,
    open,
    onOpenChange,
}: {
    data: DataEntry
    open: boolean
    onOpenChange: (open: boolean) => void
}) {
    const queryClient = useQueryClient()
    const [datePopoverOpen, setDatePopoverOpen] = React.useState(false)
    const [form, setForm] = React.useState<DataEntryFormData>(getInitialForm(data))

    React.useEffect(() => {
        if (open) {
            setForm(getInitialForm(data))
            setDatePopoverOpen(false)
        }
    }, [open, data])

    const mutation = useMutation({
        mutationFn: (payload: DataEntryFormData) => updateDataEntryHandler(data.id, payload),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['data-entry'] })
            onOpenChange(false)
        },
    })

    const handleChange = (
        field: keyof DataEntryFormData,
        value: string | number | boolean | null
    ) => {
        setForm((prev) => ({
            ...prev,
            [field]: value,
        }))
    }

    const handleEntryTypeChange = (value: string) => {
        setForm((prev) => ({
            ...prev,
            entry_type: value,
            category: '',
        }))
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        const payload: DataEntryFormData = {
            entry_type: String(form.entry_type || '').trim(),
            date: form.date ? String(form.date) : null,
            category: form.category ? String(form.category).trim() : null,
            payment_mode: form.payment_mode ? String(form.payment_mode).trim() : null,
            amount:
                form.amount === '' || form.amount === null || form.amount === undefined
                    ? null
                    : Number(form.amount),
            reference: form.reference ? String(form.reference).trim() : null,
            description: form.description ? String(form.description).trim() : null,
        }

        await mutation.mutateAsync(payload)
    }

    const selectedType = String(form.entry_type || '').toLowerCase()
    const headOptions = selectedType === 'expense' ? EXPENSE_HEADS : INCOME_HEADS

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className='max-w-[94vw] gap-0 overflow-hidden rounded-2xl border border-slate-200 bg-white p-0 shadow-2xl sm:max-w-2xl'>
                <DialogHeader className='border-b border-slate-100 px-5 py-4 text-left'>
                    <div className='flex items-start justify-between gap-4'>
                        <div>
                            <DialogTitle className='text-[18px] font-bold text-slate-900'>
                                Edit Voucher Entry
                            </DialogTitle>
                            <DialogDescription className='mt-1 text-[13px] text-slate-500'>
                                Update voucher details
                            </DialogDescription>
                        </div>

                        <DialogClose asChild>
                            <button
                                type='button'
                                className='flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700'
                            >
                                <X className='h-4 w-4' />
                            </button>
                        </DialogClose>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className='max-h-[78vh] overflow-y-auto px-5 py-4'>
                    <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                        <div className='space-y-1.5 md:col-span-2'>
                            <Label className='text-[11px] font-bold uppercase tracking-wider text-slate-500'>
                                Entry Type
                            </Label>
                            <Select
                                value={String(form.entry_type || '')}
                                onValueChange={handleEntryTypeChange}
                                disabled={mutation.isPending}
                            >
                                <SelectTrigger className='h-10 w-full rounded-xl border-slate-200 bg-slate-50/40 px-3 text-[13px] text-slate-700 shadow-none'>
                                    <SelectValue placeholder='Select type' />
                                </SelectTrigger>
                                <SelectContent className='rounded-xl border-slate-200 shadow-xl'>
                                    <SelectItem value='income'>Income (Credit)</SelectItem>
                                    <SelectItem value='expense'>Expense (Debit)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className='space-y-1.5'>
                            <Label className='text-[11px] font-bold uppercase tracking-wider text-slate-500'>
                                Date
                            </Label>

                            <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        type='button'
                                        variant='outline'
                                        disabled={mutation.isPending}
                                        className='w-full justify-between rounded-xl border-slate-200 bg-slate-50/40 px-3 text-left text-[13px] font-normal text-slate-700 shadow-none'
                                    >
                                        {form.date
                                            ? format(new Date(form.date), 'dd-MM-yyyy')
                                            : 'Select date'}
                                        <CalendarIcon className='h-4 w-4 text-slate-500' />
                                    </Button>
                                </PopoverTrigger>

                                <PopoverContent
                                    align='start'
                                    className='w-auto rounded-xl border border-slate-200 p-0 shadow-lg'
                                >
                                    <Calendar
                                        mode='single'
                                        selected={form.date ? new Date(form.date) : undefined}
                                        onSelect={(date) => {
                                            handleChange(
                                                'date',
                                                date ? format(date, 'yyyy-MM-dd') : ''
                                            )
                                            if (date) {
                                                setDatePopoverOpen(false)
                                            }
                                        }}
                                        initialFocus
                                        captionLayout='dropdown'
                                        fromYear={2000}
                                        toYear={2100}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        <SearchableSelect
                            label='Head / Category'
                            value={String(form.category || '')}
                            onChange={(value) => handleChange('category', value)}
                            options={headOptions.map((item) => ({
                                value: item,
                                label: item,
                            }))}
                            placeholder='Select category'
                            searchPlaceholder='Search category...'
                            emptyText='No category found.'
                            disabled={mutation.isPending}
                        />

                        <div className='space-y-1.5 md:col-span-2'>
                            <Label className='text-[11px] font-bold uppercase tracking-wider text-slate-500'>
                                Payment Mode
                            </Label>
                            <Select
                                value={String(form.payment_mode || '')}
                                onValueChange={(value) => handleChange('payment_mode', value)}
                                disabled={mutation.isPending}
                            >
                                <SelectTrigger className='h-10 w-full rounded-xl border-slate-200 bg-slate-50/40 px-3 text-[13px] text-slate-700 shadow-none'>
                                    <SelectValue placeholder='Select mode' />
                                </SelectTrigger>
                                <SelectContent className='rounded-xl border-slate-200 shadow-xl'>
                                    <SelectItem value='cash'>Cash</SelectItem>
                                    <SelectItem value='online'>Online</SelectItem>
                                    <SelectItem value='cheque'>Cheque</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className='space-y-1.5'>
                            <Label className='text-[11px] font-bold uppercase tracking-wider text-slate-500'>
                                Amount (₹)
                            </Label>
                            <Input
                                type='number'
                                step='0.01'
                                value={String(form.amount || '')}
                                onChange={(e) => handleChange('amount', e.target.value)}
                                placeholder='0.00'
                                disabled={mutation.isPending}
                                className='h-10 rounded-xl border-slate-200 bg-slate-50/40 px-3 text-[13px] font-medium text-slate-800 shadow-none'
                            />
                        </div>

                        <div className='space-y-1.5'>
                            <Label className='text-[11px] font-bold uppercase tracking-wider text-slate-500'>
                                Reference
                            </Label>
                            <Input
                                value={String(form.reference || '')}
                                onChange={(e) => handleChange('reference', e.target.value)}
                                placeholder='Cheque / Txn ID'
                                disabled={mutation.isPending}
                                className='h-10 rounded-xl border-slate-200 bg-slate-50/40 px-3 text-[13px] text-slate-700 shadow-none'
                            />
                        </div>

                        <div className='space-y-1.5 md:col-span-2'>
                            <Label className='text-[11px] font-bold uppercase tracking-wider text-slate-500'>
                                Description
                            </Label>
                            <Textarea
                                value={String(form.description || '')}
                                onChange={(e) => handleChange('description', e.target.value)}
                                placeholder='Write extra details here...'
                                maxLength={500}
                                disabled={mutation.isPending}
                                className='min-h-24 resize-none rounded-xl border-slate-200 bg-slate-50/40 px-3 py-2.5 text-[13px] text-slate-700 shadow-none'
                            />
                        </div>
                    </div>

                    {mutation.isError && (
                        <div className='mt-4 rounded-xl border border-rose-100 bg-rose-50/50 px-4 py-3 text-[12px] font-medium text-rose-600'>
                            {(mutation.error as Error)?.message || 'Something went wrong!'}
                        </div>
                    )}

                    <div className='mt-5 flex items-center justify-end gap-3'>
                        <Button
                            type='button'
                            variant='outline'
                            onClick={() => onOpenChange(false)}
                            disabled={mutation.isPending}
                            className='h-10 rounded-xl px-5 text-[13px] font-semibold'
                        >
                            Close
                        </Button>

                        <Button
                            type='submit'
                            disabled={
                                mutation.isPending ||
                                !String(form.entry_type || '').trim() ||
                                !String(form.category || '').trim() ||
                                !form.amount
                            }
                            className='h-10 rounded-xl bg-[#0b2d5c] px-6 text-[13px] font-semibold text-white hover:bg-[#0a2851]'
                        >
                            {mutation.isPending ? (
                                <>
                                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                                    Updating...
                                </>
                            ) : (
                                <>
                                    <Save className='mr-2 h-4 w-4' />
                                    Update Entry
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}

export default function ViewAndEdit({ data, open, onOpenChange }: ViewAndEditProps) {
    const [editOpen, setEditOpen] = React.useState(false)
    const [isDownloadingPdf, setIsDownloadingPdf] = React.useState(false)

    React.useEffect(() => {
        if (!open) {
            setEditOpen(false)
        }
    }, [open])

    const entryType = String(data.entry_type || '').toLowerCase()
    const accent = getVoucherAccent(entryType)
    const voucherNo = String((data as DataEntry & { voucher_no?: string | null }).voucher_no ?? '-')

    const handleDownloadPdf = async () => {
        try {
            setIsDownloadingPdf(true)

            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4',
            })

            const pageWidth = doc.internal.pageSize.getWidth()
            const pageHeight = doc.internal.pageSize.getHeight()

            const outerX = 34
            const outerWidth = pageWidth - outerX * 2
            const topY = 36
            const paddingX = 10

            const rows = [
                { label: 'HEAD', value: String(data.category || '-') },
                { label: 'PAYMENT MODE', value: String(data.payment_mode || '-') },
                { label: 'DETAILS', value: String(data.description || '-') },
                { label: 'REFERENCE', value: String(data.reference || 'N/A') },
                {
                    label: 'CREATED BY',
                    value: String((data as DataEntry & { created_by?: string | null }).created_by ?? 'System'),
                },
            ]

            const contentLeftX = outerX + paddingX
            const labelWidth = 28
            const valueX = contentLeftX + labelWidth + 8
            const valueWidth = outerWidth - (paddingX * 2) - labelWidth - 8

            const measuredRows = rows.map((row) => {
                doc.setFont('helvetica', 'normal')
                doc.setFontSize(12)
                const lines = wrapText(doc, row.value, valueWidth)
                const valueHeight = Math.max(6, lines.length * 5)
                const rowHeight = Math.max(14, valueHeight + 6)

                return {
                    ...row,
                    lines,
                    rowHeight,
                }
            })

            const contentHeight = measuredRows.reduce((sum, row) => sum + row.rowHeight, 0)
            const cardHeight = 26 + 18 + contentHeight + 16
            const footerY = topY + cardHeight + 14

            doc.setFillColor(243, 244, 246)
            doc.rect(0, 0, pageWidth, pageHeight, 'F')

            doc.setFillColor(255, 255, 255)
            doc.setDrawColor(226, 232, 240)
            doc.roundedRect(outerX, topY, outerWidth, cardHeight, 5, 5, 'FD')

            doc.setFillColor(accent.pdfHeader[0], accent.pdfHeader[1], accent.pdfHeader[2])
            doc.roundedRect(outerX, topY, outerWidth, 26, 5, 5, 'F')
            doc.rect(outerX, topY + 21, outerWidth, 5, 'F')

            doc.setTextColor(255, 255, 255)
            doc.setFont('helvetica', 'bold')
            doc.setFontSize(8.5)
            doc.text('PAYMENT VOUCHER', outerX + 8, topY + 7)

            doc.setFontSize(18)
            doc.text(voucherNo, outerX + 8, topY + 17)

            doc.setFontSize(8.5)
            doc.text('Date', outerX + outerWidth - 8, topY + 7, { align: 'right' })

            doc.setFontSize(12.5)
            doc.text(formatApiDate(data.date), outerX + outerWidth - 8, topY + 17, {
                align: 'right',
            })

            doc.setFillColor(accent.pdfSoft[0], accent.pdfSoft[1], accent.pdfSoft[2])
            doc.setDrawColor(accent.pdfSoftBorder[0], accent.pdfSoftBorder[1], accent.pdfSoftBorder[2])
            doc.rect(outerX, topY + 26, outerWidth, 18, 'FD')

            doc.setFont('helvetica', 'bold')
            doc.setFontSize(10)
            doc.setTextColor(100, 116, 139)
            doc.text(String(entryType || '-').toUpperCase(), outerX + 8, topY + 36)

            doc.setTextColor(accent.pdfAmount[0], accent.pdfAmount[1], accent.pdfAmount[2])
            doc.setFontSize(18)
            doc.text(`Rs. ${formatCurrencyPdf(data.amount)}`, outerX + outerWidth - 8, topY + 36, {
                align: 'right',
            })

            let currentY = topY + 44

            measuredRows.forEach((row, index) => {
                if (index > 0) {
                    doc.setDrawColor(226, 232, 240)
                    doc.setLineDashPattern([1.2, 1.2], 0)
                    doc.line(contentLeftX, currentY, outerX + outerWidth - paddingX, currentY)
                    doc.setLineDashPattern([], 0)
                }

                const textY = currentY + 8

                doc.setFont('helvetica', 'bold')
                doc.setFontSize(9)
                doc.setTextColor(148, 163, 184)
                doc.text(row.label, contentLeftX, textY)

                doc.setFont('helvetica', row.label === 'HEAD' ? 'bold' : 'normal')
                doc.setFontSize(row.label === 'HEAD' ? 12.5 : 11.5)
                doc.setTextColor(51, 65, 85)
                doc.text(row.lines, valueX, textY)

                currentY += row.rowHeight
            })

            doc.setFont('helvetica', 'bold')
            doc.setFontSize(10)
            doc.setTextColor(5, 150, 105)
            doc.text('Voucher ready.', outerX, footerY)

            const fileName = `${voucherNo || 'voucher'}.pdf`
            doc.save(fileName)
        } finally {
            setIsDownloadingPdf(false)
        }
    }

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className='max-w-[94vw] gap-0 overflow-hidden rounded-2xl border border-slate-200 bg-white p-0 sm:max-w-xl'>
                    <DialogHeader className='border-b border-slate-200 px-5 py-4 text-left'>
                        <div className='flex items-start justify-between gap-4'>
                            <div>
                                <DialogTitle className='text-[17px] font-bold text-slate-900'>
                                    Voucher Preview
                                </DialogTitle>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className='bg-slate-50 px-4 py-4'>
                        <div className='mx-auto w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm'>
                            <div className={`bg-linear-to-r ${accent.header} px-5 py-4 text-white`}>
                                <div className='flex items-start justify-between gap-4'>
                                    <div className='min-w-0'>
                                        <div className='text-[10px] font-bold uppercase tracking-[0.14em] text-white/85'>
                                            Payment Voucher
                                        </div>
                                        <div className='mt-1 truncate text-[18px] font-extrabold tracking-wide'>
                                            {voucherNo}
                                        </div>
                                    </div>

                                    <div className='shrink-0 text-right'>
                                        <div className='text-[11px] font-semibold text-white/80'>Date</div>
                                        <div className='mt-1 text-[14px] font-bold'>
                                            {formatApiDate(data.date)}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className={`${accent.soft} border-b px-5 py-4`}>
                                <div className='flex items-center justify-between gap-4'>
                                    <div>
                                        <div className='text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500'>
                                            {entryType}
                                        </div>
                                    </div>

                                    <div className={`text-[18px] font-extrabold sm:text-[20px] ${accent.amountText}`}>
                                        ₹ {formatCurrency(data.amount)}
                                    </div>
                                </div>
                            </div>

                            <div className='px-5 py-3'>
                                <div className='space-y-0'>
                                    <div className='grid grid-cols-[110px_1fr] gap-3 border-b border-dashed border-slate-200 py-3'>
                                        <div className='text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400'>
                                            Head
                                        </div>
                                        <div className='text-[14px] font-semibold text-slate-800'>
                                            {String(data.category || '-')}
                                        </div>
                                    </div>

                                    <div className='grid grid-cols-[110px_1fr] gap-3 border-b border-dashed border-slate-200 py-3'>
                                        <div className='text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400'>
                                            Payment Mode
                                        </div>
                                        <div className='text-[14px] font-semibold text-slate-700'>
                                            {String(data.payment_mode || '-')}
                                        </div>
                                    </div>

                                    <div className='grid grid-cols-[110px_1fr] gap-3 border-b border-dashed border-slate-200 py-3'>
                                        <div className='text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400'>
                                            Details
                                        </div>
                                        <div className='text-[14px] font-medium text-slate-700'>
                                            {String(data.description || '-')}
                                        </div>
                                    </div>

                                    <div className='grid grid-cols-[110px_1fr] gap-3 border-b border-dashed border-slate-200 py-3'>
                                        <div className='text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400'>
                                            Reference
                                        </div>
                                        <div className='text-[14px] font-medium text-slate-700'>
                                            {String(data.reference || 'N/A')}
                                        </div>
                                    </div>

                                    <div className='grid grid-cols-[110px_1fr] gap-3 py-3'>
                                        <div className='text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400'>
                                            Created By
                                        </div>
                                        <div className='text-[14px] font-medium text-slate-700'>
                                            {String((data as DataEntry & { created_by?: string | null }).created_by ?? 'System')}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className='px-4 py-3'>


                        <Button
                            size='sm'
                            type='button'
                            variant='outline'
                            onClick={() => onOpenChange(false)}
                            className='rounded-lg px-4 text-[13px] font-semibold'
                        >
                            Close
                        </Button>

                        <Button
                            size='sm'
                            type='button'
                            variant='outline'
                            onClick={() => setEditOpen(true)}
                            className='rounded-lg px-4 text-[13px] font-semibold'
                        >
                            <Pencil className='mr-2 h-4 w-4' />
                            Edit Entry
                        </Button>

                        <Button
                            size='sm'
                            type='button'
                            onClick={handleDownloadPdf}
                            disabled={isDownloadingPdf}
                            className='rounded-lg bg-[#0b2d5c] px-5 text-[13px] font-semibold text-white hover:bg-[#0a2851]'
                        >
                            {isDownloadingPdf ? (
                                <>
                                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                                    Downloading...
                                </>
                            ) : (
                                <>
                                    <Download className='mr-2 h-4 w-4' />
                                    Download PDF
                                </>
                            )}
                        </Button>

                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <EditEntryDialog
                data={data}
                open={editOpen}
                onOpenChange={setEditOpen}
            />
        </>
    )
}