"use client"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
    Field,
    FieldDescription,
    FieldGroup,
    FieldLabel,
    FieldSeparator,
} from "@/components/ui/field"

import { Input } from "@/components/ui/input"
import { useEffect, useState } from "react"
import { Eye, EyeClosed, ShieldAlert } from "lucide-react"
import { useLogin } from "@/hooks/useLogin"
import { Alert, AlertDescription, AlertTitle } from "./ui/alert"
import { Spinner } from "./ui/spinner"

export default function SanchalakLoginForm({
    className,
    ...props
}: React.ComponentProps<"div">) {

    const { sanchalakLogin, loading, error } = useLogin();

    const [hide, setHide] = useState(false);
    const [sanchalakId, setSanchalakId] = useState("")
    const [password, setPassword] = useState("")
    const [open, setOpen] = useState(true)
    const handleSubmit = async () => {
        await sanchalakLogin({ sanchalakId, password });
    }
    useEffect(() => {
        if (error) {
            setOpen(true)

            const timer = setTimeout(() => {
                setOpen(false)
            }, 3000)

            return () => clearTimeout(timer)
        }
    }, [error])

    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            {
                error && open &&
                <Alert variant={"destructive"}>
                    <ShieldAlert />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>
                        {error}
                    </AlertDescription>
                </Alert>
            }

            <Card className="overflow-hidden p-0">
                <CardContent className="grid p-0 md:grid-cols-2">

                    <form className="p-6 md:p-8">
                        <FieldGroup>
                            <div className="flex flex-col items-center gap-2 text-center">
                                <h1 className="text-2xl font-bold capitalize">Sanchalak Login</h1>
                                <p className="text-balance text-muted-foreground">
                                    Please verify your identity to proceed.
                                </p>
                            </div>
                            <Field>
                                <FieldLabel htmlFor="sanchalakId">Sanchalak id</FieldLabel>
                                <Input
                                    name="sanchalakId"
                                    type="text"
                                    placeholder="m@example.com"
                                    className="h-12 rounded-lg"
                                    required
                                    onChange={(e) => setSanchalakId(e.target.value)}
                                />
                            </Field>
                            <Field className=" relative ">
                                <div className="flex items-center">
                                    <FieldLabel htmlFor="password">Password</FieldLabel>
                                </div>
                                <Input
                                    name="password"
                                    id="password"
                                    type={hide ? "password" : "text"}
                                    required
                                    placeholder="password@123"
                                    className={`h-12 rounded-lg `}
                                    onChange={(e) => setPassword(e.target.value)}

                                />
                                <Button variant={"ghost"} className="lg:max-w-10 w-10 right-0 bottom-1 absolute transition-all" type="button" onClick={() => setHide(!hide)}>
                                    {
                                        hide ? <EyeClosed /> : <Eye />
                                    }
                                </Button>

                            </Field>
                            <Field>
                                <Button onClick={handleSubmit} size={"lg"} className="h-12  rounded-lg" type="button">
                                    {
                                        loading ? <Spinner /> : "Login"
                                    }
                                </Button>
                            </Field>
                        </FieldGroup>
                    </form>

                    <div className="relative hidden min-h-120 bg-muted md:block">
                        <div className="absolute inset-0 z-0 bg-[#020617]">
                            <div
                                className="absolute inset-0"
                                style={{
                                    background: "#020617",
                                    backgroundImage: `
                    linear-gradient(to right, rgba(71,85,105,0.22) 1px, transparent 1px),
                    linear-gradient(to bottom, rgba(71,85,105,0.22) 1px, transparent 1px),
                    radial-gradient(circle at 50% 50%, rgba(139,92,246,0.18) 0%, transparent 70%)
                  `,
                                    backgroundSize: "32px 32px, 32px 32px, 100% 100%",
                                }}
                            />
                            <div className="absolute inset-0 bg-linear-to-br from-slate-950/40 via-transparent to-violet-900/20" />
                        </div>

                        <div className="relative z-10 flex h-full flex-col p-8 text-white lg:p-10 ">
                            <div className="flex items-center gap-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-lg font-bold backdrop-blur-sm">
                                    B
                                </div>
                                <div className="min-w-0">
                                    <p className="text-2xl font-medium uppercase  text-violet-200/90">
                                        BSNP Portal
                                    </p>
                                    <h2 className="text-sm font-semibold leading-tight text-white">
                                        Secure Administration
                                    </h2>
                                </div>
                            </div>

                            <div className="max-w-md relative mt-10">
                                <div className="space-y-15">
                                    <h3 className="text-xl font-bold  text-white lg:text-4xl">
                                        Strategic Governance.
                                        Transparent Operations.
                                    </h3>
                                </div>

                                <p className="text-sm  text-slate-300 lg:text-sm">
                                    Welcome to the Sanchalak Console. Access reports, approve items, and oversee operations securely.</p>
                            </div>
                            <p className="text-sm absolute bottom-10">© 2025 BSNP. All rights reserved.</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
            <FieldDescription className="px-6 text-center">
                By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
                and <a href="#">Privacy Policy</a>.
            </FieldDescription>
        </div>
    )
}