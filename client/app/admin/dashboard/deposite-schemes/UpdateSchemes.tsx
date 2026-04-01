"use client"

import * as React from "react"
import { useForm } from "@tanstack/react-form"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import * as z from "zod"
import { toast } from "sonner"
import { AlertCircle, Pencil } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
import {
    Alert,
    AlertDescription,
    AlertTitle,
} from "@/components/ui/alert"

import { useAuth } from "@/providers/auth-provider"
import { updateDepositeSchemeHandler } from "@/services/depositeHandler"
import type { DepositScheme, UpdateDepositSchemePayload } from "@/types/depositeTypes"

const formSchema = z.object({
    scheme_name: z
        .string()
        .trim()
        .min(1, "Scheme name is required")
        .max(150, "Scheme name must be less than 150 characters"),
    interest_rate: z
        .string()
        .trim()
        .optional()
        .refine((value) => {
            if (!value) return true
            const parsed = Number(value)
            return !Number.isNaN(parsed)
        }, "Interest rate must be a valid number"),
    scheme_details: z
        .string()
        .trim()
        .optional(),
    term_notes: z
        .string()
        .trim()
        .optional(),
    investment_terms: z
        .string()
        .trim()
        .optional(),
})

type FormValues = {
    scheme_name: string
    interest_rate: string
    scheme_details: string
    term_notes: string
    investment_terms: string
}

type FormErrorMap = Partial<Record<keyof FormValues, string[]>>
type BackendErrors = Record<string, string[]>

type UpdateSchemesProps = {
    scheme: DepositScheme
}

function Spinner() {
    return (
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
    )
}

export function UpdateSchemes({ scheme }: UpdateSchemesProps) {
    const queryClient = useQueryClient()
    const { user } = useAuth()

    const [open, setOpen] = React.useState(false)
    const [fieldErrors, setFieldErrors] = React.useState<FormErrorMap>({})
    const [serverMessage, setServerMessage] = React.useState("")
    const [serverErrors, setServerErrors] = React.useState<BackendErrors>({})

    const toFieldErrorObjects = (errors: string[] = []) =>
        errors.map((message) => ({ message }))

    const clearFieldError = (name: keyof FormValues) => {
        setFieldErrors((prev) => {
            if (!prev[name]) return prev
            const next = { ...prev }
            delete next[name]
            return next
        })

        setServerErrors((prev) => {
            if (!prev[name]) return prev
            const next = { ...prev }
            delete next[name]
            return next
        })
    }

    const resetAllErrors = () => {
        setFieldErrors({})
        setServerErrors({})
        setServerMessage("")
    }

    const getMergedErrors = (name: keyof FormValues) => {
        return [...(fieldErrors[name] || []), ...(serverErrors[name] || [])]
    }

    const form = useForm({
        defaultValues: {
            scheme_name: "",
            interest_rate: "",
            scheme_details: "",
            term_notes: "",
            investment_terms: "",
        } satisfies FormValues,
        onSubmit: async ({ value }) => {
            resetAllErrors()

            const parsed = formSchema.safeParse(value)

            if (!parsed.success) {
                const flattened = parsed.error.flatten()
                const errors = flattened.fieldErrors as FormErrorMap
                setFieldErrors(errors)
                toast.error(parsed.error.issues[0]?.message || "Please fix the form errors")
                return
            }

            const payload: UpdateDepositSchemePayload = {
                scheme_name: parsed.data.scheme_name,
                updated_by: user?.admin_name ?? "Admin",
                scheme_details: parsed.data.scheme_details || null,
                term_notes: parsed.data.term_notes || null,
                investment_terms: parsed.data.investment_terms || null,
                interest_rate: parsed.data.interest_rate ? Number(parsed.data.interest_rate) : null,
            }

            await updateSchemeMutation.mutateAsync(payload)
        },
    })

    React.useEffect(() => {
        if (!open || !scheme) return

        form.setFieldValue("scheme_name", scheme.scheme_name || "")
        form.setFieldValue("interest_rate", scheme.interest_rate ? String(scheme.interest_rate) : "")
        form.setFieldValue("scheme_details", scheme.scheme_details || "")
        form.setFieldValue("term_notes", scheme.term_notes || "")
        form.setFieldValue("investment_terms", scheme.investment_terms || "")
        resetAllErrors()
    }, [open, scheme])

    const updateSchemeMutation = useMutation({
        mutationFn: (payload: UpdateDepositSchemePayload) =>
            updateDepositeSchemeHandler(scheme.id, payload),
        onSuccess: async () => {
            toast.success("Scheme updated successfully")
            await queryClient.invalidateQueries({ queryKey: ["deposite-schemes"] })
            resetAllErrors()
            setOpen(false)
            form.reset()
        },
        onError: (error: any) => {
            const message =
                error?.response?.data?.message ||
                error?.message ||
                "Failed to update scheme"

            const backendErrors = error?.response?.data?.errors || {}

            setServerMessage(message)
            setServerErrors(backendErrors)

            const normalizedFieldErrors: FormErrorMap = {}

            Object.entries(backendErrors).forEach(([key, value]) => {
                if (Array.isArray(value)) {
                    normalizedFieldErrors[key as keyof FormValues] = value as string[]
                }
            })

            setFieldErrors((prev) => ({
                ...prev,
                ...normalizedFieldErrors,
            }))

            toast.error(message)
        },
    })

    return (
        <Dialog
            open={open}
            onOpenChange={(value) => {
                setOpen(value)
                if (!value) {
                    resetAllErrors()
                    form.reset()
                }
            }}
        >
            <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="rounded-xl">
                    <Pencil />
                    Edit
                </Button>
            </DialogTrigger>

            <DialogContent className="overflow-hidden rounded-xl p-0 sm:max-w-3xl">
                <DialogHeader className="border-b px-6 py-4">
                    <div className="flex items-center justify-between gap-3">
                        <div className="space-y-1">
                            <DialogTitle className="text-[28px] font-semibold tracking-tight">
                                Update Scheme
                            </DialogTitle>
                            <DialogDescription className="text-sm text-muted-foreground">
                                Update deposit scheme details, rate and terms.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="px-6 py-5">
                    {!!serverMessage && (
                        <Alert variant="destructive" className="mb-5 rounded-xl">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>{serverMessage}</AlertTitle>
                            <AlertDescription>
                                <div className="space-y-1">
                                    {Object.entries(serverErrors).length > 0 ? (
                                        Object.entries(serverErrors).map(([key, messages]) => (
                                            <div key={key}>
                                                <span className="font-medium capitalize">{key.replaceAll("_", " ")}:</span>{" "}
                                                <span>{messages.join(", ")}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <div>Please check the entered details and try again.</div>
                                    )}
                                </div>
                            </AlertDescription>
                        </Alert>
                    )}

                    <form
                        id="update-scheme-form"
                        onSubmit={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            form.handleSubmit()
                        }}
                        className="space-y-6"
                    >
                        <FieldGroup className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <form.Field
                                name="scheme_name"
                                children={(field) => {
                                    const errors = getMergedErrors("scheme_name")
                                    return (
                                        <Field>
                                            <FieldLabel htmlFor={field.name} className="text-sm font-semibold capitalize text-muted-foreground">
                                                Scheme Name
                                            </FieldLabel>
                                            <Input
                                                id={field.name}
                                                name={field.name}
                                                value={field.state.value}
                                                onBlur={field.handleBlur}
                                                onChange={(e) => {
                                                    clearFieldError("scheme_name")
                                                    field.handleChange(e.target.value)
                                                }}
                                                placeholder="Recurring Deposit"
                                                className="h-11 rounded-xl"
                                            />
                                            {errors.length > 0 ? <FieldError errors={toFieldErrorObjects(errors)} /> : null}
                                        </Field>
                                    )
                                }}
                            />

                            <form.Field
                                name="interest_rate"
                                children={(field) => {
                                    const errors = getMergedErrors("interest_rate")
                                    return (
                                        <Field>
                                            <FieldLabel htmlFor={field.name} className="text-sm font-semibold capitalize text-muted-foreground">
                                                Interest Rate
                                            </FieldLabel>
                                            <Input
                                                id={field.name}
                                                name={field.name}
                                                value={field.state.value}
                                                onBlur={field.handleBlur}
                                                onChange={(e) => {
                                                    clearFieldError("interest_rate")
                                                    field.handleChange(e.target.value)
                                                }}
                                                placeholder="7"
                                                className="h-11 rounded-xl"
                                            />
                                            {errors.length > 0 ? <FieldError errors={toFieldErrorObjects(errors)} /> : null}
                                        </Field>
                                    )
                                }}
                            />
                        </FieldGroup>

                        <form.Field
                            name="scheme_details"
                            children={(field) => {
                                const errors = getMergedErrors("scheme_details")
                                return (
                                    <Field>
                                        <FieldLabel htmlFor={field.name} className="text-sm font-semibold capitalize text-muted-foreground">
                                            Details / Description
                                        </FieldLabel>
                                        <Textarea
                                            id={field.name}
                                            name={field.name}
                                            value={field.state.value}
                                            onBlur={field.handleBlur}
                                            onChange={(e) => {
                                                clearFieldError("scheme_details")
                                                field.handleChange(e.target.value)
                                            }}
                                            placeholder="Short description visible in table"
                                            className="min-h-23 resize-none rounded-xl"
                                        />
                                        {errors.length > 0 ? <FieldError errors={toFieldErrorObjects(errors)} /> : null}
                                    </Field>
                                )
                            }}
                        />

                        <FieldGroup className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <form.Field
                                name="term_notes"
                                children={(field) => {
                                    const errors = getMergedErrors("term_notes")
                                    return (
                                        <Field>
                                            <FieldLabel htmlFor={field.name} className="text-sm font-semibold capitalize text-muted-foreground">
                                                Term Notes <span className="normal-case tracking-normal text-muted-foreground">(one per line)</span>
                                            </FieldLabel>
                                            <Textarea
                                                id={field.name}
                                                name={field.name}
                                                value={field.state.value}
                                                onBlur={field.handleBlur}
                                                onChange={(e) => {
                                                    clearFieldError("term_notes")
                                                    field.handleChange(e.target.value)
                                                }}
                                                placeholder="Minimum amount: 1000"
                                                className="min-h-32 resize-none rounded-xl"
                                            />
                                            {errors.length > 0 ? <FieldError errors={toFieldErrorObjects(errors)} /> : null}
                                        </Field>
                                    )
                                }}
                            />

                            <form.Field
                                name="investment_terms"
                                children={(field) => {
                                    const errors = getMergedErrors("investment_terms")
                                    return (
                                        <Field>
                                            <FieldLabel htmlFor={field.name} className="text-sm font-semibold capitalize text-muted-foreground">
                                                Investment Terms <span className="normal-case tracking-normal text-muted-foreground">(comma separated)</span>
                                            </FieldLabel>
                                            <Textarea
                                                id={field.name}
                                                name={field.name}
                                                value={field.state.value}
                                                onBlur={field.handleBlur}
                                                onChange={(e) => {
                                                    clearFieldError("investment_terms")
                                                    field.handleChange(e.target.value)
                                                }}
                                                placeholder="1 year, 2 years"
                                                className="min-h-32 resize-none rounded-xl"
                                            />
                                            {errors.length > 0 ? <FieldError errors={toFieldErrorObjects(errors)} /> : null}
                                        </Field>
                                    )
                                }}
                            />
                        </FieldGroup>
                    </form>
                </div>

                <DialogFooter className="border-t px-6 py-4 sm:justify-end">
                    <DialogClose asChild>
                        <Button
                            variant="outline"
                            className="rounded-md"
                            disabled={updateSchemeMutation.isPending}
                        >
                            Cancel
                        </Button>
                    </DialogClose>

                    <Button
                        type="button"
                        className="rounded-md"
                        disabled={updateSchemeMutation.isPending}
                        onClick={() => form.handleSubmit()}
                    >
                        {updateSchemeMutation.isPending ? <Spinner /> : "Update Scheme"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}