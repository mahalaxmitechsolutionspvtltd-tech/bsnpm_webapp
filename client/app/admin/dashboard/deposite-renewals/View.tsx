'use client'

import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { approveDepositRenewalApplication } from '@/services/depositeHandler'
import React from 'react'
import { Spinner } from '@/components/ui/spinner'

type RenewalInstallmentItem = {
    date?: string | null
    amount?: string | number | null
    status?: string | null
    updated_by?: string | null
}

type RenewalApplicationStatus = 'PENDING' | 'REJECTED' | 'APPROVED'

type RenewalApplicationData = {
    renewal_application_no?: string
    deposit_application_id?: number | string | null
    old_application_no?: string
    member_id?: string
    member_name?: string
    scheme_name?: string
    current_deposit_amount?: string | number | null
    status?: RenewalApplicationStatus | string | null
    installment_json?: RenewalInstallmentItem[]
}

interface ViewRenewalsProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    applicationData?: RenewalApplicationData | null
}

const formatCurrency = (value: string | number | null | undefined) => {
    const amount = Number(value ?? 0)
    if (Number.isNaN(amount)) return '₹ 0.00'

    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount)
}

const getStatusBadgeClass = (status: string) => {
    switch (status?.toUpperCase()) {
        case 'PAID':
        case 'APPROVED':
            return 'border-emerald-200 bg-emerald-50 text-emerald-700'
        case 'PENDING':
            return 'border-amber-200 bg-amber-50 text-amber-700'
        case 'UNPAID':
        case 'REJECTED':
        case 'OVERDUE':
            return 'border-rose-200 bg-rose-50 text-rose-700'
        default:
            return 'border-slate-200 bg-slate-50 text-slate-700'
    }
}

export default function ViewRenewals({
    open,
    onOpenChange,
    applicationData,
}: ViewRenewalsProps) {
    const queryClient = useQueryClient()

    const installmentRows = useMemo<RenewalInstallmentItem[]>(() => {
        if (!applicationData?.installment_json) return []
        return Array.isArray(applicationData.installment_json)
            ? applicationData.installment_json
            : []
    }, [applicationData])

    const [selectedStatus, setSelectedStatus] = useState<RenewalApplicationStatus>('PENDING')

    useEffect(() => {
        if (!open) return

        const normalizedStatus = String(applicationData?.status ?? 'PENDING').toUpperCase()

        if (
            normalizedStatus === 'PENDING' ||
            normalizedStatus === 'REJECTED' ||
            normalizedStatus === 'APPROVED'
        ) {
            setSelectedStatus(normalizedStatus as RenewalApplicationStatus)
        } else {
            setSelectedStatus('PENDING')
        }
    }, [open, applicationData])

    const approveRenewalMutation = useMutation({
        mutationFn: async () => {
            if (!applicationData?.renewal_application_no) {
                throw new Error('Renewal application number is required.')
            }

            if (!applicationData?.old_application_no) {
                throw new Error('Old application number is required.')
            }

            if (!applicationData?.member_id) {
                throw new Error('Member ID is required.')
            }

            return await approveDepositRenewalApplication({
                renewal_application_no: applicationData.renewal_application_no,
                old_application_no: applicationData.old_application_no,
                member_id: applicationData.member_id,
                status: selectedStatus,
            })
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: ['deposite-renewals-applicaions'],
            })

            onOpenChange(false)
        },
    })

    const handleUpdateRenewalStatus = async () => {
        await approveRenewalMutation.mutateAsync()
    }

    const isSubmitting = approveRenewalMutation.isPending

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="rounded-xl lg:max-w-5xl">
                <DialogHeader className="space-y-3 border-b pb-4 text-left">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0 flex-1">
                            <DialogTitle className="space-y-1">
                                <div className="truncate text-sm font-semibold leading-tight">
                                    {applicationData?.renewal_application_no ?? '-'}
                                </div>
                                <div className="text-2xl  text-primary font-bold">
                                    {applicationData?.member_name ?? 'Member Details'}
                                </div>
                            </DialogTitle>
                        </div>


                    </div>

                    <DialogDescription asChild>
                        <div className=' flex justify-between'>
                            <div className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm text-foreground sm:grid-cols-2">
                                <div>
                                    Deposit ID:{' '}
                                    <span className="font-medium">
                                        {applicationData?.deposit_application_id ?? '-'}
                                    </span>
                                </div>

                                <div>
                                    Member ID:{' '}
                                    <span className="font-medium">
                                        {applicationData?.member_id ?? '-'}
                                    </span>
                                </div>

                                <div>
                                    Member Name:{' '}
                                    <span className="font-medium">
                                        {applicationData?.member_name ?? '-'}
                                    </span>
                                </div>

                                <div>
                                    Old Application No:{' '}
                                    <span className="font-medium">
                                        {applicationData?.old_application_no ?? '-'}
                                    </span>
                                </div>

                                <div>
                                    Scheme:{' '}
                                    <span className="font-medium">
                                        {applicationData?.scheme_name ?? '-'}
                                    </span>
                                </div>

                                <div>
                                    Current Deposit:{' '}
                                    <span className="font-medium">
                                        {formatCurrency(applicationData?.current_deposit_amount)}
                                    </span>
                                </div>
                            </div>
                            <div className="w-full lg:w-52">
                                <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                                    Status
                                </label>
                                <Select
                                    value={selectedStatus}
                                    onValueChange={(value) =>
                                        setSelectedStatus(value as RenewalApplicationStatus)
                                    }
                                    disabled={isSubmitting}
                                >
                                    <SelectTrigger className="w-full rounded-xl">
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="PENDING">Pending</SelectItem>
                                        <SelectItem value="REJECTED">Rejected</SelectItem>
                                        <SelectItem value="APPROVED">Approved</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="h-105 rounded-md border">
                    <div className="p-4">
                        {installmentRows.length === 0 ? (
                            <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
                                No installment data found.
                            </div>
                        ) : (
                            <div className="overflow-hidden rounded-xl border">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/40">
                                            <TableHead className="w-20">#</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Amount</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Updated By</TableHead>
                                        </TableRow>
                                    </TableHeader>

                                    <TableBody>
                                        {installmentRows.map((item, index) => {
                                            const status = String(item.status ?? 'pending').toUpperCase()

                                            return (
                                                <TableRow key={`${item.date ?? 'date'}-${index}`}>
                                                    <TableCell>{index + 1}</TableCell>
                                                    <TableCell>{item.date ?? '-'}</TableCell>
                                                    <TableCell>{formatCurrency(item.amount)}</TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            className={cn(
                                                                'rounded-full border px-2.5 py-1 text-xs font-semibold',
                                                                getStatusBadgeClass(status)
                                                            )}
                                                        >
                                                            {status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>{item.updated_by ?? '-'}</TableCell>
                                                </TableRow>
                                            )
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </div>
                </ScrollArea>

                <div className="flex items-center justify-end gap-2">
                    <DialogClose asChild>
                        <Button
                            className="rounded-xl"
                            variant="outline"
                            disabled={isSubmitting}
                        >
                            Close
                        </Button>
                    </DialogClose>

                    <Button
                        className="rounded-xl"
                        onClick={handleUpdateRenewalStatus}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <Spinner />
                                Updating...
                            </>
                        ) : (
                            'Submit application'
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}