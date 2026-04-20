"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { Send, ShieldCheck, UserRound } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/providers/auth-provider"
import {
    getComplaintByIdHandler,
    replyComplaintHandler,
} from "@/services/complaintHandler"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { ComplaintItem } from "@/types/complainsTypes"
import { cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────

type ComplaintDetailsDialogProps = {
    complaintId: number | null
    open: boolean
    onOpenChange: (open: boolean) => void
}

type HandlerErrorShape = {
    message?: string
    response?: {
        data?: {
            message?: string
        }
    }
}

type AdminReplyItem = {
    id: string
    message: string
    timestamp: string
    author: string
}

type ReplyMutationPayload = {
    message: string
    status: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getErrorMessage(error: unknown, fallback: string) {
    const typedError = error as HandlerErrorShape
    return typedError?.response?.data?.message ?? typedError?.message ?? fallback
}

function formatHeaderDateTime(value?: string | null) {
    if (!value) return "-"
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return "-"
    return format(date, "yyyy-MM-dd HH:mm")
}

function formatBubbleTime(value?: string | null) {
    if (!value) return "-"
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return "-"
    return format(date, "hh:mm a")
}

function normalizeReplyList(value: ComplaintItem["admin_reply"]) {
    if (!Array.isArray(value)) return []
    return value
}

function getStatusSubmitValue(status: string) {
    if (status === "in_progress") return "in progress"
    return status
}

function getInitial(name: string) {
    return name?.trim()?.charAt(0)?.toUpperCase() ?? "A"
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
    pending:     "bg-amber-50 text-amber-700 border-amber-200",
    in_progress: "bg-blue-50 text-blue-700 border-blue-200",
    "in progress":"bg-blue-50 text-blue-700 border-blue-200",
    replied:     "bg-violet-50 text-violet-700 border-violet-200",
    resolved:    "bg-emerald-50 text-emerald-700 border-emerald-200",
    closed:      "bg-slate-100 text-slate-500 border-slate-200",
}

function StatusBadge({ status }: { status?: string }) {
    if (!status) return null
    const label = status.replace("_", " ")
    const styles = STATUS_STYLES[status] ?? "bg-slate-100 text-slate-500 border-slate-200"
    return (
        <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium capitalize", styles)}>
            {label}
        </span>
    )
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function AdminAvatar({ name }: { name: string }) {
    return (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
            {getInitial(name)}
        </div>
    )
}

// ─── Chat Bubble ──────────────────────────────────────────────────────────────

function AdminBubble({ item }: { item: AdminReplyItem }) {
    return (
        <div className="flex items-end justify-end gap-2">
            <div className="max-w-[80%] rounded-4xl rounded-br-none border  bg-emerald-50 px-3.5 py-2.5 ">
                {/* Author */}
                <div className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold text-emerald-700">
                    <ShieldCheck size={10} />
                    <span>{item.author}</span>
                </div>
                {/* Message */}
                <p className="text-[13px] leading-relaxed text-slate-800 whitespace-pre-wrap wrap-break-word">
                    {item.message}
                </p>
                {/* Time */}
                <p className="mt-1.5 text-right text-[10px] text-emerald-600/70">
                    {formatBubbleTime(item.timestamp)}
                </p>
            </div>
            <AdminAvatar name={item.author} />
        </div>
    )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ComplaintDetailsDialog({
    complaintId,
    open,
    onOpenChange,
}: ComplaintDetailsDialogProps) {
    const queryClient = useQueryClient()
    const { user } = useAuth()
    const [replyMessage, setReplyMessage] = useState("")
    const [replyStatus, setReplyStatus] = useState("in_progress")
    const scrollRef = useRef<HTMLDivElement>(null)

    const { data, isLoading } = useQuery({
        queryKey: ["complaint-details", complaintId],
        queryFn: () => getComplaintByIdHandler(Number(complaintId)),
        enabled: open && complaintId !== null,
    })

    const replyMutation = useMutation({
        mutationFn: async ({ message, status }: ReplyMutationPayload) =>
            replyComplaintHandler(Number(complaintId), {
                message: message.trim(),
                status: getStatusSubmitValue(status),
                updated_by: user?.admin_name ? String(user.admin_name) : undefined,
            }),
        onSuccess: async () => {
            toast.success("Reply sent successfully")
            setReplyMessage("")
            setReplyStatus("in_progress")
            await queryClient.invalidateQueries({ queryKey: ["complaints"] })
            await queryClient.invalidateQueries({ queryKey: ["complaint-details", complaintId] })
        },
        onError: (error: unknown) => {
            toast.error(getErrorMessage(error, "Failed to send reply"))
        },
    })

    const complaint = data ?? null

    const adminReplies = useMemo<AdminReplyItem[]>(() => {
        const replies = normalizeReplyList(complaint?.admin_reply ?? null)
        return replies
            .map((reply, index) => ({
                id: `admin-${index}-${reply.timestamp}`,
                message: reply.message || "-",
                timestamp: reply.timestamp,
                author: reply.updated_by || "Admin",
            }))
            .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    }, [complaint?.admin_reply])

    // Auto-scroll to bottom when new replies arrive
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [adminReplies])

    const handleSubmitReply = () => {
        if (!complaint || replyMutation.isPending || !replyMessage.trim()) return
        replyMutation.mutate({ message: replyMessage, status: replyStatus })
    }

    // Allow Ctrl/Cmd + Enter to submit
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
            e.preventDefault()
            handleSubmitReply()
        }
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(nextOpen) => {
                if (!nextOpen) {
                    setReplyMessage("")
                    setReplyStatus("in_progress")
                }
                onOpenChange(nextOpen)
            }}
        >
            <DialogContent className="max-h-[92vh] overflow-hidden border-0 p-0 shadow-none sm:max-w-180">
                <div className="flex flex-col overflow-hidden rounded-xl bg-white shadow-2xl">

                    {/* ── Header ── */}
                    <DialogHeader className="shrink-0 border-b border-slate-200 px-6 py-4">
                        <div className="flex min-w-0 items-start justify-between gap-3">
                            <DialogTitle className="min-w-0">
                                <p className="text-[11px] font-semibold u">
                                    Complaint
                                </p>
                                <p className="mt-1 truncate text-[22px]  font-semibold capitalize">
                                    {isLoading ? "Loading..." : complaint?.subject || "Complaint"}
                                </p>
                            </DialogTitle>
                            <div className="mt-1 shrink-0 mx-10">
                                <StatusBadge status={complaint?.status} />
                            </div>
                        </div>
                        <DialogDescription className="mt-1.5 truncate ">
                            Member: {complaint?.member_name || "-"} ({complaint?.member_id || "#"})
                            &nbsp;•&nbsp; Ref: #{complaint?.id || "-"}
                            &nbsp;•&nbsp; Created: {formatHeaderDateTime(complaint?.created_at)}
                        </DialogDescription>
                    </DialogHeader>

                    {/* ── Body ── */}
                    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                        {isLoading ? (
                            <div className="space-y-3 p-6">
                                <Skeleton className="h-24 w-full rounded-xl" />
                                <Skeleton className="h-28 w-full rounded-xl" />
                                <Skeleton className="h-20 w-full rounded-xl" />
                            </div>
                        ) : complaint ? (
                            <div className="flex flex-col overflow-hidden">

                                {/* ── User Complaint (fixed, not scrollable) ── */}
                                <div className="shrink-0 border-b border-slate-100 bg-slate-50/70 px-5 py-3">
                                    <div className="mb-2 flex items-center gap-1.5">
                                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200">
                                            <UserRound size={11} className="text-slate-500" />
                                        </div>
                                        <p className=" font-semibold ">
                                            User Complaint
                                        </p>
                                    </div>

                                    <div className="flex items-end gap-2">
                                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[11px] font-semibold text-slate-600">
                                            {getInitial(complaint?.member_name || "U")}
                                        </div>
                                        <div className="max-w-[82%] rounded-2xl rounded-bl-lg border border-slate-200 bg-white px-3.5 py-2.5 shadow-sm">
                                            <p className="text-[13px] leading-relaxed text-slate-800 whitespace-pre-wrap wrap-break-word">
                                                {complaint.message || "-"}
                                            </p>
                                            <p className="mt-1.5 text-[10px] text-slate-400">
                                                {formatHeaderDateTime(complaint.created_at)}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* ── Admin Replies (scrollable chat area) ── */}
                                <div
                                    ref={scrollRef}
                                    className={cn(
                                        "flex flex-col gap-3 overflow-y-auto px-5 py-4",
                                        "max-h-65 scroll-smooth",
                                        "[&::-webkit-scrollbar]:w-0.75",
                                        "[&::-webkit-scrollbar-track]:bg-transparent",
                                        "[&::-webkit-scrollbar-thumb]:rounded-full",
                                        "[&::-webkit-scrollbar-thumb]:bg-slate-300",
                                    )}
                                >
                                    <div className="flex items-center gap-1.5 pb-1">
                                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50">
                                            <ShieldCheck size={11} className="text-emerald-600" />
                                        </div>
                                        <p className="text-[10px] font-semibold">
                                            Admin Replies
                                        </p>
                                        {adminReplies.length > 0 && (
                                            <span className="ml-1 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
                                                {adminReplies.length}
                                            </span>
                                        )}
                                    </div>

                                    {adminReplies.length > 0 ? (
                                        adminReplies.map((item) => (
                                            <AdminBubble key={item.id} item={item} />
                                        ))
                                    ) : (
                                        <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
                                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100">
                                                <ShieldCheck size={16} className="text-slate-400" />
                                            </div>
                                            <p className="text-[12px] text-slate-400">No admin reply yet</p>
                                        </div>
                                    )}
                                </div>

                                {/* ── Reply Input ── */}
                                <div className="shrink-0 border-t px-5 py-3">
                                    <div className="mb-2 flex items-center justify-between">
                                        <p className="font-semibold ">
                                            Reply to Complaint
                                        </p>
                                        <Select value={replyStatus} onValueChange={setReplyStatus}>
                                            <SelectTrigger className="h-7 w-32.5 rounded-lg  ">
                                                <SelectValue placeholder="Select status" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-lg">
                                                <SelectItem value="in_progress">in_progress</SelectItem>
                                                <SelectItem value="pending">pending</SelectItem>
                                                <SelectItem value="replied">replied</SelectItem>
                                                <SelectItem value="resolved">resolved</SelectItem>
                                                <SelectItem value="closed">closed</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="flex items-end gap-2">
                                        <Textarea
                                            value={replyMessage}
                                            onChange={(e) => setReplyMessage(e.target.value)}
                                            onKeyDown={handleKeyDown}
                                            placeholder="Write reply for member…  (Ctrl+Enter to send)"
                                            className="min-h-18 flex-1 resize-none rounded-xl border-slate-200 bg-white px-3.5 py-2.5 text-[13px] leading-relaxed shadow-none focus-visible:ring-0"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleSubmitReply}
                                            disabled={!complaint || replyMutation.isPending || !replyMessage.trim()}
                                            className={cn(
                                                "mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all",
                                                "bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95",
                                                "disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400",
                                            )}
                                        >
                                            {replyMutation.isPending ? (
                                                <Spinner className="h-4 w-4" />
                                            ) : (
                                                <Send size={14} />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="py-14 text-center text-sm text-slate-400">
                                Complaint not found.
                            </div>
                        )}
                    </div>

                    {/* ── Footer ── */}
                    <DialogFooter className="shrink-0 border-t border-slate-100 px-5 py-3">
                        <DialogClose asChild>
                            <Button variant="outline" size="sm" className="rounded-lg">
                                Close
                            </Button>
                        </DialogClose>
                        <Button
                            type="button"
                            size="sm"
                            className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg"
                            onClick={handleSubmitReply}
                            disabled={!complaint || replyMutation.isPending || !replyMessage.trim()}
                        >
                            {replyMutation.isPending ? <Spinner className="h-3.5 w-3.5" /> : <Send size={13} />}
                            Submit Reply
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    )
}