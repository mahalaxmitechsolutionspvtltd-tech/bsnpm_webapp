import * as React from "react"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
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
    DepositApplication,
    DepositAccountManagementItem,
} from "@/types/depositeTypes"
import { cn } from "@/lib/utils"
import {
    ExternalLink,
    Image as ImageIcon,
    Info,
    Landmark,
    Loader2,
    ReceiptText,
    X,
} from "lucide-react"
import { Spinner } from "@/components/ui/spinner"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
    applicationStartDateUpdateHandler,
    statusUpdateHandler,
} from "@/services/depositeHandler"
import { useAuth } from "@/providers/auth-provider"

interface ViewProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    data: DepositApplication | null
    onStatusSave?: (payload: {
        id: number | string
        status: string
    }) => Promise<void> | void
    onDateSave?: (payload: {
        id: number | string
        start_date: string
        end_date: string
    }) => Promise<void> | void
    saving?: boolean
    dateSaving?: boolean
}

type DepositStatus =
    | "pending"
    | "approved"
    | "rejected"
    | "active"
    | "inprogress"
    | "completed"
    | "closed"
    | "withdrawn"

const toDate = (value: unknown) => {
    if (!value) return undefined
    const stringValue = String(value).trim()
    if (!stringValue) return undefined

    const cleanValue = stringValue.includes("T")
        ? stringValue.split("T")[0]
        : stringValue

    const date = new Date(cleanValue)
    return Number.isNaN(date.getTime()) ? undefined : date
}

const formatCurrency = (value: unknown) => {
    const numberValue = Number(value)
    if (Number.isNaN(numberValue)) return String(value ?? "-")

    return new Intl.NumberFormat("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(numberValue)
}

const formatDateDisplay = (value: unknown) => {
    const parsed = toDate(value)
    if (!parsed) return "-"
    return format(parsed, "dd-MM-yyyy")
}

const formatDateTimeDisplay = (value: unknown) => {
    if (!value) return "-"
    const date = new Date(String(value))
    if (Number.isNaN(date.getTime())) return String(value)
    return format(date, "yyyy-MM-dd HH:mm:ss")
}

const getStatusTone = (status: string) => {
    const value = status.toLowerCase()

    if (value === "approved") {
        return "border-emerald-200 bg-emerald-50 text-emerald-700"
    }
    if (value === "pending") {
        return "border-amber-200 bg-amber-50 text-amber-700"
    }
    if (value === "rejected") {
        return "border-rose-200 bg-rose-50 text-rose-700"
    }
    if (value === "active") {
        return "border-sky-200 bg-sky-50 text-sky-700"
    }
    if (value === "completed") {
        return "border-violet-200 bg-violet-50 text-violet-700"
    }
    if (value === "closed") {
        return "border-slate-300 bg-slate-100 text-slate-700"
    }

    return "border-slate-200 bg-slate-100 text-slate-700"
}

const getBaseUrl = () => {
    return (
        process.env.NEXT_PUBLIC_API_BASE_URL
            ?.replace(/\/api\/?$/, "")
            ?.replace(/\/$/, "") ?? ""
    )
}

const normalizeFilePath = (value: unknown) => {
    if (!value) return null
    const stringValue = String(value).trim()
    if (!stringValue) return null
    return stringValue
}

const buildProofFileCandidates = (proofFile: unknown) => {
    const normalized = normalizeFilePath(proofFile)
    if (!normalized) return []

    if (/^https?:\/\//i.test(normalized)) {
        return [normalized]
    }

    const baseUrl = getBaseUrl()
    const cleanPath = normalized.replace(/^\/+/, "")

    if (!baseUrl) {
        return [normalized]
    }

    const candidates = new Set<string>()

    if (cleanPath.startsWith("storage/")) {
        candidates.add(`${baseUrl}/${cleanPath}`)
    }

    candidates.add(`${baseUrl}/storage/${cleanPath}`)
    candidates.add(`${baseUrl}/storage/payment_proofs/${cleanPath}`)
    candidates.add(`${baseUrl}/storage/payment-proof/${cleanPath}`)
    candidates.add(`${baseUrl}/storage/payment_proof/${cleanPath}`)
    candidates.add(`${baseUrl}/storage/account_management/${cleanPath}`)
    candidates.add(`${baseUrl}/storage/account-management/${cleanPath}`)
    candidates.add(`${baseUrl}/uploads/${cleanPath}`)
    candidates.add(`${baseUrl}/${cleanPath}`)

    return Array.from(candidates)
}

const isImageFile = (filePath: string | null | undefined) => {
    if (!filePath) return false
    return /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(filePath)
}

const isPdfFile = (filePath: string | null | undefined) => {
    if (!filePath) return false
    return /\.pdf(\?.*)?$/i.test(filePath)
}

const getSafeValue = (...values: unknown[]) => {
    for (const value of values) {
        if (value === null || value === undefined) continue
        const stringValue = String(value).trim()
        if (stringValue) return stringValue
    }
    return null
}

const getApplicationNoFromItem = (item: DepositAccountManagementItem) => {
    return getSafeValue(
        item?.application_no,
        item?.applications_json?.application_no,
        item?.matched_application_json?.application_no,
        item?.application_json?.application_no
    )
}

const getPaymentDetails = (viewData: DepositApplication | null) => {
    if (!viewData) return null

    // ✅ New backend structure - payment_details directly on application
    const pd = (viewData as any)?.payment_details
    const mj = (viewData as any)?.matched_application_json

    if (pd) {
        return {
            raw: pd,
            application_no: getSafeValue(viewData?.application_no),
            payment_mode: getSafeValue(pd?.payment_mode),
            reference_trn: getSafeValue(pd?.reference_trn),
            remark: getSafeValue(pd?.remark),
            proof_file: getSafeValue(pd?.proof_file),
            date_of_payment: getSafeValue(pd?.date_of_payment),
            total_amount: getSafeValue(
                pd?.total_amount,
                mj?.amount,
                viewData?.deposit_amount
            ),
            status: getSafeValue(pd?.status, viewData?.status),
            submitted_at: getSafeValue(pd?.created_at),
            member_name: getSafeValue(viewData?.member_name),
            member_id: getSafeValue(viewData?.member_id),
        }
    }

    // ✅ Fallback - old account_management array structure
    const raw = viewData?.account_management
    if (!raw) return null

    const items = Array.isArray(raw) ? raw : [raw]
    if (!items.length) return null

    const currentApplicationNo = String(viewData?.application_no ?? "").trim()

    const matchedByApplicationNo = items.find((item) => {
        const itemApplicationNo = String(getApplicationNoFromItem(item) ?? "").trim()
        return (
            currentApplicationNo &&
            itemApplicationNo &&
            itemApplicationNo === currentApplicationNo
        )
    })

    const resolved = matchedByApplicationNo ?? items[0]
    if (!resolved) return null

    return {
        raw: resolved,
        application_no: getSafeValue(
            resolved.application_no,
            resolved.applications_json?.application_no,
            resolved.matched_application_json?.application_no,
            viewData?.application_no
        ),
        payment_mode: getSafeValue(
            resolved.payment_mode,
            resolved.applications_json?.payment_mode,
            resolved.matched_application_json?.payment_mode
        ),
        reference_trn: getSafeValue(
            resolved.reference_trn,
            resolved.applications_json?.reference_trn,
            resolved.matched_application_json?.reference_trn
        ),
        remark: getSafeValue(
            resolved.remark,
            resolved.applications_json?.remark,
            resolved.matched_application_json?.remark
        ),
        proof_file: getSafeValue(
            resolved.proof_file,
            resolved.proofFile,
            resolved.file,
            resolved.proof,
            resolved.file_path,
            resolved.document,
            resolved.applications_json?.proof_file,
            resolved.applications_json?.proofFile,
            resolved.matched_application_json?.proof_file,
            resolved.matched_application_json?.proofFile
        ),
        date_of_payment: getSafeValue(
            resolved.date_of_payment,
            resolved.payment_date,
            resolved.applications_json?.date_of_payment,
            resolved.matched_application_json?.date_of_payment
        ),
        total_amount: getSafeValue(
            resolved.total_amount,
            resolved.amount,
            resolved.applications_json?.total_amount,
            resolved.matched_application_json?.total_amount,
            viewData?.deposit_amount
        ),
        status: getSafeValue(
            resolved.status,
            resolved.applications_json?.status,
            resolved.matched_application_json?.status,
            viewData?.status
        ),
        submitted_at: getSafeValue(
            resolved.created_at,
            resolved.submitted_at,
            resolved.applications_json?.created_at,
            resolved.matched_application_json?.created_at
        ),
        member_name: getSafeValue(resolved.member_name, viewData?.member_name),
        member_id: getSafeValue(resolved.member_id, viewData?.member_id),
    }
}
const updateApplicationInData = (
    oldData: any,
    applicationId: string | number,
    patch: Partial<DepositApplication>
) => {
    if (!oldData) return oldData

    if (Array.isArray(oldData)) {
        return oldData.map((item) =>
            item && String(item.id) === String(applicationId)
                ? { ...item, ...patch }
                : item
        )
    }

    if (oldData?.id && String(oldData.id) === String(applicationId)) {
        return { ...oldData, ...patch }
    }

    if (Array.isArray(oldData?.data)) {
        return {
            ...oldData,
            data: oldData.data.map((item: any) =>
                item && String(item.id) === String(applicationId)
                    ? { ...item, ...patch }
                    : item
            ),
        }
    }

    if (oldData?.data?.id && String(oldData.data.id) === String(applicationId)) {
        return {
            ...oldData,
            data: {
                ...oldData.data,
                ...patch,
            },
        }
    }

    return oldData
}

const calculateEndDateFromStart = (start: Date, tenureYears: unknown) => {
    const years = Number(tenureYears)

    if (!start || Number.isNaN(start.getTime()) || Number.isNaN(years) || years <= 0) {
        return undefined
    }

    const end = new Date(start)
    end.setFullYear(end.getFullYear() + years)
    end.setDate(end.getDate() - 1)

    return Number.isNaN(end.getTime()) ? undefined : end
}

const StatCard = ({
    label,
    value,
}: {
    label: string
    value: React.ReactNode
}) => {
    return (
        <div className="rounded-2xl border border-slate-200/80 bg-linear-to-b from-white to-slate-50 px-4 py-3 shadow-sm">
            <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                {label}
            </div>
            <div className="mt-1.5 text-[15px] font-semibold text-slate-900">
                {value}
            </div>
        </div>
    )
}

const SectionTitle = ({
    title,
    icon,
}: {
    title: string
    icon?: React.ReactNode
}) => {
    return (
        <div className="flex items-center gap-2 border-b border-slate-200/80 px-4 py-3">
            <div className="text-slate-400">{icon}</div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                {title}
            </div>
        </div>
    )
}

export default function View({ open, onOpenChange, data }: ViewProps) {
    const queryClient = useQueryClient()
    const { user } = useAuth()

    const [viewData, setViewData] = React.useState<DepositApplication | null>(data)
    const [status, setStatus] = React.useState<DepositStatus>("pending")
    const [startDate, setStartDate] = React.useState<Date | undefined>(undefined)
    const [endDate, setEndDate] = React.useState<Date | undefined>(undefined)
    const [startPopoverOpen, setStartPopoverOpen] = React.useState(false)
    const [endPopoverOpen, setEndPopoverOpen] = React.useState(false)
    const [proofUrlIndex, setProofUrlIndex] = React.useState(0)
    const [previewFailed, setPreviewFailed] = React.useState(false)

    React.useEffect(() => {
        setViewData(data)
    }, [data])

    const backendStatus = String(viewData?.status ?? "pending").toLowerCase()
    const isBackendApproved = backendStatus === "approved"

    const tenureYears = React.useMemo(() => {
        const years = Number(viewData?.tenure_years)
        return Number.isNaN(years) ? 0 : years
    }, [viewData?.tenure_years])

    const paymentDetails = React.useMemo(() => getPaymentDetails(viewData), [viewData])

    const proofFilePath = paymentDetails?.proof_file ?? null

    const proofFileCandidates = React.useMemo(
        () => buildProofFileCandidates(proofFilePath),
        [proofFilePath]
    )

    React.useEffect(() => {
        setProofUrlIndex(0)
        setPreviewFailed(false)
    }, [proofFilePath, open])

    const proofFileUrl =
        proofFileCandidates.length > 0 ? proofFileCandidates[proofUrlIndex] : null

    const proofIsImage = React.useMemo(() => isImageFile(proofFilePath), [proofFilePath])
    const proofIsPdf = React.useMemo(() => isPdfFile(proofFilePath), [proofFilePath])

    React.useEffect(() => {
        const nextStatus =
            (String(viewData?.status ?? "pending").toLowerCase() as DepositStatus) ||
            "pending"

        const existingStartDate = toDate(viewData?.start_date)
        const existingEndDate = toDate(viewData?.end_date)

        setStatus(nextStatus)
        setStartDate(existingStartDate)
        setEndDate(existingEndDate)
    }, [viewData])

    const syncApplicationCache = (
        applicationId: string | number,
        patch: Partial<DepositApplication>
    ) => {
        const allQueries = queryClient.getQueryCache().findAll()

        allQueries.forEach((query) => {
            queryClient.setQueryData(query.queryKey, (oldData: any) =>
                updateApplicationInData(oldData, applicationId, patch)
            )
        })

        setViewData((prev) => {
            if (!prev || String(prev.id) !== String(applicationId)) return prev
            return {
                ...prev,
                ...patch,
            }
        })
    }

    const saveStatus = useMutation({
        mutationKey: ["deposit-application-status-update"],
        mutationFn: async ({
            id,
            status,
        }: {
            id: number | string
            status: DepositStatus
        }) => {
            return await statusUpdateHandler(id, {
                status,
                updated_by: user?.admin_name,
            } as any)
        },
        onSuccess: (_, variables) => {
            syncApplicationCache(variables.id, {
                status: variables.status,
                updated_by: user?.admin_name,
            } as Partial<DepositApplication>)

            queryClient.invalidateQueries({
                predicate: (query) =>
                    Array.isArray(query.queryKey) &&
                    query.queryKey.some((key) =>
                        String(key).toLowerCase().includes("deposit")
                    ),
            })
        },
    })

    const saveDates = useMutation({
        mutationKey: ["deposit-application-dates-update"],
        mutationFn: async ({
            id,
            start_date,
            end_date,
        }: {
            id: number | string
            start_date: string
            end_date: string
        }) => {
            return await applicationStartDateUpdateHandler(id, {
                start_date,
                end_date,
                updated_by: user?.admin_name,
            } as any)
        },
        onSuccess: (_, variables) => {
            syncApplicationCache(variables.id, {
                start_date: variables.start_date as any,
                end_date: variables.end_date as any,
                updated_by: user?.admin_name,
            } as Partial<DepositApplication>)

            queryClient.invalidateQueries({
                predicate: (query) =>
                    Array.isArray(query.queryKey) &&
                    query.queryKey.some((key) =>
                        String(key).toLowerCase().includes("deposit")
                    ),
            })
        },
    })

    const handleSave = async () => {
        if (!viewData || saveStatus.isPending) return

        await saveStatus.mutateAsync({
            id: viewData.id,
            status,
        })
    }

    const handleDateSave = async () => {
        if (!viewData || !startDate || !endDate || !isBackendApproved || saveDates.isPending) {
            return
        }

        await saveDates.mutateAsync({
            id: viewData.id,
            start_date: format(startDate, "yyyy-MM-dd"),
            end_date: format(endDate, "yyyy-MM-dd"),
        })
    }

    const handleProofLoadError = () => {
        if (proofUrlIndex < proofFileCandidates.length - 1) {
            setProofUrlIndex((prev) => prev + 1)
            return
        }
        setPreviewFailed(true)
    }

    console.log(data?.payment_details?.payment_mode);

    const memberName = paymentDetails?.member_name ?? viewData?.member_name ?? "-"
    const memberId = paymentDetails?.member_id ?? viewData?.member_id ?? "-"
    const amount = paymentDetails?.total_amount ?? viewData?.deposit_amount ?? "-"
    const paidDate = paymentDetails?.date_of_payment ?? viewData?.created_at ?? "-"
    const schemeLabel = viewData?.scheme_name ?? "Deposit Scheme"
    const remark = paymentDetails?.remark ?? "No remark added"
    const submittedAt = paymentDetails?.submitted_at ?? viewData?.created_at ?? "-"

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[95vw] gap-0 overflow-hidden rounded-3xl border border-slate-200 bg-white p-0 shadow-2xl sm:max-w-245 select-none">
                <DialogHeader className="border-b border-slate-200 bg-linear-to-r from-white via-slate-50 to-white px-5 py-4">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <DialogTitle className="text-[20px] font-semibold tracking-tight text-slate-900">
                                Submission Details
                            </DialogTitle>
                            <p className="mt-1 text-[12px] text-slate-500">
                                Review member submission and take action
                            </p>
                        </div>

                        <DialogClose asChild>
                            <button
                                type="button"
                                className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </DialogClose>
                    </div>
                </DialogHeader>

                {!viewData ? (
                    <div className="px-5 py-8 text-sm text-slate-500">
                        No submission details found.
                    </div>
                ) : (
                    <div className="max-h-[74vh] overflow-y-auto px-5 py-4">
                        <div className="grid gap-3">
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                                <StatCard
                                    label="Member"
                                    value={
                                        <div>
                                            <div className="truncate">{memberName}</div>
                                            <div className="mt-1 text-[11px] font-medium text-slate-500">
                                                {memberId}
                                            </div>
                                        </div>
                                    }
                                />

                                <StatCard
                                    label="Total Amount"
                                    value={`₹ ${formatCurrency(amount)}`}
                                />

                                <StatCard
                                    label="Status"
                                    value={
                                        <Badge
                                            className={cn(
                                                "rounded-full border px-2.5 py-0.5 text-[11px] font-semibold capitalize shadow-sm",
                                                getStatusTone(
                                                    String(
                                                        paymentDetails?.status ??
                                                        viewData?.status ??
                                                        "pending"
                                                    )
                                                )
                                            )}
                                        >
                                            {String(
                                                paymentDetails?.status ??
                                                viewData?.status ??
                                                "pending"
                                            )}
                                        </Badge>
                                    }
                                />

                                <StatCard
                                    label="Date Paid"
                                    value={formatDateDisplay(paidDate)}
                                />
                            </div>

                            <div className="grid gap-3 lg:grid-cols-[1.55fr_0.82fr]">
                                <div className="space-y-3">
                                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                                        <SectionTitle
                                            title="Scheme Breakdown"
                                            icon={<Landmark className="h-4 w-4" />}
                                        />

                                        <div className="border-b border-slate-200 bg-slate-50/70 px-4 py-3">
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="min-w-0">
                                                    <div className="truncate text-[13px] font-semibold text-slate-800">
                                                        {memberName}
                                                    </div>
                                                </div>
                                                <div className="text-[12px] font-medium text-slate-500">
                                                    {memberId}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead className="bg-slate-50/60">
                                                    <tr className="border-b border-slate-200">
                                                        <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-500">
                                                            Scheme
                                                        </th>
                                                        <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-500">
                                                            Application No
                                                        </th>
                                                        <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-500">
                                                            Amount
                                                        </th>
                                                        <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-500">
                                                            Due / EMI Range
                                                        </th>
                                                        <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-500">
                                                            Payment Mode
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <tr className="align-middle">
                                                        <td className="px-4 py-3 text-[10px] font-medium text-slate-800">
                                                            {schemeLabel}
                                                        </td>
                                                        <td className="px-4 py-3 text-[10px] text-slate-700">
                                                            {paymentDetails?.application_no ??
                                                                viewData?.application_no ??
                                                                "-"}
                                                        </td>
                                                        <td className="px-4 py-3 text-[10px] font-semibold text-slate-900">
                                                            ₹ {formatCurrency(amount)}
                                                        </td>
                                                        <td className="px-4 py-3 text-[10px] text-slate-700">
                                                            {formatDateDisplay(paidDate)}
                                                        </td>
                                                        <td className="px-4 py-3 text-[10px] capitalize text-slate-700">
                                                            {String(
                                                                paymentDetails?.payment_mode ?? "-"
                                                            ).toLowerCase()}
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                                        <SectionTitle
                                            title="Remark"
                                            icon={<Info className="h-4 w-4" />}
                                        />

                                        <div className="p-4">
                                            <div className="rounded-2xl bg-slate-50 px-4 py-3 text-[14px] italic text-slate-700">
                                                {remark}
                                            </div>

                                            <div className="mt-3 grid gap-3 border-t border-slate-200 pt-3 md:grid-cols-2">
                                                <div>
                                                    <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                                                        UTR / Reference
                                                    </div>
                                                    <div className="mt-2 inline-flex min-h-9 items-center rounded-xl bg-slate-100 px-3 py-2 text-[13px] font-medium text-slate-800">
                                                        {paymentDetails?.reference_trn ?? "-"}
                                                    </div>
                                                </div>

                                                <div>
                                                    <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                                                        Submitted At
                                                    </div>
                                                    <div className="mt-2 text-[13px] font-medium text-slate-800">
                                                        {formatDateTimeDisplay(submittedAt)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                                    <SectionTitle
                                        title="Receipt Proof"
                                        icon={<ReceiptText className="h-4 w-4" />}
                                    />

                                    <div className="p-4">
                                        <div className="flex h-62.5 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50">
                                            {!proofFileUrl ? (
                                                <div className="text-center">
                                                    <ImageIcon className="mx-auto h-8 w-8 text-slate-300" />
                                                    <div className="mt-2 text-[13px] text-slate-500">
                                                        No proof file found
                                                    </div>
                                                </div>
                                            ) : proofIsImage && !previewFailed ? (
                                                <img
                                                    src={proofFileUrl}
                                                    alt="Receipt proof"
                                                    className="h-full w-full rounded-2xl object-contain"
                                                    onError={handleProofLoadError}
                                                />
                                            ) : proofIsPdf && !previewFailed ? (
                                                <iframe
                                                    src={proofFileUrl}
                                                    title="Receipt proof"
                                                    className="h-full w-full rounded-2xl"
                                                />
                                            ) : (
                                                <div className="text-center">
                                                    <div className="text-[14px] text-slate-500">
                                                        Preview failed
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="border-t border-slate-200 px-4 py-3">
                                        {proofFileUrl ? (
                                            <a
                                                href={proofFileUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-2 text-[13px] font-semibold text-slate-900 transition hover:text-slate-700"
                                            >
                                                <ExternalLink className="h-4 w-4" />
                                                Open Original File
                                            </a>
                                        ) : (
                                            <div className="text-[13px] text-slate-400">
                                                No file attached
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-linear-to-b from-white to-slate-50 p-4 shadow-sm">
                                <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                                    Quick Actions
                                </div>

                                <div className="grid gap-3 xl:grid-cols-[1fr_1fr_auto_auto]">
                                    <Select
                                        value={status}
                                        onValueChange={(value) => setStatus(value as DepositStatus)}
                                        disabled={saveStatus.isPending}
                                    >
                                        <SelectTrigger className="h-10 rounded-xl bg-white text-[13px]">
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="pending">Pending</SelectItem>
                                            <SelectItem value="approved">Approved</SelectItem>
                                            <SelectItem value="rejected">Rejected</SelectItem>
                                            <SelectItem value="active">Active</SelectItem>
                                            <SelectItem value="inprogress">In Progress</SelectItem>
                                            <SelectItem value="completed">Completed</SelectItem>
                                            <SelectItem value="closed">Closed</SelectItem>
                                            <SelectItem value="withdrawn">Withdrawn</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    <div className="grid grid-cols-2 gap-3">
                                        <Popover
                                            open={startPopoverOpen}
                                            onOpenChange={setStartPopoverOpen}
                                        >
                                            <PopoverTrigger asChild>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    disabled={!isBackendApproved || saveDates.isPending}
                                                    className="h-10 justify-start rounded-xl bg-white text-left text-[13px]"
                                                >
                                                    {startDate
                                                        ? format(startDate, "yyyy-MM-dd")
                                                        : "Start date"}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={startDate}
                                                    captionLayout="dropdown"
                                                    fromYear={2000}
                                                    toYear={2100}
                                                    onSelect={(date) => {
                                                        if (!date) return

                                                        const normalizedDate = new Date(date)
                                                        normalizedDate.setHours(0, 0, 0, 0)

                                                        setStartDate(normalizedDate)
                                                        setEndDate(
                                                            calculateEndDateFromStart(
                                                                normalizedDate,
                                                                tenureYears
                                                            )
                                                        )
                                                        setStartPopoverOpen(false)
                                                    }}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>

                                        <Popover
                                            open={endPopoverOpen}
                                            onOpenChange={setEndPopoverOpen}
                                        >
                                            <PopoverTrigger asChild>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    disabled={!isBackendApproved || saveDates.isPending}
                                                    className="h-10 justify-start rounded-xl bg-white text-left text-[13px]"
                                                >
                                                    {endDate
                                                        ? format(endDate, "yyyy-MM-dd")
                                                        : "End date"}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={endDate}
                                                    captionLayout="dropdown"
                                                    fromYear={2000}
                                                    toYear={2100}
                                                    onSelect={(date) => {
                                                        if (!date) return
                                                        const normalizedDate = new Date(date)
                                                        normalizedDate.setHours(0, 0, 0, 0)
                                                        setEndDate(normalizedDate)
                                                        setEndPopoverOpen(false)
                                                    }}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>

                                    <Button
                                        type="button"
                                        onClick={handleSave}
                                        disabled={
                                            saveStatus.isPending ||
                                            status ===
                                            String(viewData.status ?? "pending").toLowerCase()
                                        }
                                        className="h-10 rounded-xl px-4 text-[13px]"
                                    >
                                        {saveStatus.isPending ? <Spinner /> : "Confirm Status"}
                                    </Button>

                                    <Button
                                        type="button"
                                        onClick={handleDateSave}
                                        disabled={
                                            !isBackendApproved ||
                                            !startDate ||
                                            !endDate ||
                                            saveDates.isPending
                                        }
                                        className="h-10 rounded-xl px-4 text-[13px]"
                                    >
                                        {saveDates.isPending ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            "Save Dates"
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <DialogFooter className="border-t border-slate-200 bg-slate-50/80 px-5 py-3">
                    <DialogClose asChild>
                        <Button
                            type="button"
                            variant="outline"
                            className="rounded-xl bg-white text-[13px]"
                        >
                            Close
                        </Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}