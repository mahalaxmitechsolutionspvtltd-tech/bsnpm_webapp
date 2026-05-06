"use client"

import { useEffect, useState } from "react"
import { Plus } from "lucide-react"
import { useForm } from "@tanstack/react-form"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Spinner } from "@/components/ui/spinner"
import { useAuth } from "@/Context/AuthProvider"
import { AddLoanSchemeFormValues } from "@/types/loanTypes"
import { addLoanSchemes } from "@/services/loanHandler"

export default function AddLoanSchemes() {
    const { user } = useAuth()
    const queryClient = useQueryClient()
    const [open, setOpen] = useState(false)

    const addLoanSchemeMutation = useMutation({
        mutationFn: async (payload: AddLoanSchemeFormValues) => {
            return await addLoanSchemes(payload)
        },
        onSuccess: (response) => {
            if (response?.success) {
                toast.success(response?.message || "Loan scheme added successfully")
                form.reset()
                setOpen(false)

                queryClient.invalidateQueries({
                    queryKey: ['LoanSchmes'],
                })

                return
            }

            toast.error(response?.message || "Failed to add loan scheme")
        },
        onError: (error: any) => {
            toast.error(
                error?.response?.data?.message ||
                error?.message ||
                "Something went wrong while adding the loan scheme"
            )
        },
    })

    const form = useForm({
        defaultValues: {
            scheme_name: "",
            interest_rate: "",
            loan_details: "",
            created_by: user?.admin_name || "",
        } as AddLoanSchemeFormValues,

        onSubmit: async ({ value }) => {
            const payload: AddLoanSchemeFormValues = {
                scheme_name: value.scheme_name.trim(),
                interest_rate: value.interest_rate.trim(),
                loan_details: value.loan_details.trim(),
                created_by: user?.admin_name || value.created_by || "",
            }

            await addLoanSchemeMutation.mutateAsync(payload)
        },
    })

    useEffect(() => {
        if (user?.admin_name) {
            form.setFieldValue("created_by", user.admin_name)
        }
    }, [user?.admin_name])

    const handleDialogChange = (nextOpen: boolean) => {
        setOpen(nextOpen)

        if (!nextOpen) {
            form.reset()
        }
    }

    const isLoading =
        addLoanSchemeMutation.isPending || form.state.isSubmitting

    return (
        <div>
            <Dialog open={open} onOpenChange={handleDialogChange}>
                <DialogTrigger asChild>
                    <Button className="rounded-xl">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Scheme
                    </Button>
                </DialogTrigger>

                <DialogContent className="rounded-xl sm:max-w-140">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-semibold">
                            Add Loan Scheme
                        </DialogTitle>
                        <DialogDescription>
                            Enter the scheme details below and save the record.
                        </DialogDescription>
                    </DialogHeader>

                    <form
                        onSubmit={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            void form.handleSubmit()
                        }}
                        className="space-y-5"
                    >
                        <form.Field
                            name="scheme_name"
                            validators={{
                                onChange: ({ value }) =>
                                    !value?.trim() ? "Scheme name is required" : undefined,
                            }}
                        >
                            {(field) => (
                                <div className="space-y-2">
                                    <Label htmlFor={field.name}>Scheme Name</Label>
                                    <Input
                                        id={field.name}
                                        name={field.name}
                                        value={field.state.value}
                                        onBlur={field.handleBlur}
                                        onChange={(e) => field.handleChange(e.target.value)}
                                        placeholder="Enter scheme name"
                                        className="rounded-xl"
                                    />
                                    {field.state.meta.isTouched &&
                                        field.state.meta.errors.length > 0 && (
                                            <p className="text-sm text-destructive">
                                                {field.state.meta.errors[0]?.toString()}
                                            </p>
                                        )}
                                </div>
                            )}
                        </form.Field>

                        <form.Field
                            name="interest_rate"
                            validators={{
                                onChange: ({ value }) => {
                                    if (!value?.trim()) {
                                        return "Interest rate is required"
                                    }

                                    const parsed = Number(value)

                                    if (Number.isNaN(parsed)) {
                                        return "Interest rate must be a valid number"
                                    }

                                    if (parsed < 0) {
                                        return "Interest rate cannot be negative"
                                    }

                                    return undefined
                                },
                            }}
                        >
                            {(field) => (
                                <div className="space-y-2">
                                    <Label htmlFor={field.name}>Interest Rate</Label>
                                    <Input
                                        id={field.name}
                                        name={field.name}
                                        type="text"
                                        inputMode="decimal"
                                        value={field.state.value}
                                        onBlur={field.handleBlur}
                                        onChange={(e) => field.handleChange(e.target.value)}
                                        placeholder="Enter interest rate"
                                        className="rounded-xl"
                                    />
                                    {field.state.meta.isTouched &&
                                        field.state.meta.errors.length > 0 && (
                                            <p className="text-sm text-destructive">
                                                {field.state.meta.errors[0]?.toString()}
                                            </p>
                                        )}
                                </div>
                            )}
                        </form.Field>

                        <form.Field
                            name="loan_details"
                            validators={{
                                onChange: ({ value }) =>
                                    !value?.trim() ? "Scheme details are required" : undefined,
                            }}
                        >
                            {(field) => (
                                <div className="space-y-2">
                                    <Label htmlFor={field.name}>Scheme Details</Label>
                                    <Textarea
                                        id={field.name}
                                        name={field.name}
                                        value={field.state.value}
                                        onBlur={field.handleBlur}
                                        onChange={(e) => field.handleChange(e.target.value)}
                                        placeholder="Enter scheme details"
                                        className="min-h-30 rounded-xl"
                                    />
                                    {field.state.meta.isTouched &&
                                        field.state.meta.errors.length > 0 && (
                                            <p className="text-sm text-destructive">
                                                {field.state.meta.errors[0]?.toString()}
                                            </p>
                                        )}
                                </div>
                            )}
                        </form.Field>

                        <DialogFooter className="sm:gap-0">
                            <Button
                                type="button"
                                variant="outline"
                                className="rounded-xl"
                                onClick={() => {
                                    form.reset()
                                    setOpen(false)
                                }}
                                disabled={isLoading}
                            >
                                Cancel
                            </Button>

                            <form.Subscribe
                                selector={(state) => ({
                                    canSubmit: state.canSubmit,
                                })}
                            >
                                {({ canSubmit }) => (
                                    <Button
                                        type="submit"
                                        className="mx-2 rounded-xl"
                                        disabled={!canSubmit || isLoading}
                                    >
                                        {isLoading ? <Spinner /> : "Save Scheme"}
                                    </Button>
                                )}
                            </form.Subscribe>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}