"use client"

import { useState } from "react"
import { AdminLoginType, SanchalakLoginType } from "@/types/auth/loginTypes"
import { adminLoginApi, sanchalakLoginApi } from "@/services/login-api"
import axios from "axios"
import { useRouter } from "next/navigation"
import { useAuth } from "@/providers/auth-provider"

export function useLogin() {

    const { login } = useAuth();
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    async function adminlogin({ adminId, password }: AdminLoginType) {
        try {



            setLoading(true)
            setError("")
            const res = await adminLoginApi({ adminId, password });

            if (res?.data.success) {
                login(res.data.data)
                router.push("/admin/dashboard")
            } else {
                setError(res.data.error || "Login failed")
            }
        } catch (error) {
            if (axios.isAxiosError(error)) {
                setError(error.response?.data.message)
            }
        } finally {
            setLoading(false)
        }
    }

    async function sanchalakLogin({ sanchalakId, password }: SanchalakLoginType) {
        try {

            setLoading(true)
            setError("")

            const res = await sanchalakLoginApi({ sanchalakId, password });

            if (res?.data.success) {

                router.push("/sanchalak/dashboard")
            } else {
                setError(res.data.error || "Login failed")
                console.log(error)
            }
        } catch (error) {
            if (axios.isAxiosError(error)) {
                setError(error.response?.data)
                console.log(error.response?.data);

            }
        } finally {
            setLoading(false)
        }
    }

    return { adminlogin, sanchalakLogin, loading, error }
}

