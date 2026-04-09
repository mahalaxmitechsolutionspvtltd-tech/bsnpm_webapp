'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import {
    approveWithdrawalRequestHandler,
    rejectWithdrawalRequestHandler
} from '@/services/depositeWithdrawalHandler'
import { DepositWithdrawalItem, WithdrawalStatus } from '@/types/depositeWithdrawalRequest'
import {
    CheckCircle2,
    Clock3,
    IndianRupee,
    Loader2,
    ReceiptText,
    User2,
    Wallet2,
    XCircle
} from 'lucide-react'

interface DepositWithdrawalDetailsDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    data: DepositWithdrawalItem | null
    onSuccess?: () => void
}

const statusConfig: Record<
    WithdrawalStatus,
    {
        badgeClassName: string
        icon: React.ComponentType<{ className?: string }>
        label: string
    }
> = {
    PENDING: {
        badgeClassName: 'border-amber-200 bg-amber-50 text-amber-700',
        icon: Clock3,
        label: 'Pending'
    },
    APPROVED: {
        badgeClassName: 'border-emerald-200 bg-emerald-50 text-emerald-700',
        icon: CheckCircle2,
        label: 'Approved'
    },
    REJECTED: {
        badgeClassName: 'border-red-200 bg-red-50 text-red-700',
        icon: XCircle,
        label: 'Rejected'
    }
}

const formatCurrency = (value: string | number) => {
    const numberValue = typeof value === 'number' ? value : Number(value)

    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(Number.isFinite(numberValue) ? numberValue : 0)
}

const SummaryCard = ({
    label,
    value,
    subValue,
    icon: Icon,
    badge
}: {
    label: string
    value: React.ReactNode
    subValue?: React.ReactNode
    icon: React.ComponentType<{ className?: string }>
    badge?: React.ReactNode
}) => {
    return (
        <div className='rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm'>
            <div className='mb-2 flex items-start justify-between gap-3'>
                <div className='flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500'>
                    <Icon className='h-3.5 w-3.5' />
                    <span>{label}</span>
                </div>
                {badge}
            </div>
            <div className='text-[17px] font-semibold tracking-tight text-slate-950'>{value || '-'}</div>
            {subValue ? <div className='mt-1 text-sm font-medium text-slate-500'>{subValue}</div> : null}
        </div>
    )
}

const SectionCard = ({
    title,
    icon: Icon,
    children
}: {
    title: string
    icon: React.ComponentType<{ className?: string }>
    children: React.ReactNode
}) => {
    return (
        <div className='overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm'>
            <div className='border-b border-slate-200 px-4 py-3'>
                <div className='flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500'>
                    <Icon className='h-4 w-4' />
                    <span>{title}</span>
                </div>
            </div>
            <div className='px-4 py-2'>{children}</div>
        </div>
    )
}

const DataRow = ({
    label,
    value,
    strong = false
}: {
    label: string
    value: React.ReactNode
    strong?: boolean
}) => {
    return (
        <div className='flex items-start justify-between gap-4 py-2.5'>
            <div className='text-sm font-medium text-slate-500'>{label}</div>
            <div
                className={cn(
                    'max-w-[58%] break-words text-right text-sm leading-6 text-slate-900',
                    strong ? 'font-semibold' : 'font-medium'
                )}
            >
                {value || '-'}
            </div>
        </div>
    )
}

const DepositWithdrawalDetailsDialog = ({
    open,
    onOpenChange,
    data,
    onSuccess
}: DepositWithdrawalDetailsDialogProps) => {
    const queryClient = useQueryClient()

    const approveMutation = useMutation({
        mutationFn: async (row: DepositWithdrawalItem) => {
            return approveWithdrawalRequestHandler(row.id, {
                updated_by: row.updated_by || 'Admin'
            })
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['withdrawal-requests'] })
            onOpenChange(false)
            onSuccess?.()
        }
    })

    const rejectMutation = useMutation({
        mutationFn: async (row: DepositWithdrawalItem) => {
            return rejectWithdrawalRequestHandler(row.id, {
                updated_by: row.updated_by || 'Admin'
            })
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['withdrawal-requests'] })
            onOpenChange(false)
            onSuccess?.()
        }
    })

    if (!data) {
        return null
    }

    const currentStatus = statusConfig[data.status] ?? statusConfig.PENDING
    const StatusIcon = currentStatus.icon
    const isPending = data.status === 'PENDING'
    const isBusy = approveMutation.isPending || rejectMutation.isPending

    const handleApprove = () => {
        if (!isPending || isBusy) {
            return
        }

        approveMutation.mutate(data)
    }

    const handleReject = () => {
        if (!isPending || isBusy) {
            return
        }

        rejectMutation.mutate(data)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className='max-h-[90vh] overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 p-0 shadow-2xl lg:max-w-4xl'>
                <div className='border-b border-slate-200 bg-white px-6 py-5'>
                    <DialogHeader className='space-y-3 text-left'>
                        <div className='flex flex-col gap-4 md:flex-row md:items-start md:justify-between'>
                            <div className='space-y-1'>
                                <DialogTitle className='text-[24px] font-semibold tracking-tight text-slate-950'>
                                    Withdrawal Request Details
                                </DialogTitle>
                                <p className='text-sm leading-6 text-slate-500'>
                                    Review member information and withdrawal request details before taking action.
                                </p>
                            </div>

                            <Badge
                                variant='outline'
                                className={cn(
                                    'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em]',
                                    currentStatus.badgeClassName
                                )}
                            >
                                <StatusIcon className='h-3.5 w-3.5' />
                                {currentStatus.label}
                            </Badge>
                        </div>
                    </DialogHeader>
                </div>

                <ScrollArea className='max-h-[calc(90vh-150px)]'>
                    <div className='space-y-5 p-5'>
                        <div className='grid grid-cols-1 gap-4 lg:grid-cols-3'>
                            <SummaryCard
                                label='Member Name'
                                value={data.member_name || '-'}
                                subValue='Member details'
                                icon={User2}
                            />
                            <SummaryCard
                                label='Member ID'
                                value={data.member_id}
                                subValue='Member reference'
                                icon={User2}
                            />
                            <SummaryCard
                                label='Requested Amount'
                                value={formatCurrency(data.requested_amount)}
                                subValue='Withdrawal value'
                                icon={IndianRupee}
                            />
                        </div>

                        <div className='grid grid-cols-1 gap-5 lg:grid-cols-2'>
                            <SectionCard title='Withdrawal Overview' icon={ReceiptText}>
                                <DataRow label='Application No' value={data.application_no} strong />
                                <Separator className='bg-slate-200' />
                                <DataRow label='Scheme Name' value={data.scheme_name} />
                                <Separator className='bg-slate-200' />
                                <DataRow label='Installments Paid' value={data.total_installments_paid} />
                                <Separator className='bg-slate-200' />
                                <DataRow label='Status' value={currentStatus.label} />
                            </SectionCard>

                            <SectionCard title='Amount Summary' icon={Wallet2}>
                                <DataRow label='Total Amount Paid' value={formatCurrency(data.total_amount_paid)} />
                                <Separator className='bg-slate-200' />
                                <DataRow label='Calculated Interest' value={formatCurrency(data.calculated_interest)} />
                                <Separator className='bg-slate-200' />
                                <DataRow label='Final Maturity Amount' value={formatCurrency(data.final_maturity_amount)} />
                                <Separator className='bg-slate-200' />
                                <DataRow label='Requested Amount' value={formatCurrency(data.requested_amount)} strong />
                            </SectionCard>
                        </div>
                    </div>
                </ScrollArea>

                <div className='border-t border-slate-200 bg-white px-6 py-4'>
                    <div className='flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end'>
                        <Button
                            type='button'
                            variant='outline'
                            onClick={() => onOpenChange(false)}
                            disabled={isBusy}
                            className='min-w-30 rounded-xl'
                        >
                            Close
                        </Button>

                        <Button
                            type='button'
                            variant='outline'
                            onClick={handleReject}
                            disabled={!isPending || isBusy}
                            className='min-w-35 rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700'
                        >
                            {rejectMutation.isPending ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : null}
                            Reject
                        </Button>

                        <Button
                            type='button'
                            onClick={handleApprove}
                            disabled={!isPending || isBusy}
                            className='min-w-40 rounded-xl bg-slate-900 text-white hover:bg-slate-800'
                        >
                            {approveMutation.isPending ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : null}
                            Approve
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default DepositWithdrawalDetailsDialog