'use client'

import { useEffect, useState } from 'react'
import { CalendarIcon, Loader2, NotebookPen, X } from 'lucide-react'
import { format } from 'date-fns'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { addDataEntryHandler } from '@/services/dataEntryHandler'
import { DataEntry, DataEntryFormData } from '@/types/dataEntryTypes'

import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
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

const initialForm: DataEntryFormData = {
    entry_type: 'income',
    date: '',
    category: '',
    payment_mode: 'online',
    amount: '',
    reference: '',
    description: '',
}

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

type AddDataEntryDialogProps = {
    onSuccessOpenView?: (data: DataEntry) => void
}

export default function AddDataEntryDialog({
    onSuccessOpenView,
}: AddDataEntryDialogProps) {
    const queryClient = useQueryClient()
    const [open, setOpen] = useState(false)
    const [datePopoverOpen, setDatePopoverOpen] = useState(false)
    const [form, setForm] = useState<DataEntryFormData>(initialForm)

    useEffect(() => {
        if (!open) {
            setDatePopoverOpen(false)
        }
    }, [open])

    const mutation = useMutation({
        mutationFn: addDataEntryHandler,
        onSuccess: async (createdEntry) => {
            await queryClient.invalidateQueries({ queryKey: ['data-entry'] })
            setForm(initialForm)
            setDatePopoverOpen(false)
            setOpen(false)

            if (createdEntry && onSuccessOpenView) {
                onSuccessOpenView(createdEntry)
            }
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
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className='h-10 rounded-xl bg-[#0b2d5c] px-6 text-[13px] font-semibold text-white shadow-sm transition-all hover:bg-[#0a2851]'>
                    <NotebookPen className='mr-2 h-4 w-4' />
                    Add Entry
                </Button>
            </DialogTrigger>

            <DialogContent className='max-w-[95vw] gap-0 overflow-hidden rounded-xl border-none p-0 shadow-2xl md:max-w-180'>
                <DialogHeader className='border-b border-slate-100 px-6 py-4 text-left'>
                    <div className='flex items-start justify-between gap-4'>
                        <div>
                            <DialogTitle className='text-[18px] font-bold text-slate-800'>
                                Add New Data Entry
                            </DialogTitle>
                            <DialogDescription className='mt-1 text-[13px] text-slate-500'>
                                Add income or expense details
                            </DialogDescription>
                        </div>

                        <DialogClose asChild>
                            <button
                                type='button'
                                className='flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-600'
                            >
                                <X className='h-5 w-5' />
                            </button>
                        </DialogClose>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className='px-6 py-5'>
                    <div className='grid grid-cols-1 gap-5 md:grid-cols-2'>
                        <div className='space-y-1.5'>
                            <Label className='ml-1 text-[11px] font-bold uppercase tracking-wider text-slate-500'>
                                Entry Type
                            </Label>
                            <Select
                                value={String(form.entry_type || '')}
                                onValueChange={handleEntryTypeChange}
                            >
                                <SelectTrigger className='h-11 w-full rounded-xl border-slate-200 bg-slate-50/30 px-4 text-[13px] text-slate-700 shadow-none transition-all focus:ring-2 focus:ring-[#0b2d5c]/10'>
                                    <SelectValue placeholder='Select type' />
                                </SelectTrigger>
                                <SelectContent className='rounded-xl border-slate-200 shadow-xl'>
                                    <SelectItem value='income'>Income (Credit)</SelectItem>
                                    <SelectItem value='expense'>Expense (Debit)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className='space-y-1.5'>
                            <Label className='ml-1 text-[11px] font-bold uppercase tracking-wider text-slate-500'>
                                Date
                            </Label>

                            <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        type='button'
                                        variant='outline'
                                        className='w-full justify-between rounded-xl border-slate-200 bg-slate-50/30 px-4 text-left text-[13px] font-normal text-slate-700 shadow-none transition-all hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-[#0b2d5c]/10'
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
                        />

                        <div className='space-y-1.5'>
                            <Label className='ml-1 text-[11px] font-bold uppercase tracking-wider text-slate-500'>
                                Payment Mode
                            </Label>
                            <Select
                                value={String(form.payment_mode || '')}
                                onValueChange={(value) => handleChange('payment_mode', value)}
                            >
                                <SelectTrigger className='h-11 w-full rounded-xl border-slate-200 bg-slate-50/30 px-4 text-[13px] text-slate-700 shadow-none transition-all focus:ring-2 focus:ring-[#0b2d5c]/10'>
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
                            <Label className='ml-1 text-[11px] font-bold uppercase tracking-wider text-slate-500'>
                                Amount (₹)
                            </Label>
                            <Input
                                type='number'
                                step='0.01'
                                value={String(form.amount || '')}
                                onChange={(e) => handleChange('amount', e.target.value)}
                                placeholder='0.00'
                                className='h-11 w-full rounded-xl border-slate-200 bg-slate-50/30 px-4 text-[14px] font-medium text-slate-800 shadow-none transition-all placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-[#0b2d5c]/10'
                            />
                        </div>

                        <div className='space-y-1.5'>
                            <Label className='ml-1 text-[11px] font-bold uppercase tracking-wider text-slate-500'>
                                Reference (Optional)
                            </Label>
                            <Input
                                value={String(form.reference || '')}
                                onChange={(e) => handleChange('reference', e.target.value)}
                                placeholder='Cheque / Txn ID'
                                className='h-11 w-full rounded-xl border-slate-200 bg-slate-50/30 px-4 text-[13px] text-slate-700 shadow-none transition-all placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-[#0b2d5c]/10'
                            />
                        </div>

                        <div className='space-y-1.5 md:col-span-2'>
                            <Label className='ml-1 text-[11px] font-bold uppercase tracking-wider text-slate-500'>
                                Description
                            </Label>
                            <Textarea
                                value={String(form.description || '')}
                                onChange={(e) => handleChange('description', e.target.value)}
                                placeholder='Write extra details here...'
                                maxLength={500}
                                className='min-h-25 w-full resize-none rounded-xl border-slate-200 bg-slate-50/30 px-4 py-3 text-[13px] text-slate-700 shadow-none transition-all placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-[#0b2d5c]/10'
                            />
                            <div className='mt-1 flex justify-end'>
                                <span className='text-[10px] font-medium text-slate-400'>
                                    Max 500 characters
                                </span>
                            </div>
                        </div>
                    </div>

                    {mutation.isError && (
                        <div className='mt-4 rounded-xl border border-rose-100 bg-rose-50/50 px-4 py-3 text-[12px] font-medium text-rose-600'>
                            {(mutation.error as Error)?.message || 'Something went wrong!'}
                        </div>
                    )}

                    <div className='mt-5 flex items-center justify-end gap-3 border-slate-100'>
                        <Button
                            type='button'
                            variant='ghost'
                            onClick={() => setOpen(false)}
                            disabled={mutation.isPending}
                            className='h-11 rounded-xl px-6 text-[13px] font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                        >
                            Cancel
                        </Button>

                        <Button
                            type='submit'
                            disabled={
                                mutation.isPending ||
                                !String(form.entry_type || '').trim() ||
                                !String(form.category || '').trim() ||
                                !form.amount
                            }
                            className='h-11 rounded-xl bg-[#0b2d5c] px-8 text-[13px] font-bold text-white shadow-lg shadow-[#0b2d5c]/20 transition-all hover:bg-[#0a2851]'
                        >
                            {mutation.isPending ? (
                                <>
                                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                                    Saving...
                                </>
                            ) : (
                                'Save & Close'
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}