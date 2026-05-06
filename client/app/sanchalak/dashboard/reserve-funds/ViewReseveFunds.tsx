"use client"

import React from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { CalendarIcon, Loader2, Trash2 } from "lucide-react"
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
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import {
    deleteReserveFundHandler,
    ReserveFund,
    ReserveFundPaymentMode,
    ReserveFundStatus,
    ReserveFundTransactionType,
    UpdateReserveFundPayload,
    updateReserveFundHandler,
} from "@/services/reserveFundsHandler"

type ViewReserveFundsProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    reserveFund: ReserveFund | null
    updatedBy?: string | null
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

const currencyFormatter = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
})

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
})

const dateTimeFormatter = new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
})

function formatCurrency(value: unknown): string {
    const amount = Number(value)
    return currencyFormatter.format(Number.isFinite(amount) ? amount : 0)
}

function formatDate(value: unknown): string {
    if (!value) {
        return "-"
    }

    const date = new Date(String(value))

    if (Number.isNaN(date.getTime())) {
        return "-"
    }

    return dateFormatter.format(date)
}

function formatDateTime(value: unknown): string {
    if (!value) {
        return "-"
    }

    const date = new Date(String(value))

    if (Number.isNaN(date.getTime())) {
        return "-"
    }

    return dateTimeFormatter.format(date)
}

function formatText(value: unknown): string {
    if (value === null || value === undefined || value === "") {
        return "-"
    }

    return String(value)
}

function formatLabel(value: unknown): string {
    if (value === null || value === undefined || value === "") {
        return "-"
    }

    return String(value)
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase())
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

    return dateFormatter.format(date)
}

function getStatusBadgeClass(status: ReserveFundStatus): string {
    if (status === "active") {
        return "border-emerald-200 bg-emerald-50 text-emerald-700"
    }

    if (status === "inactive") {
        return "border-slate-200 bg-slate-50 text-slate-600"
    }

    return "border-rose-200 bg-rose-50 text-rose-700"
}

function getInitialFormState(reserveFund: ReserveFund | null): ReserveFundsFormState {
    const fundDate = reserveFund?.fund_date ? String(reserveFund.fund_date).slice(0, 10) : new Date().toISOString().slice(0, 10)

    return {
        title: reserveFund?.title ?? "",
        category: reserveFund?.category ?? "",
        amount: reserveFund?.amount !== null && reserveFund?.amount !== undefined ? String(reserveFund.amount) : "",
        transaction_type: reserveFund?.transaction_type ?? "credit",
        payment_mode: reserveFund?.payment_mode ?? "none",
        reference_no: reserveFund?.reference_no ?? "",
        fund_date: fundDate,
        financial_year: reserveFund?.financial_year ?? getCurrentFinancialYear(fundDate),
        status: reserveFund?.status ?? "active",
        remark: reserveFund?.remark ?? "",
    }
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

type DetailItemProps = {
    label: string
    value: React.ReactNode
}

function DetailItem({ label, value }: DetailItemProps) {
    return (
        <div className="rounded-lg border border-slate-200 bg-white p-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {label}
            </div>
            <div className="mt-1 text-sm font-semibold text-slate-900">
                {value}
            </div>
        </div>
    )
}

export default function ViewReseveFunds({
    open,
    onOpenChange,
    reserveFund,
    updatedBy = null,
}: ViewReserveFundsProps) {
    const queryClient = useQueryClient()
    const [activeTab, setActiveTab] = React.useState("view")
    const [isDatePickerOpen, setIsDatePickerOpen] = React.useState(false)
    const [form, setForm] = React.useState<ReserveFundsFormState>(() => getInitialFormState(reserveFund))
    const [errors, setErrors] = React.useState<ReserveFundsFormErrors>({})
    const [serverError, setServerError] = React.useState("")

    React.useEffect(() => {
        if (open) {
            setForm(getInitialFormState(reserveFund))
            setErrors({})
            setServerError("")
            setActiveTab("view")
            setIsDatePickerOpen(false)
        }
    }, [open, reserveFund])

    const updateMutation = useMutation({
        mutationFn: (payload: UpdateReserveFundPayload) => {
            if (!reserveFund?.id && !reserveFund?.reserve_fund_id) {
                throw new Error("Reserve fund id is missing")
            }

            return updateReserveFundHandler(reserveFund.id ?? reserveFund.reserve_fund_id, payload)
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: ["reserve-funds"],
            })
            setErrors({})
            setServerError("")
            setIsDatePickerOpen(false)
            setActiveTab("view")
            onOpenChange(false)
        },
        onError: (error) => {
            setServerError(error instanceof Error ? error.message : "Failed to update reserve fund")
        },
    })

    const deleteMutation = useMutation({
        mutationFn: () => {
            if (!reserveFund?.id && !reserveFund?.reserve_fund_id) {
                throw new Error("Reserve fund id is missing")
            }

            return deleteReserveFundHandler(reserveFund.id ?? reserveFund.reserve_fund_id, {
                deleted_by: updatedBy,
            })
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: ["reserve-funds"],
            })
            setErrors({})
            setServerError("")
            setIsDatePickerOpen(false)
            setActiveTab("view")
            onOpenChange(false)
        },
        onError: (error) => {
            setServerError(error instanceof Error ? error.message : "Failed to delete reserve fund")
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
            if (updateMutation.isPending || deleteMutation.isPending) {
                return
            }

            onOpenChange(nextOpen)

            if (!nextOpen) {
                setErrors({})
                setServerError("")
                setIsDatePickerOpen(false)
            }
        },
        [deleteMutation.isPending, onOpenChange, updateMutation.isPending]
    )

    const handleSubmit = React.useCallback(
        (event: React.FormEvent<HTMLFormElement>) => {
            event.preventDefault()

            const validationErrors = validateForm(form)

            if (Object.keys(validationErrors).length > 0) {
                setErrors(validationErrors)
                return
            }

            const payload: UpdateReserveFundPayload = {
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
                updated_by: updatedBy,
            }

            updateMutation.mutate(payload)
        },
        [form, updateMutation, updatedBy]
    )

    const handleDelete = React.useCallback(() => {
        if (deleteMutation.isPending || updateMutation.isPending) {
            return
        }

        const confirmed = window.confirm("Are you sure you want to delete this reserve fund?")

        if (!confirmed) {
            return
        }

        deleteMutation.mutate()
    }, [deleteMutation, updateMutation.isPending])

    const isActionPending = updateMutation.isPending || deleteMutation.isPending

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-h-[90vh] w-[95vw] max-w-[95vw] overflow-y-auto rounded-xl sm:max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Reserve Fund Details</DialogTitle>
                    <DialogDescription>
                        View complete reserve fund information and update fund details.
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 rounded-lg bg-muted p-1">
                        <TabsTrigger
                            value="view"
                            className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
                        >
                            View
                        </TabsTrigger>
                        <TabsTrigger
                            value="edit"
                            className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
                        >
                            Edit
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="view" className="mt-5">
                        {!reserveFund ? (
                            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm font-medium text-slate-600">
                                No reserve fund selected
                            </div>
                        ) : (
                            <div className="space-y-5">
                                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                        <div>
                                            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                Reserve Fund ID
                                            </div>
                                            <div className="mt-1 text-lg font-bold text-slate-950">
                                                {formatText(reserveFund.reserve_fund_id)}
                                            </div>
                                            <div className="mt-1 text-sm font-medium text-slate-600">
                                                {formatText(reserveFund.title)}
                                            </div>
                                        </div>
                                        <span className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-semibold capitalize ${getStatusBadgeClass(reserveFund.status)}`}>
                                            {reserveFund.status}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                    <DetailItem label="Amount" value={formatCurrency(reserveFund.amount)} />
                                    <DetailItem label="Transaction Type" value={formatLabel(reserveFund.transaction_type)} />
                                    <DetailItem label="Payment Mode" value={formatLabel(reserveFund.payment_mode)} />
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                    <DetailItem label="Category" value={formatText(reserveFund.category)} />
                                    <DetailItem label="Reference No" value={formatText(reserveFund.reference_no)} />
                                    <DetailItem label="Financial Year" value={formatText(reserveFund.financial_year)} />
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                    <DetailItem label="Fund Date" value={formatDate(reserveFund.fund_date)} />
                                    <DetailItem label="Created By" value={formatText(reserveFund.created_by)} />
                                    <DetailItem label="Updated By" value={formatText(reserveFund.updated_by)} />
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <DetailItem label="Created At" value={formatDateTime(reserveFund.created_at)} />
                                    <DetailItem label="Updated At" value={formatDateTime(reserveFund.updated_at)} />
                                </div>

                                <div className="rounded-lg border border-slate-200 bg-white p-3">
                                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Remark
                                    </div>
                                    <div className="mt-1 whitespace-pre-wrap text-sm font-medium text-slate-900">
                                        {formatText(reserveFund.remark)}
                                    </div>
                                </div>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="edit" className="mt-5">
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {serverError ? (
                                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                                    {serverError}
                                </div>
                            ) : null}

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="edit-reserve-fund-title">Title</Label>
                                    <Input
                                        id="edit-reserve-fund-title"
                                        value={form.title}
                                        onChange={(event) => updateField("title", event.target.value)}
                                        placeholder="Enter fund title"
                                        className="h-10 w-full rounded-lg"
                                        disabled={isActionPending}
                                    />
                                    {errors.title ? (
                                        <p className="text-xs font-medium text-red-600">{errors.title}</p>
                                    ) : null}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="edit-reserve-fund-category">Category</Label>
                                    <Input
                                        id="edit-reserve-fund-category"
                                        value={form.category}
                                        onChange={(event) => updateField("category", event.target.value)}
                                        placeholder="Maintenance, Building, Emergency"
                                        className="h-10 w-full rounded-lg"
                                        disabled={isActionPending}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="edit-reserve-fund-amount">Amount</Label>
                                    <Input
                                        id="edit-reserve-fund-amount"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={form.amount}
                                        onChange={(event) => updateField("amount", event.target.value)}
                                        placeholder="Enter amount"
                                        className="h-10 w-full rounded-lg"
                                        disabled={isActionPending}
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
                                            disabled={isActionPending}
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
                                            disabled={isActionPending}
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
                                            disabled={isActionPending}
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
                                    <Label htmlFor="edit-reserve-fund-reference">Reference No</Label>
                                    <Input
                                        id="edit-reserve-fund-reference"
                                        value={form.reference_no}
                                        onChange={(event) => updateField("reference_no", event.target.value)}
                                        placeholder="Transaction / cheque no"
                                        className="h-10 w-full rounded-lg"
                                        disabled={isActionPending}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Fund Date</Label>
                                    <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                disabled={isActionPending}
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
                                    <Label htmlFor="edit-reserve-fund-financial-year">Financial Year</Label>
                                    <Input
                                        id="edit-reserve-fund-financial-year"
                                        value={form.financial_year}
                                        onChange={(event) => updateField("financial_year", event.target.value)}
                                        placeholder="2026-27"
                                        className="h-10 w-full rounded-lg"
                                        disabled={isActionPending}
                                    />
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="edit-reserve-fund-remark">Remark</Label>
                                    <Textarea
                                        id="edit-reserve-fund-remark"
                                        value={form.remark}
                                        onChange={(event) => updateField("remark", event.target.value)}
                                        placeholder="Enter remark"
                                        className="min-h-24 w-full resize-none rounded-lg"
                                        disabled={isActionPending}
                                    />
                                </div>
                            </div>

                            <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <Button
                                    type="button"
                                    variant="destructive"
                                    className="rounded-lg"
                                    disabled={isActionPending || !reserveFund}
                                    onClick={handleDelete}
                                >
                                    {deleteMutation.isPending ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Deleting
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Delete
                                        </>
                                    )}
                                </Button>

                                <div className="flex flex-col gap-2 sm:flex-row">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="rounded-lg"
                                        disabled={isActionPending}
                                        onClick={() => setActiveTab("view")}
                                    >
                                        Cancel
                                    </Button>
                                    <Button type="submit" className="rounded-lg" disabled={isActionPending}>
                                        {updateMutation.isPending ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Updating
                                            </>
                                        ) : (
                                            "Update Fund"
                                        )}
                                    </Button>
                                </div>
                            </DialogFooter>
                        </form>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}