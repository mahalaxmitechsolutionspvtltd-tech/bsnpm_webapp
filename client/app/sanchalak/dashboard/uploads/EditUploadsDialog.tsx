"use client"

import * as React from "react"
import { useMutation } from "@tanstack/react-query"
import { ImagePlus } from "lucide-react"
import { updateDownload } from "@/services/downloads"

import type { DownloadItem } from "@/types/downloads"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/Context/AuthProvider"

type EditUploadsDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  data: DownloadItem | null
  onSuccess?: () => void | Promise<void>
}

type FormState = {
  title: string
  description: string
  file: File | null
}

type FormErrors = {
  title?: string
  description?: string
  file?: string
  submit?: string
}

export default function EditUploadsDialog({
  open,
  onOpenChange,
  data,
  onSuccess,
}: EditUploadsDialogProps) {
  const { user } = useAuth() as {
    user?: {
      full_name?: string
      admin_name?: string
    } | null
  }

  const actorName = user?.full_name || user?.admin_name || ""

  const [form, setForm] = React.useState<FormState>({
    title: "",
    description: "",
    file: null,
  })
  const [errors, setErrors] = React.useState<FormErrors>({})

  React.useEffect(() => {
    if (open && data) {
      setForm({
        title: data.title || "",
        description: data.description || "",
        file: null,
      })
      setErrors({})
    }

    if (!open) {
      setErrors({})
      setForm({
        title: "",
        description: "",
        file: null,
      })
    }
  }, [open, data])

  const mutation = useMutation({
    mutationFn: async (payload: FormData | { title: string; description: string; updated_by: string }) => {
      if (!data) {
        throw new Error("Upload not found")
      }
      return updateDownload(data.id, payload)
    },
    onSuccess: async () => {
      onOpenChange(false)
      if (onSuccess) {
        await onSuccess()
      }
    },
    onError: (error: Error) => {
      setErrors((prev) => ({
        ...prev,
        submit: error.message || "Failed to update upload",
      }))
    },
  })

  const validate = () => {
    const nextErrors: FormErrors = {}

    if (!form.title.trim()) {
      nextErrors.title = "Title is required"
    }

    if (form.file && form.file.size > 20 * 1024 * 1024) {
      nextErrors.file = "File size must be 20MB or less"
    }

    setErrors(nextErrors)

    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!validate() || !data) {
      return
    }

    if (form.file) {
      const payload = new FormData()
      payload.append("title", form.title.trim())
      payload.append("description", form.description.trim())
      payload.append("attachment", form.file)
      payload.append("updated_by", actorName)
      mutation.mutate(payload)
      return
    }

    mutation.mutate({
      title: form.title.trim(),
      description: form.description.trim(),
      updated_by: actorName,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="lg:max-w-3xl rounded-xl border bg-background p-0 shadow-xl">
        <DialogHeader className="border-b px-6 py-5">
          <DialogTitle className="text-2xl font-semibold tracking-tight text-foreground">
            Edit Upload
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 px-6 py-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">
              Title
            </label>
            <Input
              value={form.title}
              onChange={(e) => {
                setForm((prev) => ({
                  ...prev,
                  title: e.target.value,
                }))
                setErrors((prev) => ({
                  ...prev,
                  title: "",
                  submit: "",
                }))
              }}
              placeholder="Enter title"
              className="h-12 w-full rounded-xl"
              disabled={mutation.isPending}
            />
            {errors.title ? (
              <p className="text-sm text-destructive">{errors.title}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">
              Description
            </label>
            <Textarea
              value={form.description}
              onChange={(e) => {
                setForm((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
                setErrors((prev) => ({
                  ...prev,
                  description: "",
                  submit: "",
                }))
              }}
              placeholder="Enter description"
              className="min-h-[140px] w-full resize-none rounded-xl"
              disabled={mutation.isPending}
            />
            {errors.description ? (
              <p className="text-sm text-destructive">{errors.description}</p>
            ) : null}
          </div>

          <div className="space-y-3">
            <label className="text-sm font-semibold text-foreground">
              Attachment
            </label>

            <label className="flex min-h-[140px] w-full cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed bg-muted/30 px-4 py-6 text-center transition hover:bg-muted/50">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-background shadow-sm">
                <ImagePlus className="h-7 w-7 text-muted-foreground" />
              </div>
              <div className="mt-4 space-y-1">
                <p className="text-sm font-semibold text-foreground">
                  {form.file
                    ? form.file.name
                    : data?.attachment
                      ? "Replace current file"
                      : "Choose a file to upload"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {form.file
                    ? "New file selected for update"
                    : "Leave empty if you do not want to change the current file"}
                </p>
              </div>
              <input
                type="file"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null
                  setForm((prev) => ({
                    ...prev,
                    file,
                  }))
                  setErrors((prev) => ({
                    ...prev,
                    file: "",
                    submit: "",
                  }))
                }}
                className="hidden"
                disabled={mutation.isPending}
              />
            </label>

            <p className="text-xs text-muted-foreground">
              Max 20MB. Supported formats include PDF, DOCX, XLSX, CSV, JPG, PNG and ZIP.
            </p>

            {errors.file ? (
              <p className="text-sm text-destructive">{errors.file}</p>
            ) : null}
          </div>

          {errors.submit ? (
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {errors.submit}
            </div>
          ) : null}

          <div className="flex items-center justify-end gap-3 border-t pt-5">
            <Button
              type="button"
              variant="outline"
              className="h-12 min-w-[130px] rounded-xl"
              onClick={() => onOpenChange(false)}
              disabled={mutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="h-12 min-w-[130px] rounded-xl"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Updating..." : "Update"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}