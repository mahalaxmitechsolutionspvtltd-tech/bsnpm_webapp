"use client"

import { useEffect, useState } from "react"
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
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Spinner } from "@/components/ui/spinner"
import { useAuth } from "@/providers/auth-provider"
import { AddLoanSchemeFormValues, LoanTypes } from "@/types/loanTypes"
import { updateLoanSchemes } from "@/services/loanHandler"
import { Pencil } from "lucide-react"

type ViewLoanSchemesProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    selectedLoan: LoanTypes | null
    onUpdate: (updatedLoan: LoanTypes) => void
}


export default function ViewLoanSchemes({
    open,
    onOpenChange,
    selectedLoan,
    onUpdate,
}: ViewLoanSchemesProps) {
    const { user } = useAuth()
    const queryClient = useQueryClient()
    const [isEdit, setIsEdit] = useState(false)

    const updateLoanSchemeMutation = useMutation({
        mutationFn: async ({
            scheme_id,
            payload,
        }: {
            scheme_id: number | string
            payload: AddLoanSchemeFormValues
        }) => {
            return await updateLoanSchemes(scheme_id, payload)
        },
        onSuccess: (response) => {
            if (response?.success) {
                toast.success(response?.message || "Loan scheme updated successfully")
                setIsEdit(false)

                queryClient.invalidateQueries({
                    queryKey: ["LoanSchmes"],
                })

                onOpenChange(false)
                return
            }

            toast.error(response?.message || "Failed to update loan scheme")
        },
        onError: (error: any) => {
            toast.error(
                error?.response?.data?.message ||
                error?.message ||
                "Something went wrong while updating the loan scheme"
            )
        },
    })

    const form = useForm({
        defaultValues: {
            scheme_name: "",
            interest_rate: "",
            loan_details: "",
            created_by: "",
        } as AddLoanSchemeFormValues,

        onSubmit: async ({ value }) => {
            if (!selectedLoan?.id) {
                toast.error("Scheme id not found")
                return
            }

            const payload: AddLoanSchemeFormValues = {
                scheme_name: value.scheme_name.trim(),
                interest_rate: value.interest_rate.trim(),
                loan_details: value.loan_details.trim(),
                created_by:
                    selectedLoan?.created_by ||
                    user?.admin_name ||
                    value.created_by ||
                    "",
            }

            await updateLoanSchemeMutation.mutateAsync({
                scheme_id: selectedLoan.id,
                payload,
            })
        },
    })

    useEffect(() => {
        if (selectedLoan) {
            form.setFieldValue("scheme_name", selectedLoan.scheme_name ?? "")
            form.setFieldValue(
                "interest_rate",
                selectedLoan.interest_rate !== null &&
                    selectedLoan.interest_rate !== undefined
                    ? String(selectedLoan.interest_rate)
                    : ""
            )
            form.setFieldValue("loan_details", selectedLoan.loan_details ?? "")
            form.setFieldValue("created_by", selectedLoan.created_by ?? "")
            setIsEdit(false)
        }
    }, [selectedLoan])

    const handleDialogChange = (nextOpen: boolean) => {
        if (!nextOpen) {
            setIsEdit(false)

            if (selectedLoan) {
                form.setFieldValue("scheme_name", selectedLoan.scheme_name ?? "")
                form.setFieldValue(
                    "interest_rate",
                    selectedLoan.interest_rate !== null &&
                        selectedLoan.interest_rate !== undefined
                        ? String(selectedLoan.interest_rate)
                        : ""
                )
                form.setFieldValue("loan_details", selectedLoan.loan_details ?? "")
                form.setFieldValue("created_by", selectedLoan.created_by ?? "")
            } else {
                form.reset()
            }
        }

        onOpenChange(nextOpen)
    }

    if (!selectedLoan) return null

    const isLoading =
        updateLoanSchemeMutation.isPending || form.state.isSubmitting

    return (
        <Dialog open={open} onOpenChange={handleDialogChange}>
            <DialogContent className="rounded-xl sm:max-w-140">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold">
                        {isEdit ? "Edit Loan Scheme" : "Loan Scheme Details"}
                    </DialogTitle>
                    <DialogDescription>
                        {isEdit
                            ? "Update the selected loan scheme details."
                            : "View the selected loan scheme details."}
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
                    <div className="grid grid-cols-1 gap-5">
                        <div className="space-y-2">
                            <Label>Scheme ID</Label>
                            <Input
                                value={String(selectedLoan.id ?? "")}
                                disabled
                                className="rounded-xl"
                            />
                        </div>

                        <form.Field
                            name="scheme_name"
                            validators={{
                                onChange: ({ value }) =>
                                    !value?.trim()
                                        ? "Scheme name is required"
                                        : undefined,
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
                                        onChange={(e) =>
                                            field.handleChange(e.target.value)
                                        }
                                        placeholder="Enter scheme name"
                                        className="rounded-xl"
                                        disabled={!isEdit || isLoading}
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
                                        onChange={(e) =>
                                            field.handleChange(e.target.value)
                                        }
                                        placeholder="Enter interest rate"
                                        className="rounded-xl"
                                        disabled={!isEdit || isLoading}
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
                                    !value?.trim()
                                        ? "Scheme details are required"
                                        : undefined,
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
                                        onChange={(e) =>
                                            field.handleChange(e.target.value)
                                        }
                                        placeholder="Enter scheme details"
                                        className="min-h-30 rounded-xl"
                                        disabled={!isEdit || isLoading}
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
                    </div>

                    <DialogFooter className="sm:gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            className="rounded-xl"
                            onClick={() => handleDialogChange(false)}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>

                        {!isEdit ? (
                            <Button
                                type="button"
                                className="rounded-xl"
                                onClick={() => setIsEdit(true)}
                                disabled={isLoading}
                            >
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                            </Button>
                        ) : (
                            <form.Subscribe
                                selector={(state) => ({
                                    canSubmit: state.canSubmit,
                                })}
                            >
                                {({ canSubmit }) => (
                                    <Button
                                        type="submit"
                                        className="rounded-xl"
                                        disabled={!canSubmit || isLoading}
                                    >
                                        {isLoading ? <Spinner /> : "Update Scheme"}
                                    </Button>
                                )}
                            </form.Subscribe>
                        )}
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}