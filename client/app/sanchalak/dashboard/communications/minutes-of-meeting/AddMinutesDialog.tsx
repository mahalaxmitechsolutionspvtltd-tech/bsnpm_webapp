"use client"

import * as React from "react"
import { format } from "date-fns"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  CalendarIcon,
  Clock3,
  FileImage,
  Loader2,
  MapPin,
  UploadCloud,
} from "lucide-react"
import { addMomHandler } from "@/services/momHandler"
import type { AddMomPayload } from "@/types/mom"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
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

type AddMinutesDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type MomFormState = {
  title: string
  audience: string
  meeting_date: string
  publish_date: string
  meeting_time: string
  venue: string
  key_points: string
  summary: string
  attachment_file: string
  is_published: boolean
}

const meetingTypeOptions = [
  { value: "committee", label: "Committee" },
  { value: "board", label: "Board" },
  { value: "agm", label: "AGM" },
  { value: "egm", label: "EGM" },
  { value: "general", label: "General" },
  { value: "other", label: "Other" },
]

const defaultFormState: MomFormState = {
  title: "",
  audience: "committee",
  meeting_date: "",
  publish_date: "",
  meeting_time: "",
  venue: "",
  key_points: "",
  summary: "",
  attachment_file: "",
  is_published: true,
}

const hours = Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, "0"))
const minutes = Array.from({ length: 60 }, (_, index) => String(index).padStart(2, "0"))

const parseDateString = (value: string): Date | undefined => {
  if (!value) return undefined
  const [year, month, day] = value.split("-").map(Number)
  if (!year || !month || !day) return undefined
  const date = new Date(year, month - 1, day)
  if (Number.isNaN(date.getTime())) return undefined
  return date
}

const formatDateString = (date?: Date) => {
  if (!date) return ""
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

const parseTimeParts = (value: string) => {
  if (!value || !/^\d{2}:\d{2}$/.test(value)) {
    return {
      hour12: "",
      minute: "",
      meridiem: "AM",
    }
  }

  const [hourString, minute] = value.split(":")
  const hour24 = Number(hourString)

  if (Number.isNaN(hour24)) {
    return {
      hour12: "",
      minute: "",
      meridiem: "AM",
    }
  }

  const meridiem = hour24 >= 12 ? "PM" : "AM"
  const hour12Value = hour24 % 12 === 0 ? 12 : hour24 % 12

  return {
    hour12: String(hour12Value).padStart(2, "0"),
    minute,
    meridiem,
  }
}

const buildTimeString = (hour12: string, minute: string, meridiem: string) => {
  if (!hour12 || !minute || !meridiem) return ""
  const parsedHour12 = Number(hour12)
  if (Number.isNaN(parsedHour12)) return ""
  let hour24 = parsedHour12 % 12
  if (meridiem === "PM") {
    hour24 += 12
  }
  return `${String(hour24).padStart(2, "0")}:${minute}`
}

const formatTimeDisplay = (value: string) => {
  if (!value || !/^\d{2}:\d{2}$/.test(value)) return "Select time"
  const { hour12, minute, meridiem } = parseTimeParts(value)
  if (!hour12 || !minute) return "Select time"
  return `${hour12}:${minute} ${meridiem}`
}

const normalizeFormToPayload = (form: MomFormState): AddMomPayload => {
  const combinedSummary = [
    form.summary.trim(),
    form.venue.trim() ? `Venue: ${form.venue.trim()}` : "",
    form.meeting_time.trim() ? `Meeting Time: ${form.meeting_time.trim()}` : "",
  ]
    .filter(Boolean)
    .join("\n\n")

  const keyPoints = [form.key_points.trim(), combinedSummary.trim()].filter(Boolean).join("\n\n")

  return {
    title: form.title.trim(),
    audience: form.audience,
    meeting_date: form.meeting_date || "",
    publish_date: form.publish_date || null,
    key_points: keyPoints || null,
    attachment_file: form.attachment_file.trim() || null,
    is_published: form.is_published,
  }
}

type DatePickerFieldProps = {
  value: string
  onChange: (value: string) => void
  placeholder: string
}

function DatePickerField({ value, onChange, placeholder }: DatePickerFieldProps) {
  const selectedDate = parseDateString(value)

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "w-full justify-between rounded-xl bg-background px-3 text-left font-normal",
            !value && "text-muted-foreground"
          )}
        >
          <span>{selectedDate ? format(selectedDate, "dd-MM-yyyy") : placeholder}</span>
          <CalendarIcon className="size-4 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto rounded-xl p-0">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => onChange(formatDateString(date))}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}

type TimePickerFieldProps = {
  value: string
  onChange: (value: string) => void
}

function TimePickerField({ value, onChange }: TimePickerFieldProps) {
  const parsed = parseTimeParts(value)
  const [hour12, setHour12] = React.useState(parsed.hour12)
  const [minute, setMinute] = React.useState(parsed.minute)
  const [meridiem, setMeridiem] = React.useState(parsed.meridiem)

  React.useEffect(() => {
    const nextParsed = parseTimeParts(value)
    setHour12(nextParsed.hour12)
    setMinute(nextParsed.minute)
    setMeridiem(nextParsed.meridiem)
  }, [value])

  const updateTime = (nextHour12: string, nextMinute: string, nextMeridiem: string) => {
    setHour12(nextHour12)
    setMinute(nextMinute)
    setMeridiem(nextMeridiem)
    onChange(buildTimeString(nextHour12, nextMinute, nextMeridiem))
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "w-full justify-between rounded-xl bg-background px-3 text-left font-normal",
            !value && "text-muted-foreground"
          )}
        >
          <span>{formatTimeDisplay(value)}</span>
          <Clock3 className="size-4 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-70 rounded-xl p-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">Hour</Label>
            <Select value={hour12} onValueChange={(nextHour12) => updateTime(nextHour12, minute, meridiem)}>
              <SelectTrigger className="h-10 rounded-xl">
                <SelectValue placeholder="HH" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {hours.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">Minute</Label>
            <Select value={minute} onValueChange={(nextMinute) => updateTime(hour12, nextMinute, meridiem)}>
              <SelectTrigger className="h-10 rounded-xl">
                <SelectValue placeholder="MM" />
              </SelectTrigger>
              <SelectContent className="max-h-72 rounded-xl">
                {minutes.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">AM/PM</Label>
            <Select value={meridiem} onValueChange={(nextMeridiem) => updateTime(hour12, minute, nextMeridiem)}>
              <SelectTrigger className="h-10 rounded-xl">
                <SelectValue placeholder="AM/PM" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="AM">AM</SelectItem>
                <SelectItem value="PM">PM</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <Button type="button" variant="outline" className="h-10 rounded-xl" onClick={() => onChange("")}>
            Clear
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export default function AddMinutesDialog({ open, onOpenChange }: AddMinutesDialogProps) {
  const queryClient = useQueryClient()
  const [form, setForm] = React.useState<MomFormState>(defaultFormState)
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)

  const addMutation = useMutation({
    mutationFn: addMomHandler,
    onSuccess: () => {
      setForm(defaultFormState)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
      onOpenChange(false)
      queryClient.invalidateQueries({ queryKey: ["mom-list"] })
    },
  })

  const onChangeForm = <K extends keyof MomFormState>(key: K, value: MomFormState[K]) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const handleAttachmentClick = () => {
    fileInputRef.current?.click()
  }

  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    onChangeForm("attachment_file", file?.name ?? "")
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    addMutation.mutate(normalizeFormToPayload(form))
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          setForm(defaultFormState)
          if (fileInputRef.current) {
            fileInputRef.current.value = ""
          }
        }
        onOpenChange(nextOpen)
      }}
    >
      <DialogContent className="max-h-[92vh] overflow-y-auto rounded-2xl border bg-background p-0 shadow-2xl sm:max-w-5xl custom-scrollbar">
        <DialogHeader className="border-b bg-muted/30 px-6 py-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="space-y-1">
              <DialogTitle className="text-2xl font-semibold tracking-tight">Add Minutes</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Create a clean meeting record with details, agenda, summary and attachment.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 px-6 py-6">
          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-6">
              <div className="rounded-2xl border bg-card p-5">
                <div className="mb-4">
                  <h3 className="text-base font-semibold text-foreground">Meeting Details</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Add the core information for this meeting record.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Meeting Type</Label>
                    <Select value={form.audience} onValueChange={(value) => onChangeForm("audience", value)}>
                      <SelectTrigger className="w-full rounded-xl bg-background">
                        <SelectValue placeholder="Select meeting type" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {meetingTypeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Publish Date</Label>
                    <DatePickerField
                      value={form.publish_date}
                      onChange={(value) => onChangeForm("publish_date", value)}
                      placeholder="Select publish date"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-sm font-medium">Title</Label>
                    <Input
                      value={form.title}
                      onChange={(e) => onChangeForm("title", e.target.value)}
                      placeholder="e.g., Committee Meeting Minutes - Jan 2026"
                      className="w-full rounded-xl bg-background"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Meeting Date</Label>
                    <DatePickerField
                      value={form.meeting_date}
                      onChange={(value) => onChangeForm("meeting_date", value)}
                      placeholder="Select meeting date"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Meeting Time</Label>
                    <TimePickerField
                      value={form.meeting_time}
                      onChange={(value) => onChangeForm("meeting_time", value)}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-sm font-medium">Venue</Label>
                    <div className="relative">
                      <MapPin className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={form.venue}
                        onChange={(e) => onChangeForm("venue", e.target.value)}
                        placeholder="Society Office / Hall / Address"
                        className="w-full rounded-xl bg-background pl-10"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border bg-card p-5">
                <div className="mb-4">
                  <h3 className="text-base font-semibold text-foreground">Discussion Notes</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Capture agenda points and a short minutes summary.
                  </p>
                </div>

                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Agenda</Label>
                    <Textarea
                      value={form.key_points}
                      onChange={(e) => onChangeForm("key_points", e.target.value)}
                      placeholder={"1) Review previous points\n2) Approvals\n3) Decisions..."}
                      className="min-h-35 w-full rounded-xl bg-background resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Minutes Summary</Label>
                    <Textarea
                      value={form.summary}
                      onChange={(e) => onChangeForm("summary", e.target.value)}
                      placeholder="Short summary for quick view..."
                      className="min-h-45 w-full rounded-xl bg-background resize-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-2xl border bg-card p-5">
                <div className="mb-4">
                  <h3 className="text-base font-semibold text-foreground">Publishing</h3>
                </div>

                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Publish Status</Label>
                    <Select
                      value={form.is_published ? "published" : "draft"}
                      onValueChange={(value) => onChangeForm("is_published", value === "published")}
                    >
                      <SelectTrigger className="w-full rounded-xl bg-background">
                        <SelectValue placeholder="Select publish status" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="published">Published (Visible)</SelectItem>
                        <SelectItem value="draft">Draft (Hidden)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Attachment</Label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={handleAttachmentChange}
                    />
                    <button
                      type="button"
                      onClick={handleAttachmentClick}
                      className="flex w-full flex-col items-center justify-center rounded-xl border border-dashed bg-background px-4 py-6 text-center transition-colors hover:bg-muted/40"
                    >
                      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                        <FileImage className="size-7 text-primary" />
                      </div>
                      <div className="text-sm font-medium text-foreground">
                        {form.attachment_file ? form.attachment_file : "Choose attachment file"}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        Click here to open gallery or file picker
                      </div>
                      <div className="mt-4 inline-flex items-center rounded-lg border bg-background px-3 py-2 text-xs font-medium text-foreground">
                        <UploadCloud className="mr-2 size-4" />
                        Browse File
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border bg-muted/20 p-5">
                <h3 className="text-base font-semibold text-foreground">Quick Preview</h3>
                <div className="mt-4 space-y-4">
                  <div className="rounded-xl border bg-background p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Title</p>
                    <p className="mt-1 text-sm font-medium text-foreground">
                      {form.title.trim() || "Meeting title will appear here"}
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border bg-background p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Type</p>
                      <p className="mt-1 text-sm font-medium capitalize text-foreground">
                        {meetingTypeOptions.find((option) => option.value === form.audience)?.label || "-"}
                      </p>
                    </div>

                    <div className="rounded-xl border bg-background p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Status</p>
                      <p className="mt-1 text-sm font-medium text-foreground">
                        {form.is_published ? "Published" : "Draft"}
                      </p>
                    </div>

                    <div className="rounded-xl border bg-background p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Meeting Date</p>
                      <p className="mt-1 text-sm font-medium text-foreground">
                        {form.meeting_date ? format(parseDateString(form.meeting_date) as Date, "dd-MM-yyyy") : "-"}
                      </p>
                    </div>

                    <div className="rounded-xl border bg-background p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Meeting Time</p>
                      <p className="mt-1 text-sm font-medium text-foreground">
                        {form.meeting_time ? formatTimeDisplay(form.meeting_time) : "-"}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl border bg-background p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Venue</p>
                    <p className="mt-1 text-sm font-medium text-foreground">
                      {form.venue.trim() || "Venue details will appear here"}
                    </p>
                  </div>

                  <div className="rounded-xl border bg-background p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Attachment</p>
                    <p className="mt-1 text-sm font-medium text-foreground">
                      {form.attachment_file || "No attachment selected"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="border-t pt-4">
            <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
              <Button type="button" variant="outline" className="rounded-xl px-5" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" className="rounded-xl px-5" disabled={addMutation.isPending}>
                {addMutation.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                Save Minutes
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}