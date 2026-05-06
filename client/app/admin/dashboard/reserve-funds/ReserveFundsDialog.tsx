"use client"

import React from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { CalendarIcon, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import {
    createReserveFundHandler,
    CreateReserveFundPayload,
    ReserveFundPaymentMode,
    ReserveFundStatus,
    ReserveFundTransactionType,
} from "@/services/reserveFundsHandler"

type ReserveFundsDialogProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    createdBy?: string | null
}

type ReserveFundsFormState = {
    title: string
    category: string
    amount: string
    transaction_type: ReserveFundTransactionType
    payment_mode: ReserveFundPaymentMode | "none"
    reference_no: string
    fund_date: string
    financial_year: string
    status: ReserveFundStatus
    remark: string
}

type ReserveFundsFormErrors = Partial<Record<keyof ReserveFundsFormState, string>>

const initialFormState: ReserveFundsFormState = {
    title: "",
    category: "",
    amount: "",
    transaction_type: "credit",
    payment_mode: "none",
    reference_no: "",
    fund_date: new Date().toISOString().slice(0, 10),
    financial_year: "",
    status: "active",
    remark: "",
}

function getCurrentFinancialYear(dateValue: string): string {
    const date = dateValue ? new Date(dateValue) : new Date()
    const month = date.getMonth() + 1
    const year = date.getFullYear()

    if (month >= 4) {
        return `${year}-${String(year + 1).slice(-2)}`
    }

    return `${year - 1}-${String(year).slice(-2)}`
}

function validateForm(form: ReserveFundsFormState): ReserveFundsFormErrors {
    const errors: ReserveFundsFormErrors = {}
    const amount = Number(form.amount)

    if (!form.title.trim()) {
        errors.title = "Title is required"
    }

    if (!form.amount.trim()) {
        errors.amount = "Amount is required"
    } else if (!Number.isFinite(amount) || amount <= 0) {
        errors.amount = "Amount must be greater than 0"
    }

    if (!form.fund_date.trim()) {
        errors.fund_date = "Fund date is required"
    }

    return errors
}

function parseDateValue(value: string): Date | undefined {
    if (!value) {
        return undefined
    }

    const [year, month, day] = value.split("-").map(Number)

    if (!year || !month || !day) {
        return undefined
    }

    const date = new Date(year, month - 1, day)

    if (Number.isNaN(date.getTime())) {
        return undefined
    }

    return date
}

function formatDateValue(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")

    return `${year}-${month}-${day}`
}

function formatDisplayDate(value: string): string {
    const date = parseDateValue(value)

    if (!date) {
        return "Select fund date"
    }

    return new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).format(date)
}

export default function ReserveFundsDialog({ open, onOpenChange, createdBy = null }: ReserveFundsDialogProps) {
    const queryClient = useQueryClient()
    const [isDatePickerOpen, setIsDatePickerOpen] = React.useState(false)
    const [form, setForm] = React.useState<ReserveFundsFormState>({
        ...initialFormState,
        financial_year: getCurrentFinancialYear(initialFormState.fund_date),
    })
    const [errors, setErrors] = React.useState<ReserveFundsFormErrors>({})
    const [serverError, setServerError] = React.useState<string>("")

    const createMutation = useMutation({
        mutationFn: (payload: CreateReserveFundPayload) => createReserveFundHandler(payload),
        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: ["reserve-funds"],
            })
            setForm({
                ...initialFormState,
                financial_year: getCurrentFinancialYear(initialFormState.fund_date),
            })
            setErrors({})
            setServerError("")
            setIsDatePickerOpen(false)
            onOpenChange(false)
        },
        onError: (error) => {
            setServerError(error instanceof Error ? error.message : "Failed to create reserve fund")
        },
    })

    const updateField = React.useCallback(
        <TKey extends keyof ReserveFundsFormState>(key: TKey, value: ReserveFundsFormState[TKey]) => {
            setForm((currentForm) => {
                const nextForm = {
                    ...currentForm,
                    [key]: value,
                }

                if (key === "fund_date") {
                    nextForm.financial_year = getCurrentFinancialYear(String(value))
                }

                return nextForm
            })

            setErrors((currentErrors) => ({
                ...currentErrors,
                [key]: undefined,
            }))

            setServerError("")
        },
        []
    )

    const handleDateSelect = React.useCallback(
        (date: Date | undefined) => {
            if (!date) {
                return
            }

            updateField("fund_date", formatDateValue(date))
            setIsDatePickerOpen(false)
        },
        [updateField]
    )

    const handleOpenChange = React.useCallback(
        (nextOpen: boolean) => {
            if (createMutation.isPending) {
                return
            }

            onOpenChange(nextOpen)

            if (!nextOpen) {
                setErrors({})
                setServerError("")
                setIsDatePickerOpen(false)
            }
        },
        [createMutation.isPending, onOpenChange]
    )

    const handleSubmit = React.useCallback(
        (event: React.FormEvent<HTMLFormElement>) => {
            event.preventDefault()

            const validationErrors = validateForm(form)

            if (Object.keys(validationErrors).length > 0) {
                setErrors(validationErrors)
                return
            }

            const payload: CreateReserveFundPayload = {
                title: form.title.trim(),
                category: form.category.trim() || null,
                amount: Number(form.amount),
                transaction_type: form.transaction_type,
                payment_mode: form.payment_mode === "none" ? null : form.payment_mode,
                reference_no: form.reference_no.trim() || null,
                fund_date: form.fund_date,
                financial_year: form.financial_year.trim() || null,
                status: form.status,
                remark: form.remark.trim() || null,
                created_by: createdBy,
            }

            createMutation.mutate(payload)
        },
        [createdBy, createMutation, form]
    )

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-h-[90vh] w-[95vw] max-w-[95vw] overflow-y-auto rounded-xl sm:max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Add Reserve Fund</DialogTitle>
                    <DialogDescription>
                        Create a new reserve fund entry with amount, payment details and status.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {serverError ? (
                        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                            {serverError}
                        </div>
                    ) : null}

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="reserve-fund-title">Title</Label>
                            <Input
                                id="reserve-fund-title"
                                value={form.title}
                                onChange={(event) => updateField("title", event.target.value)}
                                placeholder="Enter fund title"
                                className="h-10 w-full rounded-lg"
                            />
                            {errors.title ? (
                                <p className="text-xs font-medium text-red-600">{errors.title}</p>
                            ) : null}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="reserve-fund-category">Category</Label>
                            <Input
                                id="reserve-fund-category"
                                value={form.category}
                                onChange={(event) => updateField("category", event.target.value)}
                                placeholder="Maintenance, Building, Emergency"
                                className="h-10 w-full rounded-lg"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="reserve-fund-amount">Amount</Label>
                            <Input
                                id="reserve-fund-amount"
                                type="number"
                                min="0"
                                step="0.01"
                                value={form.amount}
                                onChange={(event) => updateField("amount", event.target.value)}
                                placeholder="Enter amount"
                                className="h-10 w-full rounded-lg"
                            />
                            {errors.amount ? (
                                <p className="text-xs font-medium text-red-600">{errors.amount}</p>
                            ) : null}
                        </div>

                        <div className="grid w-full grid-cols-1 gap-4 md:col-span-2 md:grid-cols-3">
                            <div className="w-full space-y-2">
                                <Label>Transaction Type</Label>
                                <Select
                                    value={form.transaction_type}
                                    onValueChange={(value) => updateField("transaction_type", value as ReserveFundTransactionType)}
                                >
                                    <SelectTrigger className="h-10 w-full rounded-lg">
                                        <SelectValue placeholder="Select transaction type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="credit">Credit</SelectItem>
                                        <SelectItem value="debit">Debit</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="w-full space-y-2">
                                <Label>Payment Mode</Label>
                                <Select
                                    value={form.payment_mode}
                                    onValueChange={(value) => updateField("payment_mode", value as ReserveFundsFormState["payment_mode"])}
                                >
                                    <SelectTrigger className="h-10 w-full rounded-lg">
                                        <SelectValue placeholder="Select payment mode" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">None</SelectItem>
                                        <SelectItem value="cash">Cash</SelectItem>
                                        <SelectItem value="bank">Bank</SelectItem>
                                        <SelectItem value="upi">UPI</SelectItem>
                                        <SelectItem value="cheque">Cheque</SelectItem>
                                        <SelectItem value="online">Online</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="w-full space-y-2">
                                <Label>Status</Label>
                                <Select
                                    value={form.status}
                                    onValueChange={(value) => updateField("status", value as ReserveFundStatus)}
                                >
                                    <SelectTrigger className="h-10 w-full rounded-lg">
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="inactive">Inactive</SelectItem>
                                        <SelectItem value="cancelled">Cancelled</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="reserve-fund-reference">Reference No</Label>
                            <Input
                                id="reserve-fund-reference"
                                value={form.reference_no}
                                onChange={(event) => updateField("reference_no", event.target.value)}
                                placeholder="Transaction / cheque no"
                                className="h-10 w-full rounded-lg"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Fund Date</Label>
                            <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className={cn(
                                            "h-10 w-full justify-start rounded-lg border-slate-300 bg-white text-left font-normal",
                                            !form.fund_date && "text-slate-500"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4 text-slate-500" />
                                        {formatDisplayDate(form.fund_date)}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={parseDateValue(form.fund_date)}
                                        onSelect={handleDateSelect}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                            {errors.fund_date ? (
                                <p className="text-xs font-medium text-red-600">{errors.fund_date}</p>
                            ) : null}
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="reserve-fund-financial-year">Financial Year</Label>
                            <Input
                                id="reserve-fund-financial-year"
                                value={form.financial_year}
                                onChange={(event) => updateField("financial_year", event.target.value)}
                                placeholder="2026-27"
                                className="h-10 w-full rounded-lg"
                            />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="reserve-fund-remark">Remark</Label>
                            <Textarea
                                id="reserve-fund-remark"
                                value={form.remark}
                                onChange={(event) => updateField("remark", event.target.value)}
                                placeholder="Enter remark"
                                className="min-h-24 w-full resize-none rounded-lg"
                            />
                        </div>
                    </div>

                    <DialogFooter className="gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            className="rounded-lg"
                            disabled={createMutation.isPending}
                            onClick={() => handleOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" className="rounded-lg" disabled={createMutation.isPending}>
                            {createMutation.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving
                                </>
                            ) : (
                                "Save Fund"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}