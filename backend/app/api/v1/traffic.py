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
from app.api.v1.auth import get_current_user, require_permission
from app import models

router = APIRouter(prefix="/traffic", tags=["Traffic Analytics"])


@router.get("/summary", response_model=Dict[str, Any])
def get_traffic_summary(
    days: int = Query(7, ge=1, le=90, description="Number of past days to analyse"),
    exclude_local: bool = Query(True, description="Exclude local development and test IP addresses"),
    db: Session = Depends(get_db),
    _: models.User = Depends(require_permission("traffic"))
):
    """High-level traffic summary for admin dashboard cards."""
    since = datetime.utcnow() - timedelta(days=days)

    query = db.query(models.VisitorLog).filter(models.VisitorLog.visited_at >= since)
    if exclude_local:
        query = query.filter(
            ~models.VisitorLog.ip_address.in_(["127.0.0.1", "::1", "localhost", "unknown"]),
            ~models.VisitorLog.ip_address.like("192.168.%"),
            ~models.VisitorLog.ip_address.like("10.%"),
            ~models.VisitorLog.ip_address.like("172.%")
        )
    logs = query.all()

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

    # --- Hacker/Threat Detection Logic ---
    import re
    sqli_pattern = re.compile(
        r"(\%27)|(\')|(\-\-)|(\%23)|(#)|(union|select|insert|update|delete|drop|alter|where|from|etc/passwd|cmd\.exe|\.\.\/)",
        re.IGNORECASE
    )

    ip_stats = {}
    sqli_attempts = 0
    ddos_attempts = 0
    scanner_attempts = 0
    proxy_attempts = 0

    for l in logs:
        ip = l.ip_address
        if not ip:
            continue
        if ip not in ip_stats:
            ip_stats[ip] = {
                "total": 0,
                "errors_404": 0,
                "sqli": 0,
                "proxy": l.is_proxy or False,
                "country": l.country or "Unknown",
                "isp": l.isp or "Unknown"
            }
        
        ip_stats[ip]["total"] += 1
        if l.status_code == 404:
            ip_stats[ip]["errors_404"] += 1
        
        if l.endpoint and sqli_pattern.search(l.endpoint):
            ip_stats[ip]["sqli"] += 1
            sqli_attempts += 1

    flagged_threats = []
    for ip, stats in ip_stats.items():
        reasons = []
        severity = "Low"
        
        if stats["total"] > 150:
            reasons.append(f"Rate Anomaly ({stats['total']} requests)")
            ddos_attempts += stats["total"]
            severity = "Medium"
            
        if stats["errors_404"] > 15:
            reasons.append(f"Dir Scanner ({stats['errors_404']} 404s)")
            scanner_attempts += stats["errors_404"]
            severity = "Medium"
            
        if stats["sqli"] > 0:
            reasons.append(f"Exploit Probe ({stats['sqli']} SQLi patterns)")
            severity = "High"

        if stats["proxy"]:
            proxy_attempts += 1

        if reasons:
            flagged_threats.append({
                "ip": ip,
                "country": stats["country"],
                "isp": stats["isp"],
                "total_requests": stats["total"],
                "severity": severity,
                "reasons": ", ".join(reasons)
            })

    # Group threats by date for timeline
    threat_timeline = {}
    for l in logs:
        is_threat = l.status_code == 404 or (l.endpoint and sqli_pattern.search(l.endpoint)) or l.is_proxy
        if is_threat:
            day_str = l.visited_at.strftime("%Y-%m-%d")
            threat_timeline[day_str] = threat_timeline.get(day_str, 0) + 1

    threat_timeline_chart = [{"date": k, "attempts": v} for k, v in sorted(threat_timeline.items())]

    # Calculate overall security health score
    health_score = 100
    for t in flagged_threats:
        if t["severity"] == "High":
            health_score -= 15
        elif t["severity"] == "Medium":
            health_score -= 5
    health_score = max(health_score, 10)

    # Sort flagged threats by severity (High first) and total requests
    flagged_threats = sorted(flagged_threats, key=lambda x: (x["severity"] == "High", x["total_requests"]), reverse=True)

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
        "security_analysis": {
            "health_score": health_score,
            "flagged_threats": flagged_threats[:8],
            "threat_timeline": threat_timeline_chart,
            "vectors": [
                {"name": "Exploit Probes (SQLi/XSS)", "count": sqli_attempts},
                {"name": "DDoS Rate Anomalies", "count": ddos_attempts},
                {"name": "Directory Scanners (404s)", "count": scanner_attempts},
                {"name": "Proxy/VPN Access", "count": proxy_attempts}
            ]
        }
    }


@router.get("/logs", response_model=Dict[str, Any])
def get_traffic_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=10, le=200),
    ip: Optional[str] = Query(None),
    country: Optional[str] = Query(None),
    device: Optional[str] = Query(None),
    days: int = Query(7, ge=1, le=90),
    exclude_local: bool = Query(True, description="Exclude local development and test IP addresses"),
    db: Session = Depends(get_db),
    _: models.User = Depends(require_permission("traffic"))
):
    """Paginated raw visitor log for the admin table view."""
    since = datetime.utcnow() - timedelta(days=days)
    query = db.query(models.VisitorLog).filter(models.VisitorLog.visited_at >= since)

    if exclude_local:
        query = query.filter(
            ~models.VisitorLog.ip_address.in_(["127.0.0.1", "::1", "localhost", "unknown"]),
            ~models.VisitorLog.ip_address.like("192.168.%"),
            ~models.VisitorLog.ip_address.like("10.%"),
            ~models.VisitorLog.ip_address.like("172.%")
        )

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
    _: models.User = Depends(require_permission("traffic"))
):
    """Delete traffic logs older than N days to keep DB lean."""
    cutoff = datetime.utcnow() - timedelta(days=older_than_days)
    deleted = db.query(models.VisitorLog).filter(models.VisitorLog.visited_at < cutoff).delete()
    db.commit()
    return {"message": f"Deleted {deleted} log entries older than {older_than_days} days."}


@router.delete("/logs/clear")
def clear_all_logs(
    db: Session = Depends(get_db),
    _: models.User = Depends(require_permission("traffic"))
):
    """Delete ALL traffic logs (clean the grid data)."""
    deleted = db.query(models.VisitorLog).delete()
    db.commit()
    return {"message": f"Successfully cleared all {deleted} traffic log records."}
