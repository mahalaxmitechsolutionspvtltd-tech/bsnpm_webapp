import { NextRequest, NextResponse } from "next/server"

export function proxy(request: NextRequest) {
    const token = request.cookies.get("auth_token")?.value
    const { pathname } = request.nextUrl

    const isDefaultPage = pathname === "/"

    const isLoginPage =
        pathname === "/login" ||
        pathname === "/admin/login" ||
        pathname === "/sanchalak/login"

    const isAdminRoute =
        pathname.startsWith("/admin/dashboard") &&
        pathname !== "/admin/login"

    const isSanchalakRoute =
        pathname.startsWith("/sanchalak/dashboard") &&
        pathname !== "/sanchalak/login"

    const isProtected = isAdminRoute || isSanchalakRoute

    if (token && isDefaultPage) {
        return NextResponse.redirect(new URL("/admin/dashboard", request.url))
    }

    if (token && isLoginPage) {
        return NextResponse.redirect(new URL("/admin/dashboard", request.url))
    }

    if (!token && isProtected) {
        if (pathname.startsWith("/admin")) {
            return NextResponse.redirect(new URL("/admin/login", request.url))
        }

        if (pathname.startsWith("/sanchalak")) {
            return NextResponse.redirect(new URL("/sanchalak/login", request.url))
        }

        return NextResponse.redirect(new URL("/login", request.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        "/",
        "/login",
        "/admin/login",
        "/sanchalak/login",
        "/admin/:path*",
        "/sanchalak/:path*",
    ],
}