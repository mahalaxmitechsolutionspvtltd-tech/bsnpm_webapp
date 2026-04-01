import { AdminLoginForm } from "@/components/admin-login-form";

export default function page() {
    return (
        <div className=" container h-screen lg:w-4xl  mx-auto  flex items-center justify-center">
            <div className=" w-full">
                <AdminLoginForm />
            </div>
        </div>
    )
}
