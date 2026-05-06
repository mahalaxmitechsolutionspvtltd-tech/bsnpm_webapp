"use client"

import * as React from "react"
import { format } from "date-fns"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  CalendarDays,
  CalendarIcon,
  Clock3,
  FileImage,
  FileText,
  Loader2,
  MapPin,
  UploadCloud,
  Users,
  X,
  Eye,
  Pencil,
  CheckCircle2,
  Circle,
  ExternalLink,
  Image as ImageIcon,
  File,
} from "lucide-react"
import { updateMomHandler } from "@/services/momHandler"
import type { MomItem, UpdateMomPayload } from "@/types/mom"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
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
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

type ViewMomDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  details: MomItem | null
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

const MEETING_TYPE_OPTIONS = [
  { value: "committee", label: "Committee" },
  { value: "board", label: "Board" },
  { value: "agm", label: "AGM" },
  { value: "egm", label: "EGM" },
  { value: "general", label: "General" },
  { value: "other", label: "Other" },
]

const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"))
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"))

const DEFAULT_FORM: MomFormState = {
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

function parseDateString(value: string): Date | undefined {
  if (!value) return undefined
  const [y, m, d] = value.split("-").map(Number)
  if (!y || !m || !d) return undefined
  const date = new Date(y, m - 1, d)
  return isNaN(date.getTime()) ? undefined : date
}

function formatDateString(date?: Date): string {
  if (!date) return ""
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

function toInputDate(value: unknown): string {
  if (!value || typeof value !== "string") return ""
  const normalized = value.includes("T") ? value.split("T")[0] : value
  return /^\d{4}-\d{2}-\d{2}$/.test(normalized) ? normalized : ""
}

function toDisplayDate(value: unknown): string {
  if (!value || typeof value !== "string") return "—"
  const date = new Date(value)
  return isNaN(date.getTime()) ? String(value) : format(date, "dd MMM yyyy")
}

function extractKeyPointsText(value: unknown): string {
  if (!value) return ""
  if (typeof value === "string") return value
  if (Array.isArray(value)) return value.map(String).join("\n\n")
  if (typeof value === "object" && value !== null) {
    const t = (value as { text?: unknown }).text
    if (typeof t === "string") return t
    try {
      return JSON.stringify(value, null, 2)
    } catch {
      return ""
    }
  }
  return String(value)
}

function parseTimeParts(value: string) {
  if (!value || !/^\d{2}:\d{2}$/.test(value)) return { hour12: "", minute: "", meridiem: "AM" }
  const [hourStr, minute] = value.split(":")
  const hour24 = Number(hourStr)
  if (isNaN(hour24)) return { hour12: "", minute: "", meridiem: "AM" }
  const meridiem = hour24 >= 12 ? "PM" : "AM"
  const hour12Value = hour24 % 12 === 0 ? 12 : hour24 % 12
  return { hour12: String(hour12Value).padStart(2, "0"), minute, meridiem }
}

function buildTimeString(hour12: string, minute: string, meridiem: string): string {
  if (!hour12 || !minute || !meridiem) return ""
  const h = Number(hour12)
  if (isNaN(h)) return ""
  let hour24 = h % 12
  if (meridiem === "PM") hour24 += 12
  return `${String(hour24).padStart(2, "0")}:${minute}`
}

function formatTimeDisplay(value: string): string {
  if (!value || !/^\d{2}:\d{2}$/.test(value)) return "Select time"
  const { hour12, minute, meridiem } = parseTimeParts(value)
  if (!hour12 || !minute) return "Select time"
  return `${hour12}:${minute} ${meridiem}`
}

function parseNotes(value: unknown) {
  const text = extractKeyPointsText(value).trim()
  if (!text) return { agenda: "", summary: "", venue: "", meetingTime: "" }

  const venueMatch = text.match(/(?:^|\n\n)Venue:\s*([\s\S]+?)(?=\n\nMeeting Time:|$)/)
  const timeMatch = text.match(/(?:^|\n\n)Meeting Time:\s*([\s\S]+)$/)

  let content = text
  if (venueMatch?.[0]) content = content.replace(venueMatch[0], "").trim()
  if (timeMatch?.[0]) content = content.replace(timeMatch[0], "").trim()

  const sections = content.split(/\n\s*\n/).map(s => s.trim()).filter(Boolean)

  return {
    agenda: sections.length <= 1 ? sections[0] || "" : sections.slice(0, -1).join("\n\n"),
    summary: sections.length > 1 ? sections[sections.length - 1] : "",
    venue: venueMatch?.[1]?.trim() || "",
    meetingTime: timeMatch?.[1]?.trim() || "",
  }
}

function getInitialFormState(item: MomItem | null): MomFormState {
  if (!item) return DEFAULT_FORM
  const parsed = parseNotes(item.key_points)
  return {
    title: item.title ?? "",
    audience: item.audience ?? "committee",
    meeting_date: toInputDate(item.meeting_date),
    publish_date: toInputDate(item.publish_date),
    meeting_time: parsed.meetingTime,
    venue: parsed.venue,
    key_points: parsed.agenda,
    summary: parsed.summary,
    attachment_file: item.attachment_file ?? "",
    is_published: Boolean(item.is_published),
  }
}

function normalizeFormToPayload(form: MomFormState): UpdateMomPayload {
  const combinedSummary = [
    form.summary.trim(),
    form.venue.trim() ? `Venue: ${form.venue.trim()}` : "",
    form.meeting_time.trim() ? `Meeting Time: ${form.meeting_time.trim()}` : "",
  ].filter(Boolean).join("\n\n")

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

function getAttachmentUrl(details: MomItem): string {
  const item = details as MomItem & { attachment_url?: string | null }
  const raw = item.attachment_url || ""
  if (!raw) return ""
  if (/^https?:\/\//i.test(raw)) return encodeURI(raw)
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? ""
  return apiBase ? encodeURI(`${apiBase}/${raw.replace(/^\/+/, "")}`) : encodeURI(raw)
}

function getAttachmentName(details: MomItem): string {
  const raw = details.attachment_file || ""
  if (!raw) return ""
  const parts = raw.split("/")
  return parts[parts.length - 1] || raw
}

function getAttachmentType(path: string) {
  const lower = path.toLowerCase()
  if (/\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?|#|$)/.test(lower)) return "image"
  if (/\.pdf(\?|#|$)/.test(lower)) return "pdf"
  return "file"
}

function DatePickerField({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
}) {
  const selected = parseDateString(value)
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "h-10 w-full justify-between rounded-lg border-border/60 bg-background px-3 text-left font-normal text-sm",
            !value && "text-muted-foreground"
          )}
        >
          {selected ? format(selected, "dd MMM yyyy") : placeholder}
          <CalendarIcon className="size-3.5 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto rounded-xl p-0">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={d => onChange(formatDateString(d))}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}

function TimePickerField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const parsed = parseTimeParts(value)
  const [h, setH] = React.useState(parsed.hour12)
  const [m, setM] = React.useState(parsed.minute)
  const [mer, setMer] = React.useState(parsed.meridiem)

  React.useEffect(() => {
    const p = parseTimeParts(value)
    setH(p.hour12)
    setM(p.minute)
    setMer(p.meridiem)
  }, [value])

  const update = (nh: string, nm: string, nmer: string) => {
    setH(nh)
    setM(nm)
    setMer(nmer)
    onChange(buildTimeString(nh, nm, nmer))
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "h-10 w-full justify-between rounded-lg border-border/60 bg-background px-3 text-left font-normal text-sm",
            !value && "text-muted-foreground"
          )}
        >
          {formatTimeDisplay(value)}
          <Clock3 className="size-3.5 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 rounded-xl p-4">
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Hour", val: h, set: (v: string) => update(v, m, mer), opts: HOURS },
            { label: "Min", val: m, set: (v: string) => update(h, v, mer), opts: MINUTES },
            { label: "AM/PM", val: mer, set: (v: string) => update(h, m, v), opts: ["AM", "PM"] },
          ].map(({ label, val, set, opts }) => (
            <div key={label} className="space-y-1.5">
              <Label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{label}</Label>
              <Select value={val} onValueChange={set}>
                <SelectTrigger className="h-9 rounded-lg text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-64 rounded-xl">
                  {opts.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mt-3 w-full h-8 rounded-lg text-xs text-muted-foreground"
          onClick={() => onChange("")}
        >
          Clear time
        </Button>
      </PopoverContent>
    </Popover>
  )
}

function DetailRow({ icon: Icon, label, value, full }: {
  icon?: React.ElementType
  label: string
  value: React.ReactNode
  full?: boolean
}) {
  return (
    <div className={cn("space-y-1", full && "col-span-2")}>
      <div className="flex items-center gap-1.5">
        {Icon && <Icon className="size-3 text-muted-foreground" />}
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      </div>
      <div className="text-sm font-medium text-foreground leading-relaxed">{value || "—"}</div>
    </div>
  )
}

function SectionCard({ title, children, className }: {
  title: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("rounded-xl border border-border/50 bg-card overflow-hidden", className)}>
      <div className="px-4 py-3 border-b border-border/50 bg-muted/30">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

function Field({ label, children, full }: {
  label: string
  children: React.ReactNode
  full?: boolean
}) {
  return (
    <div className={cn("space-y-1.5", full && "col-span-2")}>
      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</Label>
      {children}
    </div>
  )
}

export default function ViewMomDialog({ open, onOpenChange, details }: ViewMomDialogProps) {
  const queryClient = useQueryClient()
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)
  const [activeTab, setActiveTab] = React.useState<"view" | "edit">("view")
  const [form, setForm] = React.useState<MomFormState>(DEFAULT_FORM)
  const [isAttachmentOpen, setIsAttachmentOpen] = React.useState(false)
  const [attachmentLoadFailed, setAttachmentLoadFailed] = React.useState(false)

  React.useEffect(() => {
    if (open) {
      setActiveTab("view")
      setForm(getInitialFormState(details))
      setIsAttachmentOpen(false)
      setAttachmentLoadFailed(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }, [open, details])

  React.useEffect(() => {
    if (isAttachmentOpen) {
      setAttachmentLoadFailed(false)
    }
  }, [isAttachmentOpen])

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!details?.id) throw new Error("Minutes of meeting not found")
      return updateMomHandler(details.id, normalizeFormToPayload(form))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mom-list"] })
      onOpenChange(false)
    },
  })

  const patch = <K extends keyof MomFormState>(key: K, value: MomFormState[K]) =>
    setForm(prev => ({ ...prev, [key]: value }))

  if (!details) return null

  const parsed = parseNotes(details.key_points)
  const extItem = details as MomItem & { created_at?: string | null; updated_at?: string | null }
  const attachmentUrl = getAttachmentUrl(details)
  const attachmentName = getAttachmentName(details)
  const attachmentType = getAttachmentType(attachmentUrl || details.attachment_file || "")
  const showImagePreview = attachmentType === "image" && !attachmentLoadFailed
  const showPdfPreview = attachmentType === "pdf" && !attachmentLoadFailed

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex h-[90vh] max-h-[90vh] flex-col overflow-hidden rounded-2xl border border-border/60 bg-background p-0 shadow-xl sm:max-w-5xl">
          <DialogHeader className="shrink-0 border-b border-border/50 px-5 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <FileText className="size-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <DialogTitle className="text-base font-semibold leading-tight truncate">
                    {details.title || "Minutes of Meeting"}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                    {details.audience ? (
                      <span className="capitalize">{details.audience} meeting</span>
                    ) : "Meeting record"}{" "}
                    · {toDisplayDate(details.meeting_date)}
                  </DialogDescription>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 mx-10">
                <div className="flex rounded-lg border border-border/60 overflow-hidden text-xs font-medium">
                  {(["view", "edit"] as const).map(tab => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-2 transition-colors capitalize",
                        activeTab === tab
                          ? "bg-primary text-primary-foreground"
                          : "bg-background text-muted-foreground hover:bg-muted/60"
                      )}
                    >
                      {tab === "view" ? <Eye className="size-3" /> : <Pencil className="size-3" />}
                      {tab}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto">
            {activeTab === "view" && (
              <div className="p-5 space-y-4">
                <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
                  <div className="space-y-4">
                    <SectionCard title="Meeting Details">
                      <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                        <DetailRow
                          label="Audience"
                          icon={Users}
                          value={
                            <span className="capitalize">
                              {MEETING_TYPE_OPTIONS.find((option) => option.value === (details.audience ?? "").toLowerCase())?.label ||
                                details.audience ||
                                "—"}
                            </span>
                          }
                        />
                        <DetailRow label="Meeting Date" icon={CalendarDays} value={toDisplayDate(details.meeting_date)} />
                        <DetailRow label="Meeting Time" icon={Clock3} value={parsed.meetingTime || "—"} />
                        <DetailRow label="Publish Date" icon={CalendarDays} value={toDisplayDate(details.publish_date)} />
                        <DetailRow label="Venue" icon={MapPin} value={parsed.venue || "—"} full />
                      </div>
                    </SectionCard>

                    <SectionCard title="Agenda">
                      {parsed.agenda ? (
                        <pre className="whitespace-pre-wrap break-words font-sans text-sm text-foreground leading-relaxed">
                          {parsed.agenda}
                        </pre>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">No agenda recorded.</p>
                      )}
                    </SectionCard>

                    <SectionCard title="Minutes Summary">
                      {parsed.summary ? (
                        <pre className="whitespace-pre-wrap break-words font-sans text-sm text-foreground leading-relaxed">
                          {parsed.summary}
                        </pre>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">No summary recorded.</p>
                      )}
                    </SectionCard>
                  </div>

                  <div className="space-y-4">
                    <SectionCard title="Publishing">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</span>
                          {details.is_published ? (
                            <Badge className="gap-1 rounded-md bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800">
                              <CheckCircle2 className="size-3" /> Published
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="gap-1 rounded-md">
                              <Circle className="size-3" /> Draft
                            </Badge>
                          )}
                        </div>
                        <Separator />
                        <DetailRow
                          label="Attachment"
                          icon={FileText}
                          value={
                            details.attachment_file ? (
                              <button
                                type="button"
                                onClick={() => setIsAttachmentOpen(true)}
                                className="inline-flex items-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-muted/60"
                              >
                                {attachmentType === "image" ? (
                                  <ImageIcon className="size-4" />
                                ) : attachmentType === "pdf" ? (
                                  <FileText className="size-4" />
                                ) : (
                                  <File className="size-4" />
                                )}
                                <span className="break-all text-left">{attachmentName || details.attachment_file}</span>
                                <Eye className="size-4" />
                              </button>
                            ) : "—"
                          }
                        />
                        <Separator />
                        <div className="grid grid-cols-2 gap-3 pt-1">
                          <DetailRow label="Created" value={toDisplayDate(extItem.created_at ?? null)} />
                          <DetailRow label="Updated" value={toDisplayDate(extItem.updated_at ?? null)} />
                        </div>
                      </div>
                    </SectionCard>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "edit" && (
              <div className="p-5 space-y-4">
                <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
                  <div className="space-y-4">
                    <SectionCard title="Meeting Details">
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="Meeting Type">
                          <Select value={form.audience} onValueChange={v => patch("audience", v)}>
                            <SelectTrigger className="h-10 w-full rounded-lg text-sm border-border/60">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                              {MEETING_TYPE_OPTIONS.map(o => (
                                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </Field>

                        <Field label="Publish Date">
                          <DatePickerField
                            value={form.publish_date}
                            onChange={v => patch("publish_date", v)}
                            placeholder="Pick date"
                          />
                        </Field>

                        <Field label="Title" full>
                          <Input
                            value={form.title}
                            onChange={e => patch("title", e.target.value)}
                            placeholder="e.g., Committee Meeting — Jan 2026"
                            className="h-10 rounded-lg border-border/60 text-sm"
                            required
                          />
                        </Field>

                        <Field label="Meeting Date">
                          <DatePickerField
                            value={form.meeting_date}
                            onChange={v => patch("meeting_date", v)}
                            placeholder="Pick date"
                          />
                        </Field>

                        <Field label="Meeting Time">
                          <TimePickerField value={form.meeting_time} onChange={v => patch("meeting_time", v)} />
                        </Field>

                        <Field label="Venue" full>
                          <div className="relative">
                            <MapPin className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                            <Input
                              value={form.venue}
                              onChange={e => patch("venue", e.target.value)}
                              placeholder="Society Office / Hall / Address"
                              className="h-10 rounded-lg border-border/60 pl-9 text-sm"
                            />
                          </div>
                        </Field>
                      </div>
                    </SectionCard>

                    <SectionCard title="Discussion Notes">
                      <div className="space-y-3">
                        <Field label="Agenda">
                          <Textarea
                            value={form.key_points}
                            onChange={e => patch("key_points", e.target.value)}
                            placeholder={"1) Review previous points\n2) Approvals\n3) Decisions..."}
                            className="min-h-32 resize-none rounded-lg border-border/60 text-sm"
                          />
                        </Field>
                        <Field label="Minutes Summary">
                          <Textarea
                            value={form.summary}
                            onChange={e => patch("summary", e.target.value)}
                            placeholder="Short summary for quick view..."
                            className="min-h-40 resize-none rounded-lg border-border/60 text-sm"
                          />
                        </Field>
                      </div>
                    </SectionCard>
                  </div>

                  <div className="space-y-4">
                    <SectionCard title="Publishing">
                      <div className="space-y-3">
                        <Field label="Publish Status">
                          <Select
                            value={form.is_published ? "published" : "draft"}
                            onValueChange={v => patch("is_published", v === "published")}
                          >
                            <SelectTrigger className="h-10 w-full rounded-lg text-sm border-border/60">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                              <SelectItem value="published">Published (Visible)</SelectItem>
                              <SelectItem value="draft">Draft (Hidden)</SelectItem>
                            </SelectContent>
                          </Select>
                        </Field>

                        <Field label="Attachment">
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            className="hidden"
                            onChange={e => patch("attachment_file", e.target.files?.[0]?.name ?? "")}
                          />
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className={cn(
                              "w-full rounded-lg border border-dashed border-border/60 bg-muted/30 px-4 py-5",
                              "flex flex-col items-center gap-2 text-center transition-colors",
                              "hover:bg-muted/60 hover:border-border"
                            )}
                          >
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                              <FileImage className="size-5 text-primary" />
                            </div>
                            <div className="space-y-0.5">
                              <p className="text-xs font-medium text-foreground">
                                {form.attachment_file || "Choose file"}
                              </p>
                              <p className="text-[11px] text-muted-foreground">PDF, JPG, PNG</p>
                            </div>
                            <div className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-background px-2.5 py-1.5 text-[11px] font-medium">
                              <UploadCloud className="size-3" />
                              Browse
                            </div>
                          </button>
                        </Field>
                      </div>
                    </SectionCard>

                    <SectionCard title="Preview">
                      <div className="space-y-2.5">
                        <div className="rounded-lg bg-muted/40 px-3 py-2.5">
                          <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold mb-0.5">Title</p>
                          <p className="text-sm font-medium text-foreground">
                            {form.title.trim() || <span className="text-muted-foreground italic">Meeting title…</span>}
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            {
                              label: "Type",
                              value: MEETING_TYPE_OPTIONS.find((option) => option.value === form.audience)?.label || form.audience
                            },
                            { label: "Status", value: form.is_published ? "Published" : "Draft" },
                            {
                              label: "Date",
                              value: form.meeting_date
                                ? format(parseDateString(form.meeting_date) as Date, "dd MMM yyyy")
                                : "—"
                            },
                            {
                              label: "Time",
                              value: form.meeting_time ? formatTimeDisplay(form.meeting_time) : "—"
                            },
                          ].map(({ label, value }) => (
                            <div key={label} className="rounded-lg bg-muted/40 px-3 py-2.5">
                              <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold mb-0.5">{label}</p>
                              <p className="text-sm font-medium capitalize text-foreground">{value || "—"}</p>
                            </div>
                          ))}
                        </div>
                        <div className="rounded-lg bg-muted/40 px-3 py-2.5">
                          <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold mb-0.5">Venue</p>
                          <p className="text-sm font-medium text-foreground">
                            {form.venue.trim() || <span className="text-muted-foreground italic">Venue details…</span>}
                          </p>
                        </div>
                      </div>
                    </SectionCard>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="shrink-0 border-t border-border/50 bg-muted/20 px-5 py-3">
            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-9 rounded-lg px-4 text-sm"
                onClick={() => onOpenChange(false)}
              >
                Close
              </Button>
              {activeTab === "edit" && (
                <Button
                  type="button"
                  size="sm"
                  className="h-9 rounded-lg px-5 text-sm"
                  onClick={() => updateMutation.mutate()}
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending && <Loader2 className="mr-1.5 size-3.5 animate-spin" />}
                  Save Changes
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isAttachmentOpen} onOpenChange={setIsAttachmentOpen}>
        <DialogContent className="max-h-[90vh] overflow-hidden rounded-2xl border border-border/60 bg-background p-0 shadow-xl sm:max-w-4xl">
          <DialogHeader className="shrink-0 border-b border-border/50 px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <DialogTitle className="truncate text-base font-semibold">
                  Attachment Preview
                </DialogTitle>
                <DialogDescription className="truncate text-xs text-muted-foreground">
                  {attachmentName || "Attachment file"}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="max-h-[calc(90vh-80px)] overflow-auto bg-muted/20 p-5">
            {!attachmentUrl ? (
              <div className="flex min-h-[320px] items-center justify-center rounded-xl border border-dashed border-border/60 bg-background">
                <div className="text-center">
                  <FileText className="mx-auto size-10 text-muted-foreground" />
                  <p className="mt-3 text-sm font-medium text-foreground">Attachment not available</p>
                </div>
              </div>
            ) : showImagePreview ? (
              <div className="overflow-hidden rounded-xl border border-border/60 bg-background">
                <img
                  src={attachmentUrl}
                  alt={attachmentName || "Attachment"}
                  className="block max-h-[70vh] w-full object-contain"
                  onError={() => setAttachmentLoadFailed(true)}
                />
              </div>
            ) : showPdfPreview ? (
              <div className="overflow-hidden rounded-xl border border-border/60 bg-background">
                <iframe
                  src={attachmentUrl}
                  title={attachmentName || "Attachment PDF"}
                  className="h-[70vh] w-full"
                />
              </div>
            ) : (
              <div className="flex min-h-[320px] items-center justify-center rounded-xl border border-dashed border-border/60 bg-background">
                <div className="text-center">
                  <File className="mx-auto size-10 text-muted-foreground" />
                  <p className="mt-3 text-sm font-medium text-foreground">{attachmentName || "Attachment file"}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Preview not available here</p>
                  <Button type="button" variant="outline" className="mt-4 rounded-lg" asChild>
                    <a href={attachmentUrl} target="_blank" rel="noreferrer">
                      <ExternalLink className="mr-2 size-4" />
                      Open File
                    </a>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}