import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// Paths that are publicly accessible (no auth required)
const PUBLIC_PATHS = ["/login", "/signup", "/forgot-password", "/"];
const RESET_PASSWORD_PATTERN = /^\/reset-password\/.+/;

function isPublicPath(pathname: string): boolean {
  return (
    PUBLIC_PATHS.includes(pathname) || RESET_PASSWORD_PATTERN.test(pathname)
  );
}

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // Redirect authenticated users away from auth pages
    if (token && isPublicPath(pathname) && pathname !== "/") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized({ token, req }) {
        const { pathname } = req.nextUrl;

        // Public paths and API auth routes never need a token
        if (
          isPublicPath(pathname) ||
          pathname.startsWith("/api/auth") ||
          pathname.startsWith("/_next") ||
          pathname === "/favicon.ico"
        ) {
          return true;
        }

        // Everything else requires a valid token
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
