"use client"

import { useMemo, useState } from "react"
import { CalendarDays, Eye, FileText, Pencil, Save, Upload, X } from "lucide-react"
import { format } from "date-fns"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { useAuth } from "@/providers/auth-provider"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    AgmEgmNoticeItem,
    updateAgmEgmNoticeHandler,
} from "@/services/agmEgmNoticeHandler"

type HandlerErrorShape = {
    message?: string
    response?: {
        data?: {
            message?: string
        }
    }
}

type NoticeFormState = {
    type: string
    audience: string
    title: string
    meetingAtDate: Date | undefined
    meetingAtTime: string
    publishMode: "draft" | "publish"
    publishDate: Date | undefined
    publishTime: string
    attachmentFile: File | null
    removeAttachment: boolean
}

type ViewAgmNoticeDialogProps = {
    notice: AgmEgmNoticeItem
    open: boolean
    onOpenChange: (open: boolean) => void
}

const typeOptions = ["AGM", "EGM"]
const audienceOptions = ["member", "sanchalak", "admins"]

function getErrorMessage(error: unknown, fallback: string) {
    const typedError = error as HandlerErrorShape
    return typedError?.response?.data?.message || typedError?.message || fallback
}

function parseDateTime(value?: string | null) {
    if (!value) {
        return {
            date: undefined as Date | undefined,
            time: "10:00",
        }
    }

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
        return {
            date: undefined as Date | undefined,
            time: "10:00",
        }
    }

    return {
        date,
        time: format(date, "HH:mm"),
    }
}

function getInitialFormState(notice: AgmEgmNoticeItem): NoticeFormState {
    const meeting = parseDateTime(notice.meeting_at)
    const publish = parseDateTime(notice.publish_date)

    return {
        type: notice.type || "AGM",
        audience: notice.audience || "member",
        title: notice.title || "",
        meetingAtDate: meeting.date,
        meetingAtTime: meeting.time,
        publishMode: notice.is_published ? "publish" : "draft",
        publishDate: publish.date,
        publishTime: publish.time,
        attachmentFile: null,
        removeAttachment: false,
    }
}

function buildDateTimeString(date?: Date, time?: string) {
    if (!date || !time) return ""
    const [hours, minutes] = time.split(":")
    const next = new Date(date)
    next.setHours(Number(hours || 0), Number(minutes || 0), 0, 0)
    return format(next, "yyyy-MM-dd HH:mm:ss")
}

function formatDateTime(value?: string | null) {
    if (!value) return "-"
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return "-"
    return format(date, "dd-MM-yyyy hh:mm a")
}

function AttachmentPreviewDialog({ notice }: { notice: AgmEgmNoticeItem }) {
    const [open, setOpen] = useState(false)
    const attachmentUrl = notice.attachment_url || null
    const attachmentFile = notice.attachment_file || ""
    const extension = attachmentFile.split(".").pop()?.toLowerCase() || ""
    const isImage = ["jpg", "jpeg", "png", "webp", "gif", "svg"].includes(extension)
    const isPdf = extension === "pdf"

    if (!attachmentUrl || !attachmentFile) {
        return (
            <Button type="button" variant="outline" className="rounded-xl" disabled>
                <Eye size={14} />
                No Attachment
            </Button>
        )
    }

    return (
        <>
            <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                onClick={() => setOpen(true)}
            >
                <Eye size={14} />
                View Attachment
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="overflow-hidden rounded-2xl border-0 p-0 shadow-2xl sm:max-w-5xl">
                    <div className="border-b bg-linear-to-r from-slate-50 via-white to-slate-50 px-6 py-5">
                        <DialogHeader className="space-y-3">
                            <div className="flex items-start gap-3">
                                <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                    <FileText size={20} />
                                </div>
                                <div className="min-w-0">
                                    <DialogTitle className="truncate text-xl font-semibold text-foreground">
                                        Attachment Preview
                                    </DialogTitle>
                                    <DialogDescription className="mt-1 truncate text-sm text-muted-foreground">
                                        {attachmentFile}
                                    </DialogDescription>
                                </div>
                            </div>
                        </DialogHeader>
                    </div>

                    <div className="max-h-[78vh] overflow-auto bg-slate-50 p-6">
                        {isImage ? (
                            <div className="overflow-hidden rounded-2xl border bg-white p-3">
                                <img
                                    src={attachmentUrl}
                                    alt={attachmentFile}
                                    className="mx-auto max-h-[65vh] w-auto rounded-xl object-contain"
                                />
                            </div>
                        ) : isPdf ? (
                            <div className="overflow-hidden rounded-2xl border bg-white">
                                <iframe
                                    src={attachmentUrl}
                                    title={attachmentFile}
                                    className="h-[70vh] w-full"
                                />
                            </div>
                        ) : (
                            <div className="rounded-2xl border bg-white p-6">
                                <p className="text-sm text-muted-foreground">
                                    Preview is not available for this file type.
                                </p>
                                <a
                                    href={attachmentUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="mt-3 inline-flex text-sm font-medium text-primary hover:underline"
                                >
                                    Open attachment in new tab
                                </a>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="gap-2 border-t bg-muted/20 px-6 py-4 sm:justify-end">
                        <DialogClose asChild>
                            <Button variant="outline" className="rounded-xl">
                                Close
                            </Button>
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}

export default function ViewAgmNoticeDialog({
    notice,
    open,
    onOpenChange,
}: ViewAgmNoticeDialogProps) {
    const queryClient = useQueryClient()
    const { user } = useAuth()
    const [isEditMode, setIsEditMode] = useState(false)
    const [formState, setFormState] = useState<NoticeFormState>(() => getInitialFormState(notice))

    const updateMutation = useMutation({
        mutationFn: async () =>
            updateAgmEgmNoticeHandler(notice.id, {
                type: formState.type,
                audience: formState.audience,
                title: formState.title.trim(),
                meeting_at: buildDateTimeString(formState.meetingAtDate, formState.meetingAtTime),
                is_published: formState.publishMode === "publish",
                is_drafted: formState.publishMode === "draft",
                publish_date:
                    formState.publishMode === "publish"
                        ? buildDateTimeString(formState.publishDate, formState.publishTime)
                        : null,
                attachment_file: formState.attachmentFile,
                updated_by: user?.admin_name ? String(user.admin_name) : undefined,
                remove_attachment: formState.removeAttachment,
            }),
        onSuccess: async () => {
            toast.success("Notice updated successfully")
            setIsEditMode(false)
            await queryClient.invalidateQueries({ queryKey: ["agm-egm-notices"] })
        },
        onError: (error: unknown) => {
            toast.error(getErrorMessage(error, "Failed to update notice"))
        },
    })

    const currentAttachmentName = useMemo(() => {
        if (formState.attachmentFile) {
            return formState.attachmentFile.name
        }

        if (formState.removeAttachment) {
            return "Attachment will be removed"
        }

        return notice.attachment_file || "No attachment"
    }, [formState.attachmentFile, formState.removeAttachment, notice.attachment_file])

    const handleOpenChange = (nextOpen: boolean) => {
        if (nextOpen) {
            setFormState(getInitialFormState(notice))
            setIsEditMode(false)
        } else {
            setIsEditMode(false)
        }
        onOpenChange(nextOpen)
    }

    const handleSave = async () => {
        await updateMutation.mutateAsync()
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="overflow-hidden rounded-2xl border-0 p-0 shadow-2xl sm:max-w-4xl">
                <div className="border-b bg-linear-to-r from-slate-50 via-white to-slate-50 px-6 py-5">
                    <DialogHeader className="space-y-3">
                        <div className="flex items-start gap-3">
                            <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                <FileText size={20} />
                            </div>
                            <div className="min-w-0">
                                <DialogTitle className="truncate text-xl font-semibold text-foreground">
                                    AGM / EGM Notice Details
                                </DialogTitle>
                                <DialogDescription className="mt-1 text-sm text-muted-foreground">
                                    View complete notice details and edit the notice when needed.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                </div>

                <div className="max-h-[60vh] overflow-y-auto p-6">
                    <div className="mb-5 flex flex-wrap items-center gap-2">
                        <Badge
                            variant="outline"
                            className={
                                notice.type === "AGM"
                                    ? "rounded-full border-blue-200 bg-blue-50 text-blue-700"
                                    : "rounded-full border-violet-200 bg-violet-50 text-violet-700"
                            }
                        >
                            {notice.type || "-"}
                        </Badge>

                        {notice.is_published ? (
                            <Badge className="rounded-full bg-emerald-600 text-white hover:bg-emerald-600">
                                Published
                            </Badge>
                        ) : notice.is_drafted ? (
                            <Badge
                                variant="outline"
                                className="rounded-full border-amber-200 bg-amber-50 text-amber-700"
                            >
                                Draft
                            </Badge>
                        ) : (
                            <Badge
                                variant="outline"
                                className="rounded-full border-slate-200 bg-slate-50 text-slate-700"
                            >
                                Pending
                            </Badge>
                        )}
                    </div>

                    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Type</Label>
                            {isEditMode ? (
                                <Select
                                    value={formState.type}
                                    onValueChange={(value) =>
                                        setFormState((prev) => ({ ...prev, type: value }))
                                    }
                                >
                                    <SelectTrigger className="rounded-xl">
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                        {typeOptions.map((option) => (
                                            <SelectItem key={option} value={option}>
                                                {option}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            ) : (
                                <div className="rounded-xl border bg-background px-4 py-3 font-medium">
                                    {notice.type || "-"}
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label>Audience</Label>
                            {isEditMode ? (
                                <Select
                                    value={formState.audience}
                                    onValueChange={(value) =>
                                        setFormState((prev) => ({ ...prev, audience: value }))
                                    }
                                >
                                    <SelectTrigger className="rounded-xl capitalize">
                                        <SelectValue placeholder="Select audience" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                        {audienceOptions.map((option) => (
                                            <SelectItem key={option} value={option} className="capitalize">
                                                {option}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            ) : (
                                <div className="rounded-xl border bg-background px-4 py-3 capitalize font-medium">
                                    {notice.audience || "-"}
                                </div>
                            )}
                        </div>

                        <div className="space-y-2 lg:col-span-2">
                            <Label>Title</Label>
                            {isEditMode ? (
                                <Input
                                    value={formState.title}
                                    onChange={(e) =>
                                        setFormState((prev) => ({ ...prev, title: e.target.value }))
                                    }
                                    className="rounded-xl"
                                    placeholder="Enter title"
                                />
                            ) : (
                                <div className="rounded-xl border bg-background px-4 py-3 font-medium">
                                    {notice.title || "-"}
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label>Meeting Date</Label>
                            {isEditMode ? (
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className={cn(
                                                "w-full justify-start rounded-xl font-normal",
                                                !formState.meetingAtDate && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarDays size={16} />
                                            {formState.meetingAtDate
                                                ? format(formState.meetingAtDate, "dd-MM-yyyy")
                                                : "Select meeting date"}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto rounded-xl p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={formState.meetingAtDate}
                                            onSelect={(date) =>
                                                setFormState((prev) => ({ ...prev, meetingAtDate: date }))
                                            }
                                            initialFocus
                                            captionLayout="dropdown"
                                        />
                                    </PopoverContent>
                                </Popover>
                            ) : (
                                <div className="rounded-xl border bg-background px-4 py-3 font-medium">
                                    {formatDateTime(notice.meeting_at)}
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label>Meeting Time</Label>
                            {isEditMode ? (
                                <Input
                                    type="time"
                                    value={formState.meetingAtTime}
                                    onChange={(e) =>
                                        setFormState((prev) => ({
                                            ...prev,
                                            meetingAtTime: e.target.value,
                                        }))
                                    }
                                    className="rounded-xl"
                                />
                            ) : (
                                <div className="rounded-xl border bg-background px-4 py-3 font-medium">
                                    {notice.meeting_at ? format(new Date(notice.meeting_at), "hh:mm a") : "-"}
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label>Status</Label>
                            {isEditMode ? (
                                <Select
                                    value={formState.publishMode}
                                    onValueChange={(value: "draft" | "publish") =>
                                        setFormState((prev) => ({ ...prev, publishMode: value }))
                                    }
                                >
                                    <SelectTrigger className="rounded-xl">
                                        <SelectValue placeholder="Select mode" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                        <SelectItem value="draft">Draft</SelectItem>
                                        <SelectItem value="publish">Published</SelectItem>
                                    </SelectContent>
                                </Select>
                            ) : (
                                <div className="rounded-xl border bg-background px-4 py-3 font-medium">
                                    {notice.is_published ? "Published" : notice.is_drafted ? "Draft" : "Pending"}
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label>Publish Date</Label>
                            {isEditMode ? (
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className={cn(
                                                "w-full justify-start rounded-xl font-normal",
                                                !formState.publishDate && formState.publishMode === "publish" && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarDays size={16} />
                                            {formState.publishDate
                                                ? format(formState.publishDate, "dd-MM-yyyy")
                                                : formState.publishMode === "publish"
                                                  ? "Select publish date"
                                                  : "Not required"}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto rounded-xl p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={formState.publishDate}
                                            onSelect={(date) =>
                                                setFormState((prev) => ({ ...prev, publishDate: date }))
                                            }
                                            initialFocus
                                            captionLayout="dropdown"
                                        />
                                    </PopoverContent>
                                </Popover>
                            ) : (
                                <div className="rounded-xl border bg-background px-4 py-3 font-medium">
                                    {formatDateTime(notice.publish_date)}
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label>Publish Time</Label>
                            {isEditMode ? (
                                <Input
                                    type="time"
                                    value={formState.publishTime}
                                    onChange={(e) =>
                                        setFormState((prev) => ({
                                            ...prev,
                                            publishTime: e.target.value,
                                        }))
                                    }
                                    className="rounded-xl"
                                    disabled={formState.publishMode !== "publish"}
                                />
                            ) : (
                                <div className="rounded-xl border bg-background px-4 py-3 font-medium">
                                    {notice.publish_date ? format(new Date(notice.publish_date), "hh:mm a") : "-"}
                                </div>
                            )}
                        </div>

                        <div className="space-y-2 lg:col-span-2">
                            <Label>Attachment</Label>
                            <div className="rounded-2xl border bg-background p-4">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="min-w-0">
                                        <p className="truncate font-medium text-foreground">
                                            {currentAttachmentName}
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2">
                                        {!isEditMode ? (
                                            <AttachmentPreviewDialog notice={notice} />
                                        ) : null}

                                        {isEditMode ? (
                                            <>
                                                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium">
                                                    <Upload size={14} />
                                                    Replace
                                                    <input
                                                        type="file"
                                                        className="hidden"
                                                        onChange={(e) =>
                                                            setFormState((prev) => ({
                                                                ...prev,
                                                                attachmentFile: e.target.files?.[0] ?? null,
                                                                removeAttachment: false,
                                                            }))
                                                        }
                                                    />
                                                </label>

                                                {(notice.attachment_file || formState.attachmentFile) ? (
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        className="rounded-xl"
                                                        onClick={() =>
                                                            setFormState((prev) => ({
                                                                ...prev,
                                                                attachmentFile: null,
                                                                removeAttachment: true,
                                                            }))
                                                        }
                                                    >
                                                        Remove
                                                    </Button>
                                                ) : null}
                                            </>
                                        ) : null}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Created By</Label>
                            <div className="rounded-xl border bg-muted/20 px-4 py-3 font-medium">
                                {notice.created_by || "-"}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Created At</Label>
                            <div className="rounded-xl border bg-muted/20 px-4 py-3 font-medium">
                                {formatDateTime(notice.created_at)}
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="gap-2 border-t bg-muted/20 px-6 py-4 sm:justify-between">
                    <div className="flex items-center gap-2">
                        {!isEditMode ? (
                            <Button
                                type="button"
                                variant="outline"
                                className="rounded-xl"
                                onClick={() => setIsEditMode(true)}
                            >
                                <Pencil size={14} />
                                Edit
                            </Button>
                        ) : (
                            <Button
                                type="button"
                                variant="outline"
                                className="rounded-xl"
                                onClick={() => {
                                    setFormState(getInitialFormState(notice))
                                    setIsEditMode(false)
                                }}
                            >
                                <X size={14} />
                                Cancel Edit
                            </Button>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <DialogClose asChild>
                            <Button variant="outline" className="rounded-xl">
                                Close
                            </Button>
                        </DialogClose>

                        {isEditMode ? (
                            <Button
                                className="rounded-xl"
                                onClick={handleSave}
                                disabled={
                                    updateMutation.isPending ||
                                    !formState.type ||
                                    !formState.title.trim() ||
                                    !formState.meetingAtDate ||
                                    !formState.meetingAtTime ||
                                    (formState.publishMode === "publish" &&
                                        (!formState.publishDate || !formState.publishTime))
                                }
                            >
                                {updateMutation.isPending ? <Spinner /> : <Save size={14} />}
                                Save Changes
                            </Button>
                        ) : null}
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}