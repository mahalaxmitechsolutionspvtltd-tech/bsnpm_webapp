"use client"

import * as React from "react"
import Image from "next/image"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm } from "@tanstack/react-form"
import { Camera, Loader2, Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import {
  type Sanchalak,
  type SanchalakStatus,
  type UpdateSanchalakInput,
  updateSanchalakHandler,
} from "@/services/sanchalakHandlers"

type EditSanchalakDialogProps = {
  open: boolean
  sanchalak: Sanchalak | null
  onOpenChange: (open: boolean) => void
}

type FormValues = {
  sanchalak_name: string
  sanchalak_email: string
  sanchalak_mobile: string
  password: string
  status: SanchalakStatus
  profile_photo: File | null
}

const MAX_IMAGE_SIZE_IN_BYTES = 15 * 1024 * 1024

const getInitialValues = (sanchalak: Sanchalak | null): FormValues => ({
  sanchalak_name: sanchalak?.sanchalak_name || "",
  sanchalak_email: sanchalak?.sanchalak_email || "",
  sanchalak_mobile: sanchalak?.sanchalak_mobile || "",
  password: "",
  status: sanchalak?.status || "active",
  profile_photo: null,
})

const validateRequired = (value: string, label: string): string | undefined => {
  if (!value || value.trim().length === 0) {
    return `${label} is required`
  }

  return undefined
}

const validateEmail = (value: string): string | undefined => {
  if (!value || value.trim().length === 0) {
    return "Email is required"
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (!emailRegex.test(value.trim())) {
    return "Enter a valid email"
  }

  return undefined
}

const validateMobile = (value: string): string | undefined => {
  if (!value || value.trim().length === 0) {
    return "Mobile number is required"
  }

  const mobileRegex = /^[0-9+\-\s]{8,20}$/

  if (!mobileRegex.test(value.trim())) {
    return "Enter a valid mobile number"
  }

  return undefined
}

const validatePassword = (value: string): string | undefined => {
  if (!value || value.length === 0) {
    return undefined
  }

  if (value.length < 6) {
    return "Password must be at least 6 characters"
  }

  return undefined
}

export function EditSanchalakDialog({ open, sanchalak, onOpenChange }: EditSanchalakDialogProps) {
  const queryClient = useQueryClient()
  const [previewUrl, setPreviewUrl] = React.useState<string>("")
  const [serverError, setServerError] = React.useState<string>("")

  const updateMutation = useMutation({
    mutationFn: updateSanchalakHandler,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["sanchalaks"] })
      form.reset(getInitialValues(sanchalak))
      setPreviewUrl("")
      setServerError("")
      onOpenChange(false)
    },
    onError: (error: Error) => {
      setServerError(error.message)
    },
  })

  const form = useForm({
    defaultValues: getInitialValues(sanchalak),
    onSubmit: async ({ value }) => {
      if (!sanchalak) {
        setServerError("Sanchalak data not found")
        return
      }

      setServerError("")

      const payload: UpdateSanchalakInput = {
        id: sanchalak.id,
        sanchalak_name: value.sanchalak_name,
        sanchalak_email: value.sanchalak_email,
        sanchalak_mobile: value.sanchalak_mobile,
        password: value.password,
        status: value.status,
        profile_photo: value.profile_photo,
      }

      await updateMutation.mutateAsync(payload)
    },
  })

  React.useEffect(() => {
    if (open) {
      form.reset(getInitialValues(sanchalak))
      setPreviewUrl("")
      setServerError("")
    }
  }, [open, sanchalak])

  React.useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  const handleClose = (value: boolean) => {
    if (updateMutation.isPending) {
      return
    }

    if (!value) {
      form.reset(getInitialValues(sanchalak))
      setPreviewUrl("")
      setServerError("")
    }

    onOpenChange(value)
  }

  const currentPhotoUrl = previewUrl || sanchalak?.profile_photo || ""

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[92vh] overflow-y-auto rounded-lg sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Sanchalak</DialogTitle>
          <DialogDescription>
            Update sanchalak profile, login details and optional profile photo.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-5"
          onSubmit={(event) => {
            event.preventDefault()
            event.stopPropagation()
            void form.handleSubmit()
          }}
        >
          <form.Field
            name="profile_photo"
            validators={{
              onChange: ({ value }) => {
                if (!value) {
                  return undefined
                }

                const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"]

                if (!allowedTypes.includes(value.type)) {
                  return "Only JPG, JPEG, PNG and WEBP images are allowed"
                }

                if (value.size > MAX_IMAGE_SIZE_IN_BYTES) {
                  return "Image size must be below 15MB"
                }

                return undefined
              },
            }}
          >
            {(field) => (
              <div className="space-y-2">
                <Label>Profile Photo</Label>
                <div className="flex flex-col gap-4 rounded-lg border border-dashed p-4 sm:flex-row sm:items-center">
                  <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted">
                    {currentPhotoUrl ? (
                      <Image
                        src={currentPhotoUrl}
                        alt="Profile preview"
                        width={96}
                        height={96}
                        className="h-full w-full object-cover"
                        unoptimized
                      />
                    ) : (
                      <Camera className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>

                  <div className="flex-1 space-y-3">
                    <Input
                      id="edit_profile_photo"
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0] || null

                        if (previewUrl) {
                          URL.revokeObjectURL(previewUrl)
                        }

                        field.handleChange(file)
                        setPreviewUrl(file ? URL.createObjectURL(file) : "")
                      }}
                    />

                    <div className="flex flex-wrap gap-2">
                      <Button type="button" variant="outline" className="rounded-lg" asChild>
                        <Label htmlFor="edit_profile_photo" className="cursor-pointer">
                          <Upload className="mr-2 h-4 w-4" />
                          Upload Image
                        </Label>
                      </Button>

                      {previewUrl ? (
                        <Button
                          type="button"
                          variant="ghost"
                          className="rounded-lg"
                          onClick={() => {
                            if (previewUrl) {
                              URL.revokeObjectURL(previewUrl)
                            }

                            field.handleChange(null)
                            setPreviewUrl("")
                          }}
                        >
                          <X className="mr-2 h-4 w-4" />
                          Remove New Image
                        </Button>
                      ) : null}
                    </div>

                    <p className="text-xs text-muted-foreground">
                      Optional image. JPG, PNG or WEBP below 15MB.
                    </p>

                    {field.state.meta.errors.length > 0 ? (
                      <p className="text-sm text-destructive">{field.state.meta.errors[0]}</p>
                    ) : null}
                  </div>
                </div>
              </div>
            )}
          </form.Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <form.Field
              name="sanchalak_name"
              validators={{
                onChange: ({ value }) => validateRequired(value, "Name"),
              }}
            >
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Sanchalak Name</Label>
                  <Input
                    id={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                    placeholder="Enter full name"
                    className="rounded-lg"
                  />
                  {field.state.meta.errors.length > 0 ? (
                    <p className="text-sm text-destructive">{field.state.meta.errors[0]}</p>
                  ) : null}
                </div>
              )}
            </form.Field>

            <form.Field
              name="sanchalak_email"
              validators={{
                onChange: ({ value }) => validateEmail(value),
              }}
            >
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Email</Label>
                  <Input
                    id={field.name}
                    type="email"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                    placeholder="example@email.com"
                    className="rounded-lg"
                  />
                  {field.state.meta.errors.length > 0 ? (
                    <p className="text-sm text-destructive">{field.state.meta.errors[0]}</p>
                  ) : null}
                </div>
              )}
            </form.Field>

            <form.Field
              name="sanchalak_mobile"
              validators={{
                onChange: ({ value }) => validateMobile(value),
              }}
            >
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Mobile</Label>
                  <Input
                    id={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                    placeholder="Enter mobile number"
                    className="rounded-lg"
                  />
                  {field.state.meta.errors.length > 0 ? (
                    <p className="text-sm text-destructive">{field.state.meta.errors[0]}</p>
                  ) : null}
                </div>
              )}
            </form.Field>

            <form.Field
              name="password"
              validators={{
                onChange: ({ value }) => validatePassword(value),
              }}
            >
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Password</Label>
                  <Input
                    id={field.name}
                    type="password"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                    placeholder="Leave blank to keep old password"
                    className="rounded-lg"
                  />
                  {field.state.meta.errors.length > 0 ? (
                    <p className="text-sm text-destructive">{field.state.meta.errors[0]}</p>
                  ) : null}
                </div>
              )}
            </form.Field>

            <form.Field name="status">
              {(field) => (
                <div className="space-y-2 sm:col-span-2">
                  <Label>Status</Label>
                  <Select
                    value={field.state.value}
                    onValueChange={(value) => field.handleChange(value as SanchalakStatus)}
                  >
                    <SelectTrigger className="rounded-lg">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="blocked">Blocked</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </form.Field>
          </div>

          {serverError ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {serverError}
            </div>
          ) : null}

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" className="rounded-lg" onClick={() => handleClose(false)}>
              Cancel
            </Button>
            <Button type="submit" className="rounded-lg" disabled={updateMutation.isPending || !sanchalak}>
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Sanchalak"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}