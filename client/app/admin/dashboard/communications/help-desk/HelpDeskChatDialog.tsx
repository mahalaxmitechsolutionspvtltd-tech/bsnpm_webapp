"use client"

import * as React from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import {
  CalendarDays,
  Clock3,
  MessageSquare,
  Paperclip,
  Send,
  User,
  X,
} from "lucide-react"
import { replyHelpHandler } from "@/services/helpHandler"
import type { HelpItem, HelpMemberReplyItem, HelpReplyItem } from "@/types/helpTypes"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface HelpDeskChatDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  request: HelpItem | null
}

type ChatMessage =
  | {
      id: string
      type: "member"
      name: string
      message: string
      time: string | null
    }
  | {
      id: string
      type: "admin"
      name: string
      message: string
      time: string | null
    }

const formatDateTime = (value?: string | null) => {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return format(date, "dd MMM yyyy, hh:mm a")
}

const safeReplies = <T,>(value: T[] | null | undefined): T[] => {
  return Array.isArray(value) ? value : []
}

const getStatusClass = (status?: string | null) => {
  const normalized = (status || "").toLowerCase()
  if (normalized === "pending") {
    return "border-amber-500/20 bg-amber-500/10 text-amber-700"
  }
  if (normalized === "replied") {
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-700"
  }
  if (normalized === "closed") {
    return "border-slate-500/20 bg-slate-500/10 text-slate-700"
  }
  return "border-primary/20 bg-primary/10 text-primary"
}

const buildMessages = (request: HelpItem | null): ChatMessage[] => {
  if (!request) return []

  const base: ChatMessage[] = [
    {
      id: `request-${request.id}`,
      type: "member",
      name: request.member_name || "Member",
      message: request.message || "-",
      time: request.created_at || null,
    },
  ]

  const memberReplies = safeReplies<HelpMemberReplyItem>(request.member_replies).map(
    (reply, index) => ({
      id: `member-${request.id}-${index}-${String(reply.reply_at ?? index)}`,
      type: "member" as const,
      name: request.member_name || "Member",
      message: typeof reply.message === "string" ? reply.message : "-",
      time: typeof reply.reply_at === "string" ? reply.reply_at : null,
    })
  )

  const adminReplies = safeReplies<HelpReplyItem>(request.admin_reply).map((reply, index) => ({
    id: `admin-${request.id}-${index}-${reply.reply_at}`,
    type: "admin" as const,
    name: reply.admin_name || "Admin",
    message: reply.message,
    time: reply.reply_at || null,
  }))

  return [...base, ...memberReplies, ...adminReplies].sort((a, b) => {
    const aTime = a.time ? new Date(a.time).getTime() : 0
    const bTime = b.time ? new Date(b.time).getTime() : 0
    return aTime - bTime
  })
}

export default function HelpDeskChatDialog({
  open,
  onOpenChange,
  request,
}: HelpDeskChatDialogProps) {
  const queryClient = useQueryClient()
  const [message, setMessage] = React.useState("")
  const [status, setStatus] = React.useState("Replied")
  const [localRequest, setLocalRequest] = React.useState<HelpItem | null>(request)

  React.useEffect(() => {
    setLocalRequest(request)
    if (request) {
      setMessage("")
      setStatus(request.status || "Replied")
    }
  }, [request])

  const mutation = useMutation({
    mutationFn: async () => {
      if (!localRequest) {
        throw new Error("Request not found.")
      }

      return replyHelpHandler(localRequest.id, {
        message: message.trim(),
        status,
        admin_name: "Admin",
        updated_by: "Admin",
      })
    },
    onSuccess: (updatedRequest) => {
      setMessage("")
      setStatus(updatedRequest.status || "Replied")
      setLocalRequest(updatedRequest)
      queryClient.setQueryData<HelpItem[]>(["help-requests"], (oldData) => {
        if (!Array.isArray(oldData)) return [updatedRequest]
        return oldData.map((item) => (item.id === updatedRequest.id ? updatedRequest : item))
      })
      queryClient.invalidateQueries({ queryKey: ["help-requests"] })
    },
  })

  const messages = React.useMemo(() => buildMessages(localRequest), [localRequest])

  const handleSend = () => {
    if (!message.trim() || !localRequest || mutation.isPending) return
    mutation.mutate()
  }

  const handleClose = () => {
    if (mutation.isPending) return
    onOpenChange(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) {
          onOpenChange(true)
        }
      }}
    >
      <DialogContent
        className="flex h-[88vh] lg:max-w-4xl flex-col gap-0 overflow-hidden p-0"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader className="border-b px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <DialogTitle className="truncate text-base font-semibold">
                {localRequest?.subject || "Help Desk"}
              </DialogTitle>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" />
                  {localRequest?.member_name || "-"} ({localRequest?.member_id || "-"})
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {formatDateTime(localRequest?.created_at)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock3 className="h-3.5 w-3.5" />
                  {formatDateTime(localRequest?.updated_at)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 mx-10">
              <Badge
                variant="outline"
                className={cn(
                  "rounded-md border px-2 py-0.5 capitalize",
                  getStatusClass(localRequest?.status)
                )}
              >
                {localRequest?.status || "-"}
              </Badge>
              <Badge
                variant="secondary"
                className="rounded-md border-0 bg-muted px-2 py-0.5 capitalize text-muted-foreground"
              >
                {localRequest?.category || "-"}
              </Badge>
             
            </div>
          </div>
        </DialogHeader>

        <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[1fr_320px]">
          <div className="flex min-h-0 flex-col bg-muted/20">
            <ScrollArea className="min-h-0 flex-1">
              <div className="space-y-4 px-4 py-4 md:px-5">
                {messages.length ? (
                  messages.map((item) => (
                    <div
                      key={item.id}
                      className={cn(
                        "flex w-full",
                        item.type === "admin" ? "justify-end" : "justify-start"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[85%] rounded-2xl px-4 py-3 shadow-sm",
                          item.type === "admin"
                            ? "rounded-br-md bg-primary text-primary-foreground"
                            : "rounded-bl-md bg-background text-foreground"
                        )}
                      >
                        <div
                          className={cn(
                            "mb-1 text-xs font-medium",
                            item.type === "admin"
                              ? "text-primary-foreground/90"
                              : "text-muted-foreground"
                          )}
                        >
                          {item.name}
                        </div>
                        <div className="whitespace-pre-wrap text-sm leading-6">
                          {item.message}
                        </div>
                        <div
                          className={cn(
                            "mt-2 text-[11px]",
                            item.type === "admin"
                              ? "text-primary-foreground/80"
                              : "text-muted-foreground"
                          )}
                        >
                          {formatDateTime(item.time)}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-lg bg-background px-4 py-6 text-center text-sm text-muted-foreground">
                    No conversation found.
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="border-t bg-background px-4 py-4 md:px-5">
              <div className="flex items-center gap-3">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your reply..."
                  className="h-11 rounded-full border-0 bg-muted px-4 shadow-none focus-visible:ring-1"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      handleSend()
                    }
                  }}
                />
                <Button
                  type="button"
                  onClick={handleSend}
                  disabled={!message.trim() || mutation.isPending || !localRequest}
                  className="h-11 rounded-full px-5"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>

              {mutation.isError ? (
                <div className="mt-2 text-xs text-destructive">
                  {mutation.error instanceof Error
                    ? mutation.error.message
                    : "Failed to send reply."}
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex min-h-0 flex-col border-l bg-background">
            <div className="border-b px-4 py-4">
              <div className="text-sm font-semibold text-foreground">Details</div>
            </div>

            <ScrollArea className="min-h-0 flex-1">
              <div className="space-y-4 px-4 py-4">
                <div className="space-y-3">
                  <div>
                    <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Status
                    </div>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger className="h-10 w-full rounded-lg">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Replied">Replied</SelectItem>
                        <SelectItem value="Closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="rounded-lg bg-muted/40 p-3">
                    <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Member ID
                    </div>
                    <div className="text-sm font-medium text-foreground">
                      {localRequest?.member_id || "-"}
                    </div>
                  </div>

                  <div className="rounded-lg bg-muted/40 p-3">
                    <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Member Name
                    </div>
                    <div className="text-sm font-medium text-foreground">
                      {localRequest?.member_name || "-"}
                    </div>
                  </div>

                  <div className="rounded-lg bg-muted/40 p-3">
                    <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Category
                    </div>
                    <div className="text-sm font-medium text-foreground">
                      {localRequest?.category || "-"}
                    </div>
                  </div>

                  <div className="rounded-lg bg-muted/40 p-3">
                    <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Attachment
                    </div>
                    {localRequest?.attachment_url ? (
                      <a
                        href={localRequest.attachment_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 text-sm font-medium text-primary underline underline-offset-4"
                      >
                        <Paperclip className="h-4 w-4" />
                        {localRequest.attachment || "View attachment"}
                      </a>
                    ) : (
                      <div className="text-sm font-medium text-foreground">No attachment</div>
                    )}
                  </div>

                  <div className="rounded-lg bg-muted/40 p-3">
                    <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Created At
                    </div>
                    <div className="text-sm font-medium text-foreground">
                      {formatDateTime(localRequest?.created_at)}
                    </div>
                  </div>

                  <div className="rounded-lg bg-muted/40 p-3">
                    <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Updated At
                    </div>
                    <div className="text-sm font-medium text-foreground">
                      {formatDateTime(localRequest?.updated_at)}
                    </div>
                  </div>

                  <div className="rounded-lg bg-muted/40 p-3">
                    <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Total Replies
                    </div>
                    <div className="text-sm font-medium text-foreground">
                      {safeReplies(localRequest?.admin_reply).length +
                        safeReplies(localRequest?.member_replies).length}
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full rounded-lg"
                    onClick={handleClose}
                    disabled={mutation.isPending}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}