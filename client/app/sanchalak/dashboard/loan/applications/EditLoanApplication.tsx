'use client'

import React, { useMemo } from 'react'
import type { LoanApplication } from '@/types/LoanApplications'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import {
    AlertCircle,
    CheckCircle2,
    Clock3,
    FileText,
    ShieldCheck,
    User2,
    Wallet,
    XCircle,
    Users,
    ChevronDownIcon,
} from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { approveLoanApplicationHandler } from '@/services/loanHandler'

type LoanApprovalStatus = 'pending' | 'approved' | 'rejected'

type ViewLoanApplicaionProps = {
    open: boolean
    onOpenChange: (openViewDialog: boolean) => void
    application: LoanApplication | null
}

type LoanApplicationRecord = LoanApplication & {
    id?: number | string
    application_no?: string | null
    application_status?: string | null
    admin_approval_status?: string | null
    member_id?: string | null
    member_name?: string | null
    scheme_name?: string | null
    interest_rate?: string | number | null
    loan_amount?: string | number | null
    tenure_months?: string | number | null
    tenure_years?: string | number | null
    start_date?: string | null
    end_date?: string | null
    created_at?: string | null
    sanchalak_approvals_status?: string | null
    guarantor_1_status?: string | null
    guarantor_2_status?: string | null
    guarantor_1_id?: string | null
    guarantor_1_name?: string | null
    guarantor_2_id?: string | null
    guarantor_2_name?: string | null
    adhaar_number?: string | null
    bank_account_number?: string | null
    annual_family_income?: string | number | null
    adjustment_remark?: string | null
    old_outstanding_amount?: string | number | null
    previous_outstanding?: string | number | null
    cash_disbursement_amount?: string | number | null
    suggested_sanction_amount?: string | number | null
    net_cash_amount?: string | number | null
    sanctioned_amount?: string | number | null
    loan_max_amount?: string | number | null
    scheme_max_amount?: string | number | null
}

type DeductionItem = {
    key: string
    label: string
    calculation: string
    amount: number
}

type ApproveLoanDeductionItem = {
    type: string
    calculation: string
    amount: number
}

type ApproveLoanApplicationPayload = {
    application_status: LoanApprovalStatus
    admin_approval_status: LoanApprovalStatus
    start_date?: string | null
    sanctioned_amount?: number
    updated_by: string
    deductions?: ApproveLoanDeductionItem[]
}

type DetailItemType = {
    label: string
    value: React.ReactNode
    className?: string
}

const STATUS_OPTIONS: LoanApprovalStatus[] = ['pending', 'approved', 'rejected']

const toNumber = (value: unknown) => {
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0

    if (typeof value === 'string') {
        const clean = value.replace(/,/g, '').replace(/₹/g, '').trim()
        const parsed = Number(clean)
        return Number.isFinite(parsed) ? parsed : 0
    }

    return 0
}

const toStatus = (value: unknown): LoanApprovalStatus => {
    const status = String(value ?? 'pending').toLowerCase()

    if (status === 'approved') return 'approved'
    if (status === 'rejected') return 'rejected'

    return 'pending'
}

const formatCurrency = (value: unknown) => {
    const amount = toNumber(value)

    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount)
}

const formatDate = (value: unknown) => {
    if (!value) return '-'

    const date = value instanceof Date ? value : new Date(String(value))
    if (Number.isNaN(date.getTime())) return String(value)

    return new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(date)
}

const formatDateTime = (value: unknown) => {
    if (!value) return '-'

    const date = new Date(String(value))
    if (Number.isNaN(date.getTime())) return String(value)

    return new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    }).format(date)
}

const getStatusBadgeClass = (status?: string | null) => {
    const value = String(status ?? '').toLowerCase()

    if (value === 'approved') {
        return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300'
    }

    if (value === 'pending') {
        return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300'
    }

    if (value === 'rejected') {
        return 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300'
    }

    return 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
}

const getApprovalIcon = (status?: string | null) => {
    const value = String(status ?? '').toLowerCase()

    if (value === 'approved') return <CheckCircle2 className="h-3.5 w-3.5" />
    if (value === 'rejected') return <XCircle className="h-3.5 w-3.5" />

    return <Clock3 className="h-3.5 w-3.5" />
}

const getTenureLabel = (application: LoanApplicationRecord | null) => {
    if (!application) return '-'

    const years = toNumber(application.tenure_years)
    const months = toNumber(application.tenure_months)

    if (years > 0) return `${years} Year${years > 1 ? 's' : ''}`
    if (months > 0) return `${months} Month${months > 1 ? 's' : ''}`

    return '-'
}

const buildDeductions = (loanAmount: number): DeductionItem[] => {
    const kayamThev = Number((loanAmount * 0.05).toFixed(2))
    const processingFee = Number((loanAmount * 0.005).toFixed(2))
    const formFee = 100

    return [
        {
            key: 'kayam-thev',
            label: 'Kayam Thev',
            calculation: '5% of Principal',
            amount: kayamThev,
        },
        {
            key: 'processing-fee',
            label: 'Processing Fee',
            calculation: '0.5% of Principal',
            amount: processingFee,
        },
        {
            key: 'form-fee',
            label: 'Form Fee',
            calculation: '₹ 100.00 (Flat)',
            amount: formFee,
        },
    ]
}

const getCalculatedAmountFromExpression = (calculation: string, loanAmount: number) => {
    const normalized = calculation.trim().toLowerCase()

    if (!normalized) return 0

    const percentMatch = normalized.match(/(\d+(?:\.\d+)?)\s*%/)
    if (percentMatch) {
        const percent = Number(percentMatch[1])
        if (Number.isFinite(percent)) {
            return Number(((loanAmount * percent) / 100).toFixed(2))
        }
    }

    const currencyMatch = normalized.match(/₹?\s*(\d+(?:\.\d+)?)/)
    if (currencyMatch) {
        const amount = Number(currencyMatch[1])
        if (Number.isFinite(amount)) {
            return Number(amount.toFixed(2))
        }
    }

    return 0
}

const isFixedDeduction = (item: DeductionItem) => {
    return item.key === 'form-fee'
}

const DetailItem = ({
    label,
    value,
    className = '',
}: {
    label: string
    value: React.ReactNode
    className?: string
}) => (
    <div className={`rounded-xl border bg-background px-3 py-2 ${className}`}>
        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            {label}
        </p>
        <div className="mt-1 wrap-break-word text-xs font-medium text-foreground">
            {value ?? '-'}
        </div>
    </div>
)

const SectionCard = ({
    title,
    icon,
    children,
}: {
    title: string
    icon: React.ReactNode
    children: React.ReactNode
}) => (
    <div className="rounded-xl border bg-background">
        <div className="flex items-center gap-2 border-b px-4 py-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-primary/10 text-primary">
                {icon}
            </div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-foreground">
                {title}
            </h3>
        </div>
        <div className="p-4">{children}</div>
    </div>
)

const StatusValue = ({ status }: { status?: string | null }) => (
    <Badge
        variant="outline"
        className={`rounded-xl text-[11px] capitalize ${getStatusBadgeClass(status)}`}
    >
        {getApprovalIcon(status)}
        <span className="ml-1">{String(status ?? '-')}</span>
    </Badge>
)

export default function ViewLoanApplication({
    open,
    onOpenChange,
    application,
}: ViewLoanApplicaionProps) {
    const app = application as LoanApplicationRecord | null

    const [activeTab, setActiveTab] = React.useState<'view' | 'edit'>('view')
    const [applicationStatus, setApplicationStatus] = React.useState<LoanApprovalStatus>('pending')
    const [openCalender, setOpenCalender] = React.useState(false)
    const [date, setDate] = React.useState<Date | undefined>(undefined)
    const [sanctionedAmount, setSanctionedAmount] = React.useState('')
    const [editableDeductions, setEditableDeductions] = React.useState<DeductionItem[]>([])
    const [editingCalculationKey, setEditingCalculationKey] = React.useState<string | null>(null)
    const [editingAmountKey, setEditingAmountKey] = React.useState<string | null>(null)

    const queryClient = useQueryClient()

    const approveLoanApplicationMutation = useMutation({
        mutationFn: ({
            application_id,
            payload,
        }: {
            application_id: number | string
            payload: ApproveLoanApplicationPayload
        }) => approveLoanApplicationHandler(application_id, payload),

        onSuccess: async () => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['loan-applications'] }),
                queryClient.invalidateQueries({ queryKey: ['loan-application-details'] }),
                queryClient.invalidateQueries({ queryKey: ['loan-emis'] }),
                queryClient.invalidateQueries({ queryKey: ['loan-emi-schedules'] }),
            ])

            onOpenChange(false)
        },
    })

    React.useEffect(() => {
        if (!app) return

        setActiveTab('view')
        setApplicationStatus(toStatus(app.application_status))
        setDate(app.start_date ? new Date(app.start_date) : undefined)
        setSanctionedAmount(String(toNumber(app.sanctioned_amount ?? app.loan_amount ?? 0)))
    }, [app])

    const loanAmount = toNumber(app?.loan_amount ?? 0)

    const prevOutstanding = toNumber(
        app?.old_outstanding_amount ??
        app?.previous_outstanding ??
        0
    )

    const suggestedSanctionAmount =
        toNumber(
            app?.cash_disbursement_amount ??
            app?.suggested_sanction_amount ??
            app?.net_cash_amount
        ) || loanAmount

    const deductions = useMemo(() => buildDeductions(loanAmount), [loanAmount])

    React.useEffect(() => {
        setEditableDeductions(deductions)
        setEditingCalculationKey(null)
        setEditingAmountKey(null)
    }, [deductions])

    const totalDeductions = editableDeductions.reduce(
        (sum, item) => sum + toNumber(item.amount),
        0
    )

    const netDisbursement = Math.max(toNumber(sanctionedAmount) - totalDeductions, 0)

    const isLoanApproved =
        toStatus(app?.application_status) === 'approved' ||
        toStatus(app?.admin_approval_status) === 'approved' ||
        applicationStatus === 'approved'

    const handleDeductionAmountChange = (index: number, value: string) => {
        const cleanedValue = value.replace(/,/g, '')
        const parsedValue = cleanedValue === '' ? 0 : Number(cleanedValue)

        setEditableDeductions((prev) =>
            prev.map((item, itemIndex) => {
                if (itemIndex !== index) return item
                if (isFixedDeduction(item)) return item

                return {
                    ...item,
                    amount: Number.isFinite(parsedValue) ? parsedValue : item.amount,
                }
            })
        )
    }

    const handleDeductionCalculationChange = (index: number, value: string) => {
        setEditableDeductions((prev) =>
            prev.map((item, itemIndex) => {
                if (itemIndex !== index) return item
                if (isFixedDeduction(item)) return item

                return {
                    ...item,
                    calculation: value,
                    amount: getCalculatedAmountFromExpression(value, loanAmount),
                }
            })
        )
    }

    const formatDateForApi = (value?: Date) => {
        if (!value) return null

        const year = value.getFullYear()
        const month = String(value.getMonth() + 1).padStart(2, '0')
        const day = String(value.getDate()).padStart(2, '0')

        return `${year}-${month}-${day}`
    }

    const buildPayload = (status: LoanApprovalStatus): ApproveLoanApplicationPayload => {
        return {
            application_status: status,
            admin_approval_status: status,
            start_date: formatDateForApi(date),
            sanctioned_amount: toNumber(sanctionedAmount || app?.loan_amount || 0),
            updated_by: 'Admin',
            deductions: editableDeductions.map((item) => ({
                type: item.label,
                calculation: item.calculation,
                amount: Number(item.amount),
            })),
        }
    }

    const handleApproveApplication = () => {
        if (!app?.id || isLoanApproved) return

        setApplicationStatus('approved')

        approveLoanApplicationMutation.mutate({
            application_id: app.id,
            payload: buildPayload('approved'),
        })
    }

    const handleRejectApplication = () => {
        if (!app?.id) return

        setApplicationStatus('rejected')

        approveLoanApplicationMutation.mutate({
            application_id: app.id,
            payload: buildPayload('rejected'),
        })
    }

    if (!app) return null

    const loanSchemeDetails: DetailItemType[] = [
        {
            label: 'Application No',
            value: app.application_no ?? '-',
        },
        {
            label: 'Scheme Name',
            value: app.scheme_name ?? '-',
        },
        {
            label: 'Loan Amount',
            value: formatCurrency(app.loan_amount),
        },
        {
            label: 'Interest Rate',
            value: `${app.interest_rate ?? '-'}${app.interest_rate ? '%' : ''}`,
        },
        {
            label: 'Tenure',
            value: getTenureLabel(app),
        },
        {
            label: 'Start Date',
            value: formatDate(app.start_date),
        },
        {
            label: 'End Date',
            value: formatDate(app.end_date),
        },
        {
            label: 'Created At',
            value: formatDateTime(app.created_at),
        },
    ]

    const importantInfo: DetailItemType[] = [
        {
            label: 'Member ID',
            value: app.member_id ?? '-',
        },
        {
            label: 'Member Name',
            value: app.member_name ?? '-',
        },
        {
            label: 'Application Start Date',
            value: formatDate(app.start_date),
        },
        {
            label: 'Application End Date',
            value: formatDate(app.end_date),
        },
        {
            label: 'Sanchalak Approval',
            value: <StatusValue status={app.sanchalak_approvals_status} />,
        },
        {
            label: 'Admin Approval Status',
            value: <StatusValue status={app.admin_approval_status} />,
        },
        {
            label: 'Guarantor 1 Approval',
            value: <StatusValue status={app.guarantor_1_status} />,
        },
        {
            label: 'Guarantor 2 Approval',
            value: <StatusValue status={app.guarantor_2_status} />,
        },
        {
            label: 'Adhaar Number',
            value: app.adhaar_number ?? '-',
        },
        {
            label: 'Bank Account Number',
            value: app.bank_account_number ?? '-',
        },
        {
            label: 'Annual Family Income',
            value: formatCurrency(app.annual_family_income),
        },
        {
            label: 'Adjustment Remark',
            value: app.adjustment_remark ?? '-',
            className: 'sm:col-span-2 xl:col-span-2',
        },
    ]

    const guarantorDetails: DetailItemType[] = [
        {
            label: 'Guarantor 1 ID',
            value: app.guarantor_1_id ?? '-',
        },
        {
            label: 'Guarantor 1 Name',
            value: app.guarantor_1_name ?? '-',
        },
        {
            label: 'Guarantor 1 Approval',
            value: <StatusValue status={app.guarantor_1_status} />,
        },
        {
            label: 'Guarantor 2 ID',
            value: app.guarantor_2_id ?? '-',
        },
        {
            label: 'Guarantor 2 Name',
            value: app.guarantor_2_name ?? '-',
        },
        {
            label: 'Guarantor 2 Approval',
            value: <StatusValue status={app.guarantor_2_status} />,
        },
    ]

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[88vh] overflow-y-auto rounded-xl border bg-background p-0 shadow-2xl sm:max-w-4xl [&>button]:hidden">
                <DialogHeader className="sticky top-0 z-10 border-b bg-background px-5 py-4">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <DialogTitle className="truncate text-base font-semibold">
                                {String(app.application_no ?? 'Loan Application')}
                            </DialogTitle>
                            <p className="mt-1 text-xs font-semibold text-foreground">
                                {String(app.member_name ?? '-')} | {String(app.member_id ?? '-')}
                            </p>
                        </div>

                        <StatusValue status={app.application_status} />
                    </div>
                </DialogHeader>

                <div className="px-5 py-4">
                    <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'view' | 'edit')} className="w-full">
                        <TabsList className="-mt-5 h-8 rounded-xl bg-muted/70 p-1">
                            <TabsTrigger
                                value="view"
                                className="rounded-lg px-3 text-[11px] font-medium transition-colors data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                            >
                                View
                            </TabsTrigger>
                            <TabsTrigger
                                value="edit"
                                className="rounded-lg px-3 text-[11px] font-medium transition-colors data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                            >
                                Edit
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="view" className="mt-0 space-y-4">
                            <div className="grid gap-3 md:grid-cols-3">
                                <div className="rounded-xl border bg-background p-3">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                            <User2 className="h-3.5 w-3.5" />
                                        </div>
                                        <span className="text-[11px] font-medium">Member Details</span>
                                    </div>
                                    <div className="mt-2 space-y-1">
                                        <p className="text-xs font-semibold text-foreground">
                                            {String(app.member_name ?? '-')}
                                        </p>
                                        <p className="text-[11px] text-muted-foreground">
                                            ID: {String(app.member_id ?? '-')}
                                        </p>
                                    </div>
                                </div>

                                <div className="rounded-xl border bg-background p-3">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                            <Wallet className="h-3.5 w-3.5" />
                                        </div>
                                        <span className="text-[11px] font-medium">Loan Summary</span>
                                    </div>
                                    <div className="mt-2 space-y-1">
                                        <p className="text-xs font-semibold text-foreground">
                                            {formatCurrency(app.loan_amount)}
                                        </p>
                                        <p className="text-[11px] text-muted-foreground">
                                            Tenure: {getTenureLabel(app)}
                                        </p>
                                    </div>
                                </div>

                                <div className="rounded-xl border bg-background p-3">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                            <ShieldCheck className="h-3.5 w-3.5" />
                                        </div>
                                        <span className="text-[11px] font-medium">Approval Status</span>
                                    </div>
                                    <div className="mt-2 space-y-1">
                                        <p className="text-xs font-semibold capitalize text-foreground">
                                            {String(app.application_status ?? '-')}
                                        </p>
                                        <p className="text-[11px] capitalize text-muted-foreground">
                                            Admin: {String(app.admin_approval_status ?? '-')}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <SectionCard
                                title="Loan Scheme Details"
                                icon={<FileText className="h-3.5 w-3.5" />}
                            >
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                    {loanSchemeDetails.map((item, index) => (
                                        <DetailItem
                                            key={`${item.label}-${index}`}
                                            label={item.label}
                                            value={item.value}
                                        />
                                    ))}
                                </div>
                            </SectionCard>

                            <SectionCard
                                title="Important Info"
                                icon={<ShieldCheck className="h-3.5 w-3.5" />}
                            >
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                    {importantInfo.map((item, index) => (
                                        <DetailItem
                                            key={`${item.label}-${index}`}
                                            label={item.label}
                                            value={item.value}
                                            className={item.className ?? ''}
                                        />
                                    ))}
                                </div>
                            </SectionCard>

                            <SectionCard
                                title="Guarantor Details"
                                icon={<Users className="h-3.5 w-3.5" />}
                            >
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                    {guarantorDetails.map((item, index) => (
                                        <DetailItem
                                            key={`${item.label}-${index}`}
                                            label={item.label}
                                            value={item.value}
                                        />
                                    ))}
                                </div>
                            </SectionCard>

                            <SectionCard
                                title="Deduction Type"
                                icon={<Wallet className="h-3.5 w-3.5" />}
                            >
                                <div className="overflow-hidden rounded-xl border">
                                    <div className="grid grid-cols-3 border-b bg-muted/40 px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                                        <div>Deduction Type</div>
                                        <div>Calculation</div>
                                        <div className="text-right">Amount</div>
                                    </div>

                                    <div className="bg-background">
                                        {deductions.map((item) => (
                                            <div
                                                key={item.key}
                                                className="grid grid-cols-3 items-center border-b px-4 py-3 text-xs"
                                            >
                                                <div className="font-medium text-foreground">
                                                    {item.label}
                                                </div>
                                                <div className="text-muted-foreground">
                                                    {item.calculation}
                                                </div>
                                                <div className="text-right font-medium text-foreground">
                                                    {formatCurrency(item.amount)}
                                                </div>
                                            </div>
                                        ))}

                                        <div className="grid grid-cols-3 items-center bg-muted/30 px-4 py-3">
                                            <div />
                                            <div className="text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-foreground">
                                                Total Deductions
                                            </div>
                                            <div className="text-right text-lg font-bold text-red-600">
                                                {formatCurrency(deductions.reduce((sum, item) => sum + item.amount, 0))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </SectionCard>

                            <div className="sticky bottom-0 flex items-center justify-end gap-2 border-t bg-background py-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="rounded-xl"
                                    onClick={() => onOpenChange(false)}
                                >
                                    Close
                                </Button>
                                <Button
                                    type="button"
                                    className="rounded-xl"
                                    onClick={() => setActiveTab('edit')}
                                >
                                    Edit Application
                                </Button>
                            </div>
                        </TabsContent>

                        <TabsContent value="edit" className="mt-0 space-y-4">
                            <div className="grid gap-3 md:grid-cols-3">
                                <div className="rounded-xl border bg-muted/30 p-3">
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                                        Scheme Max Cap
                                    </p>
                                    <p className="mt-1 text-lg font-bold text-foreground">
                                        {formatCurrency(app.loan_max_amount ?? app.scheme_max_amount ?? 500000)}
                                    </p>
                                </div>

                                <div className="rounded-xl border bg-muted/30 p-3">
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                                        Prev. Outstanding
                                    </p>
                                    <p className="mt-1 text-lg font-bold text-orange-600">
                                        {formatCurrency(prevOutstanding)}
                                    </p>
                                </div>

                                <div className="rounded-xl border bg-muted/30 p-3">
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                                        Suggested Sanction
                                    </p>
                                    <p className="mt-1 text-lg font-bold text-emerald-600">
                                        {formatCurrency(suggestedSanctionAmount)}
                                    </p>
                                </div>
                            </div>

                            <div className="rounded-xl border bg-muted/20 p-3">
                                <div className="flex items-start gap-2">
                                    <div className="mt-0.5 text-muted-foreground">
                                        <AlertCircle className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-foreground">
                                            Normal approval flow
                                        </p>
                                        <p className="mt-1 text-[11px] text-muted-foreground">
                                            Standard cap and remaining balance logic applied.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-xl border bg-background px-4 py-3">
                                <div className="grid items-center gap-3 md:grid-cols-[1fr_260px]">
                                    <div>
                                        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-700">
                                            Sanctioned Amount
                                        </p>
                                        <p className="mt-1 text-[11px] text-muted-foreground">
                                            This amount will be sent while approving or updating the application.
                                        </p>
                                    </div>

                                    <Input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={sanctionedAmount}
                                        onChange={(event) => setSanctionedAmount(event.target.value)}
                                        className="h-10 rounded-lg text-sm font-medium"
                                    />
                                </div>
                            </div>

                            <div className="rounded-xl border bg-slate-50/70 p-4 dark:bg-slate-950/30">
                                <div className="grid gap-3 md:grid-cols-3">
                                    <div className="space-y-1.5">
                                        <Label className="block text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                                            Loan Amount
                                        </Label>
                                        <div className="flex h-10 items-center rounded-lg border bg-background px-3 text-sm font-semibold text-foreground">
                                            {formatCurrency(app.loan_amount)}
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="block text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                                            Application Status
                                        </Label>
                                        <Select
                                            value={applicationStatus}
                                            onValueChange={(value) => setApplicationStatus(toStatus(value))}
                                        >
                                            <SelectTrigger className="h-10 rounded-lg text-xs capitalize">
                                                <SelectValue placeholder="Select status" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl">
                                                {STATUS_OPTIONS.map((status) => (
                                                    <SelectItem
                                                        key={status}
                                                        value={status}
                                                        className="text-xs capitalize"
                                                    >
                                                        {status}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="block text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                                            Start Date
                                        </Label>
                                        <Popover
                                            open={openCalender}
                                            onOpenChange={setOpenCalender}
                                        >
                                            <PopoverTrigger asChild>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    className="h-10 w-full justify-between rounded-lg px-3 text-left text-xs font-normal"
                                                >
                                                    {date ? formatDate(date) : 'Select date'}
                                                    <ChevronDownIcon className="h-4 w-4" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent
                                                className="w-auto overflow-hidden rounded-xl p-0"
                                                align="start"
                                            >
                                                <Calendar
                                                    mode="single"
                                                    selected={date}
                                                    captionLayout="dropdown"
                                                    defaultMonth={date}
                                                    onSelect={(selectedDate) => {
                                                        setDate(selectedDate)
                                                        setOpenCalender(false)
                                                    }}
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-3 md:grid-cols-3">
                                <div className="rounded-xl border bg-background p-3">
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                                        Total Deductions
                                    </p>
                                    <p className="mt-1 text-lg font-bold text-red-600">
                                        {formatCurrency(totalDeductions)}
                                    </p>
                                </div>

                                <div className="rounded-xl border bg-background p-3">
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                                        Net Disbursement
                                    </p>
                                    <p className="mt-1 text-lg font-bold text-emerald-600">
                                        {formatCurrency(netDisbursement)}
                                    </p>
                                </div>

                                <div className="rounded-xl border bg-background p-3">
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                                        Current Status
                                    </p>
                                    <div className="mt-2">
                                        <StatusValue status={applicationStatus} />
                                    </div>
                                </div>
                            </div>

                            <div className="overflow-hidden rounded-xl border">
                                <div className="grid grid-cols-3 border-b bg-muted/40 px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                                    <div>Deduction Type</div>
                                    <div>Calculation</div>
                                    <div className="text-right">Amount</div>
                                </div>

                                <div className="bg-background">
                                    {editableDeductions.map((item, index) => {
                                        const fixed = isFixedDeduction(item)
                                        const isCalculationEditing = editingCalculationKey === item.key
                                        const isAmountEditing = editingAmountKey === item.key

                                        return (
                                            <div
                                                key={item.key}
                                                className="grid grid-cols-3 items-center gap-3 border-b px-4 py-3 text-xs"
                                            >
                                                <div className="font-medium text-foreground">
                                                    {item.label}
                                                </div>

                                                <div>
                                                    {fixed ? (
                                                        <div className="flex h-9 items-center rounded-lg border bg-muted/40 px-3 text-xs text-foreground">
                                                            {item.calculation}
                                                        </div>
                                                    ) : isCalculationEditing ? (
                                                        <Input
                                                            autoFocus
                                                            value={item.calculation}
                                                            onChange={(event) =>
                                                                handleDeductionCalculationChange(
                                                                    index,
                                                                    event.target.value
                                                                )
                                                            }
                                                            onBlur={() => setEditingCalculationKey(null)}
                                                            onKeyDown={(event) => {
                                                                if (event.key === 'Enter') {
                                                                    setEditingCalculationKey(null)
                                                                }
                                                            }}
                                                            placeholder="Ex. 5% of Principal"
                                                            className="h-9 rounded-lg text-xs"
                                                        />
                                                    ) : (
                                                        <div
                                                            onDoubleClick={() =>
                                                                setEditingCalculationKey(item.key)
                                                            }
                                                            className="flex h-9 cursor-pointer items-center rounded-lg border bg-background px-3 text-xs text-foreground"
                                                            title="Double click to edit"
                                                        >
                                                            {item.calculation}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex justify-end">
                                                    {fixed ? (
                                                        <div className="flex h-9 w-[150px] items-center justify-end rounded-lg border bg-muted/40 px-3 text-xs font-medium text-foreground">
                                                            {Number(item.amount).toFixed(2)}
                                                        </div>
                                                    ) : isAmountEditing ? (
                                                        <Input
                                                            autoFocus
                                                            type="number"
                                                            step="0.01"
                                                            min="0"
                                                            value={item.amount}
                                                            onChange={(event) =>
                                                                handleDeductionAmountChange(
                                                                    index,
                                                                    event.target.value
                                                                )
                                                            }
                                                            onBlur={() => setEditingAmountKey(null)}
                                                            onKeyDown={(event) => {
                                                                if (event.key === 'Enter') {
                                                                    setEditingAmountKey(null)
                                                                }
                                                            }}
                                                            className="h-9 w-[150px] rounded-lg text-right text-xs"
                                                        />
                                                    ) : (
                                                        <div
                                                            onDoubleClick={() =>
                                                                setEditingAmountKey(item.key)
                                                            }
                                                            className="flex h-9 w-[150px] cursor-pointer items-center justify-end rounded-lg border bg-background px-3 text-xs font-medium text-foreground"
                                                            title="Double click to edit"
                                                        >
                                                            {Number(item.amount).toFixed(2)}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}

                                    <div className="grid grid-cols-3 items-center bg-muted/30 px-4 py-3">
                                        <div />
                                        <div className="text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-foreground">
                                            Total Deductions
                                        </div>
                                        <div className="text-right text-xl font-bold text-red-600">
                                            {formatCurrency(totalDeductions)}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            <div className="sticky bottom-0 flex flex-wrap items-center justify-end gap-2 border-t bg-background py-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="rounded-xl"
                                    onClick={() => onOpenChange(false)}
                                    disabled={approveLoanApplicationMutation.isPending}
                                >
                                    Close
                                </Button>

                                <Button
                                    type="button"
                                    variant="destructive"
                                    className="rounded-xl"
                                    onClick={handleRejectApplication}
                                    disabled={approveLoanApplicationMutation.isPending}
                                >
                                    {approveLoanApplicationMutation.isPending ? 'Submitting...' : 'Reject'}
                                </Button>

                                <Button
                                    type="button"
                                    className="rounded-xl"
                                    onClick={handleApproveApplication}
                                    disabled={approveLoanApplicationMutation.isPending || isLoanApproved}
                                >
                                    {approveLoanApplicationMutation.isPending
                                        ? 'Submitting...'
                                        : isLoanApproved
                                            ? 'Approved'
                                            : 'Approve'}
                                </Button>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </DialogContent>
        </Dialog>
    )
}