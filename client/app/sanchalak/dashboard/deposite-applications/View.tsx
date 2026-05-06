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
    ReceiptText,
} from "lucide-react"
import { Spinner } from "@/components/ui/spinner"
import { useMutation, useQueryClient, type Query, type QueryKey } from "@tanstack/react-query"
import { applicationStartDateUpdateHandler, statusUpdateHandler } from "@/services/depositeHandler"
import { useAuth } from "@/Context/AuthProvider"

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

type StatusUpdatePayload = Parameters<typeof statusUpdateHandler>[1]

type UnknownRecord = Record<string, unknown>

type AppUser = {
    admin_name?: string
}

type PaymentDetailsRecord = {
    payment_mode?: unknown
    reference_trn?: unknown
    remark?: unknown
    proof_file?: unknown
    date_of_payment?: unknown
    total_amount?: unknown
    status?: unknown
    created_at?: unknown
}

type MatchedApplicationRecord = {
    amount?: unknown
    application_no?: unknown
    payment_mode?: unknown
    reference_trn?: unknown
    remark?: unknown
    proof_file?: unknown
    proofFile?: unknown
    date_of_payment?: unknown
    total_amount?: unknown
    created_at?: unknown
}

type ApplicationJsonRecord = {
    application_no?: unknown
    payment_mode?: unknown
    reference_trn?: unknown
    remark?: unknown
    proof_file?: unknown
    proofFile?: unknown
    date_of_payment?: unknown
    total_amount?: unknown
    created_at?: unknown
}

type DepositAccountManagementExtended = Omit<
    DepositAccountManagementItem,
    "applications_json" | "matched_application_json" | "application_json"
> & {
    application_no?: unknown
    payment_mode?: unknown
    reference_trn?: unknown
    remark?: unknown
    proof_file?: unknown
    proofFile?: unknown
    file?: unknown
    proof?: unknown
    file_path?: unknown
    document?: unknown
    date_of_payment?: unknown
    payment_date?: unknown
    total_amount?: unknown
    amount?: unknown
    status?: unknown
    created_at?: unknown
    submitted_at?: unknown
    member_name?: unknown
    member_id?: unknown
    applications_json?: ApplicationJsonRecord | null
    matched_application_json?: MatchedApplicationRecord | null
    application_json?: {
        application_no?: unknown
    } | null
}

type ExtendedDepositApplication = DepositApplication & {
    payment_details?: PaymentDetailsRecord | null
    matched_application_json?: MatchedApplicationRecord | null
    account_management?:
        | DepositAccountManagementExtended[]
        | DepositAccountManagementExtended
        | DepositAccountManagementItem[]
        | DepositAccountManagementItem
        | null
    tenure_years?: unknown
    deposit_amount?: unknown
    scheme_name?: unknown
    created_at?: unknown
}

type ResolvedPaymentDetails = {
    raw: PaymentDetailsRecord | DepositAccountManagementExtended
    application_no: string | null
    payment_mode: string | null
    reference_trn: string | null
    remark: string | null
    proof_file: string | null
    date_of_payment: string | null
    total_amount: string | null
    submitted_at: string | null
    member_name: string | null
    member_id: string | null
}

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

const getSafeValue = (...values: unknown[]) => {
    for (const value of values) {
        if (value === null || value === undefined) continue
        const stringValue = String(value).trim()
        if (stringValue) return stringValue
    }
    return null
}

const normalizeAccountManagementItem = (
    item: DepositAccountManagementExtended | DepositAccountManagementItem
): DepositAccountManagementExtended => {
    return item as DepositAccountManagementExtended
}

const getApplicationNoFromItem = (
    item: DepositAccountManagementExtended | DepositAccountManagementItem
) => {
    const normalizedItem = normalizeAccountManagementItem(item)

    return getSafeValue(
        normalizedItem.application_no,
        normalizedItem.applications_json?.application_no,
        normalizedItem.matched_application_json?.application_no,
        normalizedItem.application_json?.application_no
    )
}

const getPaymentDetails = (viewData: DepositApplication | null): ResolvedPaymentDetails | null => {
    if (!viewData) return null

    const resolvedViewData = viewData as ExtendedDepositApplication
    const pd = resolvedViewData.payment_details
    const mj = resolvedViewData.matched_application_json

    if (pd) {
        return {
            raw: pd,
            application_no: getSafeValue(viewData.application_no),
            payment_mode: getSafeValue(pd.payment_mode),
            reference_trn: getSafeValue(pd.reference_trn),
            remark: getSafeValue(pd.remark),
            proof_file: getSafeValue(pd.proof_file),
            date_of_payment: getSafeValue(pd.date_of_payment),
            total_amount: getSafeValue(pd.total_amount, mj?.amount, resolvedViewData.deposit_amount),
            submitted_at: getSafeValue(pd.created_at),
            member_name: getSafeValue(viewData.member_name),
            member_id: getSafeValue(viewData.member_id),
        }
    }

    const raw = resolvedViewData.account_management
    if (!raw) return null

    const rawItems = Array.isArray(raw) ? raw : [raw]
    const items = rawItems.map((item) => normalizeAccountManagementItem(item))
    if (!items.length) return null

    const currentApplicationNo = String(viewData.application_no ?? "").trim()

    const matchedByApplicationNo = items.find((item) => {
        const itemApplicationNo = String(getApplicationNoFromItem(item) ?? "").trim()
        return (
            currentApplicationNo.length > 0 &&
            itemApplicationNo.length > 0 &&
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
            viewData.application_no
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
            resolvedViewData.deposit_amount
        ),
        submitted_at: getSafeValue(
            resolved.created_at,
            resolved.submitted_at,
            resolved.applications_json?.created_at,
            resolved.matched_application_json?.created_at
        ),
        member_name: getSafeValue(resolved.member_name, viewData.member_name),
        member_id: getSafeValue(resolved.member_id, viewData.member_id),
    }
}

const isPlainObject = (value: unknown): value is UnknownRecord => {
    return typeof value === "object" && value !== null && !Array.isArray(value)
}

const updateApplicationInData = (
    oldData: unknown,
    applicationId: string | number,
    patch: Partial<DepositApplication>
) => {
    if (!oldData) return oldData

    if (Array.isArray(oldData)) {
        return oldData.map((item) =>
            isPlainObject(item) && String(item.id) === String(applicationId)
                ? { ...item, ...patch }
                : item
        )
    }

    if (isPlainObject(oldData) && "id" in oldData && String(oldData.id) === String(applicationId)) {
        return { ...oldData, ...patch }
    }

    if (isPlainObject(oldData) && Array.isArray(oldData.data)) {
        return {
            ...oldData,
            data: oldData.data.map((item) =>
                isPlainObject(item) && String(item.id) === String(applicationId)
                    ? { ...item, ...patch }
                    : item
            ),
        }
    }

    if (
        isPlainObject(oldData) &&
        isPlainObject(oldData.data) &&
        "id" in oldData.data &&
        String(oldData.data.id) === String(applicationId)
    ) {
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

type ProofPreviewDialogProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    proofFileUrl: string | null
    proofFilePath: string | null
    previewFailed: boolean
    onPreviewError: () => void
}

function ProofPreviewDialog({
    open,
    onOpenChange,
    proofFileUrl,
    proofFilePath,
    previewFailed,
    onPreviewError,
}: ProofPreviewDialogProps) {
    const proofIsImage = React.useMemo(() => isImageFile(proofFilePath), [proofFilePath])

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[50vw] h-[80vh] overflow-hidden rounded-xl border border-slate-200 bg-white p-0 shadow-2xl sm:max-w-5xl">
                <DialogHeader className="border-b border-slate-200 bg-linear-to-r from-white via-slate-50 to-white px-5 py-4">
                    <DialogTitle className="text-[18px] font-semibold tracking-tight text-slate-900">
                        Payment Proof
                    </DialogTitle>
                </DialogHeader>

                <div className="-mt-5 px-2 space-y-3">
                    <div className="flex h-[72vh] items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                        {proofFileUrl && proofIsImage && !previewFailed ? (
                            <img
                                src={proofFileUrl}
                                alt="Payment proof"
                                className="h-full w-full object-contain"
                                onError={onPreviewError}
                            />
                        ) : (
                            <div className="text-center">
                                <ImageIcon className="mx-auto h-10 w-10 text-slate-300" />
                                <div className="mt-3 text-[14px] text-slate-500">
                                    No image found
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter className="border-t border-slate-200 bg-slate-50/80 px-5 py-3">
                    {proofFileUrl ? (
                        <a
                            href={proofFileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-[13px] font-semibold text-slate-900 transition hover:bg-slate-100"
                        >
                            <ExternalLink className="h-4 w-4" />
                            Open in New Tab
                        </a>
                    ) : null}

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

export default function View({ open, onOpenChange, data }: ViewProps) {
    const queryClient = useQueryClient()
    const { user } = useAuth() as { user: AppUser | null }

    const [viewData, setViewData] = React.useState<DepositApplication | null>(data)
    const [status, setStatus] = React.useState<DepositStatus>("pending")
    const [startDate, setStartDate] = React.useState<Date | undefined>(undefined)
    const [endDate, setEndDate] = React.useState<Date | undefined>(undefined)
    const [startPopoverOpen, setStartPopoverOpen] = React.useState(false)
    const [endPopoverOpen, setEndPopoverOpen] = React.useState(false)
    const [proofUrlIndex, setProofUrlIndex] = React.useState(0)
    const [previewFailed, setPreviewFailed] = React.useState(false)
    const [proofDialogOpen, setProofDialogOpen] = React.useState(false)

    React.useEffect(() => {
        setViewData(data)
    }, [data])

    const paymentDetails = React.useMemo(() => getPaymentDetails(viewData), [viewData])

    const currentApplicationStatus = String(viewData?.status ?? "pending").toLowerCase()
    const isApplicationApproved = currentApplicationStatus === "approved"
    const isSelectedStatusApproved = status === "approved"
    const shouldShowDateControls = isApplicationApproved || isSelectedStatusApproved

    const existingStartDate = toDate(viewData?.start_date)
    const existingEndDate = toDate(viewData?.end_date)
    const hasExistingStartDate = !!existingStartDate
    const hasExistingEndDate = !!existingEndDate
    const hasSavedDates = hasExistingStartDate && hasExistingEndDate
    const shouldHideSaveDateButton = !shouldShowDateControls

    const tenureYears = React.useMemo(() => {
        const years = Number((viewData as ExtendedDepositApplication | null)?.tenure_years)
        return Number.isNaN(years) ? 0 : years
    }, [viewData])

    const proofFilePath = paymentDetails?.proof_file ?? null

    const proofFileCandidates = React.useMemo(
        () => buildProofFileCandidates(proofFilePath),
        [proofFilePath]
    )

    React.useEffect(() => {
        setProofUrlIndex(0)
        setPreviewFailed(false)
        setProofDialogOpen(false)
    }, [proofFilePath, open])

    const proofFileUrl =
        proofFileCandidates.length > 0 ? proofFileCandidates[proofUrlIndex] : null

    const proofIsImage = React.useMemo(() => isImageFile(proofFilePath), [proofFilePath])

    React.useEffect(() => {
        const nextStatus = (String(viewData?.status ?? "pending").toLowerCase() as DepositStatus) || "pending"
        const resolvedStartDate = toDate(viewData?.start_date)
        const resolvedEndDate = toDate(viewData?.end_date)

        setStatus(nextStatus)
        setStartDate(resolvedStartDate)
        setEndDate(resolvedEndDate)
    }, [viewData])

    const syncApplicationCache = (
        applicationId: string | number,
        patch: Partial<DepositApplication>
    ) => {
        const allQueries = queryClient.getQueryCache().findAll()

        allQueries.forEach((query: Query) => {
            queryClient.setQueryData(query.queryKey, (oldData: unknown) =>
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
            status: nextStatus,
        }: {
            id: number | string
            status: DepositStatus
        }) => {
            const payload = {
                status: nextStatus,
            } as unknown as StatusUpdatePayload

            return await statusUpdateHandler(id, payload)
        },
        onSuccess: (_, variables) => {
            syncApplicationCache(variables.id, {
                status: variables.status,
                updated_by: user?.admin_name,
            } as Partial<DepositApplication>)

            queryClient.invalidateQueries({
                predicate: (query) => {
                    const queryKey = query.queryKey as QueryKey
                    return Array.isArray(queryKey) &&
                        queryKey.some((key) => String(key).toLowerCase().includes("deposit"))
                },
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
            start_date: Date
            end_date: Date
        }) => {
            return await applicationStartDateUpdateHandler(id, {
                start_date,
                end_date,
                updated_by: user?.admin_name,
            })
        },
        onSuccess: (_, variables) => {
            syncApplicationCache(variables.id, {
                start_date: format(variables.start_date, "yyyy-MM-dd"),
                end_date: format(variables.end_date, "yyyy-MM-dd"),
                updated_by: user?.admin_name,
            } as Partial<DepositApplication>)

            queryClient.invalidateQueries({
                predicate: (query) => {
                    const queryKey = query.queryKey as QueryKey
                    return Array.isArray(queryKey) &&
                        queryKey.some((key) => String(key).toLowerCase().includes("deposit"))
                },
            })
        },
    })

    const shouldDisableDateFields = saveDates.isPending || hasSavedDates
    const shouldDisableSaveDateButton =
        saveDates.isPending ||
        hasSavedDates ||
        !startDate ||
        !endDate

    const handleStatusChange = async (value: string) => {
        const nextStatus = value as DepositStatus
        const previousStatus = status

        setStatus(nextStatus)

        if (!viewData || saveStatus.isPending || nextStatus === currentApplicationStatus) return

        try {
            await saveStatus.mutateAsync({
                id: viewData.id,
                status: nextStatus,
            })
        } catch {
            setStatus(previousStatus)
        }
    }

    const handleDateSave = async () => {
        if (
            !viewData ||
            !startDate ||
            !endDate ||
            !shouldShowDateControls ||
            shouldDisableDateFields ||
            saveDates.isPending
        ) {
            return
        }

        await saveDates.mutateAsync({
            id: viewData.id,
            start_date: startDate,
            end_date: endDate,
        })
    }

    const handleProofLoadError = () => {
        if (proofUrlIndex < proofFileCandidates.length - 1) {
            setProofUrlIndex((prev) => prev + 1)
            return
        }
        setPreviewFailed(true)
    }

    const memberName = paymentDetails?.member_name ?? viewData?.member_name ?? "-"
    const memberId = paymentDetails?.member_id ?? viewData?.member_id ?? "-"
    const amount =
        paymentDetails?.total_amount ??
        ((viewData as ExtendedDepositApplication | null)?.deposit_amount ?? "-")
    const paidDate =
        paymentDetails?.date_of_payment ??
        ((viewData as ExtendedDepositApplication | null)?.created_at ?? "-")
    const schemeLabel = String(
        ((viewData as ExtendedDepositApplication | null)?.scheme_name ?? "Deposit Scheme")
    )
    const remark = paymentDetails?.remark ?? "No remark added"
    const submittedAt =
        paymentDetails?.submitted_at ??
        ((viewData as ExtendedDepositApplication | null)?.created_at ?? "-")

    return (
        <>
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
                                                    getStatusTone(currentApplicationStatus)
                                                )}
                                            >
                                                {currentApplicationStatus}
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
                                                                    viewData.application_no ??
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

                                        <div className="p-1">
                                            <div className="flex h-70.5 items-center justify-center rounded-md border border-slate-200 bg-slate-50">
                                                {proofFileUrl && proofIsImage && !previewFailed ? (
                                                    <img
                                                        src={proofFileUrl}
                                                        alt="Receipt proof"
                                                        className="h-full w-full rounded-md object-contain"
                                                        onError={handleProofLoadError}
                                                    />
                                                ) : (
                                                    <div className="text-center">
                                                        <ImageIcon className="mx-auto h-8 w-8 text-slate-300" />
                                                        <div className="mt-2 text-[13px] text-slate-500">
                                                            No image found
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="border-t border-slate-200 px-4 py-2">
                                            {proofFileUrl && proofIsImage && !previewFailed ? (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    onClick={() => setProofDialogOpen(true)}
                                                    className="h-auto px-0 py-0 text-[13px] font-semibold text-slate-900 transition hover:bg-transparent hover:text-slate-700"
                                                >
                                                    <span className="inline-flex items-center gap-2">
                                                        <ReceiptText className="h-4 w-4" />
                                                        Show Proof
                                                    </span>
                                                </Button>
                                            ) : (
                                                <div className="text-[13px] text-slate-400">
                                                    No image found
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-2xl border border-slate-200 bg-linear-to-b from-white to-slate-50 p-4 shadow-sm">
                                    <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                                        Quick Actions
                                    </div>

                                    <div className="grid gap-3 xl:grid-cols-[1fr_1fr_auto]">
                                        <Select
                                            value={status}
                                            onValueChange={handleStatusChange}
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

                                        {shouldShowDateControls ? (
                                            <div className="grid grid-cols-2 gap-3">
                                                <Popover
                                                    open={shouldDisableDateFields ? false : startPopoverOpen}
                                                    onOpenChange={(nextOpen) => {
                                                        if (shouldDisableDateFields) return
                                                        setStartPopoverOpen(nextOpen)
                                                    }}
                                                >
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            disabled={shouldDisableDateFields}
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
                                                                if (!date || shouldDisableDateFields) return

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
                                                    open={shouldDisableDateFields ? false : endPopoverOpen}
                                                    onOpenChange={(nextOpen) => {
                                                        if (shouldDisableDateFields) return
                                                        setEndPopoverOpen(nextOpen)
                                                    }}
                                                >
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            disabled={shouldDisableDateFields}
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
                                                                if (!date || shouldDisableDateFields) return

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
                                        ) : null}

                                        {!shouldHideSaveDateButton ? (
                                            <Button
                                                type="button"
                                                onClick={handleDateSave}
                                                disabled={shouldDisableSaveDateButton}
                                                className="h-10 rounded-xl px-4 text-[13px]"
                                            >
                                                {saveDates.isPending ? <Spinner /> : "Save Date"}
                                            </Button>
                                        ) : null}
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

            <ProofPreviewDialog
                open={proofDialogOpen}
                onOpenChange={setProofDialogOpen}
                proofFileUrl={proofFileUrl}
                proofFilePath={proofFilePath}
                previewFailed={previewFailed}
                onPreviewError={handleProofLoadError}
            />
        </>
    )
}