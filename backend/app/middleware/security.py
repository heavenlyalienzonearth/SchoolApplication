"""
HTTP Security Headers Middleware
Hardens transport security, protects against Clickjacking, MIME-sniffing, XSS injection, and click-hijacking.
"""
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        response = await call_next(request)
        
        # 1. HSTS (HTTP Strict Transport Security)
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"
        
        # 2. X-Frame-Options (Clickjacking protection)
        response.headers["X-Frame-Options"] = "SAMEORIGIN"
        
        # 3. X-Content-Type-Options (MIME-type sniffing protection)
        response.headers["X-Content-Type-Options"] = "nosniff"
        
        # 4. X-XSS-Protection (Reflected XSS protection)
        response.headers["X-XSS-Protection"] = "1; mode=block"
        
        # 5. Content-Security-Policy (CSP) - Hardens scripts, styles, connections, frames and images whitelist
        csp = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net; "
            "font-src 'self' https://fonts.gstatic.com; "
            "img-src 'self' data: blob: http: https:; "
            "connect-src 'self' http: https: ws: wss:; "
            "frame-src 'self';"
        )
        response.headers["Content-Security-Policy"] = csp
        
        # 6. Referrer-Policy
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        
        # 7. Permissions-Policy (Restricts browser feature usage)
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        
        return response
