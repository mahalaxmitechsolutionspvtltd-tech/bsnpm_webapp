"use client"

import * as React from "react"
import { useForm } from "@tanstack/react-form"
import { toast } from "sonner"
import * as z from "zod"
import { AlertCircle, UserCheck } from "lucide-react"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Alert,
    AlertDescription,
    AlertTitle,
} from "@/components/ui/alert"

import { addMemberHandler } from "@/services/memberHandler"
import { useAuth } from "@/Context/AuthProvider"
import type { CreateMemberPayload } from "@/types/memberTypes"
import { Spinner } from "./ui/spinner"

const optionalYesNoSchema = z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.enum(["yes", "no"]).optional()
)

const optionalPositiveNumberSchema = z.preprocess(
    (value) => {
        if (value === "" || value === null || value === undefined) return undefined
        if (typeof value === "number") return value
        const parsed = Number(value)
        return Number.isNaN(parsed) ? value : parsed
    },
    z.number().optional()
)

export const formSchema = z.object({
    full_name: z.string().min(3, "Full name should contain at least 3 characters.").max(100, "Full name is too long."),
    email: z.string().email("Please enter a valid email address."),
    gender: z.string().min(1, "Please select gender."),
    status: z.string().min(1, "Please select status."),
    password: z.string().min(6, "Password should contain at least 6 characters.").max(50, "Password is too long."),
    mobile_number: z.string().regex(/^[0-9]{10}$/, "Mobile number must be 10 digits."),
    member_joining_fee: optionalYesNoSchema,
    share_capital: optionalYesNoSchema,
    emergancy_fund: optionalYesNoSchema,
    share_capital_amount: optionalPositiveNumberSchema,
    emergancy_fund_amount: optionalPositiveNumberSchema,
}).superRefine((data, ctx) => {
    if (data.share_capital === "yes") {
        if (data.share_capital_amount === undefined) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["share_capital_amount"],
                message: "Please enter share capital amount.",
            })
        } else {
            if (data.share_capital_amount < 500) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["share_capital_amount"],
                    message: "Share capital amount must be at least 500.",
                })
            }
            if (data.share_capital_amount % 500 !== 0) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["share_capital_amount"],
                    message: "Share capital amount must be in multiples of 500.",
                })
            }
        }
    }

    if (data.emergancy_fund === "yes") {
        if (data.emergancy_fund_amount === undefined) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["emergancy_fund_amount"],
                message: "Please enter emergency fund amount.",
            })
        } else {
            if (data.emergancy_fund_amount < 20) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["emergancy_fund_amount"],
                    message: "Emergency fund amount must be at least 20.",
                })
            }
            if (data.emergancy_fund_amount % 20 !== 0) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["emergancy_fund_amount"],
                    message: "Emergency fund amount must be in multiples of 20.",
                })
            }
        }
    }
})

type FormValues = {
    full_name: string
    email: string
    password: string
    gender: string
    status: string
    mobile_number: string
    member_joining_fee: string
    share_capital: string
    emergancy_fund: string
    share_capital_amount: string
    emergancy_fund_amount: string
}

type FormErrorMap = Partial<Record<keyof FormValues, string[]>>
type BackendErrors = Record<string, string[]>

export function AddMembers() {
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

    const addMemberMutation = useMutation({
        mutationFn: addMemberHandler,
        onSuccess: async () => {
            toast.success("Member created successfully")
            await queryClient.invalidateQueries({ queryKey: ["members"] })
            resetAllErrors()
            setOpen(false)
            form.reset()
        },
        onError: (error: any) => {
            const message =
                error?.response?.data?.message ||
                error?.message ||
                "Failed to create member"

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

    const form = useForm({
        defaultValues: {
            full_name: "",
            email: "",
            password: "",
            gender: "",
            status: "",
            mobile_number: "",
            member_joining_fee: "",
            share_capital: "",
            emergancy_fund: "",
            share_capital_amount: "",
            emergancy_fund_amount: "",
        },
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

            const payload: CreateMemberPayload = {
                full_name: parsed.data.full_name,
                email: parsed.data.email,
                mobile_number: parsed.data.mobile_number,
                gender: parsed.data.gender as CreateMemberPayload["gender"],
                status: parsed.data.status as CreateMemberPayload["status"],
                password: parsed.data.password,
                created_by: user?.admin_name ?? "Admin",
                ...(parsed.data.member_joining_fee !== undefined ? { member_joining_fee: parsed.data.member_joining_fee } : {}),
                ...(parsed.data.share_capital !== undefined ? { share_capital: parsed.data.share_capital } : {}),
                ...(parsed.data.emergancy_fund !== undefined ? { emergancy_fund: parsed.data.emergancy_fund } : {}),
                ...(parsed.data.share_capital_amount !== undefined ? { share_capital_amount: parsed.data.share_capital_amount } : {}),
                ...(parsed.data.emergancy_fund_amount !== undefined ? { emergancy_fund_amount: parsed.data.emergancy_fund_amount } : {}),
            }

            await addMemberMutation.mutateAsync(payload)
        },
    })

    const getMergedErrors = (name: keyof FormValues) => {
        const client = fieldErrors[name] ?? []
        const server = serverErrors[name] ?? []
        return [...client, ...server]
    }

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
                <Button className="rounded-xl">
                    <UserCheck />
                    Add member
                </Button>
            </DialogTrigger>

            <DialogContent className="rounded-xl sm:max-w-4xl">
                <DialogTitle>Add Member</DialogTitle>
                <DialogDescription>Fill in the member details and create a new profile.</DialogDescription>

                {!!serverMessage && (
                    <Alert variant="destructive" className="rounded-xl">
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

                <Card className="border-none">
                    <CardContent className="border-none shadow-none">
                        <form
                            id="add-member-form"
                            onSubmit={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                form.handleSubmit()
                            }}
                            className="space-y-6"
                        >
                            <FieldGroup className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <form.Field
                                    name="full_name"
                                    children={(field) => {
                                        const errors = getMergedErrors("full_name")
                                        return (
                                            <Field>
                                                <FieldLabel htmlFor={field.name}>Full Name</FieldLabel>
                                                <Input
                                                    id={field.name}
                                                    name={field.name}
                                                    value={field.state.value}
                                                    onBlur={field.handleBlur}
                                                    onChange={(e) => {
                                                        clearFieldError("full_name")
                                                        field.handleChange(e.target.value)
                                                    }}
                                                    placeholder="Enter full name"
                                                    className="rounded-xl"
                                                />
                                                {errors.length > 0 ? <FieldError errors={toFieldErrorObjects(errors)} /> : null}
                                            </Field>
                                        )
                                    }}
                                />

                                <form.Field
                                    name="email"
                                    children={(field) => {
                                        const errors = getMergedErrors("email")
                                        return (
                                            <Field>
                                                <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                                                <Input
                                                    id={field.name}
                                                    name={field.name}
                                                    type="email"
                                                    value={field.state.value}
                                                    onBlur={field.handleBlur}
                                                    onChange={(e) => {
                                                        clearFieldError("email")
                                                        field.handleChange(e.target.value)
                                                    }}
                                                    placeholder="Enter email address"
                                                    className="rounded-xl"
                                                />
                                                {errors.length > 0 ? <FieldError errors={toFieldErrorObjects(errors)} /> : null}
                                            </Field>
                                        )
                                    }}
                                />

                                <form.Field
                                    name="mobile_number"
                                    children={(field) => {
                                        const errors = getMergedErrors("mobile_number")
                                        return (
                                            <Field>
                                                <FieldLabel htmlFor={field.name}>Mobile Number</FieldLabel>
                                                <Input
                                                    id={field.name}
                                                    name={field.name}
                                                    value={field.state.value}
                                                    onBlur={field.handleBlur}
                                                    onChange={(e) => {
                                                        clearFieldError("mobile_number")
                                                        field.handleChange(e.target.value)
                                                    }}
                                                    placeholder="Enter mobile number"
                                                    className="rounded-xl"
                                                />
                                                {errors.length > 0 ? <FieldError errors={toFieldErrorObjects(errors)} /> : null}
                                            </Field>
                                        )
                                    }}
                                />

                                <form.Field
                                    name="password"
                                    children={(field) => {
                                        const errors = getMergedErrors("password")
                                        return (
                                            <Field>
                                                <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                                                <Input
                                                    id={field.name}
                                                    name={field.name}
                                                    type="password"
                                                    value={field.state.value}
                                                    onBlur={field.handleBlur}
                                                    onChange={(e) => {
                                                        clearFieldError("password")
                                                        field.handleChange(e.target.value)
                                                    }}
                                                    placeholder="Enter password"
                                                    className="rounded-xl"
                                                />
                                                {errors.length > 0 ? <FieldError errors={toFieldErrorObjects(errors)} /> : null}
                                            </Field>
                                        )
                                    }}
                                />
                            </FieldGroup>

                            <FieldGroup className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                <form.Field
                                    name="gender"
                                    children={(field) => {
                                        const errors = getMergedErrors("gender")
                                        return (
                                            <Field>
                                                <FieldLabel>Gender</FieldLabel>
                                                <Select
                                                    value={field.state.value || undefined}
                                                    onValueChange={(value) => {
                                                        clearFieldError("gender")
                                                        field.handleChange(value)
                                                    }}
                                                >
                                                    <SelectTrigger className="w-full rounded-xl">
                                                        <SelectValue placeholder="Select gender" />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-xl">
                                                        <SelectItem value="male">Male</SelectItem>
                                                        <SelectItem value="female">Female</SelectItem>
                                                        <SelectItem value="other">Other</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                {errors.length > 0 ? <FieldError errors={toFieldErrorObjects(errors)} /> : null}
                                            </Field>
                                        )
                                    }}
                                />

                                <form.Field
                                    name="status"
                                    children={(field) => {
                                        const errors = getMergedErrors("status")
                                        return (
                                            <Field>
                                                <FieldLabel>Status</FieldLabel>
                                                <Select
                                                    value={field.state.value || undefined}
                                                    onValueChange={(value) => {
                                                        clearFieldError("status")
                                                        field.handleChange(value)
                                                    }}
                                                >
                                                    <SelectTrigger className="w-full rounded-xl">
                                                        <SelectValue placeholder="Select status" />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-xl">
                                                        <SelectItem value="active">Active</SelectItem>
                                                        <SelectItem value="defaulter">Defaulter</SelectItem>
                                                        <SelectItem value="resigned">Resigned</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                {errors.length > 0 ? <FieldError errors={toFieldErrorObjects(errors)} /> : null}
                                            </Field>
                                        )
                                    }}
                                />

                                <form.Field
                                    name="member_joining_fee"
                                    children={(field) => {
                                        const errors = getMergedErrors("member_joining_fee")
                                        return (
                                            <Field>
                                                <FieldLabel>Member Joining Fee (₹100) Received</FieldLabel>
                                                <Select
                                                    value={field.state.value || undefined}
                                                    onValueChange={(value) => {
                                                        clearFieldError("member_joining_fee")
                                                        field.handleChange(value)
                                                    }}
                                                >
                                                    <SelectTrigger className="w-full rounded-xl">
                                                        <SelectValue placeholder="Optional" />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-xl">
                                                        <SelectItem value="yes">Yes</SelectItem>
                                                        <SelectItem value="no">No</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                {errors.length > 0 ? <FieldError errors={toFieldErrorObjects(errors)} /> : null}
                                            </Field>
                                        )
                                    }}
                                />
                            </FieldGroup>

                            <FieldGroup className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <form.Subscribe
                                    selector={(state) => ({
                                        shareCapital: state.values.share_capital,
                                        shareCapitalAmount: state.values.share_capital_amount,
                                    })}
                                    children={({ shareCapital, shareCapitalAmount }) => {
                                        const shareCapitalErrors = getMergedErrors("share_capital")
                                        const shareCapitalAmountErrors = getMergedErrors("share_capital_amount")
                                        const isShareCapitalEnabled = shareCapital === "yes"

                                        return (
                                            <Field>
                                                <FieldLabel>Share Capital</FieldLabel>
                                                <div className="flex rounded-xl shadow-xs">
                                                    <form.Field
                                                        name="share_capital"
                                                        children={(field) => (
                                                            <Select
                                                                value={field.state.value || undefined}
                                                                onValueChange={(value) => {
                                                                    clearFieldError("share_capital")
                                                                    clearFieldError("share_capital_amount")
                                                                    field.handleChange(value)
                                                                    if (value !== "yes") {
                                                                        form.setFieldValue("share_capital_amount", "")
                                                                    }
                                                                }}
                                                            >
                                                                <SelectTrigger className="w-35 rounded-r-none rounded-l-xl shadow-none focus-visible:z-10">
                                                                    <SelectValue placeholder="Optional" />
                                                                </SelectTrigger>
                                                                <SelectContent className="rounded-xl">
                                                                    <SelectItem value="yes">Yes</SelectItem>
                                                                    <SelectItem value="no">No</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        )}
                                                    />

                                                    <form.Field
                                                        name="share_capital_amount"
                                                        children={(field) => (
                                                            <Input
                                                                id={field.name}
                                                                name={field.name}
                                                                type="number"
                                                                step="500"
                                                                min="500"
                                                                value={field.state.value}
                                                                disabled={!isShareCapitalEnabled}
                                                                onBlur={field.handleBlur}
                                                                onChange={(e) => {
                                                                    clearFieldError("share_capital_amount")
                                                                    field.handleChange(e.target.value)
                                                                }}
                                                                placeholder="500, 1000, 1500, 2000"
                                                                className="-ms-px rounded-l-none rounded-r-xl shadow-none"
                                                            />
                                                        )}
                                                    />
                                                </div>
                                                {shareCapitalErrors.length > 0 ? <FieldError errors={toFieldErrorObjects(shareCapitalErrors)} /> : null}
                                                {shareCapitalAmountErrors.length > 0 ? <FieldError errors={toFieldErrorObjects(shareCapitalAmountErrors)} /> : null}
                                            </Field>
                                        )
                                    }}
                                />

                                <form.Subscribe
                                    selector={(state) => ({
                                        emergancyFund: state.values.emergancy_fund,
                                        emergancyFundAmount: state.values.emergancy_fund_amount,
                                    })}
                                    children={({ emergancyFund, emergancyFundAmount }) => {
                                        const emergancyFundErrors = getMergedErrors("emergancy_fund")
                                        const emergancyFundAmountErrors = getMergedErrors("emergancy_fund_amount")
                                        const isEmergencyFundEnabled = emergancyFund === "yes"

                                        return (
                                            <Field>
                                                <FieldLabel>Emergency Fund</FieldLabel>
                                                <div className="flex rounded-xl shadow-xs">
                                                    <form.Field
                                                        name="emergancy_fund"
                                                        children={(field) => (
                                                            <Select
                                                                value={field.state.value || undefined}
                                                                onValueChange={(value) => {
                                                                    clearFieldError("emergancy_fund")
                                                                    clearFieldError("emergancy_fund_amount")
                                                                    field.handleChange(value)
                                                                    if (value !== "yes") {
                                                                        form.setFieldValue("emergancy_fund_amount", "")
                                                                    }
                                                                }}
                                                            >
                                                                <SelectTrigger className="w-35 rounded-r-none rounded-l-xl shadow-none focus-visible:z-10">
                                                                    <SelectValue placeholder="Optional" />
                                                                </SelectTrigger>
                                                                <SelectContent className="rounded-xl">
                                                                    <SelectItem value="yes">Yes</SelectItem>
                                                                    <SelectItem value="no">No</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        )}
                                                    />

                                                    <form.Field
                                                        name="emergancy_fund_amount"
                                                        children={(field) => (
                                                            <Input
                                                                id={field.name}
                                                                name={field.name}
                                                                type="number"
                                                                step="20"
                                                                min="20"
                                                                value={field.state.value}
                                                                disabled={!isEmergencyFundEnabled}
                                                                onBlur={field.handleBlur}
                                                                onChange={(e) => {
                                                                    clearFieldError("emergancy_fund_amount")
                                                                    field.handleChange(e.target.value)
                                                                }}
                                                                placeholder="20, 40, 60, 80, 100"
                                                                className="-ms-px rounded-l-none rounded-r-xl shadow-none"
                                                            />
                                                        )}
                                                    />
                                                </div>
                                                {emergancyFundErrors.length > 0 ? <FieldError errors={toFieldErrorObjects(emergancyFundErrors)} /> : null}
                                                {emergancyFundAmountErrors.length > 0 ? <FieldError errors={toFieldErrorObjects(emergancyFundAmountErrors)} /> : null}
                                            </Field>
                                        )
                                    }}
                                />
                            </FieldGroup>
                        </form>
                    </CardContent>
                </Card>

                <DialogFooter>
                    <DialogClose asChild>
                        <Button
                            variant="outline"
                            className="rounded-xl"
                            disabled={addMemberMutation.isPending}
                        >
                            Cancel
                        </Button>
                    </DialogClose>

                    <Button
                        type="button"
                        className="rounded-xl"
                        disabled={addMemberMutation.isPending}
                        onClick={() => form.handleSubmit()}
                    >
                        {addMemberMutation.isPending ? <Spinner /> : "Submit"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}