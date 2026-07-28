import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default auth((req: any) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  const isApiRoute = nextUrl.pathname.startsWith("/api/");
  const isAuthRoute = nextUrl.pathname === "/login";
  const isRootRoute = nextUrl.pathname === "/";
  const isProtectedRoute = nextUrl.pathname.startsWith("/dashboard");

  // All API routes bypass middleware auth — each handler does its own auth
  if (isApiRoute) return;

  // Root: logged in → dashboard, else → login
  if (isRootRoute) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  // Login page: already logged in → go to dashboard
  if (isAuthRoute) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }
    return;
  }

  // Dashboard routes require login
  if (isProtectedRoute && !isLoggedIn) {
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Admin-only: /dashboard/users
  if (nextUrl.pathname.startsWith("/dashboard/users") && req.auth?.user?.role !== "ADMIN") {
    return NextResponse.rewrite(new URL("/dashboard/forbidden", nextUrl));
  }

  return;
});

export const config = {
  matcher: [
    "/", 
    "/login", 
    "/dashboard/:path*"
  ],
};
