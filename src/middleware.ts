import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionFromToken, SESSION_COOKIE } from "@/lib/auth/session";

const PUBLIC_ROUTES = ["/login"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (PUBLIC_ROUTES.some((route) => pathname === route)) {
    // If already logged in and visiting /login, redirect to dashboard
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    if (token) {
      const session = await getSessionFromToken(token);
      if (session) {
        const redirectMap: Record<string, string> = {
          ADMIN: "/admin/dashboard",
          LECTURER: "/lecturer/dashboard",
          STUDENT: "/student/dashboard",
        };
        return NextResponse.redirect(
          new URL(redirectMap[session.role] || "/login", request.url)
        );
      }
    }
    return NextResponse.next();
  }

  // Allow API routes to handle their own auth
  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // Allow static files
  if (pathname.startsWith("/_next") || pathname.includes(".")) {
    return NextResponse.next();
  }

  // Check session
  const token = request.cookies.get(SESSION_COOKIE)?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const session = await getSessionFromToken(token);

  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Role-based route protection
  const role = session.role;

  if (pathname.startsWith("/admin") && role !== "ADMIN") {
    return NextResponse.redirect(
      new URL(`/${role.toLowerCase()}/dashboard`, request.url)
    );
  }

  if (pathname.startsWith("/lecturer") && role !== "LECTURER") {
    return NextResponse.redirect(
      new URL(`/${role.toLowerCase()}/dashboard`, request.url)
    );
  }

  if (pathname.startsWith("/student") && role !== "STUDENT") {
    return NextResponse.redirect(
      new URL(`/${role.toLowerCase()}/dashboard`, request.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
