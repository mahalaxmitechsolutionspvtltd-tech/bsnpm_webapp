"use client"

import { useState } from "react"
import { flushSync } from "react-dom"
import axios from "axios"
import { useRouter } from "next/navigation"
import { useAuth } from "@/Context/AuthProvider"
import { adminLoginApi, sanchalakLoginApi } from "@/services/authApi"
import { AdminLoginType, SanchalakLoginType } from "@/types/auth/loginTypes"

export function useLogin() {
    const { login } = useAuth()
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    async function adminlogin({ adminId, password }: AdminLoginType) {
        try {
            setLoading(true)
            setError("")

            const res = await adminLoginApi({ adminId, password })

            if (res.data.success) {
                flushSync(() => {
                    login(res.data.data, res.data.user_type, res.data.access_token)
                })

                router.replace("/admin/dashboard")
                router.refresh()
                return
            }

            setError(res.data.error || res.data.message || "Login failed")
        } catch (loginError) {
            if (axios.isAxiosError(loginError)) {
                const message =
                    typeof loginError.response?.data?.message === "string"
                        ? loginError.response.data.message
                        : "Login failed"

                setError(message)
                return
            }

            setError("Login failed")
        } finally {
            setLoading(false)
        }
    }

    async function sanchalakLogin({ sanchalakId, password }: SanchalakLoginType) {
        try {
            setLoading(true)
            setError("")

            const res = await sanchalakLoginApi({ sanchalakId, password })

            if (res.data.success) {
                flushSync(() => {
                    login(res.data.data, res.data.user_type, res.data.access_token)
                })

                router.replace("/sanchalak/dashboard")
                router.refresh()
                return
            }

            setError(res.data.error || res.data.message || "Login failed")
        } catch (loginError) {
            if (axios.isAxiosError(loginError)) {
                const message =
                    typeof loginError.response?.data?.message === "string"
                        ? loginError.response.data.message
                        : "Login failed"

                setError(message)
                return
            }

            setError("Login failed")
        } finally {
            setLoading(false)
        }
    }

    return {
        adminlogin,
        sanchalakLogin,
        loading,
        error,
    }
}