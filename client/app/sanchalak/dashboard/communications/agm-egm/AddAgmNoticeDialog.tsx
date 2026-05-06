"use client"

import { useMemo, useState } from "react"
import { CalendarDays, FileText, Plus, Upload, X } from "lucide-react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { Spinner } from "@/components/ui/spinner"

export type AddNoticeFormValues = {
    type: string
    audience: string
    title: string
    meeting_at: string
    is_published: boolean
    is_drafted: boolean
    publish_date: string
    attachment_file: File | null
}

type AddNoticeDialogProps = {
    open?: boolean
    onOpenChange?: (open: boolean) => void
    onSubmit: (values: AddNoticeFormValues) => Promise<void> | void
    isPending?: boolean
}

const typeOptions = ["AGM", "EGM"]
const audienceOptions = ["member", "sanchalak", "admins"]

const getInitialFormState = () => ({
    type: "AGM",
    audience: "member",
    title: "",
    meetingAtDate: undefined as Date | undefined,
    meetingAtTime: "10:00",
    attachmentFile: null as File | null,
})

export default function AddAgmNoticeDialog({
    open,
    onOpenChange,
    onSubmit,
    isPending = false,
}: AddNoticeDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false)
    const [formState, setFormState] = useState(getInitialFormState)

    const actualOpen = open ?? internalOpen

    const setActualOpen = (nextOpen: boolean) => {
        if (!nextOpen) {
            setFormState(getInitialFormState())
        }
        if (onOpenChange) {
            onOpenChange(nextOpen)
            return
        }
        setInternalOpen(nextOpen)
    }

    const fileLabel = useMemo(() => {
        if (!formState.attachmentFile) return "Upload attachment"
        return formState.attachmentFile.name
    }, [formState.attachmentFile])

    const buildDateTimeString = (date?: Date, time?: string) => {
        if (!date || !time) return ""
        const [hours, minutes] = time.split(":")
        const next = new Date(date)
        next.setHours(Number(hours || 0), Number(minutes || 0), 0, 0)
        return format(next, "yyyy-MM-dd HH:mm:ss")
    }

    const handleSubmit = async () => {
        await onSubmit({
            type: formState.type,
            audience: formState.audience,
            title: formState.title.trim(),
            meeting_at: buildDateTimeString(formState.meetingAtDate, formState.meetingAtTime),
            is_published: false,
            is_drafted: true,
            publish_date: "",
            attachment_file: formState.attachmentFile,
        })
        setActualOpen(false)
    }

    return (
        <Dialog open={actualOpen} onOpenChange={setActualOpen}>
            <DialogTrigger asChild>
                <Button className="rounded-xl">
                    <Plus size={16} />
                    Add Notice
                </Button>
            </DialogTrigger>

            <DialogContent className="overflow-hidden rounded-2xl border-0 p-0 shadow-2xl sm:max-w-2xl">
                <div className="border-b bg-linear-to-r from-slate-50 via-white to-slate-50 px-6 py-5">
                    <DialogHeader className="space-y-3">
                        <div className="flex items-start gap-3">
                            <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                <FileText size={20} />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-semibold text-foreground">
                                    Add AGM / EGM Notice
                                </DialogTitle>
                                <DialogDescription className="mt-1 text-sm text-muted-foreground">
                                    Create a new notice. Notice will be added as draft only.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                </div>

                <div className="p-6">
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                        <div className="min-w-0 space-y-2">
                            <Label>Type</Label>
                            <Select
                                value={formState.type}
                                onValueChange={(value) =>
                                    setFormState((prev) => ({ ...prev, type: value }))
                                }
                            >
                                <SelectTrigger className="h-11 w-full rounded-xl">
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
                        </div>

                        <div className="min-w-0 space-y-2">
                            <Label>Audience</Label>
                            <Select
                                value={formState.audience}
                                onValueChange={(value) =>
                                    setFormState((prev) => ({ ...prev, audience: value }))
                                }
                            >
                                <SelectTrigger className="h-11 w-full rounded-xl capitalize">
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
                        </div>

                        <div className="min-w-0 space-y-2">
                            <Label>Title</Label>
                            <Input
                                value={formState.title}
                                onChange={(e) =>
                                    setFormState((prev) => ({ ...prev, title: e.target.value }))
                                }
                                placeholder="Enter notice title"
                                className="h-11 w-full rounded-xl"
                            />
                        </div>

                        <div className="min-w-0 space-y-2">
                            <Label>Meeting Date</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className={cn(
                                            "h-11 w-full justify-start rounded-xl font-normal",
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
                        </div>

                        <div className="min-w-0 space-y-2">
                            <Label>Meeting Time</Label>
                            <Input
                                type="time"
                                value={formState.meetingAtTime}
                                onChange={(e) =>
                                    setFormState((prev) => ({
                                        ...prev,
                                        meetingAtTime: e.target.value,
                                    }))
                                }
                                className="h-11 w-full rounded-xl"
                            />
                        </div>

                        <div className="min-w-0 space-y-2">
                            <Label>Attachment</Label>
                            <label className="flex h-11 w-full cursor-pointer items-center gap-2 rounded-xl border border-input bg-background px-3 text-sm">
                                <Upload size={16} />
                                <span className="truncate">{fileLabel}</span>
                                <input
                                    type="file"
                                    className="hidden"
                                    onChange={(e) =>
                                        setFormState((prev) => ({
                                            ...prev,
                                            attachmentFile: e.target.files?.[0] ?? null,
                                        }))
                                    }
                                />
                            </label>
                        </div>
                    </div>
                </div>

                <DialogFooter className="gap-2 border-t bg-muted/20 px-6 py-4 sm:justify-end">
                    <DialogClose asChild>
                        <Button variant="outline" className="rounded-xl">
                            <X size={14} />
                            Cancel
                        </Button>
                    </DialogClose>

                    <Button
                        className="rounded-xl"
                        onClick={handleSubmit}
                        disabled={
                            isPending ||
                            !formState.type ||
                            !formState.title.trim() ||
                            !formState.meetingAtDate ||
                            !formState.meetingAtTime
                        }
                    >
                        {isPending ? <Spinner /> : <Plus size={14} />}
                        Create Notice
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}