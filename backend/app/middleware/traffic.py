"""
Traffic Logging Middleware
Captures every incoming request: IP, user-agent, endpoint, method, status code.
Geolocation is resolved asynchronously via ip-api.com after the response is sent.
"""
import re
import threading
import requests as http_requests
from datetime import datetime
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app import models

# Endpoints to skip (static files, health checks, docs)
SKIP_PREFIXES = (
    "/static", "/photos", "/assets",
    "/docs", "/redoc", "/openapi.json",
    "/favicon", "/_"
)

# Simple browser/OS parser (no extra library needed)
def parse_user_agent(ua: str):
    if not ua:
        return "Unknown", "", "Unknown", "desktop"

    ua_lower = ua.lower()

    # Device type
    if any(k in ua_lower for k in ["bot", "crawler", "spider", "scraper", "slurp", "bingbot", "googlebot"]):
        device_type = "bot"
    elif any(k in ua_lower for k in ["ipad", "tablet", "kindle"]):
        device_type = "tablet"
    elif any(k in ua_lower for k in ["mobile", "android", "iphone", "ipod", "blackberry", "windows phone"]):
        device_type = "mobile"
    else:
        device_type = "desktop"

    # Browser
    browser, version = "Other", ""
    for name, pattern in [
        ("Edge",    r"edg(?:e|\/)([\d.]+)"),
        ("Chrome",  r"chrome\/([\d.]+)"),
        ("Firefox", r"firefox\/([\d.]+)"),
        ("Safari",  r"version\/([\d.]+).*safari"),
        ("Opera",   r"opr\/([\d.]+)"),
        ("IE",      r"trident.*rv:([\d.]+)"),
    ]:
        m = re.search(pattern, ua_lower)
        if m:
            browser, version = name, m.group(1)
            break

    # OS
    os_name = "Other"
    for name, keyword in [
        ("Windows", "windows nt"),
        ("macOS",   "mac os x"),
        ("iOS",     "iphone os"),
        ("Android", "android"),
        ("Linux",   "linux"),
    ]:
        if keyword in ua_lower:
            os_name = name
            break

    return browser, version, os_name, device_type


def resolve_geo_async(log_id: int, ip: str):
    """Called in a background thread — fetches geo from ip-api.com and updates DB row."""
    if not ip or ip in ("127.0.0.1", "::1", "localhost"):
        return
    try:
        resp = http_requests.get(
            f"http://ip-api.com/json/{ip}?fields=status,country,countryCode,regionName,city,lat,lon,timezone,isp,proxy",
            timeout=5
        )
        data = resp.json()
        if data.get("status") == "success":
            db: Session = SessionLocal()
            try:
                log = db.query(models.VisitorLog).filter(models.VisitorLog.id == log_id).first()
                if log:
                    log.country = data.get("country")
                    log.country_code = data.get("countryCode")
                    log.region = data.get("regionName")
                    log.city = data.get("city")
                    log.latitude = str(data.get("lat", ""))
                    log.longitude = str(data.get("lon", ""))
                    log.timezone = data.get("timezone")
                    log.isp = data.get("isp")
                    log.is_proxy = data.get("proxy", False)
                    log.geo_fetched = True
                    db.commit()
            finally:
                db.close()
    except Exception:
        pass  # Never crash the app on geo failure


class TrafficLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        # Skip static/doc endpoints
        path = request.url.path
        if any(path.startswith(p) for p in SKIP_PREFIXES):
            return await call_next(request)

        # Get real IP (respects X-Forwarded-For from reverse proxies / nginx)
        forwarded = request.headers.get("x-forwarded-for")
        ip = forwarded.split(",")[0].strip() if forwarded else (request.client.host if request.client else "unknown")

        ua = request.headers.get("user-agent", "")
        referer = request.headers.get("referer", "")
        browser, version, os_name, device_type = parse_user_agent(ua)

        response = await call_next(request)

        # Log to DB (fast — no geo call here)
        db: Session = SessionLocal()
        try:
            log = models.VisitorLog(
                ip_address=ip,
                method=request.method,
                endpoint=path[:500],
                status_code=response.status_code,
                user_agent=ua[:500] if ua else None,
                browser=browser,
                browser_version=version,
                os=os_name,
                device_type=device_type,
                referer=referer[:500] if referer else None,
                visited_at=datetime.utcnow(),
                geo_fetched=False,
            )
            db.add(log)
            db.commit()
            db.refresh(log)
            log_id = log.id
        except Exception:
            db.rollback()
            log_id = None
        finally:
            db.close()

        # Resolve geolocation in background thread — does not block response
        if log_id:
            threading.Thread(target=resolve_geo_async, args=(log_id, ip), daemon=True).start()

        return response
