"""
Traffic Analytics API
Admin-only endpoints for visitor traffic insights.
"""
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional
from collections import Counter

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from app.core.database import get_db
from app.core.security import get_current_user
from app import models

router = APIRouter(prefix="/traffic", tags=["Traffic Analytics"])

ADMIN_ROLES = {"ADMIN", "PRINCIPAL"}


def require_admin(current_user: models.User = Depends(get_current_user)):
    if current_user.role.upper() not in ADMIN_ROLES:
        raise HTTPException(status_code=403, detail="Admin access required.")
    return current_user


@router.get("/summary", response_model=Dict[str, Any])
def get_traffic_summary(
    days: int = Query(7, ge=1, le=90, description="Number of past days to analyse"),
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin)
):
    """High-level traffic summary for admin dashboard cards."""
    since = datetime.utcnow() - timedelta(days=days)

    logs = db.query(models.VisitorLog).filter(
        models.VisitorLog.visited_at >= since
    ).all()

    total_hits = len(logs)
    unique_ips = len({l.ip_address for l in logs if l.ip_address})

    # Group by date
    daily: dict = {}
    for l in logs:
        day_str = l.visited_at.strftime("%Y-%m-%d")
        daily[day_str] = daily.get(day_str, 0) + 1

    # Sort dates ascending
    daily_chart = [{"date": k, "visits": v} for k, v in sorted(daily.items())]

    # Top endpoints (exclude auth/static)
    endpoints = [l.endpoint for l in logs if l.endpoint and not l.endpoint.startswith(("/static", "/photos", "/assets"))]
    top_endpoints = [{"endpoint": ep, "count": cnt} for ep, cnt in Counter(endpoints).most_common(10)]

    # Country breakdown
    countries = [l.country for l in logs if l.country]
    top_countries = [{"country": c, "count": cnt} for c, cnt in Counter(countries).most_common(10)]

    # City breakdown
    cities = [f"{l.city}, {l.country_code}" for l in logs if l.city]
    top_cities = [{"city": c, "count": cnt} for c, cnt in Counter(cities).most_common(8)]

    # Device breakdown
    devices = [l.device_type for l in logs if l.device_type]
    device_breakdown = [{"type": d, "count": cnt} for d, cnt in Counter(devices).most_common()]

    # Browser breakdown
    browsers = [l.browser for l in logs if l.browser and l.browser != "Other"]
    browser_breakdown = [{"browser": b, "count": cnt} for b, cnt in Counter(browsers).most_common(6)]

    # OS breakdown
    oses = [l.os for l in logs if l.os and l.os != "Other"]
    os_breakdown = [{"os": o, "count": cnt} for o, cnt in Counter(oses).most_common(6)]

    # ISP breakdown
    isps = [l.isp for l in logs if l.isp]
    top_isps = [{"isp": i, "count": cnt} for i, cnt in Counter(isps).most_common(6)]

    # Status code breakdown
    status_codes = [str(l.status_code) for l in logs if l.status_code]
    status_breakdown = [{"code": c, "count": cnt} for c, cnt in Counter(status_codes).most_common()]

    # Proxy count
    proxy_count = sum(1 for l in logs if l.is_proxy)

    # Hourly heatmap (0-23)
    hourly = [0] * 24
    for l in logs:
        hourly[l.visited_at.hour] += 1
    hourly_chart = [{"hour": h, "visits": hourly[h]} for h in range(24)]

    return {
        "period_days": days,
        "total_hits": total_hits,
        "unique_ips": unique_ips,
        "proxy_count": proxy_count,
        "daily_chart": daily_chart,
        "hourly_chart": hourly_chart,
        "top_endpoints": top_endpoints,
        "top_countries": top_countries,
        "top_cities": top_cities,
        "device_breakdown": device_breakdown,
        "browser_breakdown": browser_breakdown,
        "os_breakdown": os_breakdown,
        "top_isps": top_isps,
        "status_breakdown": status_breakdown,
    }


@router.get("/logs", response_model=Dict[str, Any])
def get_traffic_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=10, le=200),
    ip: Optional[str] = Query(None),
    country: Optional[str] = Query(None),
    device: Optional[str] = Query(None),
    days: int = Query(7, ge=1, le=90),
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin)
):
    """Paginated raw visitor log for the admin table view."""
    since = datetime.utcnow() - timedelta(days=days)
    query = db.query(models.VisitorLog).filter(models.VisitorLog.visited_at >= since)

    if ip:
        query = query.filter(models.VisitorLog.ip_address.contains(ip))
    if country:
        query = query.filter(models.VisitorLog.country.ilike(f"%{country}%"))
    if device:
        query = query.filter(models.VisitorLog.device_type == device)

    total = query.count()
    logs = query.order_by(desc(models.VisitorLog.visited_at)).offset((page - 1) * page_size).limit(page_size).all()

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "logs": [
            {
                "id": l.id,
                "ip_address": l.ip_address,
                "method": l.method,
                "endpoint": l.endpoint,
                "status_code": l.status_code,
                "browser": l.browser,
                "browser_version": l.browser_version,
                "os": l.os,
                "device_type": l.device_type,
                "country": l.country,
                "country_code": l.country_code,
                "city": l.city,
                "region": l.region,
                "isp": l.isp,
                "is_proxy": l.is_proxy,
                "referer": l.referer,
                "visited_at": l.visited_at.isoformat(),
            }
            for l in logs
        ]
    }


@router.delete("/logs/purge")
def purge_old_logs(
    older_than_days: int = Query(30, ge=1),
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin)
):
    """Delete traffic logs older than N days to keep DB lean."""
    cutoff = datetime.utcnow() - timedelta(days=older_than_days)
    deleted = db.query(models.VisitorLog).filter(models.VisitorLog.visited_at < cutoff).delete()
    db.commit()
    return {"message": f"Deleted {deleted} log entries older than {older_than_days} days."}
