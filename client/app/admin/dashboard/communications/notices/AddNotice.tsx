"use client"

import * as React from "react"
import { format } from "date-fns"
import { CalendarIcon, Loader2 } from "lucide-react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createNoticeHandler } from "@/services/noticeHandler"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"

type CreateNoticeFormState = {
    title: string
    audience: string
    publish_at: string
    expire_at: string
    message: string
    attachment: File | null
}

type CreateNoticeError = {
    message?: string
    errors?: Record<string, string[] | string>
}

type AddNoticeDialogProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
}

type DateTimePickerFieldProps = {
    id: string
    label: string
    value: string
    placeholder: string
    error?: string
    onChange: (value: string) => void
}

const DEFAULT_FORM_STATE: CreateNoticeFormState = {
    title: "",
    audience: "",
    publish_at: "",
    expire_at: "",
    message: "",
    attachment: null,
}

const AUDIENCE_SELECT_OPTIONS = [
    { label: "Sanchalak", value: "SANCHALAK" },
    { label: "Admin", value: "ADMIN" },
    { label: "Member", value: "MEMBER" },
]

const TIME_OPTIONS = Array.from({ length: 48 }, (_, index) => {
    const hours = String(Math.floor(index / 2)).padStart(2, "0")
    const minutes = index % 2 === 0 ? "00" : "30"
    return `${hours}:${minutes}`
})

function getErrorMessage(
    error: CreateNoticeError | null,
    field: keyof CreateNoticeFormState | "created_by_admin_id" | "attachment"
) {
    const value = error?.errors?.[field]
    if (Array.isArray(value)) {
        return value[0] || ""
    }
    if (typeof value === "string") {
        return value
    }
    return ""
}

function parseStoredDate(value: string) {
    if (!value) return null
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return null
    return parsed
}

function formatDisplayDateTime(value: string) {
    const parsed = parseStoredDate(value)
    if (!parsed) return ""
    return format(parsed, "dd-MM-yyyy hh:mm a")
}

function getDatePart(value: string) {
    const parsed = parseStoredDate(value)
    if (!parsed) return undefined
    return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate())
}

function getTimePart(value: string) {
    const parsed = parseStoredDate(value)
    if (!parsed) return ""
    return `${String(parsed.getHours()).padStart(2, "0")}:${String(parsed.getMinutes()).padStart(2, "0")}`
}

function buildDateTimeString(date: Date | undefined, time: string) {
    if (!date || !time) return ""
    const [hoursRaw, minutesRaw] = time.split(":")
    const hours = Number(hoursRaw || "0")
    const minutes = Number(minutesRaw || "0")
    const next = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hours, minutes, 0, 0)
    const year = next.getFullYear()
    const month = String(next.getMonth() + 1).padStart(2, "0")
    const day = String(next.getDate()).padStart(2, "0")
    const hh = String(next.getHours()).padStart(2, "0")
    const mm = String(next.getMinutes()).padStart(2, "0")
    return `${year}-${month}-${day}T${hh}:${mm}`
}

function DateTimePickerField({
    id,
    label,
    value,
    placeholder,
    error,
    onChange,
}: DateTimePickerFieldProps) {
    const [open, setOpen] = React.useState(false)
    const selectedDate = getDatePart(value)
    const selectedTime = getTimePart(value)

    const handleDateSelect = (date: Date | undefined) => {
        if (!date) {
            onChange("")
            return
        }

        if (selectedTime) {
            onChange(buildDateTimeString(date, selectedTime))
            setOpen(false)
            return
        }

        onChange(buildDateTimeString(date, "00:00"))
    }

    const handleTimeChange = (time: string) => {
        const baseDate = selectedDate ?? new Date()
        onChange(buildDateTimeString(baseDate, time))
        if (selectedDate) {
            setOpen(false)
        }
    }

    return (
        <div className="space-y-1.5">
            <Label htmlFor={id} className="text-xs font-semibold uppercase tracking-wide text-foreground">
                {label}
            </Label>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_130px]">
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            id={id}
                            type="button"
                            variant="outline"
                            className={cn(
                                " justify-start rounded-lg px-3 text-left text-sm font-normal",
                                !value && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                            <span className="truncate">
                                {value ? formatDisplayDateTime(value) : placeholder}
                            </span>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto rounded-lg p-0" align="start">
                        <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={handleDateSelect}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>

                <Select value={selectedTime} onValueChange={handleTimeChange}>
                    <SelectTrigger className="h-10 rounded-lg">
                        <SelectValue placeholder="Time" />
                    </SelectTrigger>
                    <SelectContent>
                        {TIME_OPTIONS.map((time) => (
                            <SelectItem key={time} value={time}>
                                {time}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {error ? (
                <p className="text-xs text-destructive">{error}</p>
            ) : null}
        </div>
    )
}

export default function AddNoticeDialog({
    open,
    onOpenChange,
}: AddNoticeDialogProps) {
    const queryClient = useQueryClient()
    const [form, setForm] = React.useState<CreateNoticeFormState>(DEFAULT_FORM_STATE)
    const [formError, setFormError] = React.useState<CreateNoticeError | null>(null)

    const createNoticeMutation = useMutation({
        mutationFn: async (payload: CreateNoticeFormState) => {
            return await createNoticeHandler({
                title: payload.title.trim(),
                audience: payload.audience,
                message: payload.message.trim(),
                publish_at: payload.publish_at,
                expire_at: payload.expire_at ? payload.expire_at : null,
                created_by_admin_id: 1,
                attachment: payload.attachment,
            })
        },
        onSuccess: async () => {
            setForm(DEFAULT_FORM_STATE)
            setFormError(null)
            onOpenChange(false)
            await queryClient.invalidateQueries({ queryKey: ["notices"] })
        },
        onError: (error: CreateNoticeError) => {
            setFormError(error)
        },
    })

    const handleDialogChange = (nextOpen: boolean) => {
        onOpenChange(nextOpen)
        if (!nextOpen) {
            setForm(DEFAULT_FORM_STATE)
            setFormError(null)
            createNoticeMutation.reset()
        }
    }

    const handleCreateNotice = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setFormError(null)
        createNoticeMutation.mutate(form)
    }

    return (
        <Dialog open={open} onOpenChange={handleDialogChange}>
            <DialogContent className="w-[95vw] lg:max-w-2xl gap-0 overflow-hidden rounded-lg p-0">
                <DialogHeader className="border-b px-5 py-4">
                    <div className="flex items-center justify-between gap-4">
                        <DialogTitle className="text-xl font-semibold text-foreground">
                            Add Notice
                        </DialogTitle>
                    </div>
                </DialogHeader>

                <form onSubmit={handleCreateNotice} className="space-y-5 px-5 py-5">
                    <div className="space-y-1.5">
                        <Label htmlFor="notice-title" className="text-xs font-semibold uppercase tracking-wide text-foreground">
                            Title
                        </Label>
                        <Input
                            id="notice-title"
                            value={form.title}
                            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                            placeholder="AGM Notice"
                            className="h-10 rounded-lg"
                        />
                        {getErrorMessage(formError, "title") ? (
                            <p className="text-xs text-destructive">{getErrorMessage(formError, "title")}</p>
                        ) : null}
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-1.5">
                            <Label htmlFor="notice-audience" className="text-xs font-semibold uppercase tracking-wide text-foreground">
                                Audience
                            </Label>
                            <Select
                                value={form.audience}
                                onValueChange={(value) => setForm((prev) => ({ ...prev, audience: value }))}
                            >
                                <SelectTrigger id="notice-audience" className="h-10 w-full rounded-lg">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    {AUDIENCE_SELECT_OPTIONS.map((item) => (
                                        <SelectItem key={item.value} value={item.value}>
                                            {item.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {getErrorMessage(formError, "audience") ? (
                                <p className="text-xs text-destructive">{getErrorMessage(formError, "audience")}</p>
                            ) : null}
                        </div>

                        <DateTimePickerField
                            id="notice-publish-at"
                            label="Publish At"
                            value={form.publish_at}
                            placeholder="dd-mm-yyyy --:--"
                            error={getErrorMessage(formError, "publish_at")}
                            onChange={(nextValue) => setForm((prev) => ({ ...prev, publish_at: nextValue }))}
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <DateTimePickerField
                            id="notice-expire-at"
                            label="Expire At"
                            value={form.expire_at}
                            placeholder="dd-mm-yyyy --:--"
                            error={getErrorMessage(formError, "expire_at")}
                            onChange={(nextValue) => setForm((prev) => ({ ...prev, expire_at: nextValue }))}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="notice-message" className="text-xs font-semibold uppercase tracking-wide text-foreground">
                            Message
                        </Label>
                        <Textarea
                            id="notice-message"
                            value={form.message}
                            onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
                            placeholder="Write the notice message here..."
                            className="min-h-25 max-h-25 rounded-lg resize-none"
                        />
                        {getErrorMessage(formError, "message") ? (
                            <p className="text-xs text-destructive">{getErrorMessage(formError, "message")}</p>
                        ) : null}
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="notice-attachment" className="text-xs font-semibold uppercase tracking-wide text-foreground">
                            Attach Document
                        </Label>
                        <Input
                            id="notice-attachment"
                            type="file"
                            onChange={(e) => {
                                const file = e.target.files?.[0] ?? null
                                setForm((prev) => ({ ...prev, attachment: file }))
                            }}
                            className=" cursor-pointer rounded-lg"
                        />
                        {getErrorMessage(formError, "attachment") ? (
                            <p className="text-xs text-destructive">{getErrorMessage(formError, "attachment")}</p>
                        ) : null}
                    </div>

                    {formError?.message ? (
                        <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                            {formError.message}
                        </div>
                    ) : null}

                    <div className="flex items-center justify-end gap-2 pt-1">
                        <Button
                            type="button"
                            variant="outline"
                            className=" rounded-lg px-4"
                            onClick={() => handleDialogChange(false)}
                            disabled={createNoticeMutation.isPending}
                        >
                            Cancel
                        </Button>

                        <Button
                            type="submit"
                            className="h-10 rounded-lg px-4"
                            disabled={createNoticeMutation.isPending}
                        >
                            {createNoticeMutation.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                "Add Notice"
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}