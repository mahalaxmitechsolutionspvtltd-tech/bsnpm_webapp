'use client'

import * as React from 'react'
import { format } from 'date-fns'
import { useMutation } from '@tanstack/react-query'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import {
    Eye,
    FileText,
    Image as ImageIcon,
    Info,
    Landmark,
    UserRound,
    Wallet,
    CalendarDays,
    ShieldCheck,
    Loader2,
} from 'lucide-react'
import type {
    PaymentHistoryDialogItem,
    PaymentHistoryTableItem,
} from '@/types/paymentsTypes'
import { formatApiDate } from '@/lib/formateApiDate'
import { approvePaymentStatusHandler } from '@/services/paymentHistoryHandler'


interface ViewProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    data: PaymentHistoryTableItem | PaymentHistoryDialogItem | null
}

const toDate = (value: unknown) => {
    if (!value) return undefined
    const raw = String(value).trim()
    if (!raw) return undefined

    const date = new Date(raw)
    return Number.isNaN(date.getTime()) ? undefined : date
}

const formatCurrency = (value: unknown) => {
    const numberValue = Number(value)
    if (Number.isNaN(numberValue)) return String(value ?? '-')

    return new Intl.NumberFormat('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(numberValue)
}

const formatDateDisplay = (value: unknown) => {
    const parsed = toDate(value)
    if (!parsed) return value ? String(value) : '-'
    return format(parsed, 'dd-MM-yyyy')
}

const getStatusTone = (status: string | null | undefined) => {
    const value = String(status ?? '').toLowerCase()

    if (value === 'approved' || value === 'paid') {
        return 'border-emerald-200 bg-emerald-50 text-emerald-700'
    }

    if (value === 'pending' || value === 'processing') {
        return 'border-amber-200 bg-amber-50 text-amber-700'
    }

    if (value === 'rejected' || value === 'failed' || value === 'cancelled') {
        return 'border-rose-200 bg-rose-50 text-rose-700'
    }

    if (value === 'partial') {
        return 'border-sky-200 bg-sky-50 text-sky-700'
    }

    if (value === 'completed') {
        return 'border-violet-200 bg-violet-50 text-violet-700'
    }

    return 'border-slate-200 bg-slate-100 text-slate-700'
}

const getSafeValue = (...values: unknown[]) => {
    for (const value of values) {
        if (value === null || value === undefined) continue
        const stringValue = String(value).trim()
        if (stringValue) return stringValue
    }
    return null
}

const getNumberOrStringValue = (...values: unknown[]) => {
    for (const value of values) {
        if (value === null || value === undefined) continue
        if (typeof value === 'number') return value
        const stringValue = String(value).trim()
        if (stringValue) return value
    }
    return null
}

const isImageFile = (value: string | null | undefined) => {
    if (!value) return false
    return /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?.*)?$/i.test(value)
}

const isPdfFile = (value: string | null | undefined) => {
    if (!value) return false
    return /\.pdf(\?.*)?$/i.test(value)
}

const StatCard = ({
    label,
    value,
    icon,
}: {
    label: string
    value: React.ReactNode
    icon?: React.ReactNode
}) => {
    return (
        <div className='rounded-xl border border-slate-200/80 bg-gradient-to-br from-white to-slate-50 px-4 py-3 shadow-xs'>
            <div className='flex items-center justify-between gap-3'>
                <div className='text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500'>
                    {label}
                </div>
                <div className='text-slate-400'>{icon}</div>
            </div>
            <div className='mt-2 text-[15px] font-semibold text-slate-900'>
                {value}
            </div>
        </div>
    )
}

const SectionTitle = ({
    title,
    icon,
    subtitle,
}: {
    title: string
    icon?: React.ReactNode
    subtitle?: string
}) => {
    return (
        <div className='flex items-start gap-3 border-b border-slate-200 px-4 py-3'>
            <div className='mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600'>
                {icon}
            </div>
            <div className='min-w-0'>
                <div className='text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-700'>
                    {title}
                </div>
                {subtitle ? (
                    <div className='mt-0.5 text-[12px] text-slate-500'>{subtitle}</div>
                ) : null}
            </div>
        </div>
    )
}

const DialogSkeleton = () => {
    return (
        <div className='max-h-[78vh] overflow-y-auto px-4 py-4 sm:px-5 sm:py-5'>
            <div className='grid gap-4'>
                <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4'>
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div
                            key={i}
                            className='rounded-xl border border-slate-200/80 bg-white px-4 py-3'
                        >
                            <Skeleton className='h-3 w-20 rounded-md' />
                            <Skeleton className='mt-3 h-6 w-32 rounded-md' />
                            <Skeleton className='mt-2 h-4 w-20 rounded-md' />
                        </div>
                    ))}
                </div>

                <div className='grid gap-4 xl:grid-cols-[1.55fr_0.95fr]'>
                    <div className='space-y-4'>
                        <div className='rounded-xl border border-slate-200 bg-white p-4'>
                            <Skeleton className='h-5 w-40 rounded-md' />
                            <Skeleton className='mt-4 h-36 w-full rounded-md' />
                        </div>
                        <div className='rounded-xl border border-slate-200 bg-white p-4'>
                            <Skeleton className='h-5 w-24 rounded-md' />
                            <Skeleton className='mt-4 h-20 w-full rounded-md' />
                            <div className='mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2'>
                                <Skeleton className='h-14 w-full rounded-md' />
                                <Skeleton className='h-14 w-full rounded-md' />
                            </div>
                        </div>
                    </div>

                    <div className='rounded-xl border border-slate-200 bg-white p-4'>
                        <Skeleton className='h-5 w-28 rounded-md' />
                        <Skeleton className='mt-4 h-72 w-full rounded-md' />
                    </div>
                </div>
            </div>
        </div>
    )
}

const DetailRow = ({
    label,
    value,
}: {
    label: string
    value: React.ReactNode
}) => {
    return (
        <div className='rounded-lg border border-slate-200 bg-slate-50/80 px-4 py-3'>
            <div className='text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500'>
                {label}
            </div>
            <div className='mt-1.5 wrap-break-word text-[13px] font-medium text-slate-800'>
                {value}
            </div>
        </div>
    )
}

function ProofPreviewDialog({
    open,
    onOpenChange,
    proofFileUrl,
    proofFileName,
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    proofFileUrl: string | null
    proofFileName: string | null
}) {
    const [previewFailed, setPreviewFailed] = React.useState(false)

    React.useEffect(() => {
        setPreviewFailed(false)
    }, [proofFileUrl, open])

    const proofIsImage = isImageFile(proofFileUrl)
    const proofIsPdf = isPdfFile(proofFileUrl)

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className='w-[50vw] h-[80vh] overflow-hidden rounded-xl border border-slate-200 bg-white p-0 shadow-2xl sm:max-w-6xl'>
                <DialogHeader className='border-b border-slate-200 bg-gradient-to-r from-white via-slate-50 to-white px-4 py-4 sm:px-5'>
                    <DialogTitle className='text-[18px] font-semibold tracking-tight text-slate-900'>
                        Payment Proof
                    </DialogTitle>
                    <p className='text-[13px] text-slate-500'>
                        Preview attached payment proof file
                    </p>
                </DialogHeader>

                <div className='flex h-[calc(80vh-125px)] flex-col px-4 py-4 sm:px-5'>
                    <div className='min-h-0 flex-1 overflow-hidden rounded-xl border border-slate-200 bg-slate-50'>
                        {!proofFileUrl ? (
                            <div className='flex h-full items-center justify-center'>
                                <div className='text-center'>
                                    <div className='mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-white shadow-sm'>
                                        <ImageIcon className='h-7 w-7 text-slate-400' />
                                    </div>
                                    <div className='mt-3 text-[14px] font-medium text-slate-600'>
                                        No proof file found
                                    </div>
                                </div>
                            </div>
                        ) : proofIsImage && !previewFailed ? (
                            <img
                                src={proofFileUrl}
                                alt='Payment proof'
                                className='h-full w-full object-contain'
                                onError={() => setPreviewFailed(true)}
                            />
                        ) : proofIsPdf && !previewFailed ? (
                            <iframe
                                src={proofFileUrl}
                                title='Payment proof preview'
                                className='h-full w-full bg-white'
                            />
                        ) : (
                            <div className='flex h-full items-center justify-center p-6'>
                                <div className='text-center'>
                                    <div className='mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm'>
                                        <FileText className='h-7 w-7 text-slate-400' />
                                    </div>
                                    <div className='mt-3 text-[14px] font-medium text-slate-600'>
                                        Preview not available
                                    </div>
                                    <div className='mt-1 text-[12px] text-slate-400'>
                                        This file cannot be previewed here
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter className='border-t border-slate-200 bg-slate-50/80 px-4 py-3 sm:px-5'>
                    <DialogClose asChild>
                        <Button
                            type='button'
                            variant='outline'
                            className='rounded-xl bg-white text-[13px]'
                        >
                            Close
                        </Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default function View({ open, onOpenChange, data }: ViewProps) {
    const [proofDialogOpen, setProofDialogOpen] = React.useState(false)
    const [inlinePreviewFailed, setInlinePreviewFailed] = React.useState(false)

    React.useEffect(() => {
        if (!open) {
            setProofDialogOpen(false)
        }
        setInlinePreviewFailed(false)
    }, [open, data])

    const resolved: PaymentHistoryDialogItem | PaymentHistoryTableItem | null = data ?? null

    const approvePaymentMutation = useMutation({
        mutationFn: async () => {
            if (!resolved?.id) {
                throw new Error('Account management id not found')
            }

            const applicationNo =
                getSafeValue(
                    (resolved as any)?.application_no,
                    (resolved as any)?.application_details?.application_no,
                    (resolved as any)?.raw?.application_no,
                    (resolved as any)?.raw?.application_details?.application_no
                ) ?? ''

            if (!applicationNo) {
                throw new Error('Application number not found')
            }

            return approvePaymentStatusHandler(resolved.id, {
                application_no: applicationNo,
                updated_by: 'admin',
            })
        },
        onSuccess: () => {
            onOpenChange(false)
        },
    })

    if (!resolved) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className='w-[50vw] h-[80vh] overflow-hidden rounded-xl border border-slate-200 bg-white p-0 shadow-2xl sm:max-w-5xl'>
                    <DialogHeader className='border-b border-slate-200 px-5 py-4'>
                        <DialogTitle className='text-[20px] font-semibold text-slate-900'>
                            Submission Details
                        </DialogTitle>
                    </DialogHeader>
                    <div className='px-5 py-8 text-sm text-slate-500'>No details found.</div>
                </DialogContent>
            </Dialog>
        )
    }

    const raw = (resolved as any)?.raw ?? {}
    const proof = (resolved as any)?.proof ?? {}
    const paymentDetails = raw?.payment_details ?? {}
    const applicationDetails =
        (resolved as any)?.application_details ??
        raw?.application_details ??
        {}

    const memberName =
        getSafeValue(
            (resolved as any)?.member_name,
            (resolved as any)?.member?.member_name,
            raw?.member_name,
            applicationDetails?.member_name,
            paymentDetails?.member_name
        ) ?? '-'

    const memberId =
        getSafeValue(
            (resolved as any)?.member_id,
            (resolved as any)?.member?.member_id,
            raw?.member_id,
            paymentDetails?.member_id
        ) ?? '-'

    const totalAmount = getNumberOrStringValue(
        (resolved as any)?.total_amount,
        (resolved as any)?.amount,
        raw?.total_amount,
        raw?.amount,
        applicationDetails?.amount,
        paymentDetails?.total_amount
    )

    const status =
        getSafeValue(
            (resolved as any)?.status,
            raw?.status,
            paymentDetails?.status
        ) ?? '-'

    const datePaid = getSafeValue(
        (resolved as any)?.date_paid,
        (resolved as any)?.date_of_payment,
        (resolved as any)?.submitted_on,
        raw?.date_of_payment,
        raw?.date_paid,
        raw?.created_at,
        paymentDetails?.date_of_payment
    )

    const paymentMode =
        getSafeValue(
            (resolved as any)?.payment_mode,
            raw?.payment_mode,
            applicationDetails?.payment_mode,
            paymentDetails?.payment_mode
        ) ?? '-'

    const remark =
        getSafeValue(
            (resolved as any)?.remark,
            raw?.remark,
            paymentDetails?.remark
        ) ?? 'No remark added'

    const referenceTrn =
        getSafeValue(
            (resolved as any)?.reference_trn,
            raw?.reference_trn,
            raw?.utr,
            paymentDetails?.reference_trn
        ) ?? '-'

    const submittedAt =
        getSafeValue(
            (resolved as any)?.submitted_at,
            raw?.submitted_at,
            raw?.created_at,
            paymentDetails?.created_at,
            (resolved as any)?.created_at
        ) ?? '-'

    const proofFileUrl =
        getSafeValue(
            (resolved as any)?.proof_file_url,
            (resolved as any)?.proof_file,
            proof?.file_url,
            proof?.url,
            raw?.proof_file_url,
            raw?.proof_file,
            raw?.proof?.file_url,
            raw?.payment_details?.proof_file,
            raw?.payment_details?.proof_file_url
        ) ?? null

    const proofFileName =
        getSafeValue(
            (resolved as any)?.proof_file_name,
            proof?.file_name,
            raw?.proof_file_name,
            raw?.proof?.file_name
        ) ??
        (proofFileUrl
            ? proofFileUrl.split('?')[0].split('/').pop() ?? null
            : null)

    const proofIsImage = isImageFile(proofFileUrl)
    const proofIsPdf = isPdfFile(proofFileUrl)

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className='w-[55vw] h-[80vh] overflow-hidden rounded-xl border border-slate-200 bg-white p-0 shadow-2xl sm:max-w-5xl'>
                    <DialogHeader className='border-b border-slate-200 bg-linear-to-r from-white via-slate-50 to-white px-4 py-4 sm:px-5'>
                        <DialogTitle className='text-[18px] sm:text-[20px] font-semibold tracking-tight text-slate-900'>
                            Submission Details
                        </DialogTitle>
                        <p className='text-[12px] sm:text-[13px] text-slate-500'>
                            Review member payments submission and take action
                        </p>
                    </DialogHeader>

                    {!resolved ? (
                        <DialogSkeleton />
                    ) : (
                        <div className='max-h-[80vh] overflow-y-auto px-4  sm:px-5'>
                            <div className='grid gap-4'>
                                <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4'>
                                    <StatCard
                                        label='Member'
                                        icon={<UserRound className='h-4 w-4' />}
                                        value={
                                            <div>
                                                <div className='truncate'>{memberName}</div>
                                                <div className='mt-1 text-[11px] font-medium text-slate-500'>
                                                    {memberId}
                                                </div>
                                            </div>
                                        }
                                    />

                                    <StatCard
                                        label='Total Amount'
                                        icon={<Wallet className='h-4 w-4' />}
                                        value={`₹ ${formatCurrency(totalAmount)}`}
                                    />

                                    <StatCard
                                        label='Status'
                                        icon={<ShieldCheck className='h-4 w-4' />}
                                        value={
                                            <Badge
                                                className={cn(
                                                    'rounded-lg border px-2.5 py-1 text-[12px] font-semibold capitalize shadow-xs',
                                                    getStatusTone(status)
                                                )}
                                            >
                                                {status}
                                            </Badge>
                                        }
                                    />

                                    <StatCard
                                        label='Date Paid'
                                        icon={<CalendarDays className='h-4 w-4' />}
                                        value={formatDateDisplay(datePaid)}
                                    />
                                </div>

                                <div className='grid gap-4 xl:grid-cols-[1.55fr_0.95fr]'>
                                    <div className='space-y-4'>
                                        <div className='overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs'>
                                            <SectionTitle
                                                title='Scheme Breakdown'
                                                subtitle='Primary payment information'
                                                icon={<Landmark className='h-4 w-4' />}
                                            />

                                            <div className='overflow-x-auto'>
                                                <table className='w-full min-w-135'>
                                                    <thead className='bg-slate-50'>
                                                        <tr className='border-b border-slate-200'>
                                                            <th className='px-2  text-left text-[11px] font-semibold text-slate-500'>
                                                                Scheme
                                                            </th>
                                                            <th className='px-2  py-2 text-left text-[11px] font-semibold text-slate-500'>
                                                                Application No
                                                            </th>
                                                            <th className='px-2  py-2 text-left text-[11px] font-semibold text-slate-500'>
                                                                Amount
                                                            </th>
                                                            <th className='px-2 py-2  text-left text-[11px] font-semibold text-slate-500'>
                                                                Mode
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        <tr className='align-middle'>
                                                            <td className='px-4 py-3 text-[13px] font-medium text-slate-800'>
                                                                {applicationDetails?.title ?? '-'}
                                                            </td>
                                                            <td className='px-4 py-3 text-[13px] text-slate-700'>
                                                                {applicationDetails?.application_no ??
                                                                    (resolved as any)?.application_no ??
                                                                    '-'}
                                                            </td>
                                                            <td className='px-4 py-3 text-[13px] font-semibold text-slate-900'>
                                                                ₹ {formatCurrency(
                                                                    applicationDetails?.amount ??
                                                                    (resolved as any)?.amount
                                                                )}
                                                            </td>
                                                            <td className='px-4 py-3 text-[13px] capitalize text-slate-700'>
                                                                {paymentMode}
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>

                                        <div className='overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs'>
                                            <SectionTitle
                                                title='Remark'
                                                subtitle='Transaction notes and metadata'
                                                icon={<Info className='h-4 w-4' />}
                                            />

                                            <div className='p-4'>
                                                <div className='rounded-md bg-slate-100 px-4 py-2  text-[14px] italic text-slate-700'>
                                                    {remark}
                                                </div>

                                                <div className='mt-4 grid gap-4 sm:grid-cols-2'>
                                                    <DetailRow
                                                        label='UTR / Reference'
                                                        value={referenceTrn}
                                                    />
                                                    <DetailRow
                                                        label='Submitted At'
                                                        value={formatApiDate(submittedAt)}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className='overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs'>
                                        <div className='p-4'>
                                            <div className='flex h-50 sm:h-64 md:h-72 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50'>
                                                {!proofFileUrl ? (
                                                    <div className='text-center'>
                                                        <ImageIcon className='mx-auto h-8 w-8 text-slate-300' />
                                                        <div className='mt-2 text-[13px] text-slate-500'>
                                                            No proof file found
                                                        </div>
                                                    </div>
                                                ) : proofIsImage && !inlinePreviewFailed ? (
                                                    <img
                                                        src={proofFileUrl}
                                                        alt='Receipt proof'
                                                        className='h-full w-full object-contain'
                                                        onError={() => setInlinePreviewFailed(true)}
                                                    />
                                                ) : proofIsPdf && !inlinePreviewFailed ? (
                                                    <iframe
                                                        src={proofFileUrl}
                                                        title='Receipt proof preview'
                                                        className='h-full w-full bg-white'
                                                    />
                                                ) : (
                                                    <div className='text-center px-4'>
                                                        <FileText className='mx-auto h-10 w-10 text-slate-400' />
                                                        <div className='mt-3 text-[13px] font-medium text-slate-700 break-all'>
                                                            {proofFileName ?? 'Proof file attached'}
                                                        </div>
                                                        <div className='mt-1 text-[12px] text-slate-500'>
                                                            Click below to preview the proof
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className='border-t border-slate-200 px-4 py-2'>
                                            {proofFileUrl ? (
                                                <Button
                                                    type='button'
                                                    variant='default'
                                                    onClick={() => setProofDialogOpen(true)}
                                                    className='rounded-xl text-[13px]'
                                                >
                                                    <Eye className='mr-2 h-4 w-4' />
                                                    Show Proof
                                                </Button>
                                            ) : (
                                                <div className='text-[13px] text-slate-400'>
                                                    No file attached
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter className='border-t border-slate-200 bg-slate-50/80 px-4 py-3 sm:px-5'>
                        <DialogClose asChild>
                            <Button
                                type='button'
                                variant='outline'
                                className='rounded-xl bg-white text-[13px]'
                                disabled={approvePaymentMutation.isPending}
                            >
                                Close
                            </Button>
                        </DialogClose>

                        <Button
                            variant='default'
                            className='rounded-xl text-[13px]'
                            onClick={() => approvePaymentMutation.mutate()}
                            disabled={approvePaymentMutation.isPending}
                        >
                            {approvePaymentMutation.isPending ? (
                                <>
                                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                                    Approving...
                                </>
                            ) : (
                                'Approve payment'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ProofPreviewDialog
                open={proofDialogOpen}
                onOpenChange={setProofDialogOpen}
                proofFileUrl={proofFileUrl}
                proofFileName={proofFileName}
            />
        </>
    )
}